@echo off
echo.
echo ════════════════════════════════════════════════════════════
echo  Legendary Age v0.3 — Сборка .exe
echo ════════════════════════════════════════════════════════════
echo.

REM Проверить Node.js
node --version > nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js не найден! Установи с https://nodejs.org
    pause
    exit /b 1
)

echo ✅ Node.js найден

REM Установить зависимости если нужно
if not exist "node_modules" (
    echo.
    echo 📦 Установка зависимостей...
    call npm install
)

REM Сборка
echo.
echo 🔨 Сборка .exe...
call npm run build

echo.
echo ════════════════════════════════════════════════════════════
echo.
if exist "dist\Legendary Age*.exe" (
    echo ✅ ГОТОВО!
    echo.
    echo 📁 .exe находится в папке: dist\
    echo.
    echo Ищи файл вроде:
    echo   Legendary Age 0.3.0.exe
    echo.
    echo 🎮 Просто запусти его — сервер запустится автоматически!
) else (
    echo ❌ Сборка не удалась
    echo.
    echo Проверь:
    echo   1. Установлены ли npm пакеты (npm install)
    echo   2. Есть ли ошибки выше
)

echo.
pause
