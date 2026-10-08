# 🔴 БЛОК 1: Интеграция боевой системы — ПОШАГОВО

Это руководство показывает как добавить боевую систему в `server.js`.

---

## ФАЙЛЫ ДЛЯ ДОБАВЛЕНИЯ

✅ **battle.js** — Логика боя (урон, кулдауны, смерть)
✅ **zones.js** — Единая база всех зон
✅ **PROTOCOL.md** — Документация протокола сообщений

---

## ШАГ 1: Подключить новые модули в server.js

**В начало server.js добавить:**

```javascript
const Battle = require('./battle.js');
const Zones = require('./zones.js');
```

---

## ШАГ 2: Инициализировать боевые параметры при входе

**В обработчик `'join'` добавить:**

```javascript
// После создания или загрузки персонажа
Battle.initBattleStats(char);

// Инициализировать позицию из зоны спавна
const zone = Zones.getZone(zone);
if (!char.x) {
  char.x = zone.spawn.x;
  char.y = zone.spawn.y;
}
```

---

## ШАГ 3: Обновлять кулдауны каждый тик

**В основной game loop (каждые 50 мс):**

```javascript
// В функции gameLoop() или хук setInterval():
const deltaTime = 0.05; // 50 миллисекунд = 0.05 сек

for (const [zoneId, zoneEntities] of Object.entries(world)) {
  for (const entity of zoneEntities) {
    if (entity.type === 'player') {
      // Обновить кулдауны
      Battle.updateCooldowns(entity, deltaTime);
      
      // Проверить нужно ли респавниться
      if (entity.dead) {
        const zone = Zones.getZone(zoneId);
        Battle.respawnCharacter(entity, zone.spawn);
      }
      
      // Очистить старые записи в журнале добычи
      Battle.cleanRecentGains(entity);
    }
  }
}
```

---

## ШАГ 4: Обработать атаки (s1, s2) в input

**В обработчик `'input'` добавить логику боя:**

```javascript
// В socket.on('input', (msg) => { ... })

if (msg.s1 || msg.s2) {
  const skillType = msg.s1 ? 's1' : 's2';
  
  // Найти цель (ближайшего врага в радиусе)
  const target = findNearestTarget(char, zoneEntities, skillType);
  
  if (target) {
    const zone = Zones.getZone(currentZone);
    const result = Battle.attack(char, target, zone, skillType);
    
    if (result.ok) {
      // Отправить эффект атаки
      broadcastToZone(currentZone, {
        t: 'fx',
        kind: 'arc',
        from: { x: char.x, y: char.y },
        to: { x: target.x, y: target.y },
        color: skillType === 's2' ? '#ff6b35' : '#ffd700'
      });
      
      // Если цель погибла, отправить уведомление
      if (result.targetDied) {
        broadcastToZone(currentZone, {
          t: 'chat',
          from: 'Система',
          text: `${char.charName} убил ${target.name}!`
        });
      }
    }
  }
}
```

---

## ШАГ 5: Функция поиска ближайшей цели

**Добавить в server.js:**

```javascript
function findNearestTarget(attacker, entities, skillType) {
  const SKILL_RANGE = {
    s1: 2.0,
    s2: 8.0
  };
  
  const range = SKILL_RANGE[skillType];
  let nearest = null;
  let minDist = Infinity;
  
  for (const entity of entities) {
    // Пропустить себя
    if (entity.id === attacker.id) continue;
    
    // Пропустить мёртвых
    if (!Battle.isAlive(entity)) continue;
    
    // Вычислить расстояние
    const dist = Math.hypot(
      (entity.x || 0) - (attacker.x || 0),
      (entity.y || 0) - (attacker.y || 0)
    );
    
    // Проверить что в дальности
    if (dist > range) continue;
    
    // Выбрать ближайшего
    if (dist < minDist) {
      minDist = dist;
      nearest = entity;
    }
  }
  
  return nearest;
}
```

---

## ШАГ 6: Добавить XP и золото в журнал добычи

**Когда игрок получает XP или золото:**

```javascript
// При убийстве моба
const xpReward = mobData.xp;
const goldReward = mobData.gold;

char.xp += xpReward;
char.gold += goldReward;

// Записать в журнал
Battle.addGain(char, 'xp', xpReward);
Battle.addGain(char, 'gold', goldReward);
```

---

## ШАГ 7: Отправлять дельты с кулдаунами и статусом

**В State Delta (state-delta.js):**

```javascript
// При отправке дельты, включить:
{
  id: char.id,
  x: char.x,
  y: char.y,
  hp: char.hp,
  maxhp: char.maxhp,
  cd1: char.cd1,      // ← НОВОЕ
  cd2: char.cd2,      // ← НОВОЕ
  dead: char.dead,    // ← НОВОЕ
  status: char.status // ← НОВОЕ
}
```

---

## ШАГ 8: Обновить интеграцию в game-v3.html

**В клиенте обработать дельту:**

```javascript
// В обработчике дельты
if (delta.cd1 !== undefined) entity.cd1 = delta.cd1;
if (delta.cd2 !== undefined) entity.cd2 = delta.cd2;
if (delta.dead !== undefined) entity.dead = delta.dead;

// Показать кулдаун на кнопке
const s1Btn = document.getElementById('skill1');
if (entity.cd1 > 0) {
  s1Btn.querySelector('.cooldown').textContent = entity.cd1.toFixed(1);
  s1Btn.querySelector('.cooldown').style.display = 'flex';
} else {
  s1Btn.querySelector('.cooldown').style.display = 'none';
}
```

---

## ШАГ 9: Тестирование боевой системы

### Локальный тест:

```bash
# Запустить сервер
npm run server

# В браузере открыть два окна лаунчера
# Персонаж 1: создать в городе
# Персонаж 2: создать в городе

# Оба идут в лес (city → forest)
# Персонаж 1 нажимает "1" (s1) на персонажа 2
# Должно увидеть:
# ✅ Эффект атаки (линия)
# ✅ HP персонажа 2 уменьшается
# ✅ Кулдаун на кнопке 1 (0.5 сек)
```

### Тест смерти:

```
# Два персонажа в лесу
# Персонаж 1 многократно атакует (s1 или s2)
# Персонаж 2 должен упасть (hp = 0)
# ✅ Видно "dead" статус
# ✅ Персонаж не двигается (может только видеть)
# ✅ Через 3-5 сек респавнится в спавне
```

### Тест PvP в арене:

```
# Оба персонажа идут в PvP арену
# Персонаж 1 атакует персонажа 2
# ✅ Должно работать (pvp: 'arena')
# ✅ При смерти теряется XP/золото за последнюю минуту
```

---

## ЧЕКЛИСТ ИНТЕГРАЦИИ

- [ ] Подключены battle.js, zones.js
- [ ] Инициализирован Battle.initBattleStats при join
- [ ] Обновляются кулдауны каждый тик
- [ ] Обработана логика attack (s1, s2)
- [ ] Найти ближайшую цель (findNearestTarget)
- [ ] Добавлены записи в журнал добычи (addGain)
- [ ] Дельты включают cd1, cd2, dead, status
- [ ] Клиент показывает кулдауны на кнопках
- [ ] Протестирована база (1 на 1)
- [ ] Протестирована смерть и респавн
- [ ] Протестирована PvP арена

---

## 🔗 СВЯЗАННЫЕ ФАЙЛЫ

- **battle.js** — Вся логика боя
- **zones.js** — Описание зон
- **PROTOCOL.md** — Формат сообщений
- **server.js** — Главный сервер (требует обновления)
- **game-v3.html** — Клиент (требует обновления)
- **state-delta.js** — Дельты (требует обновления)

---

**Статус:** Готово к реализации
**Версия:** 1.0
**Дата:** 6 октября 2026

Как закончишь с интеграцией — дай знать! 👊
