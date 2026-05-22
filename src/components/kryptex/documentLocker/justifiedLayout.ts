/** Greedy justified rows: fixed row height, widths from aspect ratio; last row stays natural width, left-aligned. */

export type AspectItem = { id: string; aspect: number };

export type PlacedItem = AspectItem & { width: number; height: number };

export type JustifiedRow = { items: PlacedItem[]; isLast: boolean };

const MIN_AR = 0.35;
const MAX_AR = 3.5;

export function clampAspect(ar: number): number {
  if (!Number.isFinite(ar) || ar <= 0) return 1;
  return Math.min(MAX_AR, Math.max(MIN_AR, ar));
}

/**
 * Packs items into rows; full rows are scaled to fill `containerWidth`.
 * Last row uses natural widths (no stretch) when it would look sparse.
 */
export function buildJustifiedRows(
  items: AspectItem[],
  containerWidth: number,
  rowHeight: number,
  gap: number
): JustifiedRow[] {
  if (containerWidth <= 0 || items.length === 0) return [];

  const normalized = items.map((it) => ({ ...it, aspect: clampAspect(it.aspect) }));
  const rows: AspectItem[][] = [];
  let row: AspectItem[] = [];
  let rowAspect = 0;

  const flush = () => {
    if (row.length) {
      rows.push(row);
      row = [];
      rowAspect = 0;
    }
  };

  for (const item of normalized) {
    const ar = item.aspect;
    if (row.length === 0) {
      row.push(item);
      rowAspect = ar;
      continue;
    }

    const n = row.length + 1;
    const combinedAspect = rowAspect + ar;
    const widthIfNatural = combinedAspect * rowHeight + gap * (n - 1);

    if (widthIfNatural <= containerWidth) {
      row.push(item);
      rowAspect = combinedAspect;
    } else {
      flush();
      row = [item];
      rowAspect = ar;
    }
  }
  flush();

  return rows.map((r, idx) => {
    const isLast = idx === rows.length - 1;
    const gaps = gap * Math.max(0, r.length - 1);
    const sumAr = r.reduce((s, it) => s + clampAspect(it.aspect), 0);

    if (isLast) {
      const naturalTotal = sumAr * rowHeight + gaps;
      const shouldStretch = r.length > 1 && naturalTotal >= containerWidth * 0.5;
      if (!shouldStretch) {
        return {
          isLast: true,
          items: r.map((it) => {
            const a = clampAspect(it.aspect);
            return { ...it, width: a * rowHeight, height: rowHeight };
          }),
        };
      }
    }

    const available = containerWidth - gaps;
    const scale = available / (sumAr * rowHeight);
    return {
      isLast,
      items: r.map((it) => {
        const a = clampAspect(it.aspect);
        return { ...it, width: a * rowHeight * scale, height: rowHeight };
      }),
    };
  });
}

/**
 * Justified rows with a fixed maximum number of images per row (e.g. 4).
 * Each row stretches to `containerWidth`; cell widths scale with aspect ratio like a full justified row.
 */
export function buildFixedColumnJustifiedRows(
  items: AspectItem[],
  containerWidth: number,
  rowHeight: number,
  gap: number,
  columnsPerRow: number
): JustifiedRow[] {
  if (containerWidth <= 0 || items.length === 0 || columnsPerRow < 1) return [];

  const normalized = items.map((it) => ({ ...it, aspect: clampAspect(it.aspect) }));
  const rows: AspectItem[][] = [];
  for (let i = 0; i < normalized.length; i += columnsPerRow) {
    rows.push(normalized.slice(i, i + columnsPerRow));
  }

  return rows.map((r, idx) => {
    const isLast = idx === rows.length - 1;
    const n = r.length;
    const gaps = gap * Math.max(0, n - 1);
    const sumAr = r.reduce((s, it) => s + clampAspect(it.aspect), 0);
    const available = containerWidth - gaps;
    const scale = available / (sumAr * rowHeight);

    return {
      isLast,
      items: r.map((it) => {
        const a = clampAspect(it.aspect);
        return { ...it, width: a * rowHeight * scale, height: rowHeight };
      }),
    };
  });
}

// Row packing uses natural widths for the final row when it would otherwise look sparse (see `shouldStretch`).
