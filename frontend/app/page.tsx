"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  GraduationCap,
  Landmark,
  ShieldCheck,
  Zap,
  ArrowRight,
  BookOpen,
  Award,
  Sparkles,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";
import { Spotlight } from "@/components/ui/spotlight";
import { BackgroundBeams } from "@/components/ui/background-beams";
import { FloatingNavbar } from "@/components/ui/floating-navbar";
import { BentoGrid, BentoGridItem } from "@/components/ui/bento-grid";
import { ChatInterface } from "@/components/chat/chat-interface";

export default function Home() {
  const [isOffline, setIsOffline] = useState(false);
  const [activeModel, setActiveModel] = useState("Gemini 3.8 Flash");

  return (
    <div className="relative min-h-screen w-full bg-[#fafaf9] dark:bg-[#051610] text-slate-800 dark:text-slate-100 overflow-hidden">
      {/* Ambient Animated Particles (from html_css_sdp_project + Aceternity) */}
      <BackgroundBeams />

      {/* Hero Spotlight Glow (Aceternity UI) */}
      <Spotlight className="-top-40 left-0 md:left-60 md:-top-20" fill="#10b981" />

      {/* Floating Glassmorphic Navbar */}
      <FloatingNavbar
        isOffline={isOffline}
        onToggleOffline={() => setIsOffline(!isOffline)}
        activeModelName={activeModel}
      />

      {/* =====================================================================
          HERO SECTION
          ===================================================================== */}
      <main className="relative z-10 pt-28 sm:pt-36 pb-20 px-4 sm:px-6 max-w-7xl mx-auto flex flex-col items-center text-center">
        {/* Eyebrow Badge */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-800 dark:text-emerald-300 text-xs sm:text-sm font-semibold mb-6 shadow-sm"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Government of Jammu & Kashmir • Higher Education Department</span>
        </motion.div>

        {/* Hero Title with Fluid Typography & Text Gradient */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="font-display font-extrabold text-3xl sm:text-5xl lg:text-6xl tracking-tight max-w-4xl text-slate-900 dark:text-white leading-[1.15]"
        >
          Your Autonomous AI Advisor for{" "}
          <span className="text-gradient-emerald">Admissions</span>,{" "}
          <span className="text-gradient-gold">Scholarships</span> &{" "}
          <span className="text-gradient-emerald">Career Pathways</span>
        </motion.h1>

        {/* Hero Description */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-6 text-sm sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed"
        >
          Grounded directly on verified gazettes, AICTE PMSSS guidelines, JKBOPEE seat matrices,
          and the updated <strong>S.O. 176 (2024)</strong> reservation policy. Powered by a
          quota-resilient 5-model Gemini fleet with sub-10ms 2G offline edge failover.
        </motion.p>

        {/* Hero CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-8 flex flex-wrap items-center justify-center gap-3 sm:gap-4"
        >
          <a
            href="#advisor"
            className="px-6 py-3 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm sm:text-base shadow-lg shadow-emerald-600/30 hover:shadow-emerald-600/50 transition duration-200 flex items-center gap-2"
          >
            <span>Launch AI Advisor</span>
            <ArrowRight className="w-4 h-4" />
          </a>
          <a
            href="#colleges"
            className="px-6 py-3 rounded-full glass-panel hover:bg-emerald-500/10 text-emerald-900 dark:text-emerald-200 font-semibold text-sm sm:text-base border border-emerald-500/30 transition duration-200"
          >
            Explore Seat Matrices & Cutoffs
          </a>
        </motion.div>

        {/* =====================================================================
            LIVE AI CHAT ADVISOR WIDGET
            ===================================================================== */}
        <section id="advisor" className="w-full mt-16 scroll-mt-28">
          <ChatInterface
            isOffline={isOffline}
            onToggleOffline={() => setIsOffline(!isOffline)}
            onModelActive={(m) => setActiveModel(m)}
          />
        </section>

        {/* =====================================================================
            BENTO GRID SHOWCASE (Aceternity UI + 21st.dev)
            ===================================================================== */}
        <section id="colleges" className="w-full mt-28 scroll-mt-24 text-left">
          <div className="text-center mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block mb-2">
              Verified Knowledge Modules
            </span>
            <h2 className="font-display font-bold text-2xl sm:text-4xl text-slate-900 dark:text-white">
              Complete Educational Architecture of Jammu & Kashmir
            </h2>
          </div>

          <BentoGrid>
            {/* Bento Item 1: PMSSS */}
            <BentoGridItem
              title="AICTE PMSSS (Prime Minister Special Scholarship Scheme)"
              description="5,000 reserved slots annually for J&K and Ladakh students with family income under ₹8.00 Lakh. Up to ₹3.00 Lakh tuition + ₹1.00 Lakh maintenance allowance per year."
              icon={<GraduationCap className="w-5 h-5" />}
              badge="5,000 Slots / Yr"
              className="md:col-span-2"
              header={
                <div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-gradient-to-br from-emerald-500/10 to-teal-500/5 p-4 border border-emerald-500/15 flex-col justify-between">
                  <div className="flex items-center justify-between text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                    <span>Degree Categories</span>
                    <span>100% DBT Transfer</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="p-2 rounded-lg bg-white/60 dark:bg-emerald-950/60 border border-emerald-500/20 font-bold">General: 2,070</div>
                    <div className="p-2 rounded-lg bg-white/60 dark:bg-emerald-950/60 border border-emerald-500/20 font-bold">Engineering: 2,830</div>
                    <div className="p-2 rounded-lg bg-white/60 dark:bg-emerald-950/60 border border-emerald-500/20 font-bold">Medical: 100</div>
                  </div>
                </div>
              }
            />

            {/* Bento Item 2: 2G Mountain Edge */}
            <BentoGridItem
              title="Sub-10ms 2G Mountain Edge Engine"
              description="Engineered specifically for low-connectivity Himalayan border sectors (Gurez, Kupwara, Uri, Kargil). Instant local responses from compressed government records."
              icon={<Zap className="w-5 h-5 text-amber-500" />}
              badge="Edge Failover"
              className="md:col-span-1"
              header={
                <div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-gradient-to-br from-amber-500/10 to-orange-500/5 p-4 border border-amber-500/20 flex-col justify-center items-center text-center">
                  <div className="text-3xl font-extrabold text-amber-600 dark:text-amber-400 font-display">
                    &lt; 10ms
                  </div>
                  <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-1">
                    Zero Cloud API Dependency
                  </div>
                </div>
              }
            />

            {/* Bento Item 3: S.O. 176 Reservation */}
            <BentoGridItem
              id="reservation"
              title="S.O. 176 (2024) Updated Reservation Policy"
              description="Comprehensive breakdown of Open Merit (50%), RBA (10%), SC (8%), ST (20%), and EWS (10%) quota seats across all professional entrance exams."
              icon={<ShieldCheck className="w-5 h-5" />}
              badge="Gazette Approved"
              className="md:col-span-1"
              header={
                <div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 p-3 border border-emerald-500/15 flex-col justify-center gap-1.5 text-xs">
                  <div className="flex justify-between font-semibold"><span>Open Merit (OM):</span> <span className="font-bold text-emerald-600 dark:text-emerald-400">50%</span></div>
                  <div className="flex justify-between font-semibold"><span>Schedule Tribe (ST):</span> <span className="font-bold text-emerald-600 dark:text-emerald-400">20%</span></div>
                  <div className="flex justify-between font-semibold"><span>Resident of Backward Area:</span> <span className="font-bold text-emerald-600 dark:text-emerald-400">10%</span></div>
                </div>
              }
            />

            {/* Bento Item 4: Top Institutes & Cutoffs */}
            <BentoGridItem
              title="NIT Srinagar, GCET Jammu & BOPEE Cutoffs"
              description="Detailed opening & closing ranks for B.Tech, MBBS, BDS, and Polytechnic diploma seats under Home State (HS) and Other State (OS) allocations."
              icon={<Landmark className="w-5 h-5" />}
              badge="32 Institutes"
              className="md:col-span-2"
              header={
                <div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-gradient-to-br from-teal-500/10 to-emerald-500/5 p-4 border border-teal-500/15 flex-col justify-between">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                    <span>NIT Srinagar • CSE Cutoff (HS Open)</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">~ 28,400 Rank</span>
                  </div>
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                    <span>GCET Jammu • Computer Science (JKCET)</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">Score 65+</span>
                  </div>
                </div>
              }
            />
          </BentoGrid>
        </section>

        {/* =====================================================================
            ANIMATED STATS STRIP
            ===================================================================== */}
        <section className="w-full mt-24 py-12 rounded-3xl glass-panel border border-emerald-500/20 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div>
            <div className="font-display font-extrabold text-3xl sm:text-4xl text-emerald-600 dark:text-emerald-400">26+</div>
            <div className="text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300 mt-1">Verified Schemes</div>
          </div>
          <div>
            <div className="font-display font-extrabold text-3xl sm:text-4xl text-amber-500">5,000</div>
            <div className="text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300 mt-1">PMSSS Annual Seats</div>
          </div>
          <div>
            <div className="font-display font-extrabold text-3xl sm:text-4xl text-emerald-600 dark:text-emerald-400">32</div>
            <div className="text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300 mt-1">UT Colleges Indexed</div>
          </div>
          <div>
            <div className="font-display font-extrabold text-3xl sm:text-4xl text-amber-500">&lt; 10ms</div>
            <div className="text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300 mt-1">Offline 2G Latency</div>
          </div>
        </section>
      </main>

      {/* =====================================================================
          FOOTER (Inspired by html_css_sdp_project footer craftsmanship)
          ===================================================================== */}
      <footer className="w-full border-t border-emerald-500/20 bg-white/60 dark:bg-[#030e0a] py-12 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-slate-600 dark:text-slate-400">
          <div className="flex items-center gap-3">
            <Image src="/jk_emblem.png" alt="J&K Emblem" width={28} height={28} className="object-contain" />
            <div>
              <div className="font-bold text-slate-900 dark:text-slate-100">J&K EduSetu</div>
              <div>Autonomous Career & Scholarship Intelligence Platform</div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <a href="https://www.aicte-india.org/bureaus/jk" target="_blank" rel="noopener noreferrer" className="hover:text-emerald-600 flex items-center gap-1">
              AICTE PMSSS Portal <ExternalLink className="w-3 h-3" />
            </a>
            <a href="https://www.jkbopee.gov.in" target="_blank" rel="noopener noreferrer" className="hover:text-emerald-600 flex items-center gap-1">
              JKBOPEE Official <ExternalLink className="w-3 h-3" />
            </a>
            <a href="https://scholarships.gov.in" target="_blank" rel="noopener noreferrer" className="hover:text-emerald-600 flex items-center gap-1">
              National Scholarship Portal <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div>
            Developed with excellence by <strong>Shubh Sharma</strong>, CSE, NIE Mysuru
          </div>
        </div>
      </footer>
    </div>
  );
}
