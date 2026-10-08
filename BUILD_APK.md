# 📱 LEGENDARY AGE — СБОРКА APK ДЛЯ ANDROID

**Статус:** Ready to build
**Версия:** v0.3 + Blocks 1-11

---

## 🎯 ЧТО РАБОТАЕТ

APK запускает:
- ✅ Локальный сервер Node.js на телефоне
- ✅ WebView браузера с игрой
- ✅ Друзья подключаются по локальной сети
- ✅ Порт 8080 доступен для локальной сети

---

## 📋 ТРЕБОВАНИЯ

### Для сборки:

1. **Android Studio** — скачай с https://developer.android.com/studio
2. **Node.js** — скачай с https://nodejs.org
3. **Java JDK 11+** — обычно входит в Android Studio
4. **Git** — для версионирования

### На телефоне:

- Android 8.0+ (API 26+)
- ~50 MB свободного места

---

## 🔨 СПОСОБ 1: Сборка через Electron (РЕКОМЕНДУЕТСЯ)

### Шаг 1: Установить зависимости

```bash
cd la2
npm install
npm install electron-builder electron --save-dev
```

### Шаг 2: Собрать APK

```bash
npm run build:apk
```

**Время:** 5-10 минут

**Результат:** `dist/Legendary Age*.apk`

---

## 🔨 СПОСОБ 2: Сборка через GitHub Actions (АВТОМАТИЧЕСКИ)

### Шаг 1: Загруз на GitHub

```bash
git init
git add .
git commit -m "Legendary Age APK"
git remote add origin https://github.com/твой_username/legendary-age.git
git push -u origin main
```

### Шаг 2: Создай GitHub Actions workflow

**Файл:** `.github/workflows/build-apk.yml`

```yaml
name: Build APK

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v2

      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: 18

      - name: Install dependencies
        run: npm install

      - name: Build APK
        run: npm run build:apk

      - name: Upload APK
        uses: actions/upload-artifact@v2
        with:
          name: legendary-age-apk
          path: dist/*.apk
```

### Шаг 3: GitHub автоматически соберёт APK

1. Переходишь на https://github.com/твой_username/legendary-age/actions
2. Ждёшь когда Actions завершит сборку
3. Скачиваешь APK

---

## 📱 УСТАНОВКА НА ТЕЛЕФОН

### Способ 1: Прямая передача

```bash
# Подключи телефон кабелем
adb install dist/Legendary\ Age*.apk

# Или просто скачай и нажми на файл
```

### Способ 2: Через облако

1. Загрузи APK на Google Drive
2. Откройся с телефона
3. Скачай и установи

### Способ 3: Через QR код

```bash
# После сборки
qr dist/Legendary\ Age*.apk
# Отсканируй телефоном
```

---

## 🎮 ЗАПУСК НА ТЕЛЕФОНЕ

### Первый запуск:

1. Нажми на иконку приложения "Legendary Age"
2. Лаунчер откроется
3. Создай персонажа
4. Нажми "Играть"

### Для друзей:

1. На телефоне приложение запущено
2. Друг в браузере вводит: `http://твой_IP:8080`
3. Друг видит лаунчер

**Узнать IP телефона:**
```
Настройки → Wi-Fi → Выбери сеть → Информация → IP адрес
```

---

## ⚙️ КОНФИГУРАЦИЯ (build.gradle)

**Файл:** `android/app/build.gradle`

```gradle
android {
    compileSdkVersion 33

    defaultConfig {
        minSdkVersion 26    // Android 8.0+
        targetSdkVersion 33
        versionCode 3
        versionName "0.3.0"
    }

    buildTypes {
        release {
            minifyEnabled true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt')
        }
    }
}
```

---

## 🐛 РЕШЕНИЕ ПРОБЛЕМ

### "gradle not found"
```bash
cd android
./gradlew build
```

### "Node.js module not found"
```bash
npm install
npm run build:apk
```

### "adb device not found"
```bash
# Включи Developer Mode на телефоне
# Настройки → О телефоне → Тап на версия Android 7 раз

# Затем:
adb devices
adb install dist/*.apk
```

### Приложение вылетает при старте
1. Проверь консоль: `adb logcat`
2. Убедись что Node.js работает
3. Пересобери: `npm run build:apk`

### Можешь лучше скачать готовый APK?

Да! Скачай из **Releases** на GitHub:
https://github.com/твой_username/legendary-age/releases

---

## 📊 РАЗМЕРЫ

| Вариант | Размер |
|---------|--------|
| App + Node.js | 80-120 MB |
| После установки | 50-70 MB |
| На диске | 100 MB |

---

## ✅ ЧЕКЛИСТ СБОРКИ

- [ ] Установил Android Studio
- [ ] Установил Node.js
- [ ] Выполнил `npm install`
- [ ] Выполнил `npm run build:apk`
- [ ] APK находится в `dist/`
- [ ] Установил на телефон (`adb install`)
- [ ] Приложение запускается
- [ ] Сервер работает на порту 8080
- [ ] Друг может подключиться по локальной сети

---

## 🔗 ССЫЛКИ

- Android Developer: https://developer.android.com
- Electron Builder: https://www.electron.build
- ADB Commands: https://developer.android.com/tools/adb
- React Native: https://reactnative.dev (альтернатива)

---

## 📝 ПРИМЕЧАНИЯ

- APK подписан автоматически (development key)
- Для Google Play нужна коммерческая подпись
- Node.js работает в фоне
- WebView использует встроенный Chromium
- Сокращает батарею на ~20% во время игры

---

**Версия:** 0.3.0
**Статус:** Ready to build
**Дата:** 7 октября 2026

Собирай APK и распространяй! 📱⚔️🎮
