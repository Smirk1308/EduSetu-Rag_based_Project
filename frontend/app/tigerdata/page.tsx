import { FloatingNavbar } from "@/components/ui/floating-navbar";
import { TigerDataConsole } from "@/components/tigerdata-console";

export const metadata = {
  title: "Tiger Data Vector Search Console | J&K EduSetu",
  description:
    "Time-aware vector search for education policies, scholarships, and admissions powered by Tiger Data PostgreSQL, TimescaleDB hypertables, pgvector, and pgvectorscale DiskANN.",
};

export default function TigerDataPage() {
  return (
    <div className="min-h-screen bg-[var(--bg-body)] text-[var(--text-primary)]">
      <FloatingNavbar />
      <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <TigerDataConsole />
      </main>
    </div>
  );
}
