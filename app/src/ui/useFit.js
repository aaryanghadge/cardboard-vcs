import { useEffect, useRef, useState } from "react";

// Tracks an element's width so timelines can share one scale and fill the space.
export function useWidth() {
  const ref = useRef(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, width];
}

// Pixels per frame so the longest timeline fits the width (clamped to stay readable).
export const fitPx = (width, longest) =>
  width ? Math.min(6, Math.max(1, (width - 28) / Math.max(longest, 1))) : undefined;
