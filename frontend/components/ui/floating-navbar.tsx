"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  FileText,
  GraduationCap,
  Home,
  Landmark,
  Menu,
  Sparkles,
  X,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

const navItems = [
  { name: "Home", href: "/", icon: Home },
  { name: "Scholarships", href: "/scholarships", icon: GraduationCap },
  { name: "Colleges & Seats", href: "/colleges", icon: Landmark },
  { name: "Admission planner", href: "/admissions", icon: FileText },
  { name: "Ask advisor", href: "/#advisor", icon: Sparkles },
];

export const FloatingNavbar = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Close sidebar on ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSidebarOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Prevent background scrolling when sidebar is open
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [sidebarOpen]);

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-[var(--line)] bg-[var(--bg-body)]/85 backdrop-blur-md shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
        <div className="mx-auto flex min-h-[76px] max-w-7xl items-center justify-between gap-4 px-4 sm:px-8">
          <Link
            href="/"
            className="flex min-w-0 items-center gap-3 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)]"
          >
            <div className="relative flex h-10 w-auto shrink-0 items-center justify-center">
              <Image
                src="/logo.png"
                alt="J&K EduSetu Logo"
                width={36}
                height={48}
                priority
                className="h-9 w-auto object-contain"
              />
            </div>
            <span className="min-w-0">
              <span className="font-display block whitespace-nowrap text-lg font-bold leading-tight tracking-tight sm:text-xl">
                J&amp;K EduSetu
              </span>
              <span className="block text-xs text-[var(--text-secondary)]">
                Independent student project
              </span>
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <nav aria-label="Main navigation" className="hidden items-center gap-5 lg:flex">
            {navItems.map((item) => (
              <Link key={item.name} href={item.href} className="nav-link">
                {item.name}
              </Link>
            ))}
          </nav>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <div className="hidden sm:block">
              <ThemeToggle />
            </div>
            <Link href="/#advisor" className="button-primary nav-cta">
              <span className="hidden sm:inline">Ask advisor</span>
              <span className="sm:hidden">Ask</span>
              <ArrowRight aria-hidden="true" className="hidden h-4 w-4 sm:block" />
            </Link>

            {/* 3-Lines Sidebar Hamburger Button */}
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="icon-button lg:hidden"
              aria-label="Open navigation sidebar"
              aria-expanded={sidebarOpen}
              aria-controls="navigation-sidebar"
            >
              <Menu aria-hidden="true" className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Dimmed Backdrop Overlay */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
          aria-hidden="true"
        />
      )}

      {/* Slide-in Navigation Sidebar Drawer */}
      <aside
        id="navigation-sidebar"
        aria-label="Mobile navigation sidebar"
        className={`fixed inset-y-0 right-0 z-50 flex w-full max-w-xs flex-col border-l border-[var(--line)] bg-[var(--bg-surface)] p-6 shadow-2xl transition-transform duration-300 ease-in-out sm:max-w-sm ${
          sidebarOpen ? "translate-x-0" : "translate-x-full pointer-events-none"
        }`}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between border-b border-[var(--line)] pb-4">
          <div className="flex items-center gap-3">
            <div className="relative flex h-10 w-auto shrink-0 items-center justify-center">
              <Image
                src="/logo.png"
                alt="J&K EduSetu Logo"
                width={32}
                height={42}
                className="h-9 w-auto object-contain"
              />
            </div>
            <div>
              <span className="font-display block text-base font-bold text-[var(--text-primary)]">
                J&amp;K EduSetu
              </span>
              <span className="block text-xs text-[var(--text-secondary)]">
                Independent student project
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="icon-button"
            aria-label="Close navigation sidebar"
          >
            <X aria-hidden="true" className="h-5 w-5" />
          </button>
        </div>

        {/* Sidebar Links */}
        <nav className="mt-6 flex flex-1 flex-col gap-2 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className="flex items-center justify-between rounded-xl border border-transparent px-4 py-3 text-sm font-semibold text-[var(--text-primary)] transition-all hover:border-[var(--line)] hover:bg-[var(--bg-soft)] hover:text-[var(--brand)]"
              >
                <div className="flex items-center gap-3">
                  <Icon className="h-4 w-4 text-[var(--brand)]" />
                  <span>{item.name}</span>
                </div>
                <ArrowRight aria-hidden="true" className="h-4 w-4 opacity-40" />
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer Controls */}
        <div className="border-t border-[var(--line)] pt-5 flex flex-col gap-4">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-semibold text-[var(--text-secondary)]">Day / Night theme</span>
            <ThemeToggle />
          </div>
          <Link
            href="/#advisor"
            onClick={() => setSidebarOpen(false)}
            className="button-primary w-full text-center"
          >
            Ask EduSetu Advisor <ArrowRight aria-hidden="true" className="h-4 w-4" />
          </Link>
        </div>
      </aside>
    </>
  );
};
