/**
 * auth.js — БЛОК 8: Безопасность аутентификации
 * - Валидация токенов
 * - Хеширование паролей
 * - TTL токенов (7 дней)
 * - Anti-flood
 */

const crypto = require('crypto');

const TOKEN_TTL = 7 * 24 * 60 * 60 * 1000; // 7 дней в миллисекундах

function hashPassword(password) {
  const salt = crypto.randomBytes(32);
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512');
  return salt.toString('hex') + ':' + hash.toString('hex');
}

function verifyPassword(password, stored) {
  const [salt, hash] = stored.split(':');
  const check = crypto.pbkdf2Sync(password, Buffer.from(salt, 'hex'), 100000, 64, 'sha512');
  return check.toString('hex') === hash;
}

function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

function createToken(charId) {
  return {
    token: generateToken(),
    charId: charId,
    createdAt: Date.now(),
    expiresAt: Date.now() + TOKEN_TTL
  };
}

function validateToken(token, tokens) {
  const record = tokens[token];
  if (!record) return { ok: false, error: 'Token not found' };
  if (Date.now() > record.expiresAt) return { ok: false, error: 'Token expired' };
  return { ok: true, charId: record.charId };
}

module.exports = {
  hashPassword,
  verifyPassword,
  generateToken,
  createToken,
  validateToken,
  TOKEN_TTL
};
