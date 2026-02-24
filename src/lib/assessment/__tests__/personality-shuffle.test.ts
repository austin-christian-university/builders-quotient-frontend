import { describe, it, expect } from "vitest";
import {
  mulberry32,
  hashString,
  createMixedItemOrder,
  toPages,
} from "../personality-shuffle";
import {
  PERSONALITY_ITEMS,
  QUESTIONS_PER_PAGE,
} from "../personality-bank";

describe("mulberry32", () => {
  it("same seed produces same sequence", () => {
    const rng1 = mulberry32(42);
    const rng2 = mulberry32(42);

    const seq1 = Array.from({ length: 20 }, () => rng1());
    const seq2 = Array.from({ length: 20 }, () => rng2());

    expect(seq1).toEqual(seq2);
  });

  it("different seeds produce different sequences", () => {
    const rng1 = mulberry32(42);
    const rng2 = mulberry32(99);

    const seq1 = Array.from({ length: 10 }, () => rng1());
    const seq2 = Array.from({ length: 10 }, () => rng2());

    expect(seq1).not.toEqual(seq2);
  });

  it("produces values between 0 and 1", () => {
    const rng = mulberry32(12345);
    for (let i = 0; i < 100; i++) {
      const val = rng();
      expect(val).toBeGreaterThanOrEqual(0);
      expect(val).toBeLessThan(1);
    }
  });
});

describe("hashString", () => {
  it("same string produces same hash", () => {
    expect(hashString("test-session-id")).toBe(hashString("test-session-id"));
  });

  it("different strings produce different hashes", () => {
    expect(hashString("session-a")).not.toBe(hashString("session-b"));
  });
});

describe("createMixedItemOrder", () => {
  it("same seed produces same order", () => {
    const rng1 = mulberry32(hashString("test-session"));
    const rng2 = mulberry32(hashString("test-session"));

    const order1 = createMixedItemOrder(PERSONALITY_ITEMS, rng1);
    const order2 = createMixedItemOrder(PERSONALITY_ITEMS, rng2);

    const ids1 = order1.map((item) => item.id);
    const ids2 = order2.map((item) => item.id);

    expect(ids1).toEqual(ids2);
  });

  it("different seeds produce different orders", () => {
    const rng1 = mulberry32(hashString("session-alpha"));
    const rng2 = mulberry32(hashString("session-beta"));

    const order1 = createMixedItemOrder(PERSONALITY_ITEMS, rng1);
    const order2 = createMixedItemOrder(PERSONALITY_ITEMS, rng2);

    const ids1 = order1.map((item) => item.id);
    const ids2 = order2.map((item) => item.id);

    expect(ids1).not.toEqual(ids2);
  });

  it("preserves all 121 items", () => {
    const rng = mulberry32(42);
    const mixed = createMixedItemOrder(PERSONALITY_ITEMS, rng);

    expect(mixed).toHaveLength(PERSONALITY_ITEMS.length);

    const mixedIds = new Set(mixed.map((item) => item.id));
    const originalIds = new Set(PERSONALITY_ITEMS.map((item) => item.id));
    expect(mixedIds).toEqual(originalIds);
  });

  it("mixes facets: no more than 2 consecutive items from the same facet", () => {
    const rng = mulberry32(42);
    const mixed = createMixedItemOrder(PERSONALITY_ITEMS, rng);

    let maxConsecutive = 1;
    let currentRun = 1;

    for (let i = 1; i < mixed.length; i++) {
      if (mixed[i].facet === mixed[i - 1].facet) {
        currentRun++;
        maxConsecutive = Math.max(maxConsecutive, currentRun);
      } else {
        currentRun = 1;
      }
    }

    // The algorithm tries to avoid consecutive same-facet items,
    // but at the end when only one facet remains it may have 2+ in a row.
    // With 9 facets and max 12 items per facet, runs of 3+ should be rare.
    expect(maxConsecutive).toBeLessThanOrEqual(2);
  });

  it("does not modify the original items array", () => {
    const originalIds = PERSONALITY_ITEMS.map((item) => item.id);
    const rng = mulberry32(42);
    createMixedItemOrder(PERSONALITY_ITEMS, rng);
    const afterIds = PERSONALITY_ITEMS.map((item) => item.id);

    expect(afterIds).toEqual(originalIds);
  });
});

describe("toPages", () => {
  it("splits items into pages of QUESTIONS_PER_PAGE", () => {
    const rng = mulberry32(42);
    const mixed = createMixedItemOrder(PERSONALITY_ITEMS, rng);
    const pages = toPages(mixed);

    // 96 items / 6 per page = 16 pages
    expect(pages).toHaveLength(Math.ceil(PERSONALITY_ITEMS.length / QUESTIONS_PER_PAGE));

    // All pages except possibly the last have exactly QUESTIONS_PER_PAGE items
    for (let i = 0; i < pages.length - 1; i++) {
      expect(pages[i]).toHaveLength(QUESTIONS_PER_PAGE);
    }

    // Last page has the remainder (96 % 6 = 0, so all pages are full)
    const lastPage = pages[pages.length - 1];
    const remainder = PERSONALITY_ITEMS.length % QUESTIONS_PER_PAGE;
    expect(lastPage.length).toBe(remainder || QUESTIONS_PER_PAGE);
  });

  it("total items across all pages equals input length", () => {
    const rng = mulberry32(42);
    const mixed = createMixedItemOrder(PERSONALITY_ITEMS, rng);
    const pages = toPages(mixed);

    const totalItems = pages.reduce((sum, page) => sum + page.length, 0);
    expect(totalItems).toBe(PERSONALITY_ITEMS.length);
  });
});
