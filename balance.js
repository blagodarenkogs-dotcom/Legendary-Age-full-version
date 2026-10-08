/**
 * balance.js — БЛОК 4: Баланс и прогрессия
 * - Anti-twink система (матчмейкинг)
 * - XP за PvP
 * - Респавн таймер
 * - Сокращение классов
 */

const CLASSES_KEPT = ['knight', 'berserker', 'mage', 'healer', 'assassin'];
const LEVEL_RANGE_PVP = 5; // ±5 уровней
const PVP_XP_MULTIPLIER = 50; // level * 50 за убийство
const DAILY_PVP_LIMIT = 100; // максимум XP за день в PvP

const RESPAWN_TIMES = {
  1: 3000,    // 1-10 уровень: 3 сек
  10: 5000,   // 11-20 уровень: 5 сек
  20: 10000   // 21+ уровень: 10 сек
};

function isValidClass(className) {
  return CLASSES_KEPT.includes(className);
}

function getResponwnTime(level) {
  if (level <= 10) return RESPAWN_TIMES[1];
  if (level <= 20) return RESPAWN_TIMES[10];
  return RESPAWN_TIMES[20];
}

function calculatePvPXP(killerLevel, victimLevel) {
  const basXp = victimLevel * PVP_XP_MULTIPLIER;
  const levelDiff = killerLevel - victimLevel;
  
  // Бонус за убийство более сильного
  if (levelDiff < 0) {
    return Math.floor(basXp * (1 + Math.abs(levelDiff) * 0.1));
  }
  
  // Штраф за убийство более слабого
  if (levelDiff > LEVEL_RANGE_PVP) {
    return Math.floor(basXp * 0.5);
  }
  
  return basXp;
}

function canPvPWith(player1, player2) {
  const diff = Math.abs(player1.lvl - player2.lvl);
  return diff <= LEVEL_RANGE_PVP;
}

function checkDailyPvPLimit(player) {
  const today = new Date().toDateString();
  
  if (!player.pvpXpDate) {
    player.pvpXpDate = today;
    player.pvpXpToday = 0;
  }
  
  if (player.pvpXpDate !== today) {
    player.pvpXpDate = today;
    player.pvpXpToday = 0;
  }
  
  return player.pvpXpToday < DAILY_PVP_LIMIT;
}

module.exports = {
  isValidClass,
  getResponwnTime,
  calculatePvPXP,
  canPvPWith,
  checkDailyPvPLimit,
  CLASSES_KEPT,
  LEVEL_RANGE_PVP,
  DAILY_PVP_LIMIT
};
