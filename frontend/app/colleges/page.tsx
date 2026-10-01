import { CollegeExplorer } from "@/components/college-explorer";
import { FloatingNavbar } from "@/components/ui/floating-navbar";

export const metadata = {
  title: "College Explorer | J&K EduSetu",
  description: "Explore J&K colleges, courses, seat information, and admission routes.",
};

export default function CollegesPage() {
  return <div className="min-h-screen bg-[var(--bg-body)] text-[var(--text-primary)]"><FloatingNavbar /><main className="mx-auto w-full max-w-7xl px-5 py-10 sm:px-8 sm:py-14"><CollegeExplorer /></main></div>;
}
