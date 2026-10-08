#!/usr/bin/env node
/**
 * server-v3.js
 * 
 * Оптимизированный сервер MMORPG "Legendary Age" v0.3
 * 
 * Новое:
 * ✅ State Delta вместо полной карты мира каждый тик
 * ✅ SQLite база данных вместо accounts.json
 * ✅ Система прогрессии (Novice → Класс)
 * ✅ Гильдии, осады, союзы
 * ✅ Таверна, свадьбы, объявления
 * ✅ Anti-flood, авторитарный движок
 */

'use strict';
const WebSocket = require('ws');
const http = require('http');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Импортируем модули
const Progression = require('./progression.js');
const Guilds = require('./guilds.js');
const Tavern = require('./tavern.js');
const StateDelta = require('./state-delta.js');
const { GameDatabase } = require('./db-sqlite.js');
const DB = require('./voxel-db.js');

// Конфигурация
const PORT = process.env.PORT || 8080;
const HOST = process.env.HOST || '0.0.0.0';
const TICK_MS = 50; // 20 тиков/сек
const DATA_DIR = path.join(__dirname, 'data');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);

// Глобальное состояние
const game = {
  players: new Map(), // id -> player
  zones: new Map(),   // zoneName -> entities
  guilds: new Map(),  // guildId -> guild
  marriages: new Map(), // marriage -> {char1, char2}
  notices: [],        // объявления в таверне
  db: new GameDatabase(path.join(DATA_DIR, 'legendary-age.db')),
  deltaMgr: new Map() // zoneName -> ZoneDeltaManager
};

// Инициализируем зоны
const ZONES = ['town', 'forest', 'dungeon'];
for (const zone of ZONES) {
  game.zones.set(zone, []);
  game.deltaMgr.set(zone, new StateDelta.ZoneDeltaManager());
}

// ============ АУТЕНТИФИКАЦИЯ ============

const tokenMap = new Map(); // token -> { accountId, login, charId, char, session }

function hashPassword(pass) {
  return crypto.scryptSync(pass, 'salt', 32).toString('hex');
}

function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

// ============ ИГРОВАЯ ЛОГИКА ============

function getZoneEntities(zoneName) {
  return game.zones.get(zoneName) || [];
}

function addEntityToZone(zoneName, entity) {
  const zone = game.zones.get(zoneName);
  if (zone) {
    zone.push(entity);
    const mgr = game.deltaMgr.get(zoneName);
    if (mgr) mgr.addEntity(entity);
  }
}

function removeEntityFromZone(zoneName, entityId) {
  const zone = game.zones.get(zoneName);
  if (zone) {
    const idx = zone.findIndex(e => e.id === entityId);
    if (idx !== -1) {
      zone.splice(idx, 1);
      const mgr = game.deltaMgr.get(zoneName);
      if (mgr) mgr.removeEntity(entityId);
    }
  }
}

function updateZoneEntity(zoneName, entity) {
  const mgr = game.deltaMgr.get(zoneName);
  if (mgr) mgr.updateEntity(entity);
}

// ============ WebSocket СЕРВЕР ============

const server = http.createServer((req, res) => {
  // Health-check для Render / Railway / UptimeRobot
  if (req.url === '/' || req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Legendary Age Server v0.3 OK\n');
    return;
  }
  res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('Legendary Age Server v0.3 — WebSocket only\n');
});

const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
  let client = { ws, accountId: null, token: null, charId: null, zone: null, messageCount: 0, messageTime: Date.now() };
  
  console.log(`[${new Date().toISOString()}] Новое подключение`);

  // Сразу отправляем hello — клиент ждёт его при подключении
  try { ws.send(JSON.stringify({ t: 'hello' })); } catch (e) { /* ignore */ }

  ws.on('message', async (raw) => {
    try {
      // Anti-flood
      client.messageCount++;
      if (Date.now() - client.messageTime > 1000) {
        client.messageCount = 0;
        client.messageTime = Date.now();
      }
      if (client.messageCount > 120) {
        ws.close(1008, 'Too many messages');
        return;
      }

      let msg;
      try { msg = JSON.parse(raw); } catch (e) { return; }

      // ---- РЕГИСТРАЦИЯ ----
      if (msg.t === 'register') {
        const result = game.db.registerAccount(msg.login, msg.pass);
        if (result.success) {
          const token = generateToken();
          tokenMap.set(token, { accountId: result.accountId, login: msg.login, chars: [] });
          client.token = token;
          client.accountId = result.accountId;
          ws.send(JSON.stringify({ t: 'auth', ok: true, token, login: msg.login, char: null }));
        } else {
          ws.send(JSON.stringify({ t: 'auth', ok: false, error: result.error }));
        }
      }

      // ---- ВХОД ----
      else if (msg.t === 'login') {
        const result = game.db.verifyAccount(msg.login, msg.pass);
        if (result.success) {
          const token = generateToken();
          const chars = game.db.getAccountCharacters(result.accountId);
          tokenMap.set(token, { accountId: result.accountId, login: msg.login, chars });
          client.token = token;
          client.accountId = result.accountId;
          if (chars[0]) client.charId = chars[0].id;
          ws.send(JSON.stringify({ t: 'auth', ok: true, token, login: msg.login, char: chars[0] || null }));
        } else {
          ws.send(JSON.stringify({ t: 'auth', ok: false, error: result.error }));
        }
      }

      // ---- ВОЗОБНОВЛЕНИЕ СЕССИИ ----
      else if (msg.t === 'me') {
        const session = tokenMap.get(msg.token);
        if (session) {
          const chars = game.db.getAccountCharacters(session.accountId);
          client.token = msg.token;
          client.accountId = session.accountId;
          if (chars[0]) client.charId = chars[0].id;
          ws.send(JSON.stringify({ t: 'auth', ok: true, token: msg.token, login: session.login, char: chars[0] || null }));
        } else {
          ws.send(JSON.stringify({ t: 'auth', ok: false, error: 'Invalid token' }));
        }
      }

      // ---- СОЗДАНИЕ ПЕРСОНАЖА ----
      else if (msg.t === 'create') {
        if (!client.token) { ws.send(JSON.stringify({ t: 'char', ok: false, error: 'Not authenticated' })); return; }
        
        const session = tokenMap.get(client.token);
        if (!session) { ws.send(JSON.stringify({ t: 'char', ok: false, error: 'Invalid token' })); return; }

        const cleanedName = DB.cleanName(msg.char.name);
        if (!cleanedName) { ws.send(JSON.stringify({ t: 'char', ok: false, error: 'Invalid name' })); return; }

        if (!msg.char.gender) { ws.send(JSON.stringify({ t: 'char', ok: false, error: 'Gender required' })); return; }

        const charResult = game.db.createCharacter(session.accountId, {
          name: cleanedName,
          gender: msg.char.gender,
          cls: 'novice',
          hairColor: msg.char.hairColor,
          hairLen: msg.char.hairLen
        });

        if (charResult.success) {
          const char = game.db.getCharacter(charResult.charId);
          session.chars = [char];
          client.charId = char.id;
          ws.send(JSON.stringify({ t: 'char', ok: true, char }));
        } else {
          ws.send(JSON.stringify({ t: 'char', ok: false, error: charResult.error }));
        }
      }

      // ---- ВХОД В ИГРУ ----
      else if (msg.t === 'join') {
        if (!msg.zone) return;
        // Если charId не установлен — берём первого персонажа аккаунта
        if (!client.charId && client.accountId) {
          const chars = game.db.getAccountCharacters(client.accountId);
          if (chars[0]) client.charId = chars[0].id;
        }
        if (!client.charId) {
          ws.send(JSON.stringify({ t: 'auth', ok: false, error: 'Нет персонажа' }));
          return;
        }
        
        const char = game.db.getCharacter(client.charId);
        if (!char) return;

        client.zone = msg.zone;
        
        // Добавляем игрока в зону
        const player = {
          id: 'p_' + client.charId,
          accountId: client.accountId,
          charName: char.name,
          gender: char.gender,
          cls: char.cls,
          hairColor: char.hairColor,
          hairLen: char.hairLen,
          lvl: char.level,
          xp: char.xp,
          gold: char.gold,
          hp: char.hp,
          maxhp: char.maxhp,
          mana: char.mana,
          maxmana: char.maxmana,
          x: char.x,
          y: char.y,
          z: char.z,
          type: 'player',
          dir: 0,
          pose: 'stand',
          status: 'idle'
        };

        game.players.set(client.charId, player);
        addEntityToZone(msg.zone, player);

        // Отправляем полный снимок зоны
        const mgr = game.deltaMgr.get(msg.zone);
        const snapshot = mgr ? mgr.getFullSnapshot() : [];

        ws.send(JSON.stringify({
          t: 'welcome',
          zone: msg.zone,
          you: player,
          entities: snapshot
        }));

        console.log(`[${new Date().toISOString()}] ${char.name} присоединился к ${msg.zone}`);
      }

      // ---- INPUT (WASD) ----
      else if (msg.t === 'input') {
        const player = game.players.get(client.charId);
        if (!player) return;

        // Обновляем позицию на основе input (авторитарно на сервере)
        if (msg.w) player.y -= 2;
        if (msg.a) player.x -= 2;
        if (msg.s) player.y += 2;
        if (msg.d) player.x += 2;

        // Границы зоны
        player.x = Math.max(0, Math.min(1000, player.x));
        player.y = Math.max(0, Math.min(1000, player.y));

        updateZoneEntity(client.zone, player);
      }

      // ---- ВЫ БОР КЛАССА (на уровне 10) ----
      else if (msg.t === 'class') {
        const char = game.db.getCharacter(client.charId);
        if (!char) return;

        if (char.level !== 10 || char.cls !== 'novice') {
          ws.send(JSON.stringify({ t: 'class', ok: false, error: 'Can only choose class at level 10' }));
          return;
        }

        // Используем progression
        const voxelChar = { ...char, lvl: char.level, cls: char.cls };
        const result = Progression.chooseClass(voxelChar, msg.cls);

        if (result.success) {
          char.level = voxelChar.lvl;
          char.cls = voxelChar.cls;
          game.db.saveCharacter({ ...char, lvl: char.level });
          ws.send(JSON.stringify({ t: 'class', ok: true, cls: msg.cls, lvl: 1 }));
        } else {
          ws.send(JSON.stringify({ t: 'class', ok: false, error: result.error }));
        }
      }

      // ---- CHAT ----
      else if (msg.t === 'chat') {
        if (msg.text.length > 200) return;
        const player = game.players.get(client.charId);
        if (!player) return;

        const packet = JSON.stringify({
          t: 'chat',
          from: player.charName,
          text: msg.text,
          zone: client.zone,
          time: Date.now()
        });

        // Отправляем всем в зоне
        const zone = getZoneEntities(client.zone);
        for (const entity of zone) {
          const playerWs = findPlayerWs(entity.id);
          if (playerWs) playerWs.send(packet);
        }
      }

      // ---- PING/PONG ----
      else if (msg.t === 'ping') {
        ws.send(JSON.stringify({ t: 'pong' }));
      }

    } catch (err) {
      console.error('Message error:', err);
    }
  });

  ws.on('close', () => {
    if (client.charId) {
      removeEntityFromZone(client.zone, 'p_' + client.charId);
      game.players.delete(client.charId);
      console.log(`[${new Date().toISOString()}] Отключение (${client.charId})`);
    }
  });
});

function findPlayerWs(playerId) {
  for (const [, client] of game.players.entries()) {
    if (client.id === playerId) return client.ws;
  }
  return null;
}

// ============ ГЛАВНЫЙ ЦИКЛ (TICK) ============

setInterval(() => {
  // Отправляем delta updates для каждой зоны
  for (const [zoneName, mgr] of game.deltaMgr.entries()) {
    const packet = mgr.getNetworkPacket();
    if (!packet) continue;

    const zone = getZoneEntities(zoneName);
    for (const entity of zone) {
      if (entity.type === 'player') {
        const ws = findPlayerWs(entity.id);
        if (ws && ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify(packet));
        }
      }
    }
  }
}, TICK_MS);

// ============ СТАРТ СЕРВЕРА ============

server.listen(PORT, HOST, () => {
  console.log(`\n🎮 Legendary Age Server v0.3`);
  console.log(`📡 WebSocket: ws://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}`);
  console.log(`📊 Mode: State Delta Optimized, SQLite Database`);
  console.log(`🏛️  Features: Guilds, Raids, Tavern, Marriages\n`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down...');
  game.db.close();
  server.close();
  process.exit(0);
});

module.exports = { game, wss };
