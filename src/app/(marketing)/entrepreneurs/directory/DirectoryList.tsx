"use client";

import { useState, useMemo, useCallback } from "react";
import { ARCHETYPES } from "@/lib/schemas/entrepreneurs";
import { EntrepreneurListItem } from "./EntrepreneurListItem";

interface EntrepreneurEntry {
  id: string;
  name: string;
  archetype_key: string;
  archetype_name: string;
  archetype_tagline: string;
  industries: string[] | null;
}

interface DirectoryListProps {
  entrepreneurs: EntrepreneurEntry[];
}

const sortedArchetypes = [...ARCHETYPES].sort((a, b) =>
  a.name.localeCompare(b.name)
);

export function DirectoryList({
  entrepreneurs,
}: DirectoryListProps) {
  const [search, setSearch] = useState("");
  const [archetypeFilter, setArchetypeFilter] = useState("");

  const handleSearchKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Escape") {
        setSearch("");
        (e.target as HTMLInputElement).blur();
      }
    },
    []
  );

  const filtered = useMemo(() => {
    const searchLower = search.toLowerCase().trim();
    return entrepreneurs.filter((e) => {
      if (searchLower && !e.name.toLowerCase().includes(searchLower)) return false;
      if (archetypeFilter && e.archetype_key !== archetypeFilter) return false;
      return true;
    });
  }, [entrepreneurs, search, archetypeFilter]);

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-8">
        <div className="relative flex-1">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary/40 pointer-events-none"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            placeholder="Search by name..."
            className="w-full rounded-lg border border-border-glass bg-bg-elevated px-4 py-2.5 pl-10 text-sm text-text-primary placeholder:text-text-secondary/40 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary/50 transition-colors"
            autoComplete="off"
            spellCheck={false}
          />
        </div>

        <select
          value={archetypeFilter}
          onChange={(e) => setArchetypeFilter(e.target.value)}
          className="rounded-lg border border-border-glass bg-bg-elevated px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary/50 transition-colors sm:w-56 appearance-none cursor-pointer"
          aria-label="Filter by archetype"
        >
          <option value="">All Archetypes</option>
          {sortedArchetypes.map((a) => (
            <option key={a.key} value={a.key}>
              {a.name}
            </option>
          ))}
        </select>
      </div>

      {/* Result count */}
      <p
        className="text-xs text-text-secondary/50 mb-4"
        style={{ fontVariantNumeric: "tabular-nums" }}
        aria-live="polite"
      >
        Showing {filtered.length} of {entrepreneurs.length} entrepreneurs
      </p>

      {/* Results */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-border-glass bg-bg-elevated px-6 py-16 text-center">
          <p className="text-text-secondary/70 text-sm">
            No entrepreneurs match your search.
          </p>
          <button
            onClick={() => {
              setSearch("");
              setArchetypeFilter("");
            }}
            className="mt-3 text-xs text-primary hover:text-primary/80 transition-colors"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((e) => (
            <EntrepreneurListItem
              key={e.id}
              id={e.id}
              name={e.name}
              archetypeName={e.archetype_name}
              archetypeTagline={e.archetype_tagline}
              industries={e.industries}
            />
          ))}
        </div>
      )}
    </div>
  );
}
