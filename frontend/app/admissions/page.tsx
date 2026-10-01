import { AdmissionChecklist } from "@/components/admission-checklist";
import { FloatingNavbar } from "@/components/ui/floating-navbar";

export const metadata = {
  title: "Admission Planner | J&K EduSetu",
  description: "Plan your J&K admission preparation with a clear, source-first checklist.",
};

export default function AdmissionsPage() {
  return <div className="min-h-screen bg-[var(--bg-body)] text-[var(--text-primary)]"><FloatingNavbar /><main className="mx-auto w-full max-w-7xl px-5 py-10 sm:px-8 sm:py-14"><AdmissionChecklist /></main></div>;
}
