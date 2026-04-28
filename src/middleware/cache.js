'use strict';

class CacheService {
  constructor() { this.store = new Map(); }

  get(key) {
    if (!this.store.has(key)) return null;
    const { value, expiresAt } = this.store.get(key);
    if (Date.now() > expiresAt) { this.store.delete(key); return null; }
    return value;
  }

  set(key, value, ttlSec) {
    this.store.set(key, { value, expiresAt: Date.now() + ttlSec * 1000 });
  }

  invalidate(key) { this.store.delete(key); }

  invalidatePattern(pattern) {
    const re = new RegExp(pattern);
    for (const k of this.store.keys()) if (re.test(k)) this.store.delete(k);
  }

  clear() { this.store.clear(); }
}

module.exports = new CacheService();
