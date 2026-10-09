import { OPS, len, signed } from "../lib.js";

export default function Inspector({ before, after, ops, id }) {
  if (!id) {
    return (
      <div className="rounded-lg border border-dashed border-edge p-4 text-sm text-dim">
        Select a clip on either timeline, or a change on the right, to see exactly what happened to it.
      </div>
    );
  }
  const clip = after ?? before;
  const rows = [];
  if (before && after) {
    for (const k of new Set([...Object.keys(before), ...Object.keys(after)])) {
      if (k === "id" || JSON.stringify(before[k]) === JSON.stringify(after[k])) continue;
      rows.push({ field: k, from: before[k], to: after[k] });
    }
  }
  const status = ops.length ? ops[0].type : "same";

  return (
    <div className="rounded-lg border border-edge bg-panel p-4">
      <div className="flex items-baseline justify-between gap-4">
        <h3 className="text-base font-semibold">{clip.name}</h3>
        <span className={`text-xs ${OPS[status].text}`}>{OPS[status].label}</span>
      </div>
      <p className="mt-0.5 text-xs text-dim">Clip {clip.id}, media {clip.asset}</p>

      {!before && <p className="mt-3 text-sm">New in this save point. Runs {len(after)} frames.</p>}
      {!after && <p className="mt-3 text-sm">Not in this save point. It ran {len(before)} frames.</p>}
      {before && after && rows.length === 0 && ops.length === 0 && <p className="mt-3 text-sm text-dim">Nothing changed on this clip.</p>}
      {rows.length > 0 && (
        <table className="mt-3 w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-dim">
              <th className="pb-1 font-normal">Field</th><th className="pb-1 font-normal">Before</th>
              <th className="pb-1 font-normal">After</th><th className="pb-1 font-normal">Difference</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.field} className="border-t border-edge">
                <td className="py-1.5">{r.field}</td>
                <td className="py-1.5 text-dim">{String(r.from ?? "none")}</td>
                <td className="py-1.5">{String(r.to ?? "none")}</td>
                <td className="py-1.5 text-amber-200">
                  {typeof r.from === "number" && typeof r.to === "number" ? `${signed(r.to - r.from)} frames` : ""}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {ops.some((o) => o.type === "moved") && (
        <p className="mt-3 text-sm text-sky-300">Moved from position {ops.find((o) => o.type === "moved").from + 1} to {ops.find((o) => o.type === "moved").to + 1}.</p>
      )}
    </div>
  );
}
