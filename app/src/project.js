import { Store } from "@engine/store.mjs";
import { MemoryStorage, BrowserStorage } from "@engine/storage.mjs";
import { seedDemoProject } from "@engine/demo-project.mjs";

function makeStorage() {
  try { return new BrowserStorage(); } catch { return new MemoryStorage(); }
}

// Opens the project kept in this browser. Seeds the sample project the first time.
export function openProject({ reset = false } = {}) {
  const storage = makeStorage();
  if (reset) storage.clear();
  const store = new Store(storage);
  if (store.all().length === 0) seedDemoProject(store);
  return store;
}
