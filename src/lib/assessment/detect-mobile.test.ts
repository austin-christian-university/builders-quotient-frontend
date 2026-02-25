// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { isMobileDevice } from "./detect-mobile";

/** Set up matchMedia to return controlled values per query. */
function mockMatchMedia(overrides: Record<string, boolean>) {
  window.matchMedia = vi.fn((query: string) =>
    ({ matches: overrides[query] ?? false }) as MediaQueryList
  );
}

describe("isMobileDevice", () => {
  it("returns true for phone (coarse pointer + narrow viewport)", () => {
    mockMatchMedia({
      "(pointer: coarse)": true,
      "(max-width: 768px)": true,
      "(any-pointer: fine)": false,
    });
    expect(isMobileDevice()).toBe(true);
  });

  it("returns true for tablet without keyboard (coarse + no fine pointer)", () => {
    mockMatchMedia({
      "(pointer: coarse)": true,
      "(max-width: 768px)": false, // tablet has wide viewport
      "(any-pointer: fine)": false,
    });
    expect(isMobileDevice()).toBe(true);
  });

  it("returns false for iPad with Magic Keyboard (has fine pointer)", () => {
    mockMatchMedia({
      "(pointer: coarse)": true,
      "(max-width: 768px)": false,
      "(any-pointer: fine)": true,
    });
    expect(isMobileDevice()).toBe(false);
  });

  it("returns false for narrow desktop window (fine pointer)", () => {
    mockMatchMedia({
      "(pointer: coarse)": false,
      "(max-width: 768px)": true,
      "(any-pointer: fine)": true,
    });
    expect(isMobileDevice()).toBe(false);
  });

  it("returns false for normal desktop (fine pointer + wide viewport)", () => {
    mockMatchMedia({
      "(pointer: coarse)": false,
      "(max-width: 768px)": false,
      "(any-pointer: fine)": true,
    });
    expect(isMobileDevice()).toBe(false);
  });

  it("returns false when pointer is fine even if no fine in any-pointer", () => {
    // Edge case: fine primary, no additional fine pointer
    mockMatchMedia({
      "(pointer: coarse)": false,
      "(max-width: 768px)": true,
      "(any-pointer: fine)": false,
    });
    expect(isMobileDevice()).toBe(false);
  });
});
