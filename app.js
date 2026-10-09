/**
 * Legendary Age — Mobile APK (Android)
 * Запускает сервер на телефоне и открывает WebView
 */

const http = require('http');
const WebSocket = require('ws');
const path = require('path');
const fs = require('fs');

const PORT = 8080;

// Создать HTTP сервер
const server = http.createServer((req, res) => {
  // Отдать index.html
  if (req.url === '/' || req.url === '/index.html') {
    const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
    return;
  }

  // Отдать game-v3.html
  if (req.url === '/game-v3.html') {
    const html = fs.readFileSync(path.join(__dirname, '../game-v3.html'), 'utf8');
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
    return;
  }

  // Отдать .js файлы
  if (req.url.endsWith('.js')) {
    const file = path.join(__dirname, '..', req.url);
    if (fs.existsSync(file)) {
      const content = fs.readFileSync(file, 'utf8');
      res.writeHead(200, { 'Content-Type': 'application/javascript' });
      res.end(content);
      return;
    }
  }

  // 404
  res.writeHead(404);
  res.end('Not found');
});

// WebSocket сервер
const wss = new WebSocket.Server({ server });

const players = {};

wss.on('connection', (socket) => {
  console.log('📱 Игрок подключился');

  socket.on('message', (data) => {
    try {
      const msg = JSON.parse(data);
      handleMessage(socket, msg);
    } catch (e) {
      console.error('Ошибка парсинга:', e);
    }
  });

  socket.on('close', () => {
    console.log('📱 Игрок отключился');
  });
});

function handleMessage(socket, msg) {
  if (msg.t === 'me') {
    socket.send(JSON.stringify({
      t: 'welcome',
      zone: 'town',
      you: {
        id: 'player_' + Math.random().toString(36).substr(2, 9),
        charName: 'Мобильный',
        cls: 'knight',
        lvl: 1,
        hp: 100,
        maxhp: 100,
        x: 500,
        y: 500
      },
      entities: []
    }));
  }
}

server.listen(PORT, '0.0.0.0', () => {
  console.log('\n🎮 LEGENDARY AGE MOBILE\n');
  console.log('✅ Сервер на порту 8080');
  console.log('📱 Открой: http://localhost:8080\n');
});

process.on('SIGINT', () => {
  console.log('\n🛑 Завершение...');
  server.close(() => process.exit(0));
});
