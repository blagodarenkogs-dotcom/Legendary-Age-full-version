# 🌍 КАК ЗАПУСТИТЬ СЕРВЕР

## СПОСОБ 1: Локально (для теста) — РЕКОМЕНДУЕТСЯ

```bash
# В папке проекта (la2/)
npm run start:local
```

Это запустит **лаунчер + сервер вместе**.
- Сервер слушает на **localhost:8080**
- Лаунчер автоматически подключится

---

## СПОСОБ 2: Только сервер (на другом компе)

```bash
# Терминал 1 - Запусти сервер
npm run server
```

Вывод:
```
🎮 Legendary Age Server v0.3
📡 WebSocket: ws://localhost:8080
```

Сервер готов к подключению!

---

## СПОСОБ 3: Сервер для друзей (локальная сеть)

### На твоём компе:

```bash
npm run server
```

Узнай свой IP:
```bash
# Windows
ipconfig

# Linux/Mac
ifconfig
```

Ищешь строку `IPv4 Address: 192.168.x.x` (или похожую)

### У друга в лаунчере:

Вводит в поле "Сервер":
```
ws://твой_IP:8080
```

Например:
```
ws://192.168.1.100:8080
```

---

## СПОСОБ 4: Сервер в облаке (Railway.app)

### Шаг 1: GitHub
```bash
git init
git add .
git commit -m "Legendary Age v0.3"
git remote add origin https://github.com/ТВ_USERNAME/legendary-age-v0.3.git
git push -u origin main
```

### Шаг 2: Railway
1. Переходишь на https://railway.app
2. Sign Up через GitHub
3. New Project → Deploy from GitHub
4. Выбираешь твой репо
5. Railway запустит сервер автоматически

### Шаг 3: Получить URL
Railway даст тебе адрес вроде:
```
https://legendary-age-production.railway.app
```

Для WebSocket используй:
```
wss://legendary-age-production.railway.app
```

### Шаг 4: Обновить лаунчер
В `index.html` найди:
```html
<input type="text" id="in-server" value="ws://localhost:8080"
```

Замени на:
```html
<input type="text" id="in-server" value="wss://legendary-age-production.railway.app"
```

---

## 📊 ПАРАМЕТРЫ СЕРВЕРА

### Порт

По умолчанию: **8080**

Изменить:
```bash
PORT=3000 npm run server
```

### Хост

По умолчанию: **0.0.0.0** (слушает все интерфейсы)

Изменить:
```bash
HOST=127.0.0.1 npm run server
```

---

## ✅ ПРОВЕРКА

### Сервер работает?

```bash
# Если видишь это - ОК:
🎮 Legendary Age Server v0.3
📡 WebSocket: ws://localhost:8080
✅ Database ready
```

### Клиент подключается?

В лаунчере выбери режим "Онлайн" и нажми "Играть в 2D"

Если видишь: `✅ Подключено к серверу` - всё работает!

---

## 🐛 ПРОБЛЕМЫ

### "Port 8080 already in use"
```bash
PORT=8888 npm run server
```

### "Cannot find module"
```bash
npm install
```

### "Database error"
```bash
rm -rf data/legendary-age.db
npm run server  # База пересоздастся
```

### Друг не может подключиться
1. Проверь что сервер запущен (`npm run server`)
2. Проверь IP адрес (`ipconfig`)
3. Проверь firewall (открыт порт 8080?)

Команда для открытия портов (Windows):
```bash
netsh advfirewall firewall add rule name="Legendary Age" dir=in action=allow protocol=tcp localport=8080
```

---

## 💡 СОВЕТЫ

1. **Не закрывай консоль** - сервер работает пока терминал открыт
2. **Логи в консоли** - там видны все действия игроков
3. **Сохранение автоматическое** - БД сохраняется в `data/legendary-age.db`
4. **Многопользователь** - на одном сервере могут играть 50+ игроков

---

**Готово!** Сервер запущен и работает! 🚀
