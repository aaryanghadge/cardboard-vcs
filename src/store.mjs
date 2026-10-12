import { sha256Hex } from "./hash.mjs";
import { merge } from "./merge.mjs";
import { resolveAll, keyOf } from "./resolve.mjs";
import { MemoryStorage } from "./storage.mjs";

// Canonical JSON: keys sorted, so identical data always gives an identical hash,
// no matter what order the keys were written in.
const canon = (v) => {
  if (Array.isArray(v)) return "[" + v.map(canon).join(",") + "]";
  if (v && typeof v === "object")
    return "{" + Object.keys(v).sort()
      .map((k) => JSON.stringify(k) + ":" + canon(v[k])).join(",") + "}";
  return JSON.stringify(v);
};

// Content-addressing: the ID *is* the hash of the content.
export const hashOf = (v) => sha256Hex(canon(v)).slice(0, 12);

export class Store {
  constructor(storage = new MemoryStorage()) {
    if (typeof storage === "string")
      throw new Error("Pass a storage adapter, e.g. new Store(new FsStorage(dir))");
    this.storage = storage;
    this.refs = storage.readRefs() ?? { current: "main", cuts: { main: null } };
    storage.writeRefs(this.refs);
  }

  _saveRefs() { this.storage.writeRefs(this.refs); }

  get currentCut() { return this.refs.current; }

  // The newest save point on the Alt cut you're currently on
  get tip() { return this.refs.cuts[this.refs.current]; }

  _setTip(id) {
    this.refs.cuts[this.refs.current] = id;
    this._saveRefs();
  }

  _put({ timeline, parents, message, conflicts = [], author = "unknown", time }) {
    const id = hashOf({ timeline, parents, message, conflicts, author });
    if (!this.storage.hasObject(id)) {
      const seq = this.storage.listObjectIds().length + 1; // never reused, so it orders history
      this.storage.writeObject(id, {
        id, timeline, parents, message, conflicts, author,
        cut: this.refs.current, time: time ?? Date.now(), seq,
      });
    }
    return id;
  }

  get(id) { return this.storage.readObject(id); }

  // Every save point, newest first
  all() {
    return this.storage.listObjectIds().map((id) => this.get(id)).sort((a, b) => b.seq - a.seq);
  }

  // Alt cuts and where each one currently ends
  cuts() {
    return Object.entries(this.refs.cuts).map(([name, tip]) => ({ name, tip, current: name === this.refs.current }));
  }

  // SAVE POINT (git: commit)
  save(timeline, message = "auto", opts = {}) {
    const parents = this.tip ? [this.tip] : [];
    const id = this._put({ timeline, parents, message, author: opts.author, time: opts.time });
    this._setTip(id);
    return id;
  }

  // ALT CUT (git: branch). Starts at the current save point and switches to it.
  fork(name) {
    if (!name || !String(name).trim()) throw new Error("Give the Alt cut a name");
    if (name in this.refs.cuts) throw new Error(`Alt cut "${name}" already exists`);
    this.refs.cuts[name] = this.tip;
    this.refs.current = name;
    this._saveRefs();
  }

  switchTo(name) {
    if (!(name in this.refs.cuts)) throw new Error(`No Alt cut "${name}"`);
    this.refs.current = name;
    this._saveRefs();
  }

  // Newest-first list of save points, following first parents
  history(id = this.tip) {
    const out = [];
    while (id) {
      const sp = this.get(id);
      out.push({ id: sp.id, message: sp.message, author: sp.author });
      id = sp.parents[0];
    }
    return out;
  }

  // Every ancestor of id (including itself), with its distance from id
  _ancestors(id) {
    const seen = new Map([[id, 0]]);
    const queue = [id];
    while (queue.length) {
      const cur = queue.shift();
      for (const p of this.get(cur).parents) {
        if (!seen.has(p)) { seen.set(p, seen.get(cur) + 1); queue.push(p); }
      }
    }
    return seen;
  }

  // The nearest save point both sides share. This is the "base" for merging.
  mergeBase(a, b) {
    const anc = this._ancestors(a);
    const queue = [b], seen = new Set([b]);
    while (queue.length) {
      const cur = queue.shift();
      if (anc.has(cur)) return cur;
      for (const p of this.get(cur).parents)
        if (!seen.has(p)) { seen.add(p); queue.push(p); }
    }
    return null;
  }

  // What combining `name` into the current cut would do. Writes nothing.
  _plan(name) {
    const mine = this.tip, theirs = this.refs.cuts[name];
    if (!theirs) throw new Error(`No Alt cut "${name}"`);
    if (!mine)
      return { status: "fast-forward", mine, theirs, base: null, timeline: this.get(theirs).timeline, conflicts: [] };

    const base = this.mergeBase(mine, theirs);
    if (base === theirs)
      return { status: "up-to-date", mine, theirs, base, timeline: this.get(mine).timeline, conflicts: [] };
    if (base === mine)
      return { status: "fast-forward", mine, theirs, base, timeline: this.get(theirs).timeline, conflicts: [] };

    const baseTl = base ? this.get(base).timeline : { tracks: [] };
    const { timeline, conflicts } = merge(baseTl, this.get(mine).timeline, this.get(theirs).timeline);
    return { status: conflicts.length ? "needs-choices" : "combined", mine, theirs, base, timeline, conflicts };
  }

  previewCombine(name) { return this._plan(name); }

  // COMBINE (git: merge). Pulls another Alt cut into the current one.
  // `decisions` are optional choices made up front; anything undecided is saved as an open choice.
  combine(name, message, decisions = {}, opts = {}) {
    const plan = this._plan(name);
    if (plan.status === "up-to-date") return { status: plan.status, conflicts: [] };
    if (plan.status === "fast-forward") {
      this._setTip(plan.theirs);
      return { status: plan.status, conflicts: [] };
    }
    const timeline = resolveAll(plan.timeline, plan.conflicts, decisions);
    const remaining = plan.conflicts.filter((c) => !decisions[keyOf(c)]);
    // A combined save point has TWO parents. Open choices are stored, never blocking.
    const id = this._put({
      timeline, parents: [plan.mine, plan.theirs],
      message: message ?? `Combine ${name}`, conflicts: remaining, author: opts.author,
    });
    this._setTip(id);
    return { status: remaining.length ? "needs-choices" : "combined", id, conflicts: remaining };
  }

  // RESOLVE (git: committing a merge resolution). Applies the editor's choices
  // on top of a conflicted save point as a NEW save point. Undecided conflicts carry over.
  resolveCombine(decisions, message = "Resolved choices", opts = {}) {
    if (!this.tip) throw new Error("Nothing to resolve: no save points yet");
    const tip = this.get(this.tip);
    if (!tip.conflicts.length) throw new Error("Nothing to resolve: this save point has no conflicts");
    const timeline = resolveAll(tip.timeline, tip.conflicts, decisions);
    const remaining = tip.conflicts.filter((c) => !decisions[keyOf(c)]);
    const id = this._put({ timeline, parents: [tip.id], message, conflicts: remaining, author: opts.author });
    this._setTip(id);
    return id;
  }

  // GO BACK TO HERE (git: reset). Old save points stay on disk, nothing is deleted.
  goBackTo(id) {
    this.get(id); // throws if it doesn't exist
    this._setTip(id);
  }
}
