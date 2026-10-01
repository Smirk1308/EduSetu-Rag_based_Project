import { FloatingNavbar } from "@/components/ui/floating-navbar";
import { ScholarshipFinder } from "@/components/scholarship-finder";

export const metadata = {
  title: "Scholarship Finder | J&K EduSetu",
  description: "Explore scholarships and estimate possible eligibility for students in Jammu and Kashmir.",
};

export default function ScholarshipsPage() {
  return <div className="min-h-screen bg-[var(--bg-body)] text-[var(--text-primary)]"><FloatingNavbar /><main className="mx-auto w-full max-w-7xl px-5 py-10 sm:px-8 sm:py-14"><ScholarshipFinder /></main></div>;
}
