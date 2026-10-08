/**
 * crafting.js
 * 
 * Система крафтинга - создание предметов из материалов
 * У кузнеца можно:
 * - Крафтить оружие из руды
 * - Крафтить броню
 * - Улучшать экипировку
 */

(function (g) {
  'use strict';
  const isNode = typeof module === 'object' && module.exports;

  // Рецепты крафтинга
  const RECIPES = {
    sword_steel: {
      name: 'Стальной меч',
      icon: '⚔️',
      result: 'sword_steel',
      materials: {
        iron_ore: 5,
        copper_ore: 2
      },
      level: 10,
      time: 30, // секунды
      exp: 100
    },

    sword_silver: {
      name: 'Серебряный меч',
      icon: '⚔️✨',
      result: 'sword_silver',
      materials: {
        iron_ore: 8,
        copper_ore: 5,
        wolf_fang: 3
      },
      level: 20,
      time: 60,
      exp: 300
    },

    armor_plate: {
      name: 'Железная броня',
      icon: '🛡️',
      result: 'armor_plate',
      materials: {
        iron_ore: 10,
        copper_ore: 3
      },
      level: 15,
      time: 45,
      exp: 200
    },

    armor_mithril: {
      name: 'Мифриловая броня',
      icon: '🛡️✨',
      result: 'armor_mithril',
      materials: {
        mithril_ingot: 8,
        demon_horn: 2
      },
      level: 35,
      time: 120,
      exp: 500
    },

    ring_strength: {
      name: 'Кольцо Силы',
      icon: '💎',
      result: 'ring_strength',
      materials: {
        copper_ore: 3,
        wolf_fang: 2
      },
      level: 12,
      time: 20,
      exp: 80
    },

    amulet_health: {
      name: 'Амулет Здоровья',
      icon: '❤️',
      result: 'amulet_health',
      materials: {
        mithril_ingot: 5,
        demon_horn: 3
      },
      level: 30,
      time: 90,
      exp: 400
    },

    potion_hp: {
      name: 'Зелье здоровья',
      icon: '🧪',
      result: 'potion_hp',
      materials: {
        iron_ore: 1
      },
      level: 1,
      time: 10,
      exp: 10,
      amount: 5 // Крафтит 5 зелий за раз
    }
  };

  // Улучшения
  const UPGRADES = {
    upgrade_sword: {
      name: 'Усилить оружие',
      desc: 'Увеличивает урон на 20%',
      icon: '⬆️',
      materials: {
        iron_ore: 3,
        wolf_fang: 1
      },
      level: 15,
      time: 30,
      exp: 150
    },

    upgrade_armor: {
      name: 'Укрепить броню',
      desc: 'Увеличивает защиту на 20%',
      icon: '⬆️',
      materials: {
        copper_ore: 5,
        demon_horn: 1
      },
      level: 20,
      time: 45,
      exp: 200
    }
  };

  /**
   * Проверить может ли персонаж крафтить рецепт
   */
  function canCraft(char, inventory, recipeName) {
    const recipe = RECIPES[recipeName];
    if (!recipe) return { ok: false, error: 'Рецепт не найден' };

    if (char.lvl < recipe.level) {
      return { ok: false, error: `Требуется уровень ${recipe.level}` };
    }

    // Проверяем материалы
    for (const [matId, needed] of Object.entries(recipe.materials)) {
      let have = 0;
      for (const slot of inventory.slots) {
        if (slot && slot.id === matId) {
          have += slot.amount || 1;
        }
      }
      if (have < needed) {
        return { ok: false, error: `Нужно ${matId}: ${needed}, а у тебя ${have}` };
      }
    }

    return { ok: true };
  }

  /**
   * Выполнить крафт
   */
  function craft(char, inventory, recipeName) {
    const check = canCraft(char, inventory, recipeName);
    if (!check.ok) return check;

    const recipe = RECIPES[recipeName];

    // Удаляем материалы
    for (const [matId, needed] of Object.entries(recipe.materials)) {
      let remaining = needed;
      for (let i = 0; i < inventory.slots.length && remaining > 0; i++) {
        const slot = inventory.slots[i];
        if (slot && slot.id === matId) {
          const toRemove = Math.min(slot.amount || 1, remaining);
          slot.amount = (slot.amount || 1) - toRemove;
          remaining -= toRemove;
          if (slot.amount <= 0) {
            inventory.slots[i] = null;
          }
        }
      }
    }

    // Добавляем результат
    const amount = recipe.amount || 1;
    window.Inventory?.addItem(inventory, recipe.result, amount);

    // Даём опыт крафта
    char.craftExp = (char.craftExp || 0) + recipe.exp;

    return {
      ok: true,
      result: recipe.result,
      time: recipe.time,
      exp: recipe.exp
    };
  }

  /**
   * Получить все доступные рецепты для персонажа
   */
  function getAvailableRecipes(charLevel) {
    const available = [];
    for (const [key, recipe] of Object.entries(RECIPES)) {
      if (charLevel >= recipe.level) {
        available.push({ id: key, ...recipe });
      }
    }
    return available;
  }

  /**
   * Получить описание рецепта
   */
  function getRecipeInfo(recipeName) {
    const recipe = RECIPES[recipeName];
    if (!recipe) return null;

    let info = `${recipe.name}\n`;
    info += `Требуемый уровень: ${recipe.level}\n`;
    info += `Время крафта: ${recipe.time}с\n`;
    info += `Опыт крафта: +${recipe.exp}\n\n`;
    info += `Материалы:\n`;

    for (const [matId, amount] of Object.entries(recipe.materials)) {
      info += `  • ${matId} x${amount}\n`;
    }

    return info;
  }

  /**
   * Деконструировать предмет (разбить на материалы)
   */
  function deconstruct(itemId) {
    // Примерно возвращаем 50% материалов, которые были использованы
    const deconstruction = {
      sword_steel: { iron_ore: 2, copper_ore: 1 },
      sword_silver: { iron_ore: 4, copper_ore: 2, wolf_fang: 1 },
      armor_plate: { iron_ore: 5, copper_ore: 1 },
      armor_mithril: { mithril_ingot: 4, demon_horn: 1 },
      ring_strength: { copper_ore: 1, wolf_fang: 1 },
      amulet_health: { mithril_ingot: 2, demon_horn: 1 }
    };

    return deconstruction[itemId] || null;
  }

  /**
   * Улучшить предмет
   */
  function upgradeItem(char, inventory, slotIndex, upgradeName) {
    const upgrade = UPGRADES[upgradeName];
    if (!upgrade) return { ok: false, error: 'Улучшение не найдено' };

    if (char.lvl < upgrade.level) {
      return { ok: false, error: `Требуется уровень ${upgrade.level}` };
    }

    const slot = inventory.slots[slotIndex];
    if (!slot) return { ok: false, error: 'Слот пуст' };

    // Проверяем материалы
    for (const [matId, needed] of Object.entries(upgrade.materials)) {
      let have = 0;
      for (const s of inventory.slots) {
        if (s && s.id === matId) have += s.amount || 1;
      }
      if (have < needed) {
        return { ok: false, error: `Не хватает материалов` };
      }
    }

    // Удаляем материалы
    for (const [matId, needed] of Object.entries(upgrade.materials)) {
      let remaining = needed;
      for (let i = 0; i < inventory.slots.length && remaining > 0; i++) {
        const s = inventory.slots[i];
        if (s && s.id === matId) {
          const toRemove = Math.min(s.amount || 1, remaining);
          s.amount = (s.amount || 1) - toRemove;
          remaining -= toRemove;
          if (s.amount <= 0) inventory.slots[i] = null;
        }
      }
    }

    // Улучшаем предмет (помечаем его)
    if (!slot.upgraded) slot.upgraded = 0;
    slot.upgraded += 1;

    return { ok: true, exp: upgrade.exp };
  }

  const api = {
    RECIPES,
    UPGRADES,
    canCraft,
    craft,
    getAvailableRecipes,
    getRecipeInfo,
    deconstruct,
    upgradeItem
  };

  if (isNode) module.exports = api;
  else g.Crafting = api;
})(typeof self !== 'undefined' ? self : globalThis);
