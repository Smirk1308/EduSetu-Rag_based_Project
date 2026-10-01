"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ArrowUpRight,
  Building2,
  ChevronDown,
  ChevronUp,
  Filter,
  GraduationCap,
  MapPin,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import type { College } from "@/data/colleges";
import { FALLBACK_COLLEGES, FALLBACK_DISTRICTS, FALLBACK_TYPES } from "@/data/colleges";

export function CollegeExplorer() {
  const [items, setItems] = useState<College[]>(FALLBACK_COLLEGES);
  const [districts, setDistricts] = useState<string[]>(FALLBACK_DISTRICTS);
  const [types, setTypes] = useState<string[]>(FALLBACK_TYPES);
  const [query, setQuery] = useState("");
  const [district, setDistrict] = useState("");
  const [collegeType, setCollegeType] = useState("");
  const [category, setCategory] = useState("");
  const [total, setTotal] = useState(FALLBACK_COLLEGES.length);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const search = useCallback(async (signal?: AbortSignal) => {
    setIsLoading(true);
    setError("");
    const params = new URLSearchParams();
    if (query.trim()) params.set("query", query.trim());
    if (district) params.set("district", district);
    if (collegeType) params.set("college_type", collegeType);
    if (category) params.set("category", category);

    try {
      const response = await fetch(`/api/catalog/colleges?${params.toString()}`, {
        cache: "no-store",
        signal,
      });
      if (!response.ok) throw new Error();
      const data = await response.json();
      setItems(data.items ?? []);
      setTotal(data.total ?? 0);
    } catch (requestError) {
      if (requestError instanceof DOMException && requestError.name === "AbortError") return;
      // Filter locally from fallback if network or server proxy fails
      let filtered = FALLBACK_COLLEGES;
      const q = query.toLowerCase().trim();
      const d = district.toLowerCase().trim();
      const t = collegeType.toLowerCase().trim();
      const cat = category.toLowerCase().trim();

      if (d) filtered = filtered.filter((c) => c.district.toLowerCase() === d);
      if (t) filtered = filtered.filter((c) => c.type.toLowerCase() === t);
      if (q) {
        filtered = filtered.filter(
          (c) =>
            c.name.toLowerCase().includes(q) ||
            c.district.toLowerCase().includes(q) ||
            c.type.toLowerCase().includes(q) ||
            (c.branches ?? []).some(
              (b) =>
                b.name.toLowerCase().includes(q) ||
                (b.cutoff_info && b.cutoff_info.toLowerCase().includes(q))
            )
        );
      }
      if (cat) {
        filtered = filtered.filter((c) =>
          (c.branches ?? []).some((b) => {
            if (cat === "om") return (b.seats_om ?? 0) > 0;
            if (cat === "sc") return (b.seats_sc ?? 0) > 0;
            if (cat === "st") return (b.seats_st ?? 0) > 0;
            if (cat === "rba") return (b.seats_rba ?? 0) > 0;
            return true;
          })
        );
      }
      setItems(filtered.slice(0, 30));
      setTotal(filtered.length);
    } finally {
      setIsLoading(false);
    }
  }, [category, collegeType, district, query]);

  useEffect(() => {
    let ignore = false;
    async function fetchOptions() {
      try {
        const response = await fetch("/api/catalog/colleges/options", { cache: "no-store" });
        if (!response.ok) return;
        const data = await response.json();
        if (!ignore) {
          if (Array.isArray(data.districts) && data.districts.length > 0) {
            setDistricts(data.districts);
          }
          if (Array.isArray(data.types) && data.types.length > 0) {
            setTypes(data.types);
          }
        }
      } catch {
        // Fallback already pre-loaded into state
      }
    }
    void fetchOptions();
    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      void search(controller.signal);
    }, 180);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [search]);

  return (
    <div className="space-y-8">
      <section className="product-hero">
        <div>
          <p className="eyebrow">College & course explorer</p>
          <h1 className="font-display mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
            Compare options before you commit.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--text-secondary)]">
            Search the verified J&amp;K catalogue by course, college, district, type, and reservation category.
            Confirm fees, seats, and cut-offs in the latest official notice.
          </p>
        </div>
        <Building2 aria-hidden="true" className="product-hero-icon" />
      </section>

      <section className="product-panel">
        <div className="mb-5 flex items-center gap-3">
          <SlidersHorizontal aria-hidden="true" className="h-5 w-5 text-[var(--brand)]" />
          <div>
            <h2 className="font-display text-2xl font-semibold">Refine your search</h2>
            <p className="text-sm text-[var(--text-secondary)]">
              Filters update the catalogue as you change them.
            </p>
          </div>
        </div>
        <div className="explorer-controls">
          <label className="search-field">
            <Search aria-hidden="true" className="h-5 w-5" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="College, course, exam, or district"
              aria-label="Search colleges"
            />
          </label>
          <label>
            District
            <select value={district} onChange={(event) => setDistrict(event.target.value)}>
              <option value="">All districts</option>
              {districts.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <label>
            Institution type
            <select value={collegeType} onChange={(event) => setCollegeType(event.target.value)}>
              <option value="">All types</option>
              {types.map((option) => (
                <option key={option} value={option}>
                  {option.charAt(0).toUpperCase() + option.slice(1)}
                </option>
              ))}
            </select>
          </label>
          <label>
            Seat category
            <select value={category} onChange={(event) => setCategory(event.target.value)}>
              <option value="">Any category</option>
              {["OM", "SC", "ST", "RBA", "EWS", "OBC"].map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      {error && (
        <p role="alert" className="product-error">
          {error}
        </p>
      )}

      <section aria-live="polite">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <p className="eyebrow">Results</p>
            <h2 className="font-display mt-1 text-3xl font-semibold">
              {isLoading ? "Updating catalogue…" : `${total} matching colleges`}
            </h2>
          </div>
          <Filter aria-hidden="true" className="h-5 w-5 text-[var(--text-muted)]" />
        </div>

        <div className="catalog-grid">
          {items.map((item) => (
            <CollegeCard key={item.id} item={item} />
          ))}
        </div>

        {!isLoading && items.length === 0 && (
          <div className="product-empty">
            No colleges match those filters. Try removing a filter or searching by a broader course name.
          </div>
        )}
      </section>
    </div>
  );
}

function CollegeCard({ item }: { item: College }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const branches = item.branches ?? [];
  const hasMore = branches.length > 3;
  const displayedBranches = isExpanded ? branches : branches.slice(0, 3);

  const websiteHref = item.website
    ? item.website.startsWith("http")
      ? item.website
      : `https://${item.website}`
    : "";

  return (
    <article className="catalog-card">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="catalog-kicker inline-flex items-center gap-1.5">
          <MapPin aria-hidden="true" className="h-3 w-3" />
          {item.district} · {item.type}
        </p>
        <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
          {item.naac_grade && (
            <span className="rounded bg-[var(--bg-soft)] px-1.5 py-0.5 font-semibold text-[var(--brand)]">
              NAAC {item.naac_grade}
            </span>
          )}
          {item.established && <span>Estd. {item.established}</span>}
        </div>
      </div>

      <h3 className="font-display mt-2 text-xl font-semibold leading-tight text-[var(--text-primary)]">
        {item.name}
      </h3>

      {item.affiliation && (
        <p className="mt-1 text-xs text-[var(--text-muted)]">
          Affiliated to {item.affiliation}
        </p>
      )}

      <dl className="college-facts">
        <div>
          <dt>Admission</dt>
          <dd>{item.admission_through || "Merit / BOPEE"}</dd>
        </div>
        <div>
          <dt>Fees / Sem</dt>
          <dd>{item.fees_per_sem || "Check notice"}</dd>
        </div>
        <div>
          <dt>Hostel</dt>
          <dd>{item.hostel ? "Available" : "Check with campus"}</dd>
        </div>
      </dl>

      <div className="mt-4 border-t border-[var(--line)] pt-4">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]">
            Courses & seats ({branches.length})
          </p>
          {hasMore && (
            <button
              type="button"
              onClick={() => setIsExpanded((prev) => !prev)}
              className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--brand)] hover:underline"
            >
              {isExpanded ? (
                <>
                  Show fewer <ChevronUp aria-hidden="true" className="h-3.5 w-3.5" />
                </>
              ) : (
                <>
                  +{branches.length - 3} more <ChevronDown aria-hidden="true" className="h-3.5 w-3.5" />
                </>
              )}
            </button>
          )}
        </div>

        <ul className="mt-2.5 space-y-2.5 text-sm text-[var(--text-secondary)]">
          {displayedBranches.map((branch) => (
            <li
              key={branch.name}
              className="rounded-lg border border-[var(--line)] bg-[var(--bg-body)] p-2.5"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="font-medium text-[var(--text-primary)] leading-snug">
                  {branch.name}
                </span>
                <span className="shrink-0 rounded bg-[var(--bg-soft)] px-2 py-0.5 text-xs font-bold text-[var(--brand)]">
                  {branch.total_seats} seats
                </span>
              </div>
              {branch.cutoff_info && (
                <p className="mt-1.5 flex items-center gap-1 text-xs text-[var(--text-muted)]">
                  <GraduationCap aria-hidden="true" className="h-3 w-3 shrink-0 text-[var(--accent)]" />
                  <span>Cut-off: {branch.cutoff_info}</span>
                </p>
              )}
            </li>
          ))}
        </ul>
      </div>

      {websiteHref && (
        <a
          href={websiteHref}
          target="_blank"
          rel="noopener noreferrer"
          className="text-link mt-5 self-start"
        >
          Visit institution website <ArrowUpRight aria-hidden="true" className="h-4 w-4" />
        </a>
      )}
    </article>
  );
}
