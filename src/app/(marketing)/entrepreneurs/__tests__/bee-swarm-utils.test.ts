import { describe, it, expect } from "vitest";
import {
  valueToX,
  mobileValueToX,
  deterministicJitter,
  formatRange,
  X_MIN,
  X_RANGE,
  MOBILE_STRIP_VIEWBOX_W,
  MOBILE_STRIP_PAD_X,
  JITTER_RANGE,
} from "../bee-swarm-utils";

describe("valueToX", () => {
  it("maps 0 to the left edge (X_MIN)", () => {
    expect(valueToX(0)).toBe(X_MIN);
  });

  it("maps 1 to the right edge (X_MIN + X_RANGE)", () => {
    expect(valueToX(1)).toBe(X_MIN + X_RANGE);
  });

  it("maps 0.5 to the midpoint", () => {
    expect(valueToX(0.5)).toBe(X_MIN + X_RANGE / 2);
  });

  it("clamps negative values to X_MIN", () => {
    expect(valueToX(-0.5)).toBe(X_MIN);
  });

  it("clamps values above 1 to the right edge", () => {
    expect(valueToX(1.5)).toBe(X_MIN + X_RANGE);
  });
});

describe("mobileValueToX", () => {
  it("maps 0 to MOBILE_STRIP_PAD_X", () => {
    expect(mobileValueToX(0)).toBe(MOBILE_STRIP_PAD_X);
  });

  it("maps 1 to the right edge minus pad", () => {
    expect(mobileValueToX(1)).toBe(MOBILE_STRIP_VIEWBOX_W - MOBILE_STRIP_PAD_X);
  });

  it("clamps out-of-range values", () => {
    expect(mobileValueToX(-1)).toBe(MOBILE_STRIP_PAD_X);
    expect(mobileValueToX(2)).toBe(MOBILE_STRIP_VIEWBOX_W - MOBILE_STRIP_PAD_X);
  });
});

describe("deterministicJitter", () => {
  it("is deterministic — same input returns same output", () => {
    const a = deterministicJitter(3, 0.7);
    const b = deterministicJitter(3, 0.7);
    expect(a).toBe(b);
  });

  it("returns different values for different indices", () => {
    const a = deterministicJitter(1, 0.5);
    const b = deterministicJitter(2, 0.5);
    expect(a).not.toBe(b);
  });

  it("stays within [-range, range]", () => {
    for (let i = 0; i < 100; i++) {
      const v = deterministicJitter(i, i * 0.013, 10);
      expect(v).toBeGreaterThanOrEqual(-10);
      expect(v).toBeLessThanOrEqual(10);
    }
  });

  it("uses JITTER_RANGE as the default range", () => {
    for (let i = 0; i < 50; i++) {
      const v = deterministicJitter(i, i * 0.1);
      expect(Math.abs(v)).toBeLessThanOrEqual(JITTER_RANGE);
    }
  });

  it("is rounded to 3 decimal places", () => {
    const v = deterministicJitter(7, 0.3);
    const decimals = (v.toString().split(".")[1] ?? "").length;
    expect(decimals).toBeLessThanOrEqual(3);
  });
});

describe("formatRange", () => {
  it("renders a 0–1 range as percentages with an en dash", () => {
    expect(formatRange(0.15, 0.72)).toBe("15\u201372%");
  });

  it("rounds percentages to the nearest integer", () => {
    expect(formatRange(0.154, 0.726)).toBe("15\u201373%");
  });

  it("handles equal min/max (point estimate)", () => {
    expect(formatRange(0.5, 0.5)).toBe("50\u201350%");
  });
});
