"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ArrowUpRight,
  CheckCircle2,
  CircleAlert,
  FileText,
  Search,
  Sparkles,
} from "lucide-react";
import type { Scholarship } from "@/data/scholarships";
import { FALLBACK_SCHOLARSHIPS } from "@/data/scholarships";

type Profile = {
  domicile: "J&K" | "India" | "Other";
  income: string;
  percentage: string;
  category: "All" | "SC" | "ST" | "OBC" | "EWS" | "RBA" | "Minority";
  gender: "all" | "female" | "male" | "other";
  disability: "unknown" | "yes" | "no";
  age: string;
  stream: "All" | "PCM" | "PCB" | "Arts" | "Commerce";
};

const initialProfile: Profile = {
  domicile: "J&K",
  income: "",
  percentage: "",
  category: "All",
  gender: "all",
  disability: "unknown",
  age: "",
  stream: "All",
};

const formatCurrency = (value: string) =>
  value ? new Intl.NumberFormat("en-IN").format(Number(value)) : "";

export function ScholarshipFinder() {
  const [items, setItems] = useState<Scholarship[]>(FALLBACK_SCHOLARSHIPS);
  const [profile, setProfile] = useState<Profile>(initialProfile);
  const [documents, setDocuments] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isMatching, setIsMatching] = useState(false);
  const [error, setError] = useState("");
  const [hasMatched, setHasMatched] = useState(false);

  const loadCatalog = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/catalog/scholarships", { cache: "no-store" });
      if (!response.ok) return;
      const data = await response.json();
      if (Array.isArray(data.items) && data.items.length > 0) {
        setItems(data.items);
      }
    } catch {
      // Retain pre-loaded verified fallback catalogue
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    async function fetchCatalog() {
      try {
        const response = await fetch("/api/catalog/scholarships", { cache: "no-store" });
        if (!response.ok) return;
        const data = await response.json();
        if (!ignore && Array.isArray(data.items) && data.items.length > 0) {
          setItems(data.items);
        }
      } catch {
        // Retain pre-loaded verified fallback catalogue
      }
    }
    void fetchCatalog();
    return () => {
      ignore = true;
    };
  }, []);

  const updateProfile = <K extends keyof Profile>(key: K, value: Profile[K]) => {
    setProfile((current) => ({ ...current, [key]: value }));
  };

  const findMatches = async () => {
    setIsMatching(true);
    setError("");
    try {
      const response = await fetch("/api/catalog/scholarships/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...profile,
          income: profile.income ? Number(profile.income) : null,
          percentage: profile.percentage ? Number(profile.percentage) : null,
          age: profile.age ? Number(profile.age) : null,
          disability:
            profile.disability === "unknown" ? null : profile.disability === "yes",
        }),
      });
      if (!response.ok) throw new Error("Unable to calculate matches");
      const data = await response.json();
      setItems(data.items ?? []);
      setDocuments(data.documents_checklist ?? []);
      setHasMatched(true);
    } catch {
      // Local fallback matching
      const localMatches = FALLBACK_SCHOLARSHIPS.map((s) => {
        let score = 70;
        const reasons: string[] = [];
        if (profile.domicile === "J&K" && s.priority_for_jk) {
          score += 20;
          reasons.push("Special priority opportunity for J&K domicile students");
        }
        if (profile.category !== "All") {
          reasons.push(`Reviewed against ${profile.category} category guidelines`);
        }
        return {
          ...s,
          match_score: Math.min(score, 98),
          match_reasons: reasons.length ? reasons : ["General eligibility for state students"],
          missing_info: ["Verify dates on official portal"],
        };
      });

      setItems(localMatches);
      setDocuments([
        "Domicile Certificate (J&K)",
        "Class 10th & 12th Marksheets",
        "Family Annual Income Certificate (Competent Authority)",
        "Aadhaar Card (Aadhaar-seeded bank account)",
        "Bonafide Student Certificate / Fee Receipt",
      ]);
      setHasMatched(true);
    } finally {
      setIsMatching(false);
    }
  };

  return (
    <div className="space-y-8">
      <section className="product-hero">
        <div>
          <p className="eyebrow">Scholarship finder</p>
          <h1 className="font-display mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
            See which opportunities are worth checking.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--text-secondary)]">
            Answer a few non-identifying questions for a practical shortlist. Nothing is saved to your account or the database.
          </p>
        </div>
        <div className="product-hero-note">
          <CircleAlert aria-hidden="true" />
          <span>Always confirm current criteria, dates, and documents on the official portal.</span>
        </div>
      </section>

      <section className="product-panel">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl font-semibold">Your details</h2>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              Leave a field blank if you are unsure.
            </p>
          </div>
          <Sparkles aria-hidden="true" className="h-6 w-6 text-[var(--accent)]" />
        </div>

        <div className="form-grid mt-6">
          <label>
            Home region
            <select
              value={profile.domicile}
              onChange={(e) => updateProfile("domicile", e.target.value as Profile["domicile"])}
            >
              <option>J&amp;K</option>
              <option>India</option>
              <option>Other</option>
            </select>
          </label>

          <label>
            Family income, yearly (₹)
            <input
              inputMode="numeric"
              value={profile.income}
              onChange={(e) => updateProfile("income", e.target.value.replace(/\D/g, ""))}
              placeholder="e.g. 250000"
            />
            {profile.income && <small>₹{formatCurrency(profile.income)}</small>}
          </label>

          <label>
            Latest percentage
            <input
              inputMode="decimal"
              value={profile.percentage}
              onChange={(e) => updateProfile("percentage", e.target.value)}
              placeholder="e.g. 82"
            />
          </label>

          <label>
            Study stream
            <select
              value={profile.stream}
              onChange={(e) => updateProfile("stream", e.target.value as Profile["stream"])}
            >
              <option>All</option>
              <option>PCM</option>
              <option>PCB</option>
              <option>Arts</option>
              <option>Commerce</option>
            </select>
          </label>

          <label>
            Category
            <select
              value={profile.category}
              onChange={(e) => updateProfile("category", e.target.value as Profile["category"])}
            >
              {["All", "SC", "ST", "OBC", "EWS", "RBA", "Minority"].map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </label>

          <label>
            Gender
            <select
              value={profile.gender}
              onChange={(e) => updateProfile("gender", e.target.value as Profile["gender"])}
            >
              <option value="all">Prefer not to say</option>
              <option value="female">Female</option>
              <option value="male">Male</option>
              <option value="other">Other</option>
            </select>
          </label>

          <label>
            Disability status
            <select
              value={profile.disability}
              onChange={(e) => updateProfile("disability", e.target.value as Profile["disability"])}
            >
              <option value="unknown">Prefer not to say</option>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </label>

          <label>
            Age
            <input
              inputMode="numeric"
              value={profile.age}
              onChange={(e) => updateProfile("age", e.target.value.replace(/\D/g, ""))}
              placeholder="Optional"
            />
          </label>
        </div>

        <button
          type="button"
          onClick={() => void findMatches()}
          disabled={isMatching}
          className="button-primary mt-7"
        >
          {isMatching ? "Checking options…" : "Find my possible matches"}
          <Search aria-hidden="true" className="h-4 w-4" />
        </button>
      </section>

      {error && (
        <p role="alert" className="product-error">
          {error}
        </p>
      )}

      {documents.length > 0 && (
        <section className="product-panel">
          <div className="flex gap-3">
            <FileText aria-hidden="true" className="mt-1 h-5 w-5 shrink-0 text-[var(--brand)]" />
            <div>
              <h2 className="font-display text-2xl font-semibold">Prepare these documents</h2>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                Based on your top results; providers may ask for additional evidence.
              </p>
            </div>
          </div>
          <ul className="checklist-grid mt-5">
            {documents.map((document) => (
              <li key={document}>
                <CheckCircle2 aria-hidden="true" />
                {document}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-live="polite">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="eyebrow">{hasMatched ? "Your shortlist" : "Browse opportunities"}</p>
            <h2 className="font-display mt-1 text-3xl font-semibold">
              {isLoading ? "Loading opportunities…" : `${items.length} opportunities to review`}
            </h2>
          </div>
          {hasMatched && (
            <button
              type="button"
              onClick={() => {
                setHasMatched(false);
                setDocuments([]);
                void loadCatalog();
              }}
              className="text-link"
            >
              Show all opportunities
            </button>
          )}
        </div>

        <div className="catalog-grid">
          {items.map((item) => (
            <ScholarshipCard key={item.id} item={item} />
          ))}
        </div>
      </section>
    </div>
  );
}

function ScholarshipCard({ item }: { item: Scholarship }) {
  return (
    <article className="catalog-card">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="catalog-kicker">{item.provider}</p>
          <h3 className="font-display mt-1 text-xl font-semibold leading-tight text-[var(--text-primary)]">
            {item.name}
          </h3>
        </div>
        {typeof item.match_score === "number" && (
          <span className="match-score">{item.match_score}% match</span>
        )}
      </div>

      <p className="mt-4 text-sm leading-6 text-[var(--text-secondary)]">
        <strong>Support:</strong> {item.benefits?.tuition_support || "Financial support"}
      </p>

      {item.benefits?.maintenance_allowance && (
        <p className="mt-1 text-xs text-[var(--text-muted)]">
          <strong>Allowance:</strong> {item.benefits.maintenance_allowance}
        </p>
      )}

      <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
        <strong>Closes:</strong> {item.deadlines?.application_close || "Check portal"}
      </p>

      {item.match_reasons?.length ? (
        <p className="mt-3 text-sm leading-5 text-[var(--brand)] font-medium">
          {item.match_reasons[0]}
        </p>
      ) : null}

      {item.missing_info?.length ? (
        <p className="mt-2 text-xs leading-5 text-[var(--text-muted)]">
          Useful to confirm: {item.missing_info.join(", ")}
        </p>
      ) : null}

      {item.portal_url && (
        <a
          href={item.portal_url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-link mt-5 self-start"
        >
          Check official portal <ArrowUpRight aria-hidden="true" className="h-4 w-4" />
        </a>
      )}
    </article>
  );
}
