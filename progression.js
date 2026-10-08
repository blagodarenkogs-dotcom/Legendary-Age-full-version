/**
 * progression.js
 * 
 * Система прогрессии персонажей:
 * 1. Всякий персонаж начинает с Novice (Новичок), уровни 1-10
 * 2. На уровне 10 игрок идёт в Таверну к Мастеру Классов
 * 3. Выбирает один из 9 классов
 * 4. Уровень сбрасывается на 1, опыт обнуляется
 * 5. Старый прогресс (10 уровней Новичка) архивируется в secret_legacy_folder
 */

(function (g) {
  'use strict';
  const isNode = typeof module === 'object' && module.exports;
  const DB = isNode ? require('./voxel-db.js') : g.VoxelDB;

  // Опыт необходимый для каждого уровня
  const XP_TABLE = [
    0,      // уровень 1
    100,    // уровень 2
    250,    // уровень 3
    450,    // уровень 4
    700,    // уровень 5
    1000,   // уровень 6
    1350,   // уровень 7
    1750,   // уровень 8
    2200,   // уровень 9
    2700,   // уровень 10
    3500,   // уровень 11 (с классом)
    4500,   // уровень 12
    5700,   // уровень 13
    7000,   // уровень 14
    8500,   // уровень 15
    10000   // уровень 20+
  ];

  /**
   * Добавляет опыт и проверяет на левел-ап
   * @param {Object} char - персонаж
   * @param {number} amt - количество опыта
   * @returns {Object} { char (изменённый), leveledUp, newLevel }
   */
  function addXP(char, amt) {
    const result = { char, leveledUp: false, newLevel: char.lvl };
    
    // Штраф за смерть: -30% опыта вне осад
    if (char.deathPenaltyUntil && Date.now() < char.deathPenaltyUntil && !char.inRaidZone) {
      amt = Math.floor(amt * 0.7); // -30%
    }
    
    char.xp = (char.xp || 0) + amt;
    
    while (char.lvl < XP_TABLE.length - 1 && char.xp >= XP_TABLE[char.lvl]) {
      char.lvl++;
      char.xp -= XP_TABLE[char.lvl - 1];
      result.leveledUp = true;
      result.newLevel = char.lvl;
    }
    
    return result;
  }

  /**
   * Проверяет готовность выбрать класс (уровень 10, Novice)
   * @param {Object} char - персонаж
   * @returns {boolean}
   */
  function canChooseClass(char) {
    return char.lvl === 10 && (!char.cls || char.cls === 'novice');
  }

  /**
   * Выбирает класс и сбрасывает прогресс Новичка
   * @param {Object} char - персонаж
   * @param {string} className - класс из DB.CLASS_IDS
   * @returns {Object} { char (изменённый), success, error? }
   */
  function chooseClass(char, className) {
    const result = { success: false };

    // Проверяем что можно выбрать класс
    if (!canChooseClass(char)) {
      result.error = 'Можно выбрать класс только на уровне 10 Новичка';
      return result;
    }

    // Проверяем что класс существует
    if (!DB.CLASSES[className] || !DB.CLASS_IDS.includes(className)) {
      result.error = 'Такого класса не существует';
      return result;
    }

    // Архивируем прогресс Новичка в secret_legacy_folder
    if (!char.secret_legacy_folder) char.secret_legacy_folder = [];
    char.secret_legacy_folder.push({
      timestamp: Date.now(),
      noviceLevel: 10,
      noviceXP: char.xp,
      noviceGold: char.gold || 0
    });

    // Выбираем класс
    char.cls = className;
    char.lvl = 1;
    char.xp = 0;
    // Золото и остальное сохраняется

    result.success = true;
    result.char = char;
    return result;
  }

  /**
   * Получает статы персонажа в зависимости от класса и уровня
   * @param {Object} char - персонаж
   * @returns {Object} статы { hp, maxhp, mana, maxmana, атаза, защита, ... }
   */
  function getCharStats(char) {
    const level = char.lvl || 1;
    const classData = char.cls ? DB.CLASSES[char.cls] : null;

    // Базовые статы (для Novice все одинаковые)
    let stats = {
      hp: 20 + level * 5,
      maxhp: 20 + level * 5,
      mana: 10 + level * 2,
      maxmana: 10 + level * 2,
      damage: 5 + level * 1,
      armor: 2 + Math.floor(level * 0.5),
      speed: 4
    };

    // Если выбран класс, добавляем бонусы класса
    if (classData) {
      const lvlMult = 1 + (level - 1) * 0.1; // +10% за каждый уровень после 1-го
      stats.hp = Math.floor(classData.hp * lvlMult);
      stats.maxhp = stats.hp;
      stats.mana = Math.floor(classData.mana * lvlMult);
      stats.maxmana = stats.mana;
      stats.damage = Math.floor(classData.damage * lvlMult);
      stats.armor = Math.floor(classData.armor * lvlMult);
      stats.speed = classData.speed || 4;
    }

    return stats;
  }

  /**
   * Восстанавливает здоровье и ману при уровнь-апе
   * @param {Object} char - персонаж
   */
  function healOnLevelUp(char) {
    const stats = getCharStats(char);
    char.hp = stats.maxhp;
    char.mana = stats.maxmana;
  }

  /**
   * Применяет штраф за смерть: -30% XP на 5 минут (вне осад)
   * @param {Object} char - персонаж
   */
  function applyDeathPenalty(char) {
    char.deathPenaltyUntil = Date.now() + 5 * 60 * 1000; // 5 минут
  }

  /**
   * Очищает штраф за смерть (используется при начале осады)
   * @param {Object} char - персонаж
   */
  function clearDeathPenalty(char) {
    delete char.deathPenaltyUntil;
  }

  const api = {
    addXP,
    canChooseClass,
    chooseClass,
    getCharStats,
    healOnLevelUp,
    applyDeathPenalty,
    clearDeathPenalty,
    XP_TABLE
  };

  if (isNode) module.exports = api;
  else g.Progression = api;
})(typeof self !== 'undefined' ? self : globalThis);
