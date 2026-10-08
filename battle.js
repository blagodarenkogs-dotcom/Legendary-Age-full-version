/**
 * battle.js
 * 
 * Серверная логика боевой системы
 * - Обработка умений (s1, s2)
 * - Расчёт урона
 * - Кулдауны
 * - Проверка дистанции и цели
 * - Смерть и респавн
 * - Журнал добычи
 */

(function (g) {
  'use strict';
  const isNode = typeof module === 'object' && module.exports;

  // Константы
  const SKILL_COOLDOWN = {
    s1: 0.5,  // Базовая атака - 0.5 сек
    s2: 3.0   // Специальная - 3 сек
  };

  const SKILL_RANGE = {
    s1: 2.0,  // Ближний бой - 2 клетки
    s2: 8.0   // Специальная - 8 клеток
  };

  const SKILL_DAMAGE = {
    s1: 1.0,  // Множитель базового урона
    s2: 1.5   // Специальная - 150% урона
  };

  // Типы зон
  const ZONE_PVP = {
    none: 'none',      // Город - нет PvP
    safe: 'safe',      // Лес, подземелье - нет PvP
    arena: 'arena'     // PvP арена - только PvP
  };

  /**
   * Инициализировать боевые параметры персонажа
   */
  function initBattleStats(char) {
    char.cd1 = 0;           // Кулдаун s1 (в секундах)
    char.cd2 = 0;           // Кулдаун s2
    char.dead = false;      // Мёртв ли?
    char.deadUntil = 0;     // До когда респавниться
    char.recentGains = [];  // Журнал добычи за последнюю минуту
  }

  /**
   * Обновить кулдауны (вызывать каждый тик)
   */
  function updateCooldowns(char, deltaTime) {
    if (char.cd1 > 0) char.cd1 = Math.max(0, char.cd1 - deltaTime);
    if (char.cd2 > 0) char.cd2 = Math.max(0, char.cd2 - deltaTime);
  }

  /**
   * Очистить старые записи в журнале добычи (старше 60 сек)
   */
  function cleanRecentGains(char) {
    const now = Date.now();
    char.recentGains = char.recentGains.filter(g => now - g.ts < 60000);
  }

  /**
   * Добавить запись в журнал добычи
   */
  function addGain(char, type, amount) {
    char.recentGains.push({
      type: type,      // 'xp' или 'gold'
      amount: amount,
      ts: Date.now()
    });
  }

  /**
   * Проверить может ли атакующий атаковать цель
   */
  function canAttack(attacker, target, zone, skillType) {
    // Нельзя атаковать себя
    if (attacker.id === target.id) {
      return { ok: false, reason: 'Нельзя атаковать себя' };
    }

    // Если оба - игроки
    if (attacker.type === 'player' && target.type === 'player') {
      // Только в PvP зонах
      if (zone.pvp !== ZONE_PVP.arena) {
        return { ok: false, reason: 'PvP запрещен в этой зоне' };
      }

      // Нельзя атаковать союзников
      if (attacker.guildId && attacker.guildId === target.guildId) {
        return { ok: false, reason: 'Нельзя атаковать союзников' };
      }

      return { ok: true };
    }

    // Можно атаковать мобов всегда
    return { ok: true };
  }

  /**
   * Проверить дистанцию
   */
  function isInRange(attacker, target, skillType) {
    const range = skillType === 's2' ? SKILL_RANGE.s2 : SKILL_RANGE.s1;
    const distance = Math.hypot(
      (target.x || 0) - (attacker.x || 0),
      (target.y || 0) - (attacker.y || 0)
    );

    return distance <= range;
  }

  /**
   * Расчитать урон
   * Формула: dmg = attacker.dmg * (1 + lvl * 0.1) * skillMultiplier - target.armor
   */
  function calculateDamage(attacker, target, skillType) {
    const skillMult = skillType === 's2' ? SKILL_DAMAGE.s2 : SKILL_DAMAGE.s1;
    const levelBonus = 1 + (attacker.lvl || 1) * 0.1;
    const baseDmg = (attacker.dmg || 5) * levelBonus * skillMult;
    const armor = (target.armor || 0);

    // Минимум 1 урон
    return Math.max(1, Math.floor(baseDmg - armor));
  }

  /**
   * Обработать атаку
   */
  function attack(attacker, target, zone, skillType) {
    // Проверка кулдауна
    if (skillType === 's1' && attacker.cd1 > 0) {
      return { ok: false, reason: 'Кулдаун' };
    }
    if (skillType === 's2' && attacker.cd2 > 0) {
      return { ok: false, reason: 'Кулдаун' };
    }

    // Проверка возможности атаки
    const canAtk = canAttack(attacker, target, zone, skillType);
    if (!canAtk.ok) {
      return canAtk;
    }

    // Проверка дистанции
    if (!isInRange(attacker, target, skillType)) {
      return { ok: false, reason: 'Далеко' };
    }

    // Расчитать урон
    const damage = calculateDamage(attacker, target, skillType);

    // Применить урон
    target.hp = Math.max(0, target.hp - damage);

    // Установить кулдаун
    if (skillType === 's1') {
      attacker.cd1 = SKILL_COOLDOWN.s1;
    } else {
      attacker.cd2 = SKILL_COOLDOWN.s2;
    }

    // Проверить смерть
    let targetDied = false;
    if (target.hp <= 0) {
      targetDied = true;
      killCharacter(target, attacker, zone);
    }

    return {
      ok: true,
      damage: damage,
      targetHp: target.hp,
      targetDied: targetDied,
      fx: {
        kind: 'arc',
        from: { x: attacker.x, y: attacker.y },
        to: { x: target.x, y: target.y },
        color: skillType === 's2' ? '#ff6b35' : '#ffd700'
      }
    };
  }

  /**
   * Персонаж погиб
   */
  function killCharacter(dead, killer, zone) {
    dead.dead = true;
    
    // Время до респавна зависит от уровня
    let respawnTime = 3000;  // мс
    if (dead.lvl > 10) respawnTime = 5000;
    if (dead.lvl > 20) respawnTime = 10000;

    dead.deadUntil = Date.now() + respawnTime;

    // Штраф за смерть
    if (zone.pvp === ZONE_PVP.arena) {
      // PvP-смерть: теряешь XP и золото за последнюю минуту
      applyPvPDeathPenalty(dead);
    } else {
      // PvE-смерть: -10% от текущего уровня XP
      applyPvEDeathPenalty(dead);
    }
  }

  /**
   * Штраф за PvE-смерть: -10% XP
   */
  function applyPvEDeathPenalty(char) {
    const XP_TABLE = [0, 100, 250, 450, 700, 1000, 1350, 1750, 2200, 2700, 3500];
    const currentLevelXp = XP_TABLE[char.lvl] || XP_TABLE[XP_TABLE.length - 1];
    const penalty = Math.floor(currentLevelXp * 0.1);

    char.xp = Math.max(0, char.xp - penalty);
  }

  /**
   * Штраф за PvP-смерть: теряешь XP и золото за последнюю минуту
   */
  function applyPvPDeathPenalty(char) {
    cleanRecentGains(char);

    for (const gain of char.recentGains) {
      if (gain.type === 'xp') {
        char.xp = Math.max(0, char.xp - gain.amount);
      } else if (gain.type === 'gold') {
        char.gold = Math.max(0, char.gold - gain.amount);
      }
    }

    // Очистить журнал
    char.recentGains = [];
  }

  /**
   * Респавн персонажа
   */
  function respawnCharacter(char, spawnPoint) {
    if (!char.dead) return;
    if (Date.now() < char.deadUntil) return;

    char.dead = false;
    char.deadUntil = 0;
    char.x = spawnPoint.x;
    char.y = spawnPoint.y;
    char.hp = char.maxhp || 100;
  }

  /**
   * Проверить есть ли живой персонаж или мёртв
   */
  function isAlive(char) {
    return !char.dead && char.hp > 0;
  }

  /**
   * Получить время до респавна (в миллисекундах), или 0 если живой
   */
  function getRespawnTime(char) {
    if (!char.dead) return 0;
    const remaining = Math.max(0, char.deadUntil - Date.now());
    return remaining;
  }

  const api = {
    // Константы
    SKILL_COOLDOWN,
    SKILL_RANGE,
    SKILL_DAMAGE,
    ZONE_PVP,

    // Функции
    initBattleStats,
    updateCooldowns,
    cleanRecentGains,
    addGain,
    canAttack,
    isInRange,
    calculateDamage,
    attack,
    killCharacter,
    applyPvEDeathPenalty,
    applyPvPDeathPenalty,
    respawnCharacter,
    isAlive,
    getRespawnTime
  };

  if (isNode) module.exports = api;
  else g.Battle = api;
})(typeof self !== 'undefined' ? self : globalThis);
