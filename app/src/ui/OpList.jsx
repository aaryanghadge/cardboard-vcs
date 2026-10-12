import { OPS, sentence } from "../lib.js";

// A compact, read-only list of changes.
export default function OpList({ title, ops, nameOf, empty = "No changes." }) {
  return (
    <div className="rounded-lg border border-edge bg-panel p-4">
      <h3 className="mb-2 text-sm font-semibold">{title}</h3>
      {ops.length === 0 ? (
        <p className="text-sm text-dim">{empty}</p>
      ) : (
        <ul className="space-y-1.5 text-sm">
          {ops.map((op, i) => (
            <li key={i} className="flex gap-2">
              <span className={`w-4 shrink-0 text-center font-semibold ${OPS[op.type].text}`}>{OPS[op.type].sym}</span>
              <span><span className="font-medium">{nameOf(op.clip)}</span> <span className="text-dim">{sentence(op, nameOf)}</span></span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
