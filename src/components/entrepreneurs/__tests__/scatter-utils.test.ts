import { describe, it, expect } from "vitest";
import { findNearestDot } from "../scatter-utils";

describe("findNearestDot", () => {
  it("returns null when no dots are within the threshold", () => {
    const dots = [
      { x: 100, y: 100 },
      { x: 200, y: 200 },
    ];
    expect(findNearestDot(0, 0, dots, 20)).toBeNull();
  });

  it("returns null for an empty dot list", () => {
    expect(findNearestDot(0, 0, [], 20)).toBeNull();
  });

  it("returns the index of the only dot inside the threshold", () => {
    const dots = [
      { x: 0, y: 0 },
      { x: 500, y: 500 },
    ];
    expect(findNearestDot(5, 5, dots, 20)).toBe(0);
  });

  it("returns the closer dot when two are within range", () => {
    const dots = [
      { x: 10, y: 0 },
      { x: 100, y: 0 },
      { x: 15, y: 0 },
    ];
    // Cursor at (12, 0): closest is index 2 (dist 3), then index 0 (dist 2), so index 0.
    expect(findNearestDot(12, 0, dots, 20)).toBe(0);
  });

  it("treats the threshold as inclusive (distance == threshold hits)", () => {
    const dots = [{ x: 10, y: 0 }];
    // distance from (0,0) to (10,0) is exactly 10
    expect(findNearestDot(0, 0, dots, 10)).toBe(0);
    expect(findNearestDot(0, 0, dots, 9.99)).toBeNull();
  });

  it("breaks ties by returning the first-listed dot", () => {
    const dots = [
      { x: 10, y: 0 },
      { x: -10, y: 0 },
    ];
    expect(findNearestDot(0, 0, dots, 20)).toBe(0);
  });

  it("uses Euclidean distance, not Manhattan", () => {
    const dots = [
      { x: 3, y: 4 }, // Euclidean 5, Manhattan 7
    ];
    expect(findNearestDot(0, 0, dots, 5)).toBe(0);
    expect(findNearestDot(0, 0, dots, 4.9)).toBeNull();
  });
});
