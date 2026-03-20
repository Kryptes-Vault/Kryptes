import { describe, expect, it } from "vitest";
import { buildJustifiedRows, clampAspect } from "./justifiedLayout";

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

describe("clampAspect", () => {
  it("clamps extreme values", () => {
    expect(clampAspect(0.01)).toBeGreaterThanOrEqual(0.35);
    expect(clampAspect(100)).toBeLessThanOrEqual(3.5);
  });
});
