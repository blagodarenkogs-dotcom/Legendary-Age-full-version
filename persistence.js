/**
 * persistence.js — БЛОК 5: Персистентность мира
 * - Сохранение позиции игрока
 * - Восстановление при входе
 * - Спавн и респавн мобов
 * - Боссы по расписанию
 */

const SAVE_INTERVAL = 30000; // Сохранять каждые 30 сек
const MOB_RESPAWN_TIME = 60000; // Мобы респавнятся через 60 сек
const BOSS_RESPAWN_TIME = 10 * 60 * 1000; // Боссы через 10 минут

function savePlayerPosition(player, db) {
  if (!db) return;
  
  try {
    db.prepare(`
      UPDATE characters 
      SET x = ?, y = ?, z = ?, zone = ? 
      WHERE id = ?
    `).run(player.x, player.y, player.z, player.zone, player.id);
  } catch (e) {
    console.error('Error saving position:', e);
  }
}

function loadPlayerPosition(player, db) {
  if (!db) return player;
  
  try {
    const row = db.prepare(`
      SELECT x, y, z, zone FROM characters WHERE id = ?
    `).get(player.id);
    
    if (row) {
      player.x = row.x;
      player.y = row.y;
      player.z = row.z;
      player.zone = row.zone;
    }
  } catch (e) {
    console.error('Error loading position:', e);
  }
  
  return player;
}

function saveInventory(player, db) {
  if (!db || !player.inventory) return;
  
  try {
    db.prepare('DELETE FROM inventory WHERE charId = ?').run(player.id);
    
    for (let i = 0; i < player.inventory.slots.length; i++) {
      const slot = player.inventory.slots[i];
      if (slot) {
        db.prepare(`
          INSERT INTO inventory (charId, slot, itemId, amount)
          VALUES (?, ?, ?, ?)
        `).run(player.id, i, slot.id, slot.amount || 1);
      }
    }
  } catch (e) {
    console.error('Error saving inventory:', e);
  }
}

function loadInventory(player, db) {
  if (!db) return player;
  
  try {
    const rows = db.prepare(`
      SELECT slot, itemId, amount FROM inventory WHERE charId = ?
    `).all(player.id);
    
    if (!player.inventory) {
      player.inventory = { slots: new Array(30).fill(null) };
    }
    
    for (const row of rows) {
      player.inventory.slots[row.slot] = {
        id: row.itemId,
        amount: row.amount
      };
    }
  } catch (e) {
    console.error('Error loading inventory:', e);
  }
  
  return player;
}

function respawnMob(mob) {
  mob.dead = false;
  mob.hp = mob.maxhp;
  mob.deadUntil = 0;
}

function shouldRespawnBoss(boss) {
  if (!boss.dead) return false;
  return Date.now() - boss.deadTime > BOSS_RESPAWN_TIME;
}

module.exports = {
  savePlayerPosition,
  loadPlayerPosition,
  saveInventory,
  loadInventory,
  respawnMob,
  shouldRespawnBoss,
  SAVE_INTERVAL,
  MOB_RESPAWN_TIME,
  BOSS_RESPAWN_TIME
};
