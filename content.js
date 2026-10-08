/**
 * content.js — БЛОК 11: Контент
 * - NPC (торговец, кузнец, священник, мастер)
 * - Квесты (5 простых)
 * - Титулы и достижения
 */

const NPC_DATA = {
  merchant: {
    name: 'Торговец',
    icon: '🏪',
    items: [
      { id: 'potion_hp', price: 25 },
      { id: 'potion_mana', price: 25 }
    ]
  },
  blacksmith: {
    name: 'Кузнец',
    icon: '🔨',
    recipes: ['sword_steel', 'armor_plate', 'ring_strength']
  },
  priest: {
    name: 'Священник',
    icon: '✝️',
    services: ['marriage', 'blessing']
  },
  classmaster: {
    name: 'Мастер Классов',
    icon: '📚',
    service: 'class_change'
  }
};

const QUESTS = [
  {
    id: 'kill_slimes',
    name: 'Убей 10 слизней',
    reward: { xp: 100, gold: 50 },
    target: { type: 'kill', mobType: 'slime', count: 10 }
  },
  {
    id: 'forest_explorer',
    name: 'Исследуй весь лес',
    reward: { xp: 200, gold: 100 },
    target: { type: 'explore', zone: 'forest' }
  },
  {
    id: 'first_kill',
    name: 'Убей первого босса',
    reward: { xp: 500, gold: 200, title: 'boss_slayer' },
    target: { type: 'boss', count: 1 }
  },
  {
    id: 'reach_level_10',
    name: 'Достигни уровня 10',
    reward: { gold: 300 },
    target: { type: 'level', level: 10 }
  },
  {
    id: 'join_guild',
    name: 'Вступи в гильдию',
    reward: { xp: 150, gold: 75 },
    target: { type: 'guild' }
  }
];

const TITLES = {
  boss_slayer: { name: 'Истребитель боссов', icon: '⚔️' },
  pvp_champion: { name: 'Чемпион PvP', icon: '👑' },
  fortress_owner: { name: 'Владелец крепости', icon: '🏯' },
  rich: { name: 'Богатей', icon: '💰', requirement: { gold: 10000 } },
  explorer: { name: 'Путешественник', icon: '🗺️' }
};

function getQuestByZone(zone) {
  return QUESTS.filter(q => q.target.zone === zone);
}

function completesQuest(player, quest) {
  const target = quest.target;
  
  if (target.type === 'kill') {
    return (player.mobKills?.[target.mobType] || 0) >= target.count;
  }
  if (target.type === 'level') {
    return player.lvl >= target.level;
  }
  if (target.type === 'guild') {
    return !!player.guildId;
  }
  
  return false;
}

function canEarnTitle(player, title) {
  if (!title.requirement) return true;
  if (title.requirement.gold) {
    return player.gold >= title.requirement.gold;
  }
  return true;
}

module.exports = {
  NPC_DATA,
  QUESTS,
  TITLES,
  getQuestByZone,
  completesQuest,
  canEarnTitle
};
