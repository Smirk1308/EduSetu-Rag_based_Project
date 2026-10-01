"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  ClipboardCheck,
  ExternalLink,
  Info,
} from "lucide-react";

const steps = [
  {
    id: "notice",
    title: "Read the current notification",
    detail: "Check the official admission authority for the course, eligibility, dates, and the active seat matrix.",
    link: "https://www.jkbopee.gov.in",
    label: "JKBOPEE official website",
  },
  {
    id: "documents",
    title: "Prepare your core documents",
    detail: "Keep identity, academic records, domicile, category or income documents, and photographs ready in the required format.",
  },
  {
    id: "exam",
    title: "Confirm the admission route",
    detail: "Your course may use JKCET, NEET, JEE Main, CUET, an institutional test, or merit-based counselling.",
  },
  {
    id: "choices",
    title: "Build realistic choices",
    detail: "Use the college explorer to compare courses, previous cut-off context, location, fees, and seat categories.",
  },
  {
    id: "submit",
    title: "Submit and retain proof",
    detail: "Review every field, submit before the official deadline, and save the acknowledgement and payment receipt.",
  },
  {
    id: "counselling",
    title: "Track counselling and reporting",
    detail: "Watch the official portal for merit lists, counselling schedules, document verification, and reporting instructions.",
  },
];

export function AdmissionChecklist() {
  const [complete, setComplete] = useState<string[]>([]);
  const progress = Math.round((complete.length / steps.length) * 100);

  const toggle = (id: string) =>
    setComplete((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
    );

  return (
    <div className="space-y-8">
      <section className="product-hero">
        <div>
          <p className="eyebrow">Admission planner</p>
          <h1 className="font-display mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
            A calmer way to prepare for admission.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--text-secondary)]">
            Use this checklist as a personal working plan. It stays in this browser session and does not submit an application for you.
          </p>
        </div>
        <ClipboardCheck aria-hidden="true" className="product-hero-icon" />
      </section>

      <section className="product-panel">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl font-semibold">Your progress</h2>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              {complete.length} of {steps.length} preparation steps completed.
            </p>
          </div>
          <span className="progress-value">{progress}%</span>
        </div>
        <div className="progress-track mt-5" aria-label={`${progress}% complete`}>
          <span style={{ width: `${progress}%` }} />
        </div>
      </section>

      <section className="space-y-3">
        {steps.map((step, index) => {
          const isComplete = complete.includes(step.id);
          return (
            <article
              key={step.id}
              className={`checklist-step ${isComplete ? "checklist-step-complete" : ""}`}
            >
              <button
                type="button"
                onClick={() => toggle(step.id)}
                className="check-button"
                aria-label={`${isComplete ? "Mark incomplete" : "Mark complete"}: ${step.title}`}
              >
                {isComplete && <Check aria-hidden="true" className="h-4 w-4" />}
              </button>
              <div className="min-w-0 flex-1">
                <p className="catalog-kicker">Step {index + 1}</p>
                <h2 className="font-display mt-1 text-xl font-semibold text-[var(--text-primary)]">
                  {step.title}
                </h2>
                <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
                  {step.detail}
                </p>
                {step.link && (
                  <a
                    className="text-link mt-3 inline-flex items-center gap-1.5"
                    href={step.link}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {step.label} <ExternalLink aria-hidden="true" className="h-3.5 w-3.5" />
                  </a>
                )}
              </div>
            </article>
          );
        })}
      </section>

      <aside className="product-tip">
        <Info aria-hidden="true" className="h-5 w-5 shrink-0" />
        <p>
          Dates, fees, cut-offs, eligibility and seat matrices can change. Treat this as preparation guidance and always use the current official notification as the final authority.
        </p>
      </aside>

      <div>
        <Link href="/colleges" className="button-primary inline-flex items-center gap-2">
          Explore colleges and courses <ArrowRight aria-hidden="true" className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
