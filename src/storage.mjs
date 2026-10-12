// Storage adapters. The Store only talks to this small interface, so the same engine
// runs in Node (files), in tests (memory) and in the browser (localStorage).
//   readObject(id) / writeObject(id, obj) / hasObject(id) / listObjectIds()
//   readRefs() / writeRefs(refs)

export class MemoryStorage {
  constructor() { this.objects = new Map(); this.refs = null; }
  readObject(id) {
    if (!this.objects.has(id)) throw new Error(`Unknown save point ${id}`);
    return structuredClone(this.objects.get(id));
  }
  writeObject(id, obj) { this.objects.set(id, structuredClone(obj)); }
  hasObject(id) { return this.objects.has(id); }
  listObjectIds() { return [...this.objects.keys()]; }
  readRefs() { return this.refs ? structuredClone(this.refs) : null; }
  writeRefs(refs) { this.refs = structuredClone(refs); }
  clear() { this.objects.clear(); this.refs = null; }
}

export class BrowserStorage {
  constructor(prefix = "cardboard:", ls = globalThis.localStorage) {
    if (!ls) throw new Error("localStorage is not available");
    try { ls.setItem(prefix + "probe", "1"); ls.removeItem(prefix + "probe"); }
    catch { throw new Error("localStorage is not writable"); }
    this.prefix = prefix;
    this.ls = ls;
  }
  _key(id) { return `${this.prefix}obj:${id}`; }
  readObject(id) {
    const raw = this.ls.getItem(this._key(id));
    if (raw == null) throw new Error(`Unknown save point ${id}`);
    return JSON.parse(raw);
  }
  writeObject(id, obj) { this.ls.setItem(this._key(id), JSON.stringify(obj)); }
  hasObject(id) { return this.ls.getItem(this._key(id)) != null; }
  listObjectIds() {
    const start = `${this.prefix}obj:`;
    const ids = [];
    for (let i = 0; i < this.ls.length; i++) {
      const k = this.ls.key(i);
      if (k && k.startsWith(start)) ids.push(k.slice(start.length));
    }
    return ids;
  }
  readRefs() {
    const raw = this.ls.getItem(this.prefix + "refs");
    return raw ? JSON.parse(raw) : null;
  }
  writeRefs(refs) { this.ls.setItem(this.prefix + "refs", JSON.stringify(refs)); }
  clear() {
    const keys = [];
    for (let i = 0; i < this.ls.length; i++) {
      const k = this.ls.key(i);
      if (k && k.startsWith(this.prefix)) keys.push(k);
    }
    keys.forEach((k) => this.ls.removeItem(k));
  }
}
