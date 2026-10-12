const http = require('http');
const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 8080;

// HTTP сервер (отдаёт HTML файлы)
const server = http.createServer((req, res) => {
  // Корневая страница - отдаём index.html
  if (req.url === '/' || req.url === '/index.html') {
    const filePath = path.join(__dirname, 'index.html');
    if (fs.existsSync(filePath)) {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(fs.readFileSync(filePath));
      return;
    }
  }

  // Другие HTML файлы
  if (req.url.endsWith('.html')) {
    const filePath = path.join(__dirname, req.url);
    if (fs.existsSync(filePath)) {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(fs.readFileSync(filePath));
      return;
    }
  }

  // JS файлы
  if (req.url.endsWith('.js')) {
    const filePath = path.join(__dirname, req.url);
    if (fs.existsSync(filePath)) {
      res.writeHead(200, { 'Content-Type': 'application/javascript' });
      res.end(fs.readFileSync(filePath));
      return;
    }
  }

  // По умолчанию отправляем index.html
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(fs.readFileSync(path.join(__dirname, 'index.html')));
});

// WebSocket сервер
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
  console.log('📱 Новый игрок подключился');

  ws.on('message', (data) => {
    try {
      const msg = JSON.parse(data);
      
      if (msg.t === 'me') {
        ws.send(JSON.stringify({
          t: 'welcome',
          you: {
            id: 'player_' + Math.random().toString(36).substr(2, 9),
            charName: 'Герой',
            cls: 'knight',
            lvl: 1,
            hp: 100,
            maxhp: 100,
            xp: 0,
            zone: 'town'
          },
          entities: []
        }));
      }
    } catch (e) {
      console.error('Ошибка:', e);
    }
  });

  ws.on('close', () => {
    console.log('📱 Игрок отключился');
  });
});

// Запуск
server.listen(PORT, '0.0.0.0', () => {
  console.log('');
  console.log('╔════════════════════════════════════════╗');
  console.log('║   🎮 LEGENDARY AGE SERVER v0.3        ║');
  console.log('╚════════════════════════════════════════╝');
  console.log('');
  console.log(`✅ Сервер запущен на порту ${PORT}`);
  console.log(`📡 WebSocket: ws://localhost:${PORT}`);
  console.log(`🌐 HTTP: http://localhost:${PORT}`);
  console.log('');
});

process.on('SIGINT', () => {
  console.log('\n🛑 Завершение...');
  server.close(() => {
    console.log('✅ Сервер остановлен');
    process.exit(0);
  });
});
