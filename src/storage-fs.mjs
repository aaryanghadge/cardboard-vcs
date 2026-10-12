// Node-only storage adapter: one JSON file per save point plus refs.json.
import { mkdirSync, readFileSync, writeFileSync, existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

export class FsStorage {
  constructor(dir = ".cardboard") {
    this.dir = dir;
    this.objDir = join(dir, "objects");
    this.refsFile = join(dir, "refs.json");
    mkdirSync(this.objDir, { recursive: true });
  }
  readObject(id) {
    const file = join(this.objDir, id + ".json");
    if (!existsSync(file)) throw new Error(`Unknown save point ${id}`);
    return JSON.parse(readFileSync(file, "utf8"));
  }
  writeObject(id, obj) { writeFileSync(join(this.objDir, id + ".json"), JSON.stringify(obj, null, 2)); }
  hasObject(id) { return existsSync(join(this.objDir, id + ".json")); }
  listObjectIds() {
    return readdirSync(this.objDir).filter((f) => f.endsWith(".json")).map((f) => f.slice(0, -5));
  }
  readRefs() { return existsSync(this.refsFile) ? JSON.parse(readFileSync(this.refsFile, "utf8")) : null; }
  writeRefs(refs) { writeFileSync(this.refsFile, JSON.stringify(refs, null, 2)); }
}
