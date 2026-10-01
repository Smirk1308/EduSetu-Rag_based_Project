export const runtime = "nodejs";

function getBackendUrl() {
  const configuredUrl = process.env.BACKEND_API_URL;
  const backendUrl = configuredUrl || (
    process.env.NODE_ENV === "development" ? "http://127.0.0.1:8000" : ""
  );

  if (!backendUrl) {
    throw new Error("BACKEND_API_URL is not configured");
  }

  return new URL("/api/chat", backendUrl);
}

export async function POST(request: Request) {
  let backendUrl: URL;

  try {
    backendUrl = getBackendUrl();
  } catch {
    return Response.json(
      { detail: "The advisor service is not configured yet." },
      { status: 503 },
    );
  }

  try {
    const upstream = await fetch(backendUrl, {
      method: "POST",
      headers: {
        "Content-Type": request.headers.get("content-type") || "application/json",
        Accept: "text/event-stream",
      },
      body: await request.text(),
      cache: "no-store",
      signal: request.signal,
    });

    const headers = new Headers({
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
    });
    const contentType = upstream.headers.get("content-type");
    if (contentType) headers.set("Content-Type", contentType);

    return new Response(upstream.body, {
      status: upstream.status,
      headers,
    });
  } catch (error) {
    console.error("Advisor backend proxy failed:", error);
    return Response.json(
      { detail: "The advisor service is temporarily unavailable." },
      { status: 502 },
    );
  }
}
