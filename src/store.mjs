import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { merge } from "./merge.mjs";

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
export const hashOf = (v) =>
  createHash("sha256").update(canon(v)).digest("hex").slice(0, 12);

export class Store {
  constructor(dir = ".cardboard") {
    this.objDir = join(dir, "objects");       // one JSON file per save point
    this.refsFile = join(dir, "refs.json");   // Alt cut name -> tip save point
    mkdirSync(this.objDir, { recursive: true });
    this.refs = existsSync(this.refsFile)
      ? JSON.parse(readFileSync(this.refsFile, "utf8"))
      : { current: "main", cuts: { main: null } };
    this._saveRefs();
  }

  _saveRefs() {
    writeFileSync(this.refsFile, JSON.stringify(this.refs, null, 2));
  }

  // The newest save point on the Alt cut you're currently on
  get tip() {
    return this.refs.cuts[this.refs.current];
  }

  _setTip(id) {
    this.refs.cuts[this.refs.current] = id;
    this._saveRefs();
  }

  _put({ timeline, parents, message, conflicts = [] }) {
    const id = hashOf({ timeline, parents, message, conflicts });
    const sp = { id, timeline, parents, message, conflicts, time: Date.now() };
    writeFileSync(join(this.objDir, id + ".json"), JSON.stringify(sp, null, 2));
    return id;
  }

  get(id) {
    return JSON.parse(readFileSync(join(this.objDir, id + ".json"), "utf8"));
  }

  // SAVE POINT (git: commit)
  save(timeline, message = "auto") {
    const parents = this.tip ? [this.tip] : [];
    const id = this._put({ timeline, parents, message });
    this._setTip(id);
    return id;
  }

  // ALT CUT (git: branch). Starts at the current save point and switches to it.
  fork(name) {
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
      out.push({ id: sp.id, message: sp.message });
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

  // COMBINE (git: merge). Pulls another Alt cut into the current one.
  combine(name, message) {
    const mine = this.tip, theirs = this.refs.cuts[name];
    if (!theirs) throw new Error(`No Alt cut "${name}"`);

    if (!mine) { this._setTip(theirs); return { status: "fast-forward", conflicts: [] }; }

    const base = this.mergeBase(mine, theirs);
    if (base === theirs) return { status: "up-to-date", conflicts: [] };
    if (base === mine) { this._setTip(theirs); return { status: "fast-forward", conflicts: [] }; }

    const baseTl = base ? this.get(base).timeline : { tracks: [] };
    const { timeline, conflicts } = merge(
      baseTl, this.get(mine).timeline, this.get(theirs).timeline
    );
    // A combined save point has TWO parents. Conflicts are stored, never blocking.
    const id = this._put({
      timeline, parents: [mine, theirs],
      message: message ?? `Combine ${name}`, conflicts,
    });
    this._setTip(id);
    return { status: conflicts.length ? "needs-choices" : "combined", id, conflicts };
  }

  // GO BACK TO HERE (git: reset). Old save points stay on disk, nothing is deleted.
  goBackTo(id) {
    this.get(id); // throws if it doesn't exist
    this._setTip(id);
  }
}
