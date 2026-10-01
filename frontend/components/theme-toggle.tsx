"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/theme-provider";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  const isDark = theme === "dark";

  return (
    <button
      onClick={toggleTheme}
      suppressHydrationWarning
      className="icon-button relative overflow-hidden transition-all duration-200 hover:scale-105 active:scale-95 hover:bg-[var(--bg-soft)]"
      aria-label="Toggle theme"
      title={isDark ? "Switch to Day Mode" : "Switch to Night Mode"}
    >
      <div className="relative h-4 w-4">
        <Sun
          aria-hidden="true"
          className={`absolute inset-0 h-4 w-4 text-[var(--accent)] transition-all duration-300 ${
            isDark ? "rotate-0 scale-100 opacity-100" : "-rotate-90 scale-0 opacity-0"
          }`}
        />
        <Moon
          aria-hidden="true"
          className={`absolute inset-0 h-4 w-4 text-[var(--brand)] transition-all duration-300 ${
            isDark ? "rotate-90 scale-0 opacity-0" : "rotate-0 scale-100 opacity-100"
          }`}
        />
      </div>
    </button>
  );
}
