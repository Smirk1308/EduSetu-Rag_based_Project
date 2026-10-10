"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Building2,
  CheckCircle2,
  Compass,
  ExternalLink,
  FileText,
  GraduationCap,
  Landmark,
  Scale,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useState } from "react";
import { ChatInterface } from "@/components/chat/chat-interface";
import { FloatingNavbar } from "@/components/ui/floating-navbar";
import { Reveal } from "@/components/ui/reveal";

const pathways = [
  {
    id: "scholarships",
    title: "Scholarship guidance",
    description: "Understand eligibility, AICTE PMSSS benefits, and how to apply.",
    badge: "15+ curated schemes",
    href: "/scholarships",
    icon: GraduationCap,
    tone: "gold",
  },
  {
    id: "admissions",
    title: "Admission information",
    description: "Clear step-by-step guidance on JKBOPEE, CUET, and JEE routes.",
    badge: "Step-by-step roadmaps",
    href: "/admissions",
    icon: FileText,
    tone: "blue",
  },
  {
    id: "colleges",
    title: "College & seat guidance",
    description: "Explore 26 profiled institutions, indicative opening ranks, and courses.",
    badge: "26 institutions profiled",
    href: "/colleges",
    icon: Landmark,
    tone: "slate",
  },
];

const studentStages = [
  {
    stage: "Classes 10 & 12",
    title: "School students",
    description: "Explore future streams, board milestones, and discover central & state scholarships early.",
    icon: BookOpen,
    badge: "Foundations & Streams",
    highlights: [
      "Stream selection (PCM / PCB / Arts / Commerce)",
      "Pre-Matric & Post-Matric UT scholarships",
      "Early AICTE PMSSS eligibility evaluation",
    ],
    actionHref: "/scholarships",
    actionLabel: "Find school scholarships",
  },
  {
    stage: "UG & Professional",
    title: "Entrance aspirants",
    description: "Get indicative guidance on JEE Main, NEET UG, JKCET, CUET, and category quotas.",
    icon: Compass,
    badge: "Competitive Exams",
    highlights: [
      "NIT Srinagar home-state opening & closing ranks",
      "JKBOPEE centralized counselling procedures",
      "Category certificate & document checklists",
    ],
    actionHref: "/admissions",
    actionLabel: "Plan admission steps",
  },
  {
    stage: "Degree & Research",
    title: "Higher education seekers",
    description: "Compare universities, government degree colleges, fee structures, and campus facilities across J&K.",
    icon: GraduationCap,
    badge: "Colleges & Degrees",
    highlights: [
      "26 profiled UT engineering, medical & degree colleges",
      "Indicative S.O. 176 (2024) reservation distribution",
      "Hostel availability, fees & NAAC accreditation",
    ],
    actionHref: "/colleges",
    actionLabel: "Explore colleges & seats",
  },
];

const reservationCategories = [
  {
    label: "Open Merit (OM)",
    percentage: "Indicative ~40%–50%",
    desc: "Unreserved merit pool. Note: Effective percentage varies between central vs. UT institutions and remains subject to ongoing administrative and legal review.",
    gazetteRef: "JKBOPEE Seat Matrix",
    sourceUrl: "https://www.jkbopee.gov.in",
  },
  {
    label: "Scheduled Tribe (ST-1)",
    percentage: "10%",
    desc: "Gujjars, Bakarwals, Baltis, Gaddis & historically notified tribes.",
    gazetteRef: "S.O. 176 (2024)",
    sourceUrl: "https://jksocialwelfare.nic.in",
  },
  {
    label: "Scheduled Tribe (ST-2)",
    percentage: "10%",
    desc: "Pahari Ethnic Group, Paddari Tribe, Koli, Gadda Brahmin (Total ST: 20%).",
    gazetteRef: "Constitution (J&K) ST Act 2024",
    sourceUrl: "https://tribal.nic.in",
  },
  {
    label: "Resident of Backward Area (RBA)",
    percentage: "10%",
    desc: "Certified residents of notified rural areas (rationalized from former 20%/12%).",
    gazetteRef: "S.O. 176 (2024)",
    sourceUrl: "https://jksocialwelfare.nic.in",
  },
  {
    label: "Other Backward Classes (OBC)",
    percentage: "8%",
    desc: "Socially and educationally backward classes (enhanced from former 4% OSC).",
    gazetteRef: "S.O. 176 (2024)",
    sourceUrl: "https://jksocialwelfare.nic.in",
  },
  {
    label: "Scheduled Caste (SC)",
    percentage: "8%",
    desc: "Notified Scheduled Caste communities of Jammu & Kashmir.",
    gazetteRef: "J&K Reservation Act",
    sourceUrl: "https://jksocialwelfare.nic.in",
  },
  {
    label: "Economically Weaker Section (EWS)",
    percentage: "10%",
    desc: "Gross annual family income below ₹8 Lakhs (applicable to unreserved categories).",
    gazetteRef: "S.O. 127 / S.O. 176",
    sourceUrl: "https://jksocialwelfare.nic.in",
  },
  {
    label: "ALC / International Border (IB)",
    percentage: "4%",
    desc: "Residents living along the Line of Actual Control & International Border.",
    gazetteRef: "S.O. 176 (2024)",
    sourceUrl: "https://jksocialwelfare.nic.in",
  },
  {
    label: "Children of Defence / Sports",
    percentage: "3% CDP + 2% Sports",
    desc: "Children of Defence Personnel (3%) and Sports quota (2%) applied horizontally.",
    gazetteRef: "JKBOPEE Rules",
    sourceUrl: "https://www.jkbopee.gov.in",
  },
];

export default function Home() {
  const [isOffline, setIsOffline] = useState(false);

  return (
    <div id="top" className="min-h-screen bg-[var(--bg-body)] text-[var(--text-primary)]">
      <FloatingNavbar />

      <main>
        {/* Full-length immersive hero section with real Kashmir photography */}
        <section className="relative overflow-hidden w-full border-b border-[var(--line)]">
          {/* Background real photograph with high-craft gradient scrim */}
          <div className="absolute inset-0 z-0">
            <Image
              src="/hero-jk-real.jpg"
              alt="Panoramic real photograph of Srinagar, Dal Lake, and the Himalayan mountains in Jammu & Kashmir"
              fill
              priority
              sizes="100vw"
              className="object-cover object-[center_35%]"
            />
            {/* Scrims driven purely by CSS variables - completely seamless in Day and Night */}
            <div className="hero-scrim-x absolute inset-0 pointer-events-none" />
            <div className="hero-scrim-y absolute inset-0 pointer-events-none" />
          </div>

          <div className="relative z-10 mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-28 lg:py-36">
            <Reveal className="max-w-3xl">
              {/* Main Headline */}
              <h1 className="font-display text-4xl font-bold leading-[1.08] tracking-[-0.035em] sm:text-5xl lg:text-[3.9rem]">
                Your education journey in J&amp;K, made{" "}
                <span className="text-[var(--accent)] underline decoration-[var(--accent)]/30 underline-offset-8">
                  simpler.
                </span>
              </h1>

              {/* Subtitle */}
              <p className="mt-6 max-w-2xl text-base leading-7 text-[var(--text-secondary)] sm:text-lg">
                J&amp;K EduSetu is an independent student guidance initiative for Jammu, Kashmir &amp; Ladakh.
                Explore indicative scholarship schemes, transparent admission roadmaps, and seat
                reservation frameworks—designed with low-bandwidth 2G resilience to keep opportunities accessible.
              </p>

              {/* Primary Action Buttons: Exactly one primary and one secondary */}
              <div className="mt-10 flex flex-wrap items-center gap-4">
                <Link href="/scholarships" className="button-primary">
                  Explore scholarships <ArrowRight aria-hidden="true" className="h-4 w-4" />
                </Link>
                <a href="#advisor" className="button-secondary">
                  Ask EduSetu advisor
                </a>
              </div>

              {/* Instant Prompt Chips */}
              <div className="mt-8 border-t border-[var(--line)]/70 pt-6">
                <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                  Instant guidance:
                </p>
                <div className="mt-2.5 flex flex-wrap gap-2">
                  <a
                    href="#advisor"
                    className="inline-flex items-center gap-1.5 rounded-full border border-[var(--line)] bg-[var(--bg-surface)]/80 px-3 py-1.5 text-xs text-[var(--text-secondary)] transition-all hover:border-[var(--brand)] hover:text-[var(--brand)] hover:shadow-sm"
                  >
                    <span>AICTE PMSSS 2025-26 Registration</span>
                    <ArrowRight className="h-3 w-3" />
                  </a>
                  <a
                    href="#advisor"
                    className="inline-flex items-center gap-1.5 rounded-full border border-[var(--line)] bg-[var(--bg-surface)]/80 px-3 py-1.5 text-xs text-[var(--text-secondary)] transition-all hover:border-[var(--brand)] hover:text-[var(--brand)] hover:shadow-sm"
                  >
                    <span>NIT Srinagar Cutoffs (Home State)</span>
                    <ArrowRight className="h-3 w-3" />
                  </a>
                  <a
                    href="#advisor"
                    className="inline-flex items-center gap-1.5 rounded-full border border-[var(--line)] bg-[var(--bg-surface)]/80 px-3 py-1.5 text-xs text-[var(--text-secondary)] transition-all hover:border-[var(--brand)] hover:text-[var(--brand)] hover:shadow-sm"
                  >
                    <span>Indicative Quota Guide (S.O. 176)</span>
                    <ArrowRight className="h-3 w-3" />
                  </a>
                  <a
                    href="#advisor"
                    className="inline-flex items-center gap-1.5 rounded-full border border-[var(--line)] bg-[var(--bg-surface)]/80 px-3 py-1.5 text-xs text-[var(--text-secondary)] transition-all hover:border-[var(--brand)] hover:text-[var(--brand)] hover:shadow-sm"
                  >
                    <span>JKBOPEE Counselling Dates</span>
                    <ArrowRight className="h-3 w-3" />
                  </a>
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        {/* Technical Proof & Metrics Bar */}
        <section className="relative z-20 mx-auto -mt-6 max-w-7xl px-5 sm:-mt-8 sm:px-8">
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            <div className="metric-card">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--accent-navy)]">Edge Engine</span>
              <p className="mt-1 font-display text-2xl font-bold text-[var(--text-primary)] sm:text-3xl">0.27 ms</p>
              <p className="mt-1 text-xs text-[var(--text-secondary)]">2G ultra-lite lookup for low-connectivity border areas</p>
            </div>
            <div className="metric-card">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--accent-slate)]">Curated Corpus</span>
              <p className="mt-1 font-display text-2xl font-bold text-[var(--text-primary)] sm:text-3xl">494+ Chunks</p>
              <p className="mt-1 text-xs text-[var(--text-secondary)]">Indexed from public J&amp;K notices, circulars &amp; guidebooks</p>
            </div>
            <div className="metric-card">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--accent-gold)]">Policy Reference</span>
              <p className="mt-1 font-display text-2xl font-bold text-[var(--text-primary)] sm:text-3xl">S.O. 176</p>
              <p className="mt-1 text-xs text-[var(--text-secondary)]">Indicative reference breakdown of J&amp;K reservation rules</p>
            </div>
            <div className="metric-card">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--accent-navy)]">Directory</span>
              <p className="mt-1 font-display text-2xl font-bold text-[var(--text-primary)] sm:text-3xl">26 Colleges</p>
              <p className="mt-1 text-xs text-[var(--text-secondary)]">NIT, GMCs, GCET, and UT universities profiled</p>
            </div>
          </div>
        </section>

        {/* Core Guidance Pathways */}
        <section aria-label="Explore guidance" className="mx-auto grid w-full max-w-7xl gap-4 px-5 pt-12 pb-14 sm:grid-cols-3 sm:px-8 sm:pt-16 sm:pb-20">
          {pathways.map(({ id, title, description, badge, href, icon: Icon, tone }, index) => (
            <Reveal key={id} delay={index * 0.07}>
              <Link id={id} href={href} className="pathway-link group scroll-mt-24">
                <span className={`pathway-icon pathway-icon-${tone}`}>
                  <Icon aria-hidden="true" className="h-7 w-7" strokeWidth={1.8} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="inline-block rounded-full bg-[var(--bg-soft)] px-2.5 py-0.5 text-[11px] font-semibold text-[var(--text-secondary)] mb-1">
                    {badge}
                  </span>
                  <span className="block font-display text-lg font-semibold leading-tight text-[var(--text-primary)]">
                    {title}
                  </span>
                  <span className="mt-1.5 block text-sm leading-5 text-[var(--text-secondary)]">
                    {description}
                  </span>
                </span>
                <ArrowRight aria-hidden="true" className="h-5 w-5 shrink-0 text-[var(--brand)] transition-transform group-hover:translate-x-1" />
              </Link>
            </Reveal>
          ))}
        </section>

        {/* Quick Links Section */}
        <section className="border-y border-[var(--line)] bg-[var(--bg-soft)] px-5 py-10 sm:px-8 sm:py-12">
          <div className="mx-auto flex max-w-7xl flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <Reveal className="max-w-sm shrink-0">
              <p className="eyebrow">Direct Actions</p>
              <h2 className="font-display mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">Take the next step</h2>
              <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)] sm:text-base">
                Quick links to the tools and portals students use most often.
              </p>
            </Reveal>
            <Reveal className="flex-1" delay={0.1}>
              <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
                <Link href="/scholarships" className="quick-link">
                  <GraduationCap aria-hidden="true" />
                  <span>Find scholarships</span>
                  <ArrowRight aria-hidden="true" />
                </Link>
                <Link href="/admissions" className="quick-link">
                  <FileText aria-hidden="true" />
                  <span>Plan your admission</span>
                  <ArrowRight aria-hidden="true" />
                </Link>
                <Link href="/colleges" className="quick-link">
                  <Landmark aria-hidden="true" />
                  <span>Explore colleges &amp; cutoffs</span>
                  <ArrowRight aria-hidden="true" />
                </Link>
                <a href="#reservation" className="quick-link">
                  <ShieldCheck aria-hidden="true" />
                  <span>S.O. 176 reservation rules</span>
                  <ArrowRight aria-hidden="true" />
                </a>
              </div>
            </Reveal>
          </div>
        </section>

        {/* AI Advisor Chat Section */}
        <section id="advisor" className="scroll-mt-24 px-5 py-16 sm:px-8 sm:py-20">
          <div className="mx-auto max-w-7xl">
            <Reveal className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="eyebrow">Personal Educational &amp; Career Guidance</p>
                <h2 className="font-display mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
                  Have a question? Start here.
                </h2>
              </div>
              <p className="max-w-lg text-sm leading-6 text-[var(--text-secondary)] sm:text-base">
                Ask about scholarship eligibility, admission deadlines, colleges, or seat categories. Answers are indicative guidelines grounded in public documents with source citations provided.
              </p>
            </Reveal>
            <Reveal delay={0.08}>
              <ChatInterface isOffline={isOffline} onToggleOffline={() => setIsOffline((value) => !value)} />
            </Reveal>
          </div>
        </section>

        {/* Support for Every Stage Section (Refined Architectural Cards) */}
        <section className="border-t border-[var(--line)] bg-[var(--bg-body)] px-5 py-16 sm:px-8 sm:py-20">
          <div className="mx-auto max-w-7xl">
            <Reveal className="max-w-2xl mb-12">
              <p className="eyebrow">For Students Across Jammu, Kashmir &amp; Ladakh</p>
              <h2 className="font-display mt-3 text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
                Support for every stage of your educational journey.
              </h2>
              <p className="mt-4 text-base leading-7 text-[var(--text-secondary)]">
                Whether you are completing secondary school, writing competitive entrance exams, or selecting a higher education institution, EduSetu gives you clear milestones and indicative summaries of public notices.
              </p>
            </Reveal>

            <div className="grid gap-6 sm:grid-cols-3">
              {studentStages.map((stage, index) => {
                const Icon = stage.icon;
                const accentBadgeClass =
                  index === 0
                    ? "bg-amber-500/10 text-[var(--accent-gold)]"
                    : index === 1
                    ? "bg-blue-500/10 text-[var(--accent-navy)]"
                    : "bg-slate-500/10 text-[var(--accent-slate)]";
                const iconColorClass =
                  index === 0
                    ? "text-[var(--accent-gold)]"
                    : index === 1
                    ? "text-[var(--accent-navy)]"
                    : "text-[var(--accent-slate)]";
                return (
                  <Reveal key={stage.title} delay={index * 0.08}>
                    <article className="product-panel flex h-full flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between gap-2 border-b border-[var(--line)] pb-4">
                          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${accentBadgeClass}`}>
                            <Icon aria-hidden="true" className="h-3.5 w-3.5" />
                            {stage.badge}
                          </span>
                          <span className="text-xs font-medium text-[var(--text-muted)]">{stage.stage}</span>
                        </div>

                        <h3 className="font-display mt-5 text-xl font-bold text-[var(--text-primary)]">
                          {stage.title}
                        </h3>
                        <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
                          {stage.description}
                        </p>

                        <ul className="mt-5 space-y-2 border-t border-[var(--line)]/60 pt-4">
                          {stage.highlights.map((item) => (
                            <li key={item} className="flex items-start gap-2 text-xs leading-5 text-[var(--text-secondary)]">
                              <CheckCircle2 aria-hidden="true" className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${iconColorClass}`} />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="mt-6 pt-4 border-t border-[var(--line)]">
                        <Link href={stage.actionHref} className="text-link text-xs font-bold">
                          {stage.actionLabel} <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" />
                        </Link>
                      </div>
                    </article>
                  </Reveal>
                );
              })}
            </div>
          </div>
        </section>

        {/* Seat Reservations & S.O. 176 Section */}
        <section id="reservation" className="scroll-mt-24 border-t border-[var(--line)] bg-[var(--bg-soft)] px-5 py-16 sm:px-8 sm:py-20">
          <div className="mx-auto max-w-7xl">
            <Reveal className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-2xl">
                <div className="inline-flex items-center gap-2 rounded-full border border-[var(--accent)]/30 bg-[var(--accent-soft)] px-3 py-1 text-xs font-bold text-[var(--accent)] mb-3">
                  <Scale aria-hidden="true" className="h-3.5 w-3.5" />
                  Indicative J&amp;K Reservation Framework · S.O. 176 (2024)
                </div>
                <h2 className="font-display text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
                  Understand the rules that shape your seat allocation.
                </h2>
                <p className="mt-3 text-base leading-7 text-[var(--text-secondary)]">
                  The Jammu and Kashmir Reservation Rules (amended under S.O. 176 of 15 March 2024) provide the following reference breakdown for professional and higher education admissions. Figures are indicative guidelines:
                </p>
              </div>
              <a href="#advisor" className="button-secondary shrink-0 self-start lg:self-auto">
                Explore category guidelines <ArrowRight aria-hidden="true" className="h-4 w-4" />
              </a>
            </Reveal>

            {/* Quota Breakdown Grid */}
            <Reveal delay={0.1}>
              <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 sm:gap-4">
                {reservationCategories.map((item) => (
                  <div
                    key={item.label}
                    className="flex flex-col justify-between rounded-2xl border border-[var(--line)] bg-[var(--bg-surface)] p-5 shadow-[var(--shadow-card)] transition-all hover:border-[var(--brand)]/40 hover:shadow-[var(--shadow-elevated)] hover:-translate-y-0.5"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <span className="block text-xs font-semibold text-[var(--text-muted)] leading-tight">{item.label}</span>
                        {item.gazetteRef && (
                          <a
                            href={item.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="shrink-0 inline-flex items-center gap-1 rounded bg-[var(--bg-soft)] px-1.5 py-0.5 text-[10px] font-mono text-[var(--accent-navy)] hover:underline"
                            title={`Official source: ${item.gazetteRef}`}
                          >
                            <span>{item.gazetteRef}</span>
                            <ExternalLink aria-hidden="true" className="h-2.5 w-2.5 opacity-60" />
                          </a>
                        )}
                      </div>
                      <span className="block font-display text-2xl font-bold text-[var(--accent-navy)] mt-2 sm:text-3xl">{item.percentage}</span>
                      <p className="mt-1.5 text-xs leading-4 text-[var(--text-secondary)]">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Legal Notice Banner */}
              <div className="mt-6 rounded-xl border border-amber-500/25 bg-amber-50/70 dark:bg-amber-950/30 p-3.5 text-xs text-amber-900 dark:text-amber-200">
                <p className="font-semibold flex items-center gap-1.5">
                  <ShieldAlert className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
                  Indicative reference breakdown · Historical public notices (S.O. 176, March 2024)
                </p>
                <p className="mt-1 leading-5 text-[var(--text-secondary)]">
                  Percentages above are indicative historical benchmarks and differ between UT colleges (JKBOPEE) and central institutions (JoSAA). Quota distributions remain subject to government review and litigation. Always verify the active seat matrix on the official <a href="https://jkbopee.gov.in" target="_blank" rel="noopener noreferrer" className="underline font-semibold text-[var(--brand)] hover:text-[var(--brand-strong)]">JKBOPEE portal</a>.
                </p>
              </div>
            </Reveal>
          </div>
        </section>

        {/* Institutions & Colleges Showcase */}
        <section id="colleges-and-seats" className="scroll-mt-24 px-5 py-16 sm:px-8 sm:py-20">
          <Reveal className="mx-auto max-w-7xl overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--bg-surface)] shadow-[var(--shadow-card)]">
            <div className="grid lg:grid-cols-[1.1fr_0.9fr]">
              <div className="flex flex-col justify-center p-7 sm:p-10 lg:p-14">
                <p className="eyebrow">Institutions Directory (Indicative)</p>
                <h2 className="font-display mt-3 text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
                  Higher education opportunities across Jammu &amp; Kashmir.
                </h2>
                <p className="mt-4 text-base leading-7 text-[var(--text-secondary)]">
                  Explore 26 profiled institutions across Srinagar, Jammu, Anantnag, Baramulla, and border districts. Compare indicative cutoffs, seat capacities, fee frameworks, and NAAC accreditations.
                </p>

                <div className="mt-6 flex flex-wrap gap-2">
                  <span className="rounded-lg bg-[var(--bg-soft)] px-2.5 py-1 text-xs font-semibold text-[var(--text-secondary)]">NIT Srinagar</span>
                  <span className="rounded-lg bg-[var(--bg-soft)] px-2.5 py-1 text-xs font-semibold text-[var(--text-secondary)]">GCET Jammu</span>
                  <span className="rounded-lg bg-[var(--bg-soft)] px-2.5 py-1 text-xs font-semibold text-[var(--text-secondary)]">GMC Srinagar</span>
                  <span className="rounded-lg bg-[var(--bg-soft)] px-2.5 py-1 text-xs font-semibold text-[var(--text-secondary)]">University of Kashmir</span>
                  <span className="rounded-lg bg-[var(--bg-soft)] px-2.5 py-1 text-xs font-semibold text-[var(--text-secondary)]">IUST Awantipora</span>
                  <span className="rounded-lg bg-[var(--bg-soft)] px-2.5 py-1 text-xs font-semibold text-[var(--text-secondary)]">University of Jammu</span>
                  <span className="rounded-lg bg-[var(--bg-soft)] px-2.5 py-1 text-xs font-semibold text-[var(--text-secondary)]">SKUAST Kashmir</span>
                </div>

                <div className="mt-8 flex flex-wrap items-center gap-3">
                  <Link href="/colleges" className="button-primary">
                    Explore colleges &amp; cutoffs <ArrowRight aria-hidden="true" className="h-4 w-4" />
                  </Link>
                  <Link href="/admissions" className="button-secondary">
                    Admission planner
                  </Link>
                </div>
              </div>

              <div className="relative min-h-72 border-t border-[var(--line)] bg-[var(--bg-soft)] sm:min-h-96 lg:min-h-[460px] lg:border-t-0 lg:border-l">
                <Image
                  src="/jk-campus.png"
                  alt="University campus architecture in Jammu and Kashmir"
                  fill
                  sizes="(max-width: 1024px) 100vw, 45vw"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-surface)]/80 via-transparent to-transparent lg:hidden" />
              </div>
            </div>
          </Reveal>
        </section>

        {/* Official Resources & Portals Section */}
        <section className="border-t border-[var(--line)] bg-[var(--bg-soft)] px-5 py-16 sm:px-8 sm:py-20">
          <div className="mx-auto max-w-7xl">
            <Reveal className="max-w-2xl mb-8">
              <p className="eyebrow">External Gateways</p>
              <h2 className="font-display mt-2 text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
                Official Department &amp; University Portals
              </h2>
              <p className="mt-3 text-base leading-7 text-[var(--text-secondary)]">
                Always confirm current deadlines, eligibility notifications, and application submissions through authorized government portals.
              </p>
            </Reveal>

            <Reveal delay={0.08}>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <a
                  href="https://www.aicte-india.org/bureaus/jk"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="product-panel group flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <GraduationCap className="h-6 w-6 text-[var(--accent-gold)]" />
                      <ExternalLink className="h-4 w-4 text-[var(--text-muted)] group-hover:text-[var(--accent-gold)] transition-colors" />
                    </div>
                    <h3 className="font-display mt-4 text-lg font-bold text-[var(--text-primary)]">AICTE PMSSS</h3>
                    <p className="mt-1 text-xs leading-5 text-[var(--text-secondary)]">
                      Prime Minister’s Special Scholarship Scheme for J&amp;K students studying outside UT. Up to ₹3.0 Lakhs support.
                    </p>
                  </div>
                  <span className="text-link mt-4 text-xs font-bold text-[var(--accent-gold)]">Open AICTE portal →</span>
                </a>

                <a
                  href="https://www.jkbopee.gov.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="product-panel group flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <FileText className="h-6 w-6 text-[var(--accent-navy)]" />
                      <ExternalLink className="h-4 w-4 text-[var(--text-muted)] group-hover:text-[var(--accent-navy)] transition-colors" />
                    </div>
                    <h3 className="font-display mt-4 text-lg font-bold text-[var(--text-primary)]">JKBOPEE Portal</h3>
                    <p className="mt-1 text-xs leading-5 text-[var(--text-secondary)]">
                      J&amp;K Board of Professional Entrance Examinations. Engineering, NEET AYUSH, and Paramedical counselling.
                    </p>
                  </div>
                  <span className="text-link mt-4 text-xs font-bold text-[var(--accent-navy)]">Open JKBOPEE portal →</span>
                </a>

                <a
                  href="https://scholarships.gov.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="product-panel group flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <Sparkles className="h-6 w-6 text-[var(--accent-gold)]" />
                      <ExternalLink className="h-4 w-4 text-[var(--text-muted)] group-hover:text-[var(--accent-gold)] transition-colors" />
                    </div>
                    <h3 className="font-display mt-4 text-lg font-bold text-[var(--text-primary)]">National Scholarship (NSP)</h3>
                    <p className="mt-1 text-xs leading-5 text-[var(--text-secondary)]">
                      Central government scholarship schemes, Post-Matric, CSSS, and merit-cum-means financial aid.
                    </p>
                  </div>
                  <span className="text-link mt-4 text-xs font-bold text-[var(--accent-gold)]">Open NSP portal →</span>
                </a>

                <a
                  href="https://jkhighereducation.nic.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="product-panel group flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <Building2 className="h-6 w-6 text-[var(--accent-slate)]" />
                      <ExternalLink className="h-4 w-4 text-[var(--text-muted)] group-hover:text-[var(--accent-slate)] transition-colors" />
                    </div>
                    <h3 className="font-display mt-4 text-lg font-bold text-[var(--text-primary)]">J&amp;K Higher Education Dept</h3>
                    <p className="mt-1 text-xs leading-5 text-[var(--text-secondary)]">
                      Official Government of J&amp;K Higher Education portal. Policy circulars, college list, and NEP guidelines.
                    </p>
                  </div>
                  <span className="text-link mt-4 text-xs font-bold text-[var(--accent-slate)]">Open Higher Ed portal →</span>
                </a>
              </div>
            </Reveal>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer id="resources" className="scroll-mt-24 border-t border-[var(--line)] bg-[var(--bg-surface)] px-5 py-12 sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-8 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="relative flex h-10 w-auto shrink-0 items-center justify-center">
              <Image
                src="/logo.png"
                alt="J&K EduSetu Logo"
                width={36}
                height={48}
                className="h-9 w-auto object-contain"
              />
            </div>
            <div>
              <p className="font-display text-lg font-bold">J&amp;K EduSetu</p>
              <p className="text-sm text-[var(--text-secondary)]">Independent Student Guidance Resource for J&amp;K · Developed by Shubh Sharma</p>
            </div>
          </div>
          <nav aria-label="Official resources" className="flex flex-wrap gap-x-6 gap-y-3 text-sm text-[var(--text-secondary)]">
            <a className="footer-link" href="https://www.aicte-india.org/bureaus/jk" target="_blank" rel="noopener noreferrer">AICTE PMSSS Portal</a>
            <a className="footer-link" href="https://www.jkbopee.gov.in" target="_blank" rel="noopener noreferrer">JKBOPEE Official</a>
            <a className="footer-link" href="https://scholarships.gov.in" target="_blank" rel="noopener noreferrer">National Scholarship Portal</a>
            <a className="footer-link" href="https://jkhighereducation.nic.in" target="_blank" rel="noopener noreferrer">Higher Education Dept J&amp;K</a>
          </nav>
          <a href="#top" className="footer-link inline-flex items-center gap-2 text-sm font-semibold">
            Back to top <ArrowRight aria-hidden="true" className="h-4 w-4 -rotate-90" />
          </a>
        </div>

        {/* Prominent Legal Disclaimer */}
        <div className="mx-auto mt-8 max-w-7xl border-t border-[var(--line)] pt-6 text-xs text-[var(--text-muted)] leading-relaxed">
          <p className="font-semibold text-[var(--text-secondary)] flex items-center gap-1.5">
            <ShieldAlert className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
            Disclaimer &amp; Independent Project Notice
          </p>
          <p className="mt-1">
            J&amp;K EduSetu is an independent educational guidance platform created and maintained by Shubh Sharma. It is <strong>not affiliated with, authorized, maintained, sponsored, or endorsed by the Government of Jammu &amp; Kashmir</strong>, the Higher Education Department, JKBOPEE, AICTE, or any official government body. All information, cutoffs, eligibility criteria, and seat allocation figures shown are <strong>indicative</strong> and provided for personal informational guidance only. Always confirm official dates, eligibility criteria, and rules directly on the respective official portal (<a href="https://jkbopee.gov.in" target="_blank" rel="noopener noreferrer" className="underline font-medium text-[var(--brand)] hover:underline">jkbopee.gov.in</a>, <a href="https://www.aicte-india.org/bureaus/jk" target="_blank" rel="noopener noreferrer" className="underline font-medium text-[var(--brand)] hover:underline">aicte-india.org</a>) before making educational or financial decisions.
          </p>
        </div>
      </footer>
    </div>
  );
}
