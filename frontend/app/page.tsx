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
  ShieldCheck,
  Sparkles,
  Zap,
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
    badge: "15+ verified schemes",
    href: "/scholarships",
    icon: GraduationCap,
    tone: "mint",
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
    description: "Explore 26 verified institutions, opening ranks, and courses.",
    badge: "26 institutions verified",
    href: "/colleges",
    icon: Landmark,
    tone: "gold",
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
    description: "Get verified guidance on JEE Main, NEET UG, JKCET, CUET, and home-state reservation quotas.",
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
      "26 verified UT engineering, medical & degree colleges",
      "S.O. 176 (2024) reservation distribution rules",
      "Hostel availability, fees & NAAC accreditation",
    ],
    actionHref: "/colleges",
    actionLabel: "Explore colleges & seats",
  },
];

const reservationCategories = [
  { label: "Open Merit (OM)", percentage: "50%", desc: "General merit seats across all UT courses" },
  { label: "Resident of Backward Area (RBA)", percentage: "10%", desc: "Certified residents of notified rural areas" },
  { label: "Scheduled Tribe (ST)", percentage: "10%", desc: "Gujjars, Bakarwals, Balti, Gaddi & notified tribes" },
  { label: "Economically Weaker Section (EWS)", percentage: "10%", desc: "Annual family income up to ₹8 Lakhs" },
  { label: "Scheduled Caste (SC)", percentage: "8%", desc: "Notified SC communities of J&K" },
  { label: "ALC / International Border", percentage: "4%", desc: "Residents along the Line of Control & IB" },
  { label: "Other Social Castes (OSC)", percentage: "4%", desc: "Socially and educationally backward classes" },
  { label: "Children of Defense / Sports", percentage: "4%", desc: "Paramilitary, police personnel & sports quota" },
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

          <div className="relative z-10 mx-auto max-w-7xl px-5 py-14 sm:px-8 sm:py-20 lg:py-24">
            <Reveal className="max-w-3xl">
              {/* Dual Authority Badge */}
              <div className="mb-6 inline-flex flex-wrap items-center gap-2 rounded-full border border-[var(--brand)]/25 bg-[var(--bg-surface)]/85 px-3.5 py-1.5 text-xs font-semibold shadow-sm backdrop-blur-md">
                <span className="flex items-center gap-1.5 text-[var(--brand)]">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  Government of Jammu &amp; Kashmir
                </span>
                <span className="text-[var(--text-muted)]">·</span>
                <span className="text-[var(--text-secondary)]">Higher Education Department</span>
                <span className="rounded-full bg-[var(--accent)]/15 px-2.5 py-0.5 text-[11px] font-bold text-[var(--accent)]">
                  Personal Project by Shubh Sharma
                </span>
              </div>

              {/* Main Headline */}
              <h1 className="font-display text-4xl font-bold leading-[1.08] tracking-[-0.035em] sm:text-5xl lg:text-[3.9rem]">
                Your education journey in J&amp;K, made{" "}
                <span className="text-[var(--accent)] underline decoration-[var(--accent)]/30 underline-offset-8">
                  simpler.
                </span>
              </h1>

              {/* Subtitle */}
              <p className="mt-6 max-w-2xl text-base leading-7 text-[var(--text-secondary)] sm:text-lg">
                J&amp;K EduSetu is the official autonomous guidance platform for Jammu &amp; Kashmir students.
                Find verified scholarship schemes, transparent admission roadmaps, and deterministic seat
                reservation matrices—grounded in official UT Gazettes and built for 2G network resilience.
              </p>

              {/* Primary Action Buttons */}
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link href="/scholarships" className="button-primary">
                  Find the right opportunity <ArrowRight aria-hidden="true" className="h-4 w-4" />
                </Link>
                <a href="#advisor" className="button-secondary">
                  Ask EduSetu advisor
                </a>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--line)] bg-[var(--bg-surface)]/80 px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] backdrop-blur-sm">
                  <Zap aria-hidden="true" className="h-3.5 w-3.5 text-[var(--brand)]" />
                  2G Edge &amp; Offline Ready
                </span>
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
                    <span>S.O. 176 Quota Calculator</span>
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
              <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--brand)]">Edge Engine</span>
              <p className="mt-1 font-display text-2xl font-bold text-[var(--text-primary)] sm:text-3xl">0.27 ms</p>
              <p className="mt-1 text-xs text-[var(--text-secondary)]">2G ultra-lite trie lookup for remote border regions</p>
            </div>
            <div className="metric-card">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--brand)]">Official Data</span>
              <p className="mt-1 font-display text-2xl font-bold text-[var(--text-primary)] sm:text-3xl">494+ Chunks</p>
              <p className="mt-1 text-xs text-[var(--text-secondary)]">Indexed from 12+ verified J&amp;K gazettes and notices</p>
            </div>
            <div className="metric-card">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--accent)]">Policy Audited</span>
              <p className="mt-1 font-display text-2xl font-bold text-[var(--text-primary)] sm:text-3xl">S.O. 176</p>
              <p className="mt-1 text-xs text-[var(--text-secondary)]">Deterministic OM / RBA / SC / ST quota calculator</p>
            </div>
            <div className="metric-card">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--brand)]">UT Catalogue</span>
              <p className="mt-1 font-display text-2xl font-bold text-[var(--text-primary)] sm:text-3xl">26 Colleges</p>
              <p className="mt-1 text-xs text-[var(--text-secondary)]">NIT, IIT, GMCs, GCET, and degree colleges verified</p>
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
                  <span className="inline-block rounded-full bg-[var(--bg-soft)] px-2.5 py-0.5 text-[11px] font-semibold text-[var(--brand)] mb-1">
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
                <p className="eyebrow">Personal Policy &amp; Career Guidance</p>
                <h2 className="font-display mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
                  Have a question? Start here.
                </h2>
              </div>
              <p className="max-w-lg text-sm leading-6 text-[var(--text-secondary)] sm:text-base">
                Ask about scholarship eligibility, admission deadlines, colleges, or seat categories. Every response is verified against active UT gazettes with citation sources provided.
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
                Whether you are completing secondary school, writing competitive entrance exams, or selecting a higher education institution, EduSetu gives you clear milestones and verified official notices.
              </p>
            </Reveal>

            <div className="grid gap-6 sm:grid-cols-3">
              {studentStages.map((stage, index) => {
                const Icon = stage.icon;
                return (
                  <Reveal key={stage.title} delay={index * 0.08}>
                    <article className="product-panel flex h-full flex-col justify-between transition-all hover:border-[var(--brand)]/50 hover:shadow-md">
                      <div>
                        <div className="flex items-center justify-between gap-2 border-b border-[var(--line)] pb-4">
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--bg-soft)] px-2.5 py-1 text-xs font-semibold text-[var(--brand)]">
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
                              <CheckCircle2 aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--brand)]" />
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
                  J&amp;K Reservation Rules · S.O. 176 (2024)
                </div>
                <h2 className="font-display text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
                  Understand the rules that shape your seat allocation.
                </h2>
                <p className="mt-3 text-base leading-7 text-[var(--text-secondary)]">
                  The Jammu and Kashmir Reservation Rules (amended under S.O. 176 of 2024) govern all professional, engineering, and medical admissions. Review the official allocation breakdown:
                </p>
              </div>
              <a href="#advisor" className="button-secondary shrink-0 self-start lg:self-auto">
                Calculate my quota category <ArrowRight aria-hidden="true" className="h-4 w-4" />
              </a>
            </Reveal>

            {/* Quota Breakdown Grid */}
            <Reveal delay={0.1}>
              <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
                {reservationCategories.map((item) => (
                  <div key={item.label} className="rounded-2xl border border-[var(--line)] bg-[var(--bg-surface)] p-4 shadow-sm transition-all hover:border-[var(--brand)]/40">
                    <span className="block text-xs font-semibold text-[var(--text-muted)] leading-tight">{item.label}</span>
                    <span className="block font-display text-2xl font-bold text-[var(--brand)] mt-1.5 sm:text-3xl">{item.percentage}</span>
                    <p className="mt-1 text-xs leading-4 text-[var(--text-secondary)]">{item.desc}</p>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </section>

        {/* Institutions & Colleges Showcase */}
        <section id="colleges-and-seats" className="scroll-mt-24 px-5 py-16 sm:px-8 sm:py-20">
          <Reveal className="mx-auto max-w-7xl overflow-hidden rounded-[2rem] border border-[var(--line)] bg-[var(--bg-surface)] shadow-[var(--shadow-card)]">
            <div className="grid lg:grid-cols-[1.1fr_0.9fr]">
              <div className="flex flex-col justify-center p-7 sm:p-10 lg:p-14">
                <p className="eyebrow">Verified Institutions Directory</p>
                <h2 className="font-display mt-3 text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
                  Higher education opportunities across Jammu &amp; Kashmir.
                </h2>
                <p className="mt-4 text-base leading-7 text-[var(--text-secondary)]">
                  Compare 26 verified institutions across Srinagar, Jammu, Anantnag, Baramulla, and remote border districts. Inspect previous year cutoffs, seat capacities, semester fees, and NAAC accreditations.
                </p>

                <div className="mt-6 flex flex-wrap gap-2">
                  <span className="rounded-lg bg-[var(--bg-soft)] px-2.5 py-1 text-xs font-semibold text-[var(--text-secondary)]">NIT Srinagar</span>
                  <span className="rounded-lg bg-[var(--bg-soft)] px-2.5 py-1 text-xs font-semibold text-[var(--text-secondary)]">IIT Jammu</span>
                  <span className="rounded-lg bg-[var(--bg-soft)] px-2.5 py-1 text-xs font-semibold text-[var(--text-secondary)]">IIM Jammu</span>
                  <span className="rounded-lg bg-[var(--bg-soft)] px-2.5 py-1 text-xs font-semibold text-[var(--text-secondary)]">GMC Srinagar</span>
                  <span className="rounded-lg bg-[var(--bg-soft)] px-2.5 py-1 text-xs font-semibold text-[var(--text-secondary)]">GCET Jammu</span>
                  <span className="rounded-lg bg-[var(--bg-soft)] px-2.5 py-1 text-xs font-semibold text-[var(--text-secondary)]">University of Kashmir</span>
                  <span className="rounded-lg bg-[var(--bg-soft)] px-2.5 py-1 text-xs font-semibold text-[var(--text-secondary)]">SMVDU Katra</span>
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
              <p className="eyebrow">Verified Gateways</p>
              <h2 className="font-display mt-2 text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
                Official Department Portals
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
                  className="product-panel group flex flex-col justify-between transition-all hover:border-[var(--brand)] hover:shadow-md"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <GraduationCap className="h-6 w-6 text-[var(--brand)]" />
                      <ExternalLink className="h-4 w-4 text-[var(--text-muted)] group-hover:text-[var(--brand)] transition-colors" />
                    </div>
                    <h3 className="font-display mt-4 text-lg font-bold text-[var(--text-primary)]">AICTE PMSSS</h3>
                    <p className="mt-1 text-xs leading-5 text-[var(--text-secondary)]">
                      Prime Minister’s Special Scholarship Scheme for J&amp;K students studying outside UT. Up to ₹3.0 Lakhs support.
                    </p>
                  </div>
                  <span className="text-link mt-4 text-xs font-bold">Open AICTE portal →</span>
                </a>

                <a
                  href="https://www.jkbopee.gov.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="product-panel group flex flex-col justify-between transition-all hover:border-[var(--brand)] hover:shadow-md"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <FileText className="h-6 w-6 text-[var(--brand)]" />
                      <ExternalLink className="h-4 w-4 text-[var(--text-muted)] group-hover:text-[var(--brand)] transition-colors" />
                    </div>
                    <h3 className="font-display mt-4 text-lg font-bold text-[var(--text-primary)]">JKBOPEE Portal</h3>
                    <p className="mt-1 text-xs leading-5 text-[var(--text-secondary)]">
                      J&amp;K Board of Professional Entrance Examinations. Engineering, NEET AYUSH, and Paramedical counselling.
                    </p>
                  </div>
                  <span className="text-link mt-4 text-xs font-bold">Open JKBOPEE portal →</span>
                </a>

                <a
                  href="https://scholarships.gov.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="product-panel group flex flex-col justify-between transition-all hover:border-[var(--brand)] hover:shadow-md"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <Sparkles className="h-6 w-6 text-[var(--accent)]" />
                      <ExternalLink className="h-4 w-4 text-[var(--text-muted)] group-hover:text-[var(--brand)] transition-colors" />
                    </div>
                    <h3 className="font-display mt-4 text-lg font-bold text-[var(--text-primary)]">National Scholarship (NSP)</h3>
                    <p className="mt-1 text-xs leading-5 text-[var(--text-secondary)]">
                      Central government scholarship schemes, Post-Matric, CSSS, and merit-cum-means financial aid.
                    </p>
                  </div>
                  <span className="text-link mt-4 text-xs font-bold">Open NSP portal →</span>
                </a>

                <a
                  href="https://jkhighereducation.nic.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="product-panel group flex flex-col justify-between transition-all hover:border-[var(--brand)] hover:shadow-md"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <Building2 className="h-6 w-6 text-[var(--brand)]" />
                      <ExternalLink className="h-4 w-4 text-[var(--text-muted)] group-hover:text-[var(--brand)] transition-colors" />
                    </div>
                    <h3 className="font-display mt-4 text-lg font-bold text-[var(--text-primary)]">J&amp;K Higher Education Dept</h3>
                    <p className="mt-1 text-xs leading-5 text-[var(--text-secondary)]">
                      Official Government of J&amp;K Higher Education portal. Policy circulars, college list, and NEP guidelines.
                    </p>
                  </div>
                  <span className="text-link mt-4 text-xs font-bold">Open Higher Ed portal →</span>
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
            <Image src="/jk_emblem.png" alt="Jammu and Kashmir Government emblem" width={40} height={50} className="h-12 w-10 object-contain" />
            <div>
              <p className="font-display text-lg font-bold">J&amp;K EduSetu</p>
              <p className="text-sm text-[var(--text-secondary)]">Autonomous Education, Career &amp; Policy Gateway for J&amp;K · Developed by Shubh Sharma</p>
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
      </footer>
    </div>
  );
}
