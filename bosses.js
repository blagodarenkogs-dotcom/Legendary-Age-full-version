/**
 * bosses.js - Система боссов с уникальными способностями
 */
(function (g) {
  'use strict';
  const isNode = typeof module === 'object' && module.exports;
  
  const BOSSES = {
    'boss_alpha': {
      name: 'Альфа-волк', icon: '🐺', location: 'forest', level: 15, hp: 200, dmg: 8,
      xp: 500, gold: 100, loot: [
        { id: 'fang_alpha', name: 'Клык Альфы', rarity: 'SSS' },
        { id: 'pelt_alpha', name: 'Шкура Альфы', rarity: 'SS' }
      ]
    },
    'boss_frost': {
      name: 'Ледяная Королева', icon: '🐉', location: 'mountain', level: 25, hp: 350, dmg: 12,
      xp: 800, gold: 200, loot: [
        { id: 'crown_frost', name: 'Корона Льда', rarity: 'SSS' },
        { id: 'crystal_frost', name: 'Кристалл Льда', rarity: 'SSS' }
      ]
    },
    'boss_lich': {
      name: 'Король-Лич', icon: '💀', location: 'dungeon', level: 30, hp: 500, dmg: 15,
      xp: 1200, gold: 300, loot: [
        { id: 'crown_lich', name: 'Корона Лича', rarity: 'SSS' },
        { id: 'staff_lich', name: 'Посох Лича', rarity: 'SSS' }
      ]
    }
  };
  
  function getBoss(id) { return BOSSES[id]; }
  function generateLoot(boss) {
    return { items: boss.loot, gold: boss.gold, xp: boss.xp };
  }
  
  const api = { BOSSES, getBoss, generateLoot };
  if (isNode) module.exports = api;
  else g.Bosses = api;
})(typeof self !== 'undefined' ? self : globalThis);
