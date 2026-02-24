import {
  QUESTIONS_PER_PAGE,
  type PersonalityFacet,
  type PersonalityItem,
} from "./personality-bank";

/** Mulberry32 seeded PRNG — deterministic random from integer seed. */
export function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Simple string hash to integer (Java-style hashCode). */
export function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return hash;
}

function shuffleInPlace<T>(array: T[], random: () => number) {
  for (let i = array.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

/**
 * Produces a mixed item order where consecutive items are from different facets.
 * Shuffles within each facet first, then interleaves.
 */
export function createMixedItemOrder(
  items: PersonalityItem[],
  random: () => number
): PersonalityItem[] {
  const itemsByFacet = new Map<PersonalityFacet, PersonalityItem[]>();

  for (const item of items) {
    if (!itemsByFacet.has(item.facet)) {
      itemsByFacet.set(item.facet, []);
    }
    itemsByFacet.get(item.facet)!.push({ ...item });
  }

  for (const list of itemsByFacet.values()) {
    shuffleInPlace(list, random);
  }

  const facets = Array.from(itemsByFacet.keys());
  const totalItems = items.length;
  const mixedItems: PersonalityItem[] = [];
  let lastFacet: PersonalityFacet | null = null;

  while (mixedItems.length < totalItems) {
    const availableFacets = facets.filter(
      (facet) => (itemsByFacet.get(facet)?.length ?? 0) > 0
    );
    if (availableFacets.length === 0) break;

    const candidateFacets = availableFacets.filter(
      (facet) => facet !== lastFacet
    );
    const selectionPool =
      candidateFacets.length > 0 ? candidateFacets : availableFacets;
    const selectedFacet =
      selectionPool[Math.floor(random() * selectionPool.length)];

    const pool = itemsByFacet.get(selectedFacet);
    if (!pool || pool.length === 0) continue;

    const nextItem = pool.shift();
    if (nextItem) {
      mixedItems.push(nextItem);
      lastFacet = selectedFacet;
    }
  }

  return mixedItems;
}

/** Splits a flat item list into pages of QUESTIONS_PER_PAGE items. */
export function toPages(items: PersonalityItem[]): PersonalityItem[][] {
  const pages: PersonalityItem[][] = [];
  for (let i = 0; i < items.length; i += QUESTIONS_PER_PAGE) {
    pages.push(items.slice(i, i + QUESTIONS_PER_PAGE));
  }
  return pages;
}
