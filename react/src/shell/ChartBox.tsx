// A measured container for Syncfusion charts. Know the width before the chart mounts,
// pass it in pixels, and update from a ResizeObserver only when the floored width changes.
// Never call chart.refresh().
import { useCallback, useLayoutEffect, useRef, useState, type ReactNode } from 'react';

export function ChartBox({ children }: { children: (width: number) => ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => setWidth(w => (Math.floor(el.getBoundingClientRect().width) || w));
    measure();
    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        const w = Math.floor(entry.contentRect.width);
        if (w > 0) setWidth(prev => (w === prev ? prev : w));
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const stableChildren = useCallback((w: number) => children(w), [children]);

  return (
    <div ref={ref} style={{ width: '100%', minHeight: 1 }}>
      {width > 0 ? stableChildren(width) : null}
    </div>
  );
}