import { OPS, OP_ORDER, sentence } from "../lib.js";

export default function ChangeList({ ops, hidden, onToggle, nameOf, selected, onSelect }) {
  const counts = Object.fromEntries(OP_ORDER.map((t) => [t, ops.filter((o) => o.type === t).length]));
  const visible = ops.filter((o) => !hidden.has(o.type));

  return (
    <div>
      <h2 className="mb-3 text-sm font-semibold">Changes</h2>

      <div className="mb-4 flex flex-wrap gap-1.5">
        {OP_ORDER.filter((t) => counts[t] > 0).map((t) => {
          const on = !hidden.has(t);
          return (
            <button key={t} onClick={() => onToggle(t)} aria-pressed={on}
              className={`rounded-full border px-2.5 py-1 text-xs transition-colors
                ${on ? `border-edge bg-raise ${OPS[t].text}` : "border-edge text-dim line-through opacity-60"}`}>
              {counts[t]} {OPS[t].label.toLowerCase()}
            </button>
          );
        })}
      </div>

      {ops.length === 0 ? (
        <p className="text-sm text-dim">These two save points are identical.</p>
      ) : visible.length === 0 ? (
        <p className="text-sm text-dim">Every change type is hidden. Turn one back on above.</p>
      ) : (
        <ul className="space-y-1">
          {visible.map((op, i) => {
            const isSel = selected === op.clip;
            return (
              <li key={i}>
                <button onClick={() => onSelect(isSel ? null : op.clip)} aria-pressed={isSel}
                  className={`flex w-full items-start gap-2.5 rounded-md border px-2.5 py-2 text-left text-sm transition-colors
                    ${isSel ? "border-white/50 bg-raise" : "border-transparent hover:bg-raise"}`}>
                  <span className={`w-4 shrink-0 text-center font-semibold ${OPS[op.type].text}`}>{OPS[op.type].sym}</span>
                  <span>
                    <span className="font-medium">{nameOf(op.clip)}</span>{" "}
                    <span className="text-dim">{sentence(op, nameOf)}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
