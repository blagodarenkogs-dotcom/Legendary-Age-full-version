/**
 * world-v2.js - Расширенная карта мира с 6+ локациями
 */
(function (g) {
  'use strict';
  const isNode = typeof module === 'object' && module.exports;
  
  const ZONES = {
    town: { name: '🏰 Город Легенды', safe: true, mobs: [] },
    forest: { name: '🌲 Лесной Туннель', safe: false, mobs: ['slime', 'wolf', 'orc'] },
    dungeon: { name: '💀 Мрачное Подземелье', safe: false, mobs: ['skeleton', 'demon'] },
    mountain: { name: '⛰️ Горный Перевал', safe: false, mobs: ['goblin', 'golem'] },
    castle: { name: '🏯 Крепость Врагов', safe: false, mobs: [], isRaidZone: true },
    abyss: { name: '🌌 Бездна Забвения', safe: false, mobs: ['void_entity', 'chaos'] }
  };
  
  const MOB_TYPES = {
    slime: { name: 'Слизень', hp: 10, dmg: 2, xp: 15 },
    wolf: { name: 'Волк', hp: 20, dmg: 4, xp: 30 },
    orc: { name: 'Орк', hp: 30, dmg: 5, xp: 45 },
    skeleton: { name: 'Скелет', hp: 25, dmg: 5, xp: 50 },
    demon: { name: 'Демон', hp: 60, dmg: 8, xp: 100 }
  };
  
  function getZone(name) { return ZONES[name]; }
  function getAllZones() { return Object.keys(ZONES); }
  function getMobData(type) { return MOB_TYPES[type]; }
  
  const api = { ZONES, MOB_TYPES, getZone, getAllZones, getMobData };
  if (isNode) module.exports = api;
  else g.World = api;
})(typeof self !== 'undefined' ? self : globalThis);
