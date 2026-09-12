/**
 * agent.cache.js - In-memory cache for files, project index, and search results.
 * Eliminates redundant DB reads during a single agent task execution.
 */

const TTL_FILE   = 60000;    // 60s - file content
const TTL_INDEX  = 120000;   // 120s - project file tree
const TTL_SEARCH = 30000;    // 30s  - search results

class AgentCache {
  constructor() {
    this._store = new Map();
  }

  _key() {
    return Array.from(arguments).join(':');
  }

  set(key, value, ttl) {
    this._store.set(key, { value: value, expiresAt: Date.now() + ttl });
  }

  get(key) {
    const entry = this._store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) { this._store.delete(key); return null; }
    return entry.value;
  }

  del(key) { this._store.delete(key); }

  // File content
  getFile(projectId, path) {
    return this.get('f:' + projectId + ':' + path);
  }
  setFile(projectId, path, content) {
    this.set('f:' + projectId + ':' + path, content, TTL_FILE);
  }
  invalidateFile(projectId, path) {
    this.del('f:' + projectId + ':' + path);
  }

  // Project file tree index
  getIndex(projectId) {
    return this.get('idx:' + projectId);
  }
  setIndex(projectId, tree) {
    this.set('idx:' + projectId, tree, TTL_INDEX);
  }
  invalidateIndex(projectId) {
    this.del('idx:' + projectId);
  }

  // Search results
  getSearch(projectId, query) {
    return this.get('srch:' + projectId + ':' + query);
  }
  setSearch(projectId, query, results) {
    this.set('srch:' + projectId + ':' + query, results, TTL_SEARCH);
  }

  // Invalidate all cached data for a project
  invalidateProject(projectId) {
    const marker = ':' + projectId + ':';
    for (const key of this._store.keys()) {
      if (key.includes(marker)) this._store.delete(key);
    }
  }

  stats() {
    let alive = 0, expired = 0;
    const now = Date.now();
    for (const entry of this._store.values()) {
      now > entry.expiresAt ? expired++ : alive++;
    }
    return { alive: alive, expired: expired, total: this._store.size };
  }

  purge() {
    const now = Date.now();
    for (const [k, v] of this._store) {
      if (now > v.expiresAt) this._store.delete(k);
    }
  }
}

// Singleton shared across all agent executions in this process
module.exports = new AgentCache();
