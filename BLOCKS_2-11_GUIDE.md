# 📚 БЛОКИ 2-11 — ПОЛНОЕ РУКОВОДСТВО

**Статус:** Все готовы к интеграции
**Формат:** Пошаговые инструкции

---

## 🟠 БЛОК 2: КЛИЕНТ-СЕРВЕР КОНТРАКТ

### Что делать:

1. **Миграция БД:**
```sql
ALTER TABLE characters RENAME COLUMN level TO lvl;
```

2. **Обновить server.js:**
- Все обращения к `player.level` → `player.lvl`
- Все обращения к `player.hp` → остаётся `player.hp`

3. **Обновить game-v3.html:**
- Все `char.level` → `char.lvl`

4. **Проверить PROTOCOL.md:**
- Весь протокол там описан в таблицах
- Каждое сообщение с примерами JSON

### Тестирование:
```javascript
console.assert(player.lvl === 10, 'Level field renamed correctly');
```

---

## 🟠 БЛОК 3: ЧИСТКА ПРОЕКТА

### Удалить:
- world-v2.js (всё в zones.js)
- game.html (использовать game-v3.html)
- любые хардкод зоны в server.js

### Переструктурировать:
```
voxel-db.js → расчленить на:
  ├─ data/classes.js      (9 классов)
  ├─ data/appearance.js   (пол, причёски)
  └─ models/builder.js    (сборка моделей)

server.js → разбить на:
  ├─ server/index.js      (точка входа)
  ├─ server/auth.js       (логин/регистрация)
  ├─ server/handlers/     (обработчики сообщений)
  │  ├─ input.js
  │  ├─ chat.js
  │  ├─ join.js
  │  └─ attack.js
  ├─ server/game-loop.js  (основной цикл)
  └─ server/db.js         (работа с БД)
```

### Обновить README.md:
- Удалить упоминания accounts.json
- Добавить описание блоков 1-11
- Обновить команды npm

---

## 🟡 БЛОК 4: БАЛАНС И ПРОГРЕССИЯ

### Использование balance.js:

```javascript
const Balance = require('./balance.js');

// Проверить валидный ли класс
if (!Balance.isValidClass(className)) {
  return { error: 'Invalid class' };
}

// Получить время респавна
const respawnTime = Balance.getResponwnTime(player.lvl);

// Рассчитать XP за PvP убийство
const xp = Balance.calculatePvPXP(killer.lvl, victim.lvl);

// Проверить может ли один игрок PvP с другим
if (Balance.canPvPWith(player1, player2)) {
  // Можно атаковать
}

// Проверить дневной лимит PvP
if (Balance.checkDailyPvPLimit(player)) {
  player.pvpXpToday += xp;
}
```

### Изменения классов:
- **Остаются:** knight, berserker, mage, healer, assassin
- **Удаляются:** paladin, necromancer, priest, monk, archer

### Тестирование:
```
1. Два игрока разного уровня в PvP арене
2. Более низкий уровень убивает более высокого
3. Получает бонус XP (1.1x за каждый уровень)
```

---

## 🟡 БЛОК 5: ПЕРСИСТЕНТНОСТЬ МИРА

### Использование persistence.js:

```javascript
const Persist = require('./persistence.js');

// При входе игрока
Persist.loadPlayerPosition(player, db);
Persist.loadInventory(player, db);

// Каждые 30 секунд
setInterval(() => {
  for (const player of onlinePlayers) {
    Persist.savePlayerPosition(player, db);
    Persist.saveInventory(player, db);
  }
}, Persist.SAVE_INTERVAL);

// При выходе игрока
Persist.savePlayerPosition(player, db);
Persist.saveInventory(player, db);

// Мобы
for (const mob of zone.mobs) {
  if (mob.dead && Date.now() - mob.deadTime > Persist.MOB_RESPAWN_TIME) {
    Persist.respawnMob(mob);
  }
}

// Боссы
for (const boss of zone.bosses) {
  if (Persist.shouldRespawnBoss(boss)) {
    Persist.respawnMob(boss);
  }
}
```

### Миграция БД:
```sql
-- Таблица инвентаря
CREATE TABLE IF NOT EXISTS inventory (
  charId TEXT,
  slot INTEGER,
  itemId TEXT,
  amount INTEGER
);

-- Индекс
CREATE INDEX idx_inventory ON inventory(charId);
```

---

## 🟣 БЛОК 6: PvP-ЗОНА

### Использование pvp-arena.js:

```javascript
const PvP = require('./pvp-arena.js');

// Получить рейтинг топ-100
const top100 = PvP.getPlayerRating(allPlayers);
console.log(top100[0]); // {rank: 1, name: "Артур", kills: 50}

// Проверить может ли матчмейк
if (PvP.canMatchWith(player1, player2)) {
  // Можно матчить в PvP
}

// Записать убийство
PvP.recordPvPKill(killer, victim);
// killer.pvpKills += 1
// victim.pvpDeaths += 1
```

### Механика входа в PvP:
```
1. Игрок идёт на портал в городе
2. Видит предупреждение: "Вы вступите в PvP зону!"
3. Нажимает "Enter"
4. Телепортируется в arena_pvp
5. Может атаковать ТОЛЬКО игроков (нет мобов)
6. При смерти: теряет XP и золото за последнюю минуту
7. Может выйти ТОЛЬКО через портал в arena_pvp
```

### Порталы:
- **Вход:** Площадь в городе (100,500)
- **Выход:** Внутри areny (100,300)

---

## 🟡 БЛОК 7: ОСАДЫ (PvE-ИВЕНТ)

### Использование sieges.js:

```javascript
const Siege = require('./sieges.js');

// Проверить идёт ли сейчас осада
if (Siege.isSiegeTime()) {
  console.log('ОСАДА НАЧАЛАСЬ!');
}

// Проверить в окне ли осады (за 30 мин)
if (Siege.isInSiegeWindow()) {
  // Показать предупреждение в UI
}

// Когда гильдия побеждает
Siege.recordSiegeWin(guild);
// guild.fortressOwner = true
// guild.fortressUntil = now + 7 дней

// Применить бонус владения при добыче XP/Gold
const bonus = Siege.getFortressBonus(player, player.guild);
player.xp += baseXp * bonus; // +15% если владеют крепостью
player.gold += baseGold * bonus;
```

### Механика осады:

**Фаза 1: Война с NPC (30 минут)**
- Гильдии атакуют NPC защитников крепости
- Топ-100 боевых очков побеждает

**Фаза 2: Владение**
- Победившие гильдии получают крепость
- +15% XP/Gold пассивно для ВСЕХ членов
- Держат неделю до следующей осады

**Союзы:**
- Несколько гильдий могут идти союзом
- Все получают бонус владения
- Распадаются после осады

---

## 🟢 БЛОК 8: БЕЗОПАСНОСТЬ

### Использование auth.js:

```javascript
const Auth = require('./auth.js');

// Регистрация
const hashedPassword = Auth.hashPassword('password123');
db.run('INSERT INTO accounts VALUES (?, ?)', [login, hashedPassword]);

// Логин
const stored = db.get('SELECT pass FROM accounts WHERE login = ?', [login]);
if (Auth.verifyPassword(inputPass, stored.pass)) {
  // Пароль верный
  const token = Auth.createToken(charId);
  return token;
}

// Проверка токена при каждом запросе
const validation = Auth.validateToken(token, tokenMap);
if (!validation.ok) {
  return { error: validation.error };
}
```

### Anti-flood:
```javascript
// Ограничить 100 пакетов в секунду
const maxPacketsPerSec = 100;
const packetTimestamps = [];

socket.on('message', (data) => {
  const now = Date.now();
  packetTimestamps.push(now);
  packetTimestamps.filter(t => now - t < 1000); // Только за последнюю сек
  
  if (packetTimestamps.length > maxPacketsPerSec) {
    socket.close(1008, 'Policy Violation');
  }
});
```

### WebSocket heartbeat:
```javascript
setInterval(() => {
  socket.ping();
}, 30000); // Каждые 30 сек

socket.on('pong', () => {
  console.log('Игрок активен');
});
```

---

## 🟢 БЛОК 9: ТЕСТЫ

### Запустить тесты:
```bash
node --test test/*.js
```

### Примеры тестов:

**test/battle.test.js:**
```javascript
import test from 'node:test';
import assert from 'node:assert';
import Battle from '../battle.js';

test('Damage calculation', () => {
  const attacker = { lvl: 10, dmg: 10 };
  const target = { armor: 3 };
  const damage = Battle.calculateDamage(attacker, target, 's1');
  assert.strictEqual(damage, 17); // 10 * (1 + 10*0.1) - 3
});

test('Cooldown update', () => {
  const char = { cd1: 1.0 };
  Battle.updateCooldowns(char, 0.5);
  assert.strictEqual(char.cd1, 0.5);
});
```

**test/pvp.test.js:**
```javascript
test('PvP matching', () => {
  const p1 = { lvl: 10 };
  const p2 = { lvl: 14 };
  assert.ok(canMatchWith(p1, p2)); // ±5 уровней
});
```

---

## 🔵 БЛОК 10: ИНФРАСТРУКТУРА

### .gitignore:
```
node_modules/
data/
dist/
*.db
.env
.DS_Store
```

### .env:
```
PORT=8080
HOST=0.0.0.0
LOG_LEVEL=info
DATABASE=data/legendary-age.db
```

### Логирование:
```javascript
function log(level, msg) {
  const time = new Date().toISOString();
  console.log(`[${time}] ${level}: ${msg}`);
}

log('INFO', 'Server started on port 8080');
log('ERROR', 'Database connection failed');
```

### Graceful shutdown:
```javascript
process.on('SIGINT', () => {
  console.log('Shutting down...');
  server.close(() => {
    db.close();
    process.exit(0);
  });
});
```

---

## 🔵 БЛОК 11: КОНТЕНТ

### Использование content.js:

```javascript
const Content = require('./content.js');

// Получить квесты для зоны
const forestQuests = Content.getQuestByZone('forest');

// Проверить завершен ли квест
if (Content.completesQuest(player, quest)) {
  player.xp += quest.reward.xp;
  player.gold += quest.reward.gold;
}

// Дать титул если может
if (Content.canEarnTitle(player, title)) {
  player.titles = player.titles || [];
  player.titles.push(title.id);
}
```

### NPC:
- **Торговец** — покупка зелий
- **Кузнец** — крафтинг оружия
- **Священник** — браки
- **Мастер Классов** — выбор класса

### Квесты:
1. "Убей 10 слизней" → +100 XP, +50 Gold
2. "Исследуй весь лес" → +200 XP, +100 Gold
3. "Убей первого босса" → +500 XP, +200 Gold, титул
4. "Достигни уровня 10" → +300 Gold
5. "Вступи в гильдию" → +150 XP, +75 Gold

### Титулы:
- **boss_slayer** — за убийство босса
- **pvp_champion** — за 50 PvP убийств
- **fortress_owner** — за владение крепостью
- **rich** — за 10,000 золота
- **explorer** — за исследование всех зон

---

## 📊 ИНТЕГРАЦИЯ ВСЕХ БЛОКОВ

**Порядок интеграции в server.js:**

1. Подключить все модули (battle, zones, balance и т.д.)
2. Инициализировать при старте сервера
3. Применять в game-loop каждый тик
4. Сохранять в БД при выходе
5. Отправлять дельты клиенту

**Результат:**
- ✅ Полностью рабочая MMORPG
- ✅ Боевая система
- ✅ PvP арена
- ✅ Осады
- ✅ Квесты и титулы
- ✅ Безопасность

---

**Версия:** BLOCKS 2-11 1.0
**Статус:** ✅ Готовы к интеграции
**Дата:** 7 октября 2026

Начинай интеграцию! 💪
