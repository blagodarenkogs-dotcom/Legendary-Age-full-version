/**
 * tavern.js
 * 
 * Система свадеб в таверне и функционал священника
 * 
 * В таверне находятся:
 * 1. Доска объявлений (поиск пары, поиск пати, услуги)
 * 2. Мастер Классов (выбор класса на уровне 10)
 * 3. Священник (проведение свадеб)
 */

(function (g) {
  'use strict';
  const isNode = typeof module === 'object' && module.exports;
  const Progression = isNode ? require('./progression.js') : g.Progression;

  // Константы
  const MARRIAGE_COST = 500;            // золото на свадьбу
  const MARRIAGE_GIFT_GOLD = 1000;      // подарок молодожёнам
  const DIVORCE_COST = 100;             // золото на развод

  /**
   * Запрос на свадьбу (один партнёр предлагает другому)
   * @param {Object} proposer - инициатор свадьбы
   * @param {Object} target - целевой персонаж
   * @returns {Object} { success, error?, proposalId }
   */
  function proposeMarriage(proposer, target) {
    const result = { success: false };

    // Проверяем что нет активных предложений
    if (proposer.marriageProposal) {
      result.error = 'Ты уже сделал предложение. Жди ответа или отмени.';
      return result;
    }

    if (target.marriageProposal && target.marriageProposal.from === proposer.accountId) {
      result.error = 'Предложение уже отправлено этому персонажу';
      return result;
    }

    // Проверяем что не в браке
    if (proposer.spouseId || target.spouseId) {
      result.error = 'Один из вас уже женат/замужем. Сначала разведитесь.';
      return result;
    }

    // Проверяем что оба разного пола (баланс игры)
    if (proposer.gender === target.gender) {
      result.error = 'Оба одного пола. Святилище не поддерживает такие браки.';
      return result;
    }

    // Проверяем золото инициатора
    if ((proposer.gold || 0) < MARRIAGE_COST) {
      result.error = `Свадьба стоит ${MARRIAGE_COST} золота`;
      return result;
    }

    const proposalId = 'mp_' + Math.random().toString(36).substr(2, 9);
    
    proposer.marriageProposal = {
      id: proposalId,
      to: target.accountId,
      toName: target.name,
      sentAt: Date.now()
    };

    result.success = true;
    result.proposalId = proposalId;
    return result;
  }

  /**
   * Принять предложение свадьбы
   * @param {Object} target - тот, кто принимает предложение
   * @param {Object} proposer - тот, кто сделал предложение
   * @returns {Object} { success, error?, marriage }
   */
  function acceptMarriage(target, proposer) {
    const result = { success: false };

    if (!proposer.marriageProposal || proposer.marriageProposal.to !== target.accountId) {
      result.error = 'Нет активного предложения свадьбы от этого персонажа';
      return result;
    }

    // Проверяем оба в браке?
    if (target.spouseId || proposer.spouseId) {
      result.error = 'Один из вас уже женат/замужем';
      return result;
    }

    // Проверяем золото обоих
    if ((target.gold || 0) < MARRIAGE_COST || (proposer.gold || 0) < MARRIAGE_COST) {
      result.error = 'Обоим нужно по ' + MARRIAGE_COST + ' золота для свадьбы';
      return result;
    }

    // Списываем золото
    target.gold -= MARRIAGE_COST;
    proposer.gold -= MARRIAGE_COST;

    // Даём подарок
    target.gold += MARRIAGE_GIFT_GOLD;
    proposer.gold += MARRIAGE_GIFT_GOLD;

    // Связываем персонажей браком
    const marriageId = 'mr_' + Math.random().toString(36).substr(2, 9);
    target.spouseId = proposer.accountId;
    target.spouseName = proposer.name;
    target.marriedAt = Date.now();
    target.marriageId = marriageId;

    proposer.spouseId = target.accountId;
    proposer.spouseName = target.name;
    proposer.marriedAt = Date.now();
    proposer.marriageId = marriageId;

    // Очищаем предложение
    delete proposer.marriageProposal;

    result.success = true;
    result.marriage = {
      id: marriageId,
      partner1: proposer.name,
      partner2: target.name,
      marriedAt: target.marriedAt
    };

    return result;
  }

  /**
   * Отклонить предложение свадьбы
   * @param {Object} target - тот, кто отклоняет
   * @param {Object} proposer - тот, кто предложил
   * @returns {Object} { success }
   */
  function rejectMarriage(target, proposer) {
    if (proposer.marriageProposal && proposer.marriageProposal.to === target.accountId) {
      delete proposer.marriageProposal;
    }
    return { success: true };
  }

  /**
   * Развод
   * @param {Object} char - персонаж, который разводится
   * @returns {Object} { success, error? }
   */
  function divorce(char) {
    const result = { success: false };

    if (!char.spouseId) {
      result.error = 'Ты не женат/замужем';
      return result;
    }

    if ((char.gold || 0) < DIVORCE_COST) {
      result.error = `Развод стоит ${DIVORCE_COST} золота`;
      return result;
    }

    char.gold -= DIVORCE_COST;
    const exSpouseName = char.spouseName;
    delete char.spouseId;
    delete char.spouseName;
    delete char.marriedAt;
    delete char.marriageId;

    result.success = true;
    result.message = `Ты развёлся/развелась с ${exSpouseName}`;
    return result;
  }

  /**
   * Мастер Классов: выбор профессии на уровне 10
   * @param {Object} char - персонаж (должен быть уровень 10, Novice)
   * @param {string} className - выбранный класс
   * @returns {Object} { success, error?, newLevel, stats }
   */
  function chooseProfession(char, className) {
    const result = { success: false };

    if (!Progression.canChooseClass(char)) {
      result.error = 'Можно выбрать профессию только на уровне 10 Новичка';
      return result;
    }

    // Используем функцию из progression.js
    const choiceResult = Progression.chooseClass(char, className);
    if (!choiceResult.success) {
      result.error = choiceResult.error;
      return result;
    }

    // Восстанавливаем здоровье и ману
    Progression.healOnLevelUp(char);

    const stats = Progression.getCharStats(char);
    result.success = true;
    result.newLevel = char.lvl;
    result.className = className;
    result.stats = stats;

    return result;
  }

  /**
   * Получает список объявлений в таверне (с фильтром)
   * @param {Array} notices - все объявления
   * @param {string} filter - фильтр (парня/девушку, пати, услуги)
   * @returns {Array} отфильтрованные объявления
   */
  function getNoticeBoard(notices, filter) {
    let result = notices || [];

    // Фильтруем по типу
    if (filter) {
      result = result.filter(n => n.content.toLowerCase().includes(filter.toLowerCase()));
    }

    // Фильтруем просроченные
    result = result.filter(n => n.expiresAt > Date.now());

    // Сортируем по новизне
    result.sort((a, b) => b.postedAt - a.postedAt);

    return result;
  }

  /**
   * Уведомление о свадьбе для глобального чата
   * @param {string} name1 - имя персонажа 1
   * @param {string} name2 - имя персонажа 2
   * @returns {string} красивое сообщение
   */
  function getMarriageAnnouncement(name1, name2) {
    const emojis = ['💒', '💍', '💕', '👰', '🤵'];
    const emoji = emojis[Math.floor(Math.random() * emojis.length)];
    return `${emoji} ${name1} и ${name2} поженились! Поздравляем молодожёнов! ${emoji}`;
  }

  const api = {
    proposeMarriage,
    acceptMarriage,
    rejectMarriage,
    divorce,
    chooseProfession,
    getNoticeBoard,
    getMarriageAnnouncement,
    // Константы
    MARRIAGE_COST,
    MARRIAGE_GIFT_GOLD,
    DIVORCE_COST
  };

  if (isNode) module.exports = api;
  else g.Tavern = api;
})(typeof self !== 'undefined' ? self : globalThis);
