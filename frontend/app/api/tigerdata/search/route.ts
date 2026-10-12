export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: any = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const query = String(body.query || "PMSSS scholarship eligibility and engineering colleges");
  const metric = String(body.metric || "cosine");
  const category = String(body.category || "all");
  const startDate = body.start_date || "2025-01-01";
  const endDate = body.end_date || "2026-12-31";
  const timeWeight = typeof body.time_decay_weight === "number" ? body.time_decay_weight : 0.3;
  const topK = typeof body.top_k === "number" ? body.top_k : 5;

  const configuredUrl = process.env.BACKEND_API_URL;
  const baseUrl = configuredUrl || (
    process.env.NODE_ENV === "development" ? "http://127.0.0.1:8000" : ""
  );

  if (baseUrl) {
    try {
      const upstream = await fetch(new URL("/api/tigerdata/search", baseUrl), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          query,
          metric,
          category,
          start_date: startDate,
          end_date: endDate,
          time_decay_weight: timeWeight,
          top_k: topK,
        }),
        cache: "no-store",
        signal: AbortSignal.timeout(4500),
      });

      if (upstream.ok) {
        const data = await upstream.json();
        return Response.json(data);
      }
    } catch {
      // Fall through to safe demo calculation
    }
  }

  // Safe client-facing demonstration corpus
  const corpus = [
    {
      id: "e9a03b54-1b32-475a-bc81-8b29e05739cf",
      title: "AICTE PMSSS 2025–26: J&K Special Scholarship Scheme Notification",
      source: "AICTE_PMSSS_2025_26_Notification.pdf",
      source_type: "Official Notification",
      category: "scholarship",
      academic_cycle: "2025-26",
      recorded_at: "2025-05-10T10:00:00+00:00",
      content: "Prime Minister’s Special Scholarship Scheme (PMSSS) for Jammu, Kashmir & Ladakh students for the academic session 2025–26. Eligibility: domicile of J&K, passed 10+2 from JKBOSE or CBSE schools in J&K, family income ≤ ₹8.00 Lakh per annum. Up to ₹1.25 Lakh/yr academic fee for general degree courses, ₹3.00 Lakh/yr for professional engineering degrees, plus ₹1.00 Lakh maintenance allowance.",
    },
    {
      id: "2bc9831a-5c24-4f01-92b1-0985da3811aa",
      title: "NIT Srinagar & GCET Admissions: Opening Cutoffs & Seat Matrix",
      source: "JKBOPEE_CET_Seat_Matrix_2025.pdf",
      source_type: "Seat Matrix & Cutoffs",
      category: "engineering",
      academic_cycle: "2025-26",
      recorded_at: "2025-06-15T09:30:00+00:00",
      content: "Engineering admissions across Government College of Engineering & Technology (GCET Safapora & Jammu) and NIT Srinagar. Home State quota (50%) applicable at NIT Srinagar via JoSAA/CSAB. JKBOPEE CET engineering counseling rounds commence following entrance examinations with updated category reservations.",
    },
    {
      id: "8f4103ab-62e9-4e78-bc52-7b0d911b33ce",
      title: "JKBOPEE Medical Admissions (NEET-UG): GMC Srinagar & GMC Jammu",
      source: "JKBOPEE_NEET_UG_Information_Brochure_2025.pdf",
      source_type: "Admissions Circular",
      category: "medical",
      academic_cycle: "2025-26",
      recorded_at: "2025-06-20T11:00:00+00:00",
      content: "Admission to MBBS, BDS, and BAMS courses across Government Medical Colleges (GMC Srinagar, GMC Jammu, GMC Anantnag, GMC Baramulla). Domicile mandatory for 85% UT quota seats. Counseling rounds conducted by JKBOPEE under published merit rankings.",
    },
    {
      id: "4d7920ec-9a1b-4177-8025-ec5418b7062a",
      title: "Jammu & Kashmir S.O. 176 Reservation Rules & Quota Breakdown",
      source: "JK_Gazette_SO_176_Reservation_Rules_2024.pdf",
      source_type: "Gazette Notification",
      category: "reservation",
      academic_cycle: "2024-25",
      recorded_at: "2024-03-15T14:00:00+00:00",
      content: "Official gazette notification detailing the Jammu and Kashmir Reservation Rules framework. Covers Open Merit (OM), Scheduled Tribes (ST-1 & ST-2), Resident of Backward Area (RBA), Other Backward Classes (OBC), Scheduled Castes (SC), and Economically Weaker Sections (EWS).",
    },
  ];

  // Filter by category
  let filtered = corpus;
  if (category && category !== "all") {
    filtered = filtered.filter((item) => item.category === category);
  }

  // Filter by date range
  const startMs = new Date(startDate).getTime();
  const endMs = new Date(endDate).getTime();
  filtered = filtered.filter((item) => {
    const itemMs = new Date(item.recorded_at).getTime();
    return itemMs >= startMs && itemMs <= endMs;
  });

  if (filtered.length === 0) {
    filtered = corpus.slice(0, 2);
  }

  const alpha = 1.0 - timeWeight;
  const beta = timeWeight;

  const results = filtered.map((item, idx) => {
    const baseDistance = metric === "l2" ? 0.38 + idx * 0.08 : 0.065 + idx * 0.045;
    const semSim = metric === "l2" ? 1.0 / (1.0 + baseDistance) : 1.0 - baseDistance;
    const daysOld = Math.max(0, (Date.now() - new Date(item.recorded_at).getTime()) / (1000 * 60 * 60 * 24));
    const freshness = Math.exp(-0.00385 * daysOld); // 180-day half-life decay
    const hybrid = (alpha * semSim) + (beta * freshness);

    return {
      id: item.id,
      title: item.title,
      source: item.source,
      source_type: item.source_type,
      category: item.category,
      academic_cycle: item.academic_cycle,
      recorded_at: item.recorded_at,
      distance: Math.round(baseDistance * 1000) / 1000,
      semantic_similarity: Math.round(semSim * 1000) / 1000,
      time_freshness: Math.round(freshness * 1000) / 1000,
      hybrid_score: Math.round(hybrid * 1000) / 1000,
      content: item.content,
      metric_used: metric,
    };
  });

  results.sort((a, b) => b.hybrid_score - a.hybrid_score);

  return Response.json({
    status: "success",
    connected: false,
    mode: "preview/seeded",
    latency_ms: 3.2,
    metric,
    results: results.slice(0, topK),
  });
}
