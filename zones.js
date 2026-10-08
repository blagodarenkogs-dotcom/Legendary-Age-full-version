/**
 * zones.js
 * 
 * ЕДИНЫЙ источник истины для всех зон игры
 * Используется и сервером, и клиентом
 * 
 * Структура зоны:
 * {
 *   id: уникальный ID
 *   name: имя для игрока
 *   icon: эмодзи
 *   pvp: 'none' | 'safe' | 'arena'
 *   width, height: размер зоны
 *   spawn: {x, y} - точка спавна
 *   minLevel: минимальный уровень для входа
 *   mobs: ['slime', 'wolf', ...] - типы мобов
 *   bosses: ['boss_id', ...] - боссы
 *   npc: [{id, name, type, pos}, ...] - NPC
 *   portals: [{pos, to, toPos}, ...] - порталы
 * }
 */

(function (g) {
  'use strict';
  const isNode = typeof module === 'object' && module.exports;

  const ZONES = {
    town: {
      id: 'town',
      name: 'Город Легенды',
      icon: '🏰',
      desc: 'Безопасное место для начинающих',
      pvp: 'none',        // Нет PvP
      width: 1000,
      height: 1000,
      spawn: { x: 500, y: 500 },
      minLevel: 1,
      mobs: [],           // Нет мобов в городе
      bosses: [],
      npc: [
        { id: 'npc_tavern', name: 'Харчевник Грегор', pos: { x: 500, y: 400 }, type: 'tavern' },
        { id: 'npc_master', name: 'Мастер Классов Альда', pos: { x: 600, y: 400 }, type: 'classmaster' },
        { id: 'npc_priest', name: 'Священник Лион', pos: { x: 700, y: 400 }, type: 'priest' }
      ],
      portals: [
        { pos: { x: 100, y: 500 }, to: 'forest', toPos: { x: 900, y: 500 } },
        { pos: { x: 900, y: 500 }, to: 'pvp_arena', toPos: { x: 100, y: 500 } }
      ]
    },

    forest: {
      id: 'forest',
      name: 'Лесной Туннель',
      icon: '🌲',
      desc: 'Опасный лес с монстрами среднего уровня',
      pvp: 'safe',        // Нет PvP, но опасно
      width: 1200,
      height: 1200,
      spawn: { x: 900, y: 500 },
      minLevel: 5,
      mobs: ['slime', 'wolf', 'orc'],
      bosses: ['boss_alpha'],
      npc: [],
      portals: [
        { pos: { x: 900, y: 500 }, to: 'town', toPos: { x: 100, y: 500 } },
        { pos: { x: 100, y: 600 }, to: 'dungeon', toPos: { x: 900, y: 600 } },
        { pos: { x: 1100, y: 400 }, to: 'mountain', toPos: { x: 100, y: 400 } }
      ]
    },

    dungeon: {
      id: 'dungeon',
      name: 'Мрачное Подземелье',
      icon: '💀',
      desc: 'Самая опасная локация. Требуется уровень 20+',
      pvp: 'safe',
      width: 1000,
      height: 1500,
      spawn: { x: 900, y: 600 },
      minLevel: 20,
      mobs: ['skeleton', 'bat', 'demon'],
      bosses: ['boss_lich'],
      npc: [],
      portals: [
        { pos: { x: 900, y: 600 }, to: 'forest', toPos: { x: 100, y: 600 } },
        { pos: { x: 500, y: 1400 }, to: 'abyss', toPos: { x: 500, y: 100 } }
      ]
    },

    mountain: {
      id: 'mountain',
      name: 'Горный Перевал',
      icon: '⛰️',
      desc: 'Холодные горы с ледяными существами',
      pvp: 'safe',
      width: 1400,
      height: 800,
      spawn: { x: 100, y: 400 },
      minLevel: 15,
      mobs: ['goblin', 'golem', 'ice_drake'],
      bosses: ['boss_frost'],
      npc: [],
      portals: [
        { pos: { x: 100, y: 400 }, to: 'forest', toPos: { x: 1100, y: 400 } },
        { pos: { x: 1300, y: 400 }, to: 'castle', toPos: { x: 100, y: 400 } }
      ]
    },

    castle: {
      id: 'castle',
      name: 'Крепость Врагов',
      icon: '🏯',
      desc: 'Осаждаемая крепость. Место боёв гильдий',
      pvp: 'safe',        // PvE событие (осада)
      width: 800,
      height: 800,
      spawn: { x: 400, y: 400 },
      minLevel: 10,
      mobs: [],
      bosses: [],
      npc: [
        { id: 'npc_warden', name: 'Страж Крепости', pos: { x: 400, y: 400 }, type: 'warden' }
      ],
      portals: [
        { pos: { x: 100, y: 400 }, to: 'mountain', toPos: { x: 1300, y: 400 } }
      ]
    },

    pvp_arena: {
      id: 'pvp_arena',
      name: 'Арена Боёв',
      icon: '⚔️',
      desc: 'Чистая PvP арена для одноединства',
      pvp: 'arena',       // ТОЛЬКО PvP!
      width: 600,
      height: 600,
      spawn: { x: 300, y: 300 },
      minLevel: 1,
      mobs: [],          // Нет мобов
      bosses: [],        // Нет боссов
      npc: [
        { id: 'npc_announcer', name: 'Ведущий боёв', pos: { x: 300, y: 100 }, type: 'announcer' }
      ],
      portals: [
        { pos: { x: 100, y: 300 }, to: 'town', toPos: { x: 900, y: 500 } }
      ]
    },

    abyss: {
      id: 'abyss',
      name: 'Бездна Забвения',
      icon: '🌌',
      desc: 'Финальная локация. Требуется уровень 40+',
      pvp: 'safe',
      width: 2000,
      height: 2000,
      spawn: { x: 500, y: 100 },
      minLevel: 40,
      mobs: ['void_entity', 'shadow', 'chaos_spawn'],
      bosses: ['boss_chaos'],
      npc: [],
      portals: [
        { pos: { x: 500, y: 100 }, to: 'dungeon', toPos: { x: 500, y: 1400 } }
      ]
    }
  };

  // Типы мобов
  const MOB_TYPES = {
    slime: { name: 'Слизень', hp: 10, dmg: 2, xp: 15, gold: 5, icon: '🟢' },
    wolf: { name: 'Волк', hp: 20, dmg: 4, xp: 30, gold: 12, icon: '🐺' },
    orc: { name: 'Орк', hp: 30, dmg: 5, xp: 45, gold: 20, icon: '👹' },
    skeleton: { name: 'Скелет', hp: 25, dmg: 5, xp: 50, gold: 25, icon: '💀' },
    bat: { name: 'Летучая мышь', hp: 15, dmg: 3, xp: 25, gold: 10, icon: '🦇' },
    demon: { name: 'Демон', hp: 60, dmg: 8, xp: 100, gold: 50, icon: '😈' },
    goblin: { name: 'Гоблин', hp: 35, dmg: 6, xp: 60, gold: 30, icon: '👺' },
    golem: { name: 'Голем', hp: 80, dmg: 9, xp: 120, gold: 60, icon: '⛨' },
    ice_drake: { name: 'Ледяной дракончик', hp: 90, dmg: 10, xp: 150, gold: 80, icon: '🐉' },
    void_entity: { name: 'Сущность Пустоты', hp: 100, dmg: 12, xp: 200, gold: 100, icon: '👻' },
    shadow: { name: 'Тень', hp: 70, dmg: 11, xp: 180, gold: 90, icon: '⬛' },
    chaos_spawn: { name: 'Порождение Хаоса', hp: 120, dmg: 15, xp: 250, gold: 150, icon: '🌀' }
  };

  /**
   * Получить зону по ID
   */
  function getZone(zoneId) {
    return ZONES[zoneId];
  }

  /**
   * Получить все зоны
   */
  function getAllZones() {
    return Object.values(ZONES);
  }

  /**
   * Получить все ID зон
   */
  function getZoneIds() {
    return Object.keys(ZONES);
  }

  /**
   * Проверить может ли игрок войти в зону
   */
  function canEnterZone(playerLevel, zoneId) {
    const zone = ZONES[zoneId];
    if (!zone) return false;
    return playerLevel >= zone.minLevel;
  }

  /**
   * Получить данные о типе моба
   */
  function getMobData(mobType) {
    return MOB_TYPES[mobType];
  }

  /**
   * Спавнить монстров в зоне
   */
  function spawnMobs(zone, count = 5) {
    if (!zone.mobs || zone.mobs.length === 0) return [];

    const mobs = [];
    for (let i = 0; i < count; i++) {
      const mobType = zone.mobs[Math.floor(Math.random() * zone.mobs.length)];
      const mobData = MOB_TYPES[mobType];

      const mob = {
        id: 'm_' + Math.random().toString(36).substr(2, 9),
        type: 'monster',
        name: mobData.name,
        mobType: mobType,
        icon: mobData.icon,
        lvl: 1 + Math.floor(Math.random() * 10),
        hp: mobData.hp,
        maxhp: mobData.hp,
        dmg: mobData.dmg,
        xp: mobData.xp,
        gold: mobData.gold,
        x: Math.random() * zone.width,
        y: Math.random() * zone.height,
        z: 0,
        dir: Math.floor(Math.random() * 4),
        status: 'idle'
      };

      mobs.push(mob);
    }

    return mobs;
  }

  /**
   * Получить портал по позиции
   */
  function getPortal(zone, x, y, distanceThreshold = 50) {
    if (!zone.portals) return null;

    for (const portal of zone.portals) {
      const dist = Math.hypot(portal.pos.x - x, portal.pos.y - y);
      if (dist < distanceThreshold) {
        return {
          toZone: portal.to,
          toPos: portal.toPos
        };
      }
    }

    return null;
  }

  const api = {
    ZONES,
    MOB_TYPES,
    getZone,
    getAllZones,
    getZoneIds,
    canEnterZone,
    getMobData,
    spawnMobs,
    getPortal
  };

  if (isNode) module.exports = api;
  else g.Zones = api;
})(typeof self !== 'undefined' ? self : globalThis);
