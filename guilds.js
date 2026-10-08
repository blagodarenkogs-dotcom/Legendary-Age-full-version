/**
 * guilds.js
 * 
 * Система гильдий, союзов, осад крепостей и распределения добычи
 * 
 * Основные механики:
 * - Создание гильдии: 1000 золота, требуется персонаж с классом
 * - Вступление: только с классом
 * - Осада: каждое воскресенье 11:30 на 30 минут
 * - Союзы: временные объединения на время осады
 * - Распределение лута: пропорционально урону (вкладу)
 */

(function (g) {
  'use strict';
  const isNode = typeof module === 'object' && module.exports;

  // Константы
  const GUILD_CREATE_COST = 1000;       // золото на создание гильдии
  const SIEGE_DAY = 0;                   // воскресенье (0 = Sunday)
  const SIEGE_HOUR = 11;                 // 11:30
  const SIEGE_MINUTE = 30;
  const SIEGE_DURATION_MS = 30 * 60 * 1000; // 30 минут
  const NOTICE_BOARD_COST = 200;        // золото за объявление в таверне

  /**
   * Создаёт новую гильдию
   * @param {Object} char - персонаж-создатель (должен иметь класс)
   * @param {string} guildName - название гильдии
   * @returns {Object} { success, guildId, error? }
   */
  function createGuild(char, guildName) {
    const result = { success: false };

    if (!guildName || guildName.length < 3) {
      result.error = 'Название гильдии: 3-32 символа';
      return result;
    }

    if (!char.cls || char.cls === 'novice') {
      result.error = 'Только персонажи с классом могут создавать гильдии';
      return result;
    }

    if ((char.gold || 0) < GUILD_CREATE_COST) {
      result.error = `Нужно ${GUILD_CREATE_COST} золота для создания гильдии`;
      return result;
    }

    // Создаём гильдию
    const guildId = 'g_' + Math.random().toString(36).substr(2, 9);
    const guild = {
      id: guildId,
      name: guildName,
      leader: char.accountId,
      createdAt: Date.now(),
      members: [{ accountId: char.accountId, charName: char.name, role: 'leader' }],
      treasury: 0,
      allies: [], // массив ID гильдий-союзников
      fortress: null, // какую крепость удерживает
      totalDamageInRaid: 0 // общий урон во время осады
    };

    // Списываем золото
    char.gold -= GUILD_CREATE_COST;

    result.success = true;
    result.guildId = guildId;
    result.guild = guild;
    return result;
  }

  /**
   * Вступление в гильдию
   * @param {Object} char - персонаж
   * @param {string} guildId - ID гильдии
   * @returns {Object} { success, error? }
   */
  function joinGuild(char, guildId) {
    const result = { success: false };

    if (!char.cls || char.cls === 'novice') {
      result.error = 'Только персонажи с классом могут вступать в гильдии';
      return result;
    }

    // Проверяем что персонаж не в другой гильдии
    if (char.guildId) {
      result.error = 'Ты уже в гильдии. Сначала покинь её.';
      return result;
    }

    result.success = true;
    return result;
  }

  /**
   * Покидает гильдию
   * @param {Object} char - персонаж
   * @returns {Object} { success }
   */
  function leaveGuild(char) {
    char.guildId = null;
    return { success: true };
  }

  /**
   * Проверяет начало осады (каждое воскресенье 11:30)
   * @returns {boolean}
   */
  function isSiegeTime() {
    const now = new Date();
    return now.getDay() === SIEGE_DAY &&
           now.getHours() === SIEGE_HOUR &&
           now.getMinutes() === SIEGE_MINUTE;
  }

  /**
   * Проверяет находимся ли в окне осады (±30 минут после 11:30)
   * @returns {boolean}
   */
  function isInSiegeWindow() {
    const now = new Date();
    if (now.getDay() !== SIEGE_DAY) return false;
    const minute = now.getHours() * 60 + now.getMinutes();
    const siegeMinute = SIEGE_HOUR * 60 + SIEGE_MINUTE;
    return Math.abs(minute - siegeMinute) < 30;
  }

  /**
   * Формирует союз между двумя гильдиями
   * @param {Object} guildA - гильдия A
   * @param {Object} guildB - гильдия B
   * @returns {Object} { success, error? }
   */
  function formAlliance(guildA, guildB) {
    const result = { success: false };

    if (!isInSiegeWindow()) {
      result.error = 'Союзы можно формировать только во время осады (воскресенье 11:30 ± 30 минут)';
      return result;
    }

    // Добавляем в список союзников друг друга
    if (!guildA.allies.includes(guildB.id)) {
      guildA.allies.push(guildB.id);
    }
    if (!guildB.allies.includes(guildA.id)) {
      guildB.allies.push(guildA.id);
    }

    result.success = true;
    return result;
  }

  /**
   * Расторгает союз (автоматически при конце осады или при потере крепости)
   * @param {Object} guild - гильдия
   */
  function breakAlliances(guild) {
    guild.allies = [];
  }

  /**
   * Проверяет Friendly Fire (можно ли атаковать)
   * @param {string} guildA - ID гильдии атакующего
   * @param {string} guildB - ID гильдии цели
   * @param {Object} guilds - все гильдии (для поиска союзов)
   * @returns {boolean} true = можно атаковать, false = это союзник
   */
  function canAttack(guildA, guildB, guilds) {
    if (!guildA || !guildB) return true;
    if (guildA === guildB) return false; // На своих не атакуем

    // Проверяем союзы
    const g1 = guilds.find(g => g.id === guildA);
    if (g1 && g1.allies.includes(guildB)) return false;

    return true;
  }

  /**
   * Регистрирует урон персонажа во время осады
   * @param {Object} guild - гильдия персонажа
   * @param {number} damage - количество урона
   */
  function recordRaidDamage(guild, damage) {
    guild.totalDamageInRaid = (guild.totalDamageInRaid || 0) + damage;
  }

  /**
   * Распределяет добычу между гильдией или союзом (вызывается в 12:00 воскресенья)
   * @param {Array} guilds - все гильдии
   * @param {number} totalPrizeGold - общий призовой фонд
   * @returns {Array} распределённые награды по гильдиям
   */
  function distributeRaidRewards(guilds, totalPrizeGold) {
    const rewards = [];

    // Находим победителя (гильдия с максимальным уроном)
    let winningGuild = null;
    let maxDamage = 0;

    for (const g of guilds) {
      if ((g.totalDamageInRaid || 0) > maxDamage) {
        maxDamage = g.totalDamageInRaid;
        winningGuild = g;
      }
    }

    if (!winningGuild) return rewards;

    // Если есть союзники победителя, делим поровну между ними
    const winningTeam = [winningGuild.id, ...winningGuild.allies];
    const goldPerGuild = Math.floor(totalPrizeGold / winningTeam.length);

    for (const guildId of winningTeam) {
      const g = guilds.find(gg => gg.id === guildId);
      if (g) {
        const memberGold = Math.floor(goldPerGuild / g.members.length);
        rewards.push({
          guildId: g.id,
          guildName: g.name,
          goldPerMember: memberGold
        });
      }
    }

    // Проигравшие получают 10% от призового фонда (равномерно всем остальным)
    const losingGuilds = guilds.filter(g => !winningTeam.includes(g.id) && (g.totalDamageInRaid || 0) > 0);
    if (losingGuilds.length > 0) {
      const consolationTotal = Math.floor(totalPrizeGold * 0.1);
      const consolationPerGuild = Math.floor(consolationTotal / losingGuilds.length);

      for (const g of losingGuilds) {
        const memberGold = Math.floor(consolationPerGuild / g.members.length);
        rewards.push({
          guildId: g.id,
          guildName: g.name,
          goldPerMember: memberGold,
          isConsolation: true
        });
      }
    }

    // Очищаем счётчик урона для следующей осады
    for (const g of guilds) {
      g.totalDamageInRaid = 0;
      g.allies = [];
    }

    return rewards;
  }

  /**
   * Объявление в таверне (доска объявлений)
   */
  function postNotice(char, content) {
    const result = { success: false };

    if ((char.gold || 0) < NOTICE_BOARD_COST) {
      result.error = `Объявление стоит ${NOTICE_BOARD_COST} золота`;
      return result;
    }

    if (content.length < 10 || content.length > 200) {
      result.error = 'Объявление: 10-200 символов';
      return result;
    }

    // Списываем золото
    char.gold -= NOTICE_BOARD_COST;

    const notice = {
      id: 'n_' + Math.random().toString(36).substr(2, 9),
      author: char.name,
      content: content,
      postedAt: Date.now(),
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000 // 7 дней
    };

    result.success = true;
    result.notice = notice;
    return result;
  }

  const api = {
    createGuild,
    joinGuild,
    leaveGuild,
    isSiegeTime,
    isInSiegeWindow,
    formAlliance,
    breakAlliances,
    canAttack,
    recordRaidDamage,
    distributeRaidRewards,
    postNotice,
    // Константы
    GUILD_CREATE_COST,
    SIEGE_DAY,
    SIEGE_HOUR,
    SIEGE_MINUTE,
    SIEGE_DURATION_MS,
    NOTICE_BOARD_COST
  };

  if (isNode) module.exports = api;
  else g.Guilds = api;
})(typeof self !== 'undefined' ? self : globalThis);
