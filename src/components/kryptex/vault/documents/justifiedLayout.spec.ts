import { describe, expect, it } from "vitest";
import { buildFixedColumnJustifiedRows, buildJustifiedRows, clampAspect } from "./justifiedLayout";

describe("buildJustifiedRows", () => {
  it("returns empty for zero width", () => {
    expect(buildJustifiedRows([{ id: "a", aspect: 1 }], 0, 100, 8)).toEqual([]);
  });

  it("packs a single wide item on last row without forced stretch when sparse", () => {
    const rows = buildJustifiedRows([{ id: "a", aspect: 1 }], 800, 100, 8);
    expect(rows).toHaveLength(1);
    expect(rows[0].isLast).toBe(true);
    expect(rows[0].items[0].width).toBe(100);
  });
});

describe("buildFixedColumnJustifiedRows", () => {
  it("returns empty for zero width", () => {
    expect(buildFixedColumnJustifiedRows([{ id: "a", aspect: 1 }], 0, 100, 8, 4)).toEqual([]);
  });

  it("puts four squares per row and fills width", () => {
    const items = [
      { id: "a", aspect: 1 },
      { id: "b", aspect: 1 },
      { id: "c", aspect: 1 },
      { id: "d", aspect: 1 },
    ];
    const gap = 8;
    const w = 800;
    const h = 100;
    const rows = buildFixedColumnJustifiedRows(items, w, h, gap, 4);
    expect(rows).toHaveLength(1);
    expect(rows[0].items).toHaveLength(4);
    const total = rows[0].items.reduce((s, it) => s + it.width, 0) + gap * 3;
    expect(total).toBeCloseTo(w, 5);
  });

  it("last row can have fewer than four items", () => {
    const items = [
      { id: "a", aspect: 1 },
      { id: "b", aspect: 1 },
      { id: "c", aspect: 1 },
    ];
    const rows = buildFixedColumnJustifiedRows(items, 400, 80, 8, 4);
    expect(rows).toHaveLength(1);
    expect(rows[0].items).toHaveLength(3);
  });
});

describe("clampAspect", () => {
  it("clamps extreme values", () => {
    expect(clampAspect(0.01)).toBeGreaterThanOrEqual(0.35);
    expect(clampAspect(100)).toBeLessThanOrEqual(3.5);
  });
});
