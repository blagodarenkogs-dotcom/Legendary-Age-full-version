/**
 * sieges.js — БЛОК 7: Осады (PvE ивент)
 * - Механика осад каждое воскресенье
 * - Союзы гильдий
 * - Бонус владения (+15% XP/Gold)
 */

const SIEGE_DAY = 0; // Воскресенье (0 = пн, 6 = вс)
const SIEGE_HOUR = 15; // 15:00
const SIEGE_DURATION = 30 * 60 * 1000; // 30 минут
const FORTRESS_BONUS = 1.15; // +15% XP/Gold

function isSiegeTime() {
  const now = new Date();
  const day = now.getDay();
  const hour = now.getHours();
  return day === SIEGE_DAY && hour === SIEGE_HOUR;
}

function isInSiegeWindow() {
  const now = new Date();
  if (!isSiegeTime()) {
    const siegeStart = getNextSiegeTime();
    const diff = siegeStart - now;
    return diff < 30 * 60 * 1000 && diff > 0; // 30 мин до начала
  }
  return true;
}

function getNextSiegeTime() {
  const now = new Date();
  let next = new Date(now);
  next.setDate(next.getDate() + ((SIEGE_DAY + 7 - next.getDay()) % 7));
  next.setHours(SIEGE_HOUR, 0, 0, 0);
  if (next <= now) next.setDate(next.getDate() + 7);
  return next;
}

function recordSiegeWin(guild) {
  guild.fortressOwner = true;
  guild.fortressUntil = Date.now() + 7 * 24 * 60 * 60 * 1000; // На неделю
}

function getFortressBonus(char, guild) {
  if (guild && guild.fortressOwner && Date.now() < guild.fortressUntil) {
    return FORTRESS_BONUS;
  }
  return 1.0;
}

module.exports = {
  isSiegeTime,
  isInSiegeWindow,
  getNextSiegeTime,
  recordSiegeWin,
  getFortressBonus,
  FORTRESS_BONUS
};
