import {
  FALLBACK_COLLEGES,
  FALLBACK_DISTRICTS,
  FALLBACK_TYPES,
} from "@/data/colleges";
import { FALLBACK_SCHOLARSHIPS } from "@/data/scholarships";

export const runtime = "nodejs";

const ALLOWED_PATHS = new Set([
  "scholarships",
  "scholarships/match",
  "colleges",
  "colleges/options",
]);

function getBackendUrl(path: string, requestUrl: string) {
  const configuredUrl = process.env.BACKEND_API_URL;
  const baseUrl = configuredUrl || (
    process.env.NODE_ENV === "development" ? "http://127.0.0.1:8000" : ""
  );

  if (!baseUrl) return null;

  const request = new URL(requestUrl);
  const target = new URL(`/api/catalog/${path}`, baseUrl);
  target.search = request.search;
  return target;
}

function getLocalFallback(joinedPath: string, searchParams: URLSearchParams, bodyText?: string) {
  if (joinedPath === "scholarships") {
    return {
      items: FALLBACK_SCHOLARSHIPS,
      notice: "Eligibility is an estimate. Confirm current rules, dates, and documents on the official portal before applying.",
    };
  }

  if (joinedPath === "colleges/options") {
    return {
      districts: FALLBACK_DISTRICTS,
      types: FALLBACK_TYPES,
    };
  }

  if (joinedPath === "colleges") {
    const q = (searchParams.get("query") || "").toLowerCase().trim();
    const d = (searchParams.get("district") || "").toLowerCase().trim();
    const t = (searchParams.get("college_type") || "").toLowerCase().trim();
    const cat = (searchParams.get("category") || "").toLowerCase().trim();

    let items = FALLBACK_COLLEGES;
    if (d) items = items.filter((c) => c.district.toLowerCase() === d);
    if (t) items = items.filter((c) => c.type.toLowerCase() === t);
    if (q) {
      items = items.filter((c) =>
        c.name.toLowerCase().includes(q) ||
        c.district.toLowerCase().includes(q) ||
        c.type.toLowerCase().includes(q) ||
        c.branches.some(
          (b) =>
            b.name.toLowerCase().includes(q) ||
            (b.cutoff_info && b.cutoff_info.toLowerCase().includes(q))
        )
      );
    }
    if (cat) {
      items = items.filter((c) =>
        c.branches.some((b) => {
          if (cat === "om") return (b.seats_om ?? 0) > 0;
          if (cat === "sc") return (b.seats_sc ?? 0) > 0;
          if (cat === "st") return (b.seats_st ?? 0) > 0;
          if (cat === "rba") return (b.seats_rba ?? 0) > 0;
          return true;
        })
      );
    }

    return {
      items: items.slice(0, 30),
      total: items.length,
      notice: "Seat availability, fees, cut-offs, and admission routes change. Confirm them through the institution or current official notification.",
    };
  }

  if (joinedPath === "scholarships/match") {
    let profile: Record<string, unknown> = {};
    if (bodyText) {
      try {
        profile = JSON.parse(bodyText);
      } catch {
        // fallback to empty profile
      }
    }

    const items = FALLBACK_SCHOLARSHIPS.map((s) => {
      let score = 75;
      const reasons: string[] = [];
      if (profile.domicile === "J&K" && s.priority_for_jk) {
        score += 15;
        reasons.push("Priority scheme specifically for J&K students");
      }
      return {
        ...s,
        match_score: Math.min(score, 98),
        match_reasons: reasons.length ? reasons : ["General opportunity eligible for review"],
        missing_info: ["Verify portal for current session notification"],
      };
    });

    return {
      items: items.slice(0, 12),
      documents_checklist: [
        "Domicile Certificate (J&K)",
        "Class 12th Marks Certificate",
        "Family Annual Income Certificate",
        "Aadhaar Card",
        "Bank Account Passbook (Aadhaar-seeded)",
      ],
      notice: "This is a preliminary guide. Verify every requirement with the official provider.",
    };
  }

  return null;
}

async function proxy(request: Request, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  const joinedPath = path.join("/");
  if (!ALLOWED_PATHS.has(joinedPath)) {
    return Response.json({ detail: "Unknown catalogue endpoint." }, { status: 404 });
  }

  if ((joinedPath === "scholarships/match") !== (request.method === "POST")) {
    return Response.json({ detail: "Method not allowed." }, { status: 405 });
  }

  const requestUrl = new URL(request.url);
  const bodyText = request.method === "POST" ? await request.text() : undefined;
  const backendTarget = getBackendUrl(joinedPath, request.url);

  if (backendTarget) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const upstream = await fetch(backendTarget, {
        method: request.method,
        headers: request.method === "POST"
          ? { "Content-Type": request.headers.get("content-type") || "application/json" }
          : undefined,
        body: bodyText,
        cache: "no-store",
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (upstream.ok) {
        const data = await upstream.text();
        return new Response(data, {
          status: upstream.status,
          headers: {
            "Content-Type": upstream.headers.get("content-type") || "application/json",
            "Cache-Control": "no-store",
          },
        });
      }
      console.warn(`Upstream catalogue returned ${upstream.status}, serving local fallback.`);
    } catch (error) {
      console.warn("Catalogue backend proxy unavailable, serving local fallback:", error);
    }
  }

  // Graceful fallback to verified local catalogue
  const fallbackData = getLocalFallback(joinedPath, requestUrl.searchParams, bodyText);
  if (fallbackData) {
    return Response.json(fallbackData, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
        "X-EduSetu-Catalogue": "local-fallback",
      },
    });
  }

  return Response.json({ detail: "The catalogue service is temporarily unavailable." }, { status: 502 });
}

export async function GET(request: Request, context: { params: Promise<{ path: string[] }> }) {
  return proxy(request, context);
}

export async function POST(request: Request, context: { params: Promise<{ path: string[] }> }) {
  return proxy(request, context);
}
