/**
 * inventory.js
 * 
 * Система инвентаря и экипировки персонажа
 * - Слоты для одежды, оружия, аксессуаров
 * - Материалы для крафтинга
 * - Максимум 30 предметов
 */

(function (g) {
  'use strict';
  const isNode = typeof module === 'object' && module.exports;

  // Предметы в игре
  const ITEMS = {
    // Оружие
    sword_iron: { id: 'sword_iron', name: 'Железный меч', rarity: 'common', type: 'weapon', dmg: 5, price: 50 },
    sword_steel: { id: 'sword_steel', name: 'Стальной меч', rarity: 'uncommon', type: 'weapon', dmg: 8, price: 150 },
    sword_silver: { id: 'sword_silver', name: 'Серебряный меч', rarity: 'rare', type: 'weapon', dmg: 12, price: 300 },
    staff_oak: { id: 'staff_oak', name: 'Дубовый посох', rarity: 'common', type: 'weapon', dmg: 4, price: 40 },
    bow_ash: { id: 'bow_ash', name: 'Ясеневый лук', rarity: 'uncommon', type: 'weapon', dmg: 7, price: 120 },
    
    // Броня
    armor_leather: { id: 'armor_leather', name: 'Кожаная броня', rarity: 'common', type: 'armor', armor: 5, price: 80 },
    armor_plate: { id: 'armor_plate', name: 'Железная броня', rarity: 'uncommon', type: 'armor', armor: 10, price: 200 },
    armor_mithril: { id: 'armor_mithril', name: 'Мифриловая броня', rarity: 'rare', type: 'armor', armor: 15, price: 400 },
    
    // Аксессуары
    ring_strength: { id: 'ring_strength', name: 'Кольцо Силы', rarity: 'uncommon', type: 'accessory', dmg: 3, price: 100 },
    ring_defense: { id: 'ring_defense', name: 'Кольцо Защиты', rarity: 'uncommon', type: 'accessory', armor: 3, price: 100 },
    amulet_health: { id: 'amulet_health', name: 'Амулет Здоровья', rarity: 'rare', type: 'accessory', maxhp: 50, price: 250 },
    
    // Материалы для крафта
    iron_ore: { id: 'iron_ore', name: 'Железная руда', rarity: 'common', type: 'material', stackable: true, price: 10 },
    copper_ore: { id: 'copper_ore', name: 'Медная руда', rarity: 'common', type: 'material', stackable: true, price: 8 },
    wolf_fang: { id: 'wolf_fang', name: 'Клык волка', rarity: 'uncommon', type: 'material', stackable: true, price: 20 },
    demon_horn: { id: 'demon_horn', name: 'Рог демона', rarity: 'rare', type: 'material', stackable: true, price: 50 },
    mithril_ingot: { id: 'mithril_ingot', name: 'Мифриловый слиток', rarity: 'rare', type: 'material', stackable: true, price: 100 },
    
    // Зелья
    potion_hp: { id: 'potion_hp', name: 'Зелье здоровья', rarity: 'common', type: 'consumable', stackable: true, heals: 50, price: 25 },
    potion_mana: { id: 'potion_mana', name: 'Зелье маны', rarity: 'common', type: 'consumable', stackable: true, restores: 50, price: 25 },
    elixir_str: { id: 'elixir_str', name: 'Эликсир Силы', rarity: 'rare', type: 'consumable', stackable: true, dmgBoost: 0.2, duration: 60, price: 100 }
  };

  /**
   * Создать пустой инвентарь для персонажа
   */
  function createInventory() {
    return {
      slots: new Array(30).fill(null), // 30 слотов
      equipped: {
        weapon: null,
        armor: null,
        accessory1: null,
        accessory2: null
      }
    };
  }

  /**
   * Добавить предмет в инвентарь
   */
  function addItem(inventory, itemId, amount = 1) {
    const item = ITEMS[itemId];
    if (!item) return { success: false, error: 'Предмет не существует' };

    // Если предмет "многоразовый" (stackable), пытаемся добавить в стак
    if (item.stackable) {
      for (let i = 0; i < inventory.slots.length; i++) {
        if (inventory.slots[i] && inventory.slots[i].id === itemId) {
          inventory.slots[i].amount += amount;
          return { success: true, slot: i };
        }
      }
    }

    // Ищем пустой слот
    for (let i = 0; i < inventory.slots.length; i++) {
      if (!inventory.slots[i]) {
        inventory.slots[i] = {
          id: itemId,
          name: item.name,
          rarity: item.rarity,
          type: item.type,
          amount: amount
        };
        return { success: true, slot: i };
      }
    }

    return { success: false, error: 'Инвентарь полон' };
  }

  /**
   * Удалить предмет из инвентаря
   */
  function removeItem(inventory, slotIndex, amount = 1) {
    if (!inventory.slots[slotIndex]) return { success: false };

    const slot = inventory.slots[slotIndex];
    if (slot.amount <= amount) {
      inventory.slots[slotIndex] = null;
    } else {
      slot.amount -= amount;
    }

    return { success: true };
  }

  /**
   * Экипировать предмет
   */
  function equip(inventory, slotIndex, char) {
    const slot = inventory.slots[slotIndex];
    if (!slot) return { success: false, error: 'Слот пуст' };

    const item = ITEMS[slot.id];
    if (!item) return { success: false, error: 'Неизвестный предмет' };

    if (item.type === 'weapon') {
      inventory.equipped.weapon = slot.id;
      if (item.dmg) char.dmg = (char.dmg || 0) + item.dmg;
    } else if (item.type === 'armor') {
      inventory.equipped.armor = slot.id;
      if (item.armor) char.armor = (char.armor || 0) + item.armor;
    } else if (item.type === 'accessory') {
      if (!inventory.equipped.accessory1) {
        inventory.equipped.accessory1 = slot.id;
      } else {
        inventory.equipped.accessory2 = slot.id;
      }
      if (item.dmg) char.dmg = (char.dmg || 0) + item.dmg;
      if (item.armor) char.armor = (char.armor || 0) + item.armor;
      if (item.maxhp) char.maxhp = (char.maxhp || 100) + item.maxhp;
    }

    return { success: true };
  }

  /**
   * Снять предмет
   */
  function unequip(inventory, slot, char) {
    const itemId = inventory.equipped[slot];
    if (!itemId) return { success: false };

    const item = ITEMS[itemId];
    if (item) {
      if (item.dmg) char.dmg = Math.max(0, (char.dmg || 0) - item.dmg);
      if (item.armor) char.armor = Math.max(0, (char.armor || 0) - item.armor);
    }

    inventory.equipped[slot] = null;
    return { success: true };
  }

  /**
   * Получить актуальные статы с экипировкой
   */
  function getEquippedStats(inventory) {
    let stats = { dmg: 0, armor: 0, maxhp: 0 };

    for (const slotName of Object.keys(inventory.equipped)) {
      const itemId = inventory.equipped[slotName];
      if (itemId) {
        const item = ITEMS[itemId];
        if (item.dmg) stats.dmg += item.dmg;
        if (item.armor) stats.armor += item.armor;
        if (item.maxhp) stats.maxhp += item.maxhp;
      }
    }

    return stats;
  }

  /**
   * Использовать расходник
   */
  function useConsumable(inventory, slotIndex, char) {
    const slot = inventory.slots[slotIndex];
    if (!slot) return { success: false, error: 'Слот пуст' };

    const item = ITEMS[slot.id];
    if (item.type !== 'consumable') return { success: false, error: 'Это не расходник' };

    if (item.heals) {
      char.hp = Math.min(char.hp + item.heals, char.maxhp);
    }
    if (item.restores) {
      char.mana = Math.min((char.mana || 0) + item.restores, char.maxmana || 100);
    }

    removeItem(inventory, slotIndex, 1);
    return { success: true };
  }

  /**
   * Получить описание предмета
   */
  function getItemInfo(itemId) {
    const item = ITEMS[itemId];
    if (!item) return null;

    let desc = `${item.name}\n`;
    desc += `Редкость: ${item.rarity}\n`;
    desc += `Тип: ${item.type}\n`;

    if (item.dmg) desc += `Урон: +${item.dmg}\n`;
    if (item.armor) desc += `Защита: +${item.armor}\n`;
    if (item.maxhp) desc += `HP: +${item.maxhp}\n`;
    if (item.heals) desc += `Лечит: ${item.heals} HP\n`;
    if (item.price) desc += `Цена: ${item.price}g`;

    return desc;
  }

  /**
   * Продать предмет торговцу
   */
  function sellItem(inventory, slotIndex, char) {
    const slot = inventory.slots[slotIndex];
    if (!slot) return { success: false };

    const item = ITEMS[slot.id];
    const price = Math.floor((item.price || 0) * 0.8); // 80% от цены

    char.gold = (char.gold || 0) + price;
    removeItem(inventory, slotIndex, 1);

    return { success: true, gold: price };
  }

  const api = {
    ITEMS,
    createInventory,
    addItem,
    removeItem,
    equip,
    unequip,
    getEquippedStats,
    useConsumable,
    getItemInfo,
    sellItem
  };

  if (isNode) module.exports = api;
  else g.Inventory = api;
})(typeof self !== 'undefined' ? self : globalThis);
