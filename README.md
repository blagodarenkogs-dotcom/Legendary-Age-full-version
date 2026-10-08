# ⚔️ Legendary Age v0.3

Medieval fantasy MMORPG на Electron + Node.js + WebSocket + SQLite

## 🚀 БЫСТРЫЙ СТАРТ

```bash
npm install
npm run start:local    # Лаунчер + сервер
```

Или:
```bash
npm run server         # Только сервер (терминал 1)
npm start              # Только лаунчер (терминал 2)
```

## 🎮 ЧТО ВНУТРИ

- 9 классов персонажей
- 6+ локаций (Город, Лес, Подземелье, Горы, Крепость, Бездна)
- Гильдии с еженедельными осадами
- Таверна со свадьбами
- Система крафтинга
- Инвентарь и экипировка
- Боссы: Альфа-волк, Ледяная Королева, Король-Лич, ПЕРВОРОДНЫЙ ХАОС
- SQLite база данных
- Оптимизированная сеть (State Delta)

## 📁 ФАЙЛЫ

```
├─ server.js           - WebSocket сервер
├─ index.html          - Лаунчер
├─ game-v3.html        - Игра
├─ progression.js      - Система уровней
├─ guilds.js           - Гильдии
├─ tavern.js           - Таверна
├─ crafting.js         - Крафтинг
├─ inventory.js        - Инвентарь
├─ bosses.js           - Боссы
├─ world-v2.js         - Карта (6+ локаций)
└─ [остальное в документации]
```

## 🌐 РАЗВЁРТЫВАНИЕ

На Railway.app (бесплатно):
1. GitHub → New Repo
2. git push на GitHub
3. Railway → Deploy from GitHub
4. Получишь wss://... URL

## 📚 ДОКУМЕНТАЦИЯ

Полная информация в INSTALL.md и PROJECT_OVERVIEW_RU.md

## 📝 ЛИЦЕНЗИЯ

MIT License
