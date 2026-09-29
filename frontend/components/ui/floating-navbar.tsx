"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Menu, X, ExternalLink } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";

interface FloatingNavbarProps {
  isOffline: boolean;
  onToggleOffline: () => void;
  activeModelName?: string;
}

export const FloatingNavbar = ({
  isOffline,
  onToggleOffline,
  activeModelName = "Gemini 3.8 Flash",
}: FloatingNavbarProps) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { name: "AI Advisor", href: "#advisor" },
    { name: "Colleges & Seats", href: "#colleges" },
    { name: "Scholarships", href: "#scholarships" },
    { name: "S.O. 176 Quota", href: "#reservation" },
  ];

  return (
    <header className="fixed top-4 inset-x-0 z-50 flex justify-center px-4">
      <motion.nav
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="w-full max-w-6xl glass-panel rounded-full px-4 py-2.5 flex items-center justify-between shadow-lg shadow-black/5 dark:shadow-emerald-950/20 border border-emerald-500/20"
      >
        {/* Brand & Emblem */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="relative w-8 h-8 rounded-full overflow-hidden border border-emerald-500/40 bg-white/10 p-0.5 shadow-sm">
            <Image
              src="/jk_emblem.png"
              alt="J&K Government Emblem"
              fill
              className="object-contain p-0.5"
            />
          </div>
          <div className="flex flex-col">
            <span className="font-display font-bold text-sm sm:text-base tracking-tight text-emerald-950 dark:text-emerald-100 flex items-center">
              J&K EduSetu
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 ml-1 inline-block animate-pulse" />
            </span>
            <span className="text-[9px] uppercase tracking-wider font-semibold text-emerald-600 dark:text-emerald-400 hidden sm:inline-block">
              Government of Jammu & Kashmir
            </span>
          </div>
        </Link>

        {/* Desktop Nav Links */}
        <div className="hidden md:flex items-center gap-6">
          {navItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
            >
              {item.name}
            </Link>
          ))}
        </div>

        {/* Controls: Active Model Pill, 2G Mode, Theme */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Active Fleet Indicator */}
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping inline-block" />
            <span>{isOffline ? "2G Offline Edge" : activeModelName}</span>
          </div>

          {/* ⚡ 2G Ultra-Lite Toggle Switch */}
          <button
            onClick={onToggleOffline}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 border",
              isOffline
                ? "bg-amber-500 text-white border-amber-600 shadow-md shadow-amber-500/25"
                : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20"
            )}
            title="Toggle 2G Mountain Edge Mode (Sub-10ms Verified Local Gazette)"
          >
            <Zap className={cn("w-3.5 h-3.5", isOffline ? "fill-white" : "text-amber-500")} />
            <span className="hidden sm:inline">2G Edge</span>
          </button>

          {/* Theme Switcher */}
          <ThemeToggle />

          {/* Mobile Menu Trigger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-1.5 rounded-full text-slate-700 dark:text-slate-300 hover:bg-emerald-500/10"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </motion.nav>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-16 inset-x-4 md:hidden glass-panel rounded-2xl p-4 shadow-xl border border-emerald-500/20 flex flex-col gap-3"
          >
            {navItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg text-sm font-medium text-slate-800 dark:text-slate-200 hover:bg-emerald-500/10"
              >
                {item.name}
              </Link>
            ))}
            <div className="pt-2 border-t border-emerald-500/20 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
              <span>Active Engine</span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                {isOffline ? "2G Offline Edge" : activeModelName}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};
