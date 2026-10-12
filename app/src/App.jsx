import { useState } from "react";
import { openProject } from "./project.js";
import History from "./views/History.jsx";
import Compare from "./views/Compare.jsx";
import Combine from "./views/Combine.jsx";
import Edit from "./views/Edit.jsx";

const TABS = [
  ["history", "History"],
  ["edit", "Edit"],
  ["compare", "Compare"],
  ["combine", "Combine"],
];

export default function App() {
  const [store, setStore] = useState(() => openProject());
  const [version, setVersion] = useState(0);
  const [view, setView] = useState("history");
  const [cmp, setCmp] = useState(null);          // { base, head } save point ids
  const [selectedId, setSelectedId] = useState(null);
  const [forking, setForking] = useState(false);
  const [newCut, setNewCut] = useState("");
  const [error, setError] = useState("");

  const bump = () => setVersion((v) => v + 1);
  const cuts = store.cuts();
  const current = store.currentCut;

  const attempt = (fn) => { try { fn(); setError(""); bump(); } catch (e) { setError(e.message); } };
  const goCompare = (base, head) => { setCmp({ base, head }); setView("compare"); };
  const reset = () => {
    setStore(openProject({ reset: true }));
    setCmp(null); setSelectedId(null); setView("history"); setError(""); bump();
  };

  return (
    <div className="flex min-h-full flex-col">
      <header className="flex flex-wrap items-center gap-x-5 gap-y-2 border-b border-edge bg-panel px-5 py-2.5">
        <div className="flex items-center gap-3">
          <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
            <path d="M3 6l7-3 7 3v8l-7 3-7-3z" fill="none" stroke="#d6b48a" strokeWidth="1.5" strokeLinejoin="round" />
            <path d="M3 6l7 3 7-3M10 9v8" fill="none" stroke="#d6b48a" strokeWidth="1.5" strokeLinejoin="round" />
          </svg>
          <span className="font-semibold">Cardboard</span>
          <span className="text-dim">Acme Studio / Spring campaign</span>
        </div>

        <nav className="flex gap-1" aria-label="Views">
          {TABS.map(([id, label]) => (
            <button key={id} onClick={() => setView(id)} aria-current={view === id ? "page" : undefined}
              className={`rounded-md px-3 py-1.5 text-sm transition-colors ${view === id ? "bg-raise text-white" : "text-dim hover:text-white"}`}>
              {label}
            </button>
          ))}
        </nav>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-2 text-sm text-dim">
            Alt cut
            <select value={current} onChange={(e) => attempt(() => store.switchTo(e.target.value))}
              className="rounded-md border border-edge bg-raise px-2.5 py-1.5 text-sm text-text">
              {cuts.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
            </select>
          </label>
          {forking ? (
            <form className="flex gap-2" onSubmit={(e) => {
              e.preventDefault();
              attempt(() => { store.fork(newCut.trim()); setNewCut(""); setForking(false); });
            }}>
              <input autoFocus value={newCut} onChange={(e) => setNewCut(e.target.value)} placeholder="name, e.g. sound-mix"
                aria-label="New Alt cut name" className="w-44 rounded-md border border-edge bg-ink px-2.5 py-1.5 text-sm text-text" />
              <button type="submit" className="rounded-md bg-sky-600 px-3 py-1.5 text-sm font-medium text-white">Create</button>
              <button type="button" onClick={() => { setForking(false); setError(""); }} className="rounded-md px-2 py-1.5 text-sm text-dim hover:text-white">Cancel</button>
            </form>
          ) : (
            <button onClick={() => setForking(true)} className="rounded-md border border-edge bg-raise px-3 py-1.5 text-sm hover:brightness-110">New Alt cut</button>
          )}
          <button onClick={reset} className="rounded-md px-2 py-1.5 text-sm text-dim hover:text-white">Reset demo</button>
        </div>
      </header>

      {error && <p role="alert" className="border-b border-rose-400/40 bg-rose-950/40 px-5 py-2 text-sm text-rose-200">{error}</p>}

      {view === "history" && (
        <History store={store} version={version} selectedId={selectedId} onSelect={setSelectedId}
          onCompare={goCompare} onChanged={bump} onResolve={() => setView("combine")} />
      )}
      {view === "compare" && <Compare store={store} version={version} ids={cmp} onIds={setCmp} />}
      {view === "combine" && (
        <Combine store={store} version={version} onChanged={bump}
          onDone={(id) => { setSelectedId(id); setView("history"); }} />
      )}
      {view === "edit" && (
        <Edit key={`${current}:${store.tip}`} store={store}
          onSaved={(id) => { bump(); setSelectedId(id); setView("history"); }} />
      )}
    </div>
  );
}
