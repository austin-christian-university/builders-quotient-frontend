"use client";

import { useState, useMemo, useCallback, useId } from "react";
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

const fieldClass =
  "h-12 w-full rounded-none border border-ink bg-paper px-3 text-base text-ink placeholder:text-[#8c8a84] focus:outline-2 focus:outline-offset-2 focus:outline-ink";

export function DirectoryList({
  entrepreneurs,
}: DirectoryListProps) {
  const [search, setSearch] = useState("");
  const [archetypeFilter, setArchetypeFilter] = useState("");
  const searchId = useId();
  const filterId = useId();

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
      <div className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-[minmax(0,1fr)_16rem]">
        <div>
          <label htmlFor={searchId} className="mb-2 block text-sm text-[#8c8a84]">
            Search by name
          </label>
          <input
            id={searchId}
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            placeholder="Search by name..."
            className={fieldClass}
            autoComplete="off"
            spellCheck={false}
          />
        </div>

        <div>
          <label htmlFor={filterId} className="mb-2 block text-sm text-[#8c8a84]">
            Filter by archetype
          </label>
          <div className="relative">
            <select
              id={filterId}
              value={archetypeFilter}
              onChange={(e) => setArchetypeFilter(e.target.value)}
              className={`${fieldClass} cursor-pointer appearance-none pr-9`}
            >
              <option value="">All Archetypes</option>
              {sortedArchetypes.map((a) => (
                <option key={a.key} value={a.key}>
                  {a.name}
                </option>
              ))}
            </select>
            <span
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-ink"
              aria-hidden="true"
            >
              ↓
            </span>
          </div>
        </div>
      </div>

      {/* Result count */}
      <p
        className="mb-3 text-sm text-[#8c8a84] tabular-nums"
        aria-live="polite"
      >
        Showing <b className="font-semibold text-ink">{filtered.length}</b> of {entrepreneurs.length} entrepreneurs
      </p>

      {/* Results */}
      {filtered.length === 0 ? (
        <div className="border-t border-ink py-12">
          <p className="text-lg text-ink">No entrepreneurs match your search.</p>
          <button
            type="button"
            onClick={() => {
              setSearch("");
              setArchetypeFilter("");
            }}
            className="mt-4 text-sm font-semibold text-ink underline decoration-vermilion decoration-2 underline-offset-4 hover:text-vermilion focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-ink"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <ul className="border-t border-ink">
          {filtered.map((e) => (
            <li key={e.id}>
              <EntrepreneurListItem
                id={e.id}
                name={e.name}
                archetypeName={e.archetype_name}
                archetypeTagline={e.archetype_tagline}
                industries={e.industries}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
