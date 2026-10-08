/**
 * pvp-arena.js — БЛОК 6: PvP зона
 * - Механика PvP арены
 * - Матчмейкинг по уровню
 * - Рейтинг топ-100
 */

const ARENA_LEVEL_RANGE = 5; // ±5 уровней от игрока

function getPlayerRating(players) {
  return players
    .filter(p => p.pvpKills >= 0)
    .sort((a, b) => b.pvpKills - a.pvpKills)
    .slice(0, 100)
    .map((p, idx) => ({
      rank: idx + 1,
      name: p.charName,
      kills: p.pvpKills,
      level: p.lvl
    }));
}

function canMatchWith(player1, player2) {
  const diff = Math.abs(player1.lvl - player2.lvl);
  return diff <= ARENA_LEVEL_RANGE;
}

function recordPvPKill(killer, victim) {
  killer.pvpKills = (killer.pvpKills || 0) + 1;
  killer.pvpExp = (killer.pvpExp || 0) + victim.lvl * 50;
  victim.pvpDeaths = (victim.pvpDeaths || 0) + 1;
}

module.exports = {
  getPlayerRating,
  canMatchWith,
  recordPvPKill,
  ARENA_LEVEL_RANGE
};
