/**
 * db-sqlite.js
 * 
 * Обёртка для SQLite базы данных
 * Заменяет accounts.json на надёжное хранилище
 * 
 * Требует: npm install better-sqlite3
 * 
 * Таблицы:
 * - accounts (аккаунты с хешированными паролями)
 * - characters (персонажи с их статами)
 * - guilds (гильдии)
 * - marriages (браки)
 * - notices (объявления в таверне)
 */

(function (g) {
  'use strict';
  const isNode = typeof module === 'object' && module.exports;

  if (!isNode) {
    console.warn('SQLite доступен только на сервере (Node.js)');
    return;
  }

  const Database = require('better-sqlite3');
  const path = require('path');
  const crypto = require('crypto');

  class GameDatabase {
    constructor(dbPath) {
      this.dbPath = dbPath || path.join(__dirname, 'legendary-age.db');
      this.db = new Database(this.dbPath);
      this.db.pragma('journal_mode = WAL'); // Write-Ahead Logging для безопасности
      this.initTables();
    }

    initTables() {
      // Таблица аккаунтов
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS accounts (
          id TEXT PRIMARY KEY,
          login TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          created_at INTEGER NOT NULL,
          last_login INTEGER,
          data TEXT
        );
      `);

      // Таблица персонажей
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS characters (
          id TEXT PRIMARY KEY,
          account_id TEXT NOT NULL,
          name TEXT UNIQUE NOT NULL,
          gender TEXT NOT NULL,
          cls TEXT DEFAULT 'novice',
          level INTEGER DEFAULT 1,
          xp INTEGER DEFAULT 0,
          hp INTEGER DEFAULT 20,
          maxhp INTEGER DEFAULT 20,
          mana INTEGER DEFAULT 10,
          maxmana INTEGER DEFAULT 10,
          gold INTEGER DEFAULT 0,
          zone TEXT DEFAULT 'town',
          x REAL DEFAULT 100,
          y REAL DEFAULT 100,
          z REAL DEFAULT 0,
          hair_color TEXT DEFAULT 'black',
          hair_len TEXT DEFAULT 'short',
          guild_id TEXT,
          spouse_id TEXT,
          created_at INTEGER NOT NULL,
          last_updated INTEGER NOT NULL,
          data TEXT,
          FOREIGN KEY (account_id) REFERENCES accounts(id)
        );
      `);

      // Таблица гильдий
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS guilds (
          id TEXT PRIMARY KEY,
          name TEXT UNIQUE NOT NULL,
          leader_id TEXT NOT NULL,
          created_at INTEGER NOT NULL,
          treasury INTEGER DEFAULT 0,
          total_damage_in_raid INTEGER DEFAULT 0,
          data TEXT,
          FOREIGN KEY (leader_id) REFERENCES accounts(id)
        );
      `);

      // Таблица браков
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS marriages (
          id TEXT PRIMARY KEY,
          char_id_1 TEXT NOT NULL,
          char_id_2 TEXT NOT NULL,
          married_at INTEGER NOT NULL,
          FOREIGN KEY (char_id_1) REFERENCES characters(id),
          FOREIGN KEY (char_id_2) REFERENCES characters(id)
        );
      `);

      // Таблица объявлений в таверне
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS notices (
          id TEXT PRIMARY KEY,
          author TEXT NOT NULL,
          content TEXT NOT NULL,
          posted_at INTEGER NOT NULL,
          expires_at INTEGER NOT NULL
        );
      `);

      // Таблица логов осад
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS raid_logs (
          id TEXT PRIMARY KEY,
          guild_id TEXT,
          character_id TEXT,
          damage_dealt INTEGER,
          timestamp INTEGER,
          FOREIGN KEY (guild_id) REFERENCES guilds(id),
          FOREIGN KEY (character_id) REFERENCES characters(id)
        );
      `);
    }

    /**
     * Регистрация аккаунта
     */
    registerAccount(login, password) {
      try {
        const hash = crypto.scryptSync(password, 'salt', 32).toString('hex');
        const id = 'acc_' + Math.random().toString(36).substr(2, 9);
        
        const stmt = this.db.prepare(`
          INSERT INTO accounts (id, login, password_hash, created_at)
          VALUES (?, ?, ?, ?)
        `);

        stmt.run(id, login, hash, Date.now());
        return { success: true, accountId: id };
      } catch (err) {
        return { success: false, error: 'Ошибка БД: ' + err.message };
      }
    }

    /**
     * Проверка пароля при входе
     */
    verifyAccount(login, password) {
      try {
        const stmt = this.db.prepare('SELECT * FROM accounts WHERE login = ?');
        const acc = stmt.get(login);

        if (!acc) return { success: false, error: 'Аккаунт не найден' };

        const hash = crypto.scryptSync(password, 'salt', 32).toString('hex');
        if (hash !== acc.password_hash) return { success: false, error: 'Неверный пароль' };

        // Обновляем last_login
        const updateStmt = this.db.prepare('UPDATE accounts SET last_login = ? WHERE id = ?');
        updateStmt.run(Date.now(), acc.id);

        return { success: true, accountId: acc.id, login: acc.login };
      } catch (err) {
        return { success: false, error: 'Ошибка БД: ' + err.message };
      }
    }

    /**
     * Создание персонажа
     */
    createCharacter(accountId, char) {
      try {
        const charId = 'char_' + Math.random().toString(36).substr(2, 9);
        const now = Date.now();

        const stmt = this.db.prepare(`
          INSERT INTO characters (
            id, account_id, name, gender, cls, created_at, last_updated,
            hair_color, hair_len
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        stmt.run(
          charId,
          accountId,
          char.name,
          char.gender,
          char.cls || 'novice',
          now,
          now,
          char.hairColor || 'black',
          char.hairLen || 'short'
        );

        return { success: true, charId };
      } catch (err) {
        return { success: false, error: 'Ошибка БД: ' + err.message };
      }
    }

    /**
     * Получить персонажа
     */
    getCharacter(charId) {
      const stmt = this.db.prepare('SELECT * FROM characters WHERE id = ?');
      return stmt.get(charId);
    }

    /**
     * Получить всех персонажей аккаунта
     */
    getAccountCharacters(accountId) {
      const stmt = this.db.prepare('SELECT * FROM characters WHERE account_id = ?');
      return stmt.all(accountId);
    }

    /**
     * Сохранить персонажа (обновление)
     */
    saveCharacter(char) {
      try {
        const stmt = this.db.prepare(`
          UPDATE characters SET
            level = ?, xp = ?, hp = ?, gold = ?,
            zone = ?, x = ?, y = ?, z = ?,
            cls = ?, guild_id = ?, spouse_id = ?,
            last_updated = ?
          WHERE id = ?
        `);

        stmt.run(
          char.lvl || 1,
          char.xp || 0,
          char.hp || 20,
          char.gold || 0,
          char.zone || 'town',
          char.x || 100,
          char.y || 100,
          char.z || 0,
          char.cls || 'novice',
          char.guildId || null,
          char.spouseId || null,
          Date.now(),
          char.id
        );

        return { success: true };
      } catch (err) {
        return { success: false, error: 'Ошибка БД: ' + err.message };
      }
    }

    /**
     * Создать гильдию
     */
    createGuild(guild) {
      try {
        const stmt = this.db.prepare(`
          INSERT INTO guilds (id, name, leader_id, created_at)
          VALUES (?, ?, ?, ?)
        `);

        stmt.run(guild.id, guild.name, guild.leader, Date.now());
        return { success: true };
      } catch (err) {
        return { success: false, error: 'Ошибка БД: ' + err.message };
      }
    }

    /**
     * Получить гильдию
     */
    getGuild(guildId) {
      const stmt = this.db.prepare('SELECT * FROM guilds WHERE id = ?');
      return stmt.get(guildId);
    }

    /**
     * Сохранить объявление в таверне
     */
    postNotice(notice) {
      try {
        const stmt = this.db.prepare(`
          INSERT INTO notices (id, author, content, posted_at, expires_at)
          VALUES (?, ?, ?, ?, ?)
        `);

        stmt.run(notice.id, notice.author, notice.content, notice.postedAt, notice.expiresAt);
        return { success: true };
      } catch (err) {
        return { success: false, error: 'Ошибка БД: ' + err.message };
      }
    }

    /**
     * Получить активные объявления
     */
    getNotices() {
      const stmt = this.db.prepare(`
        SELECT * FROM notices WHERE expires_at > ? ORDER BY posted_at DESC
      `);
      return stmt.all(Date.now());
    }

    /**
     * Записать урон осады
     */
    logRaidDamage(guildId, charId, damage) {
      try {
        const stmt = this.db.prepare(`
          INSERT INTO raid_logs (id, guild_id, character_id, damage_dealt, timestamp)
          VALUES (?, ?, ?, ?, ?)
        `);

        const logId = 'log_' + Math.random().toString(36).substr(2, 9);
        stmt.run(logId, guildId, charId, damage, Date.now());
        return { success: true };
      } catch (err) {
        return { success: false, error: 'Ошибка БД: ' + err.message };
      }
    }

    /**
     * Закрыть БД
     */
    close() {
      this.db.close();
    }
  }

  if (isNode) module.exports = { GameDatabase };
})(typeof self !== 'undefined' ? self : globalThis);
