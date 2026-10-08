/**
 * state-delta.js
 * 
 * Система State Delta: отправляем только изменения вместо полной карты мира
 * 
 * Проблема: сервер каждый тик отправляет JSON.stringify всего мира -> смерть при 5+ игроках
 * Решение: только отправляем {id, поля которые изменились}
 * 
 * Пример:
 * Вместо: {t:'s', z:'town', p:[{id,x,y,hp,mh,lv,xp,nx,gold,c1,c2,dd,rs},...]}
 * Отправляем: {t:'d', d:[{id:'p1',x:100,y:50},...]},{id:'m2',hp:10}}}
 */

(function (g) {
  'use strict';
  const isNode = typeof module === 'object' && module.exports;

  /**
   * Отслеживает состояние сущности для обнаружения изменений
   */
  class StateTracker {
    constructor(entity) {
      this.entity = entity;
      this.lastSent = JSON.parse(JSON.stringify(entity)); // глубокая копия
    }

    /**
     * Возвращает только изменённые поля
     * @returns {Object} {id, поля которые изменились}
     */
    getDelta() {
      const delta = { id: this.entity.id };
      let hasChanges = false;

      // Проверяем ключевые поля
      const fields = ['x', 'y', 'z', 'hp', 'mana', 'lvl', 'xp', 'gold', 'status', 'pose', 'dir'];
      
      for (const field of fields) {
        if (this.entity[field] !== this.lastSent[field]) {
          delta[field] = this.entity[field];
          hasChanges = true;
        }
      }

      if (hasChanges) {
        this.lastSent = JSON.parse(JSON.stringify(this.entity));
        return delta;
      }

      return null; // нет изменений
    }

    /**
     * Обновляет отслеживаемое состояние
     */
    update(entity) {
      this.entity = entity;
    }

    /**
     * Полный снимок (для новых игроков)
     */
    getFullState() {
      return {
        id: this.entity.id,
        x: this.entity.x,
        y: this.entity.y,
        z: this.entity.z,
        hp: this.entity.hp,
        mana: this.entity.mana,
        maxhp: this.entity.maxhp,
        maxmana: this.entity.maxmana,
        lvl: this.entity.lvl,
        xp: this.entity.xp,
        gold: this.entity.gold,
        cls: this.entity.cls,
        gender: this.entity.gender,
        hairColor: this.entity.hairColor,
        hairLen: this.entity.hairLen,
        status: this.entity.status || 'idle',
        pose: this.entity.pose || 'stand',
        dir: this.entity.dir || 0,
        type: this.entity.type || 'player' // 'player', 'monster', 'npc'
      };
    }
  }

  /**
   * Менеджер State Delta для зоны
   */
  class ZoneDeltaManager {
    constructor() {
      this.trackers = new Map(); // id -> StateTracker
      this.pendingDeltas = []; // очередь изменений для отправки
    }

    /**
     * Добавляет сущность для отслеживания
     */
    addEntity(entity) {
      this.trackers.set(entity.id, new StateTracker(entity));
      this.pendingDeltas.push({ action: 'spawn', entity: this.trackers.get(entity.id).getFullState() });
    }

    /**
     * Удаляет сущность
     */
    removeEntity(entityId) {
      this.trackers.delete(entityId);
      this.pendingDeltas.push({ action: 'despawn', id: entityId });
    }

    /**
     * Обновляет сущность и регистрирует изменения
     */
    updateEntity(entity) {
      const tracker = this.trackers.get(entity.id);
      if (!tracker) {
        this.addEntity(entity);
        return;
      }

      tracker.update(entity);
      const delta = tracker.getDelta();
      if (delta) {
        this.pendingDeltas.push({ action: 'update', delta });
      }
    }

    /**
     * Получает все pending deltas и очищает очередь
     */
    getPendingDeltas() {
      const result = this.pendingDeltas;
      this.pendingDeltas = [];
      return result;
    }

    /**
     * Полный снимок всех сущностей в зоне (для новых игроков)
     */
    getFullSnapshot() {
      const entities = [];
      for (const tracker of this.trackers.values()) {
        entities.push(tracker.getFullState());
      }
      return entities;
    }

    /**
     * Отправляет сжатый пакет (для сети)
     * Вместо {t:'s', p:[...]} отправляем {t:'d', d:[...]}
     */
    getNetworkPacket() {
      const deltas = this.getPendingDeltas();
      if (deltas.length === 0) return null;

      // Сжимаем пакет
      const packet = {
        t: 'd', // 'd' = delta update
        d: deltas
      };

      return packet;
    }
  }

  /**
   * Сжатие координат для экономии пропускной способности
   * Вместо {x: 123.456, y: 789.012} отправляем "123:789"
   */
  function compressCoords(x, y) {
    return Math.floor(x) + ':' + Math.floor(y);
  }

  function decompressCoords(str) {
    const [x, y] = str.split(':').map(Number);
    return { x, y };
  }

  /**
   * Бинарная кодировка для сверхмалого пакета
   * Но это сложнее, поэтому сейчас используем текстовые маркеры
   */
  const api = {
    StateTracker,
    ZoneDeltaManager,
    compressCoords,
    decompressCoords
  };

  if (isNode) module.exports = api;
  else g.StateDelta = api;
})(typeof self !== 'undefined' ? self : globalThis);
