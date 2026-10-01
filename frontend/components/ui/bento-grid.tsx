"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { ArrowUpRight } from "lucide-react";

export const BentoGrid = ({
  className,
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) => {
  return (
    <div
      className={cn(
        "grid md:auto-rows-[18rem] grid-cols-1 md:grid-cols-3 gap-4 max-w-6xl mx-auto",
        className
      )}
    >
      {children}
    </div>
  );
};

export const BentoGridItem = ({
  id,
  className,
  title,
  description,
  header,
  icon,
  badge,
  onClick,
}: {
  id?: string;
  className?: string;
  title?: string | React.ReactNode;
  description?: string | React.ReactNode;
  header?: React.ReactNode;
  icon?: React.ReactNode;
  badge?: string;
  onClick?: () => void;
}) => {
  return (
    <div
      id={id}
      onClick={onClick}
      className={cn(
        "row-span-1 rounded-2xl group/bento hover:shadow-xl transition duration-200 shadow-input dark:shadow-none p-5 dark:bg-[#0b291f] bg-white border border-emerald-500/15 justify-between flex flex-col space-y-4 hover:border-emerald-500/40 relative overflow-hidden cursor-pointer",
        className
      )}
    >
      {/* Background Glow */}
      <div className="absolute -top-12 -right-12 w-28 h-28 bg-emerald-500/10 dark:bg-emerald-400/10 rounded-full blur-2xl group-hover/bento:scale-150 transition duration-300 pointer-events-none" />

      {header}

      <div className="group-hover/bento:translate-x-1 transition duration-200">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
            {icon}
            {badge && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                {badge}
              </span>
            )}
          </div>
          <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover/bento:text-emerald-500 group-hover/bento:translate-x-0.5 group-hover/bento:-translate-y-0.5 transition duration-200" />
        </div>

        <div className="font-display font-bold text-slate-900 dark:text-slate-100 text-base mb-1">
          {title}
        </div>
        <div className="font-normal text-slate-600 dark:text-slate-300 text-xs leading-relaxed">
          {description}
        </div>
      </div>
    </div>
  );
};
