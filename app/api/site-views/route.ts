import { NextRequest, NextResponse } from "next/server";

const VIEW_KEY = "total_views";
const SESSION_COOKIE = "archive-view-counted";

type SupabaseConfig = {
  url: string;
  key: string;
};

export async function GET() {
  try {
    const total = await readTotalViews(getSupabaseConfig());
    return jsonResponse(total);
  } catch (error) {
    logServerError(error);
    return unavailableResponse();
  }
}

export async function POST(request: NextRequest) {
  if (!hasAllowedOrigin(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const config = getSupabaseConfig();
    const alreadyCounted = request.cookies.has(SESSION_COOKIE);
    const total = alreadyCounted
      ? await readTotalViews(config)
      : await incrementTotalViews(config);
    const response = jsonResponse(total);

    if (!alreadyCounted) {
      response.cookies.set(SESSION_COOKIE, "1", {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
      });
    }

    return response;
  } catch (error) {
    logServerError(error);
    return unavailableResponse();
  }
}

function getSupabaseConfig(): SupabaseConfig {
  const url = process.env.SUPABASE_URL?.replace(/\/$/, "");
  const key =
    process.env.SUPABASE_SECRET_KEY ??
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error("Site view storage is not configured.");
  }

  return { url, key };
}

async function readTotalViews(config: SupabaseConfig) {
  const response = await supabaseFetch(
    config,
    `/rest/v1/site_stats?key=eq.${VIEW_KEY}&select=value&limit=1`
  );
  const rows = (await response.json()) as Array<{ value?: number | string }>;
  return parseCount(rows[0]?.value);
}

async function incrementTotalViews(config: SupabaseConfig) {
  const response = await supabaseFetch(
    config,
    "/rest/v1/rpc/increment_site_view",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    }
  );
  return parseCount(await response.json());
}

async function supabaseFetch(
  config: SupabaseConfig,
  path: string,
  init: RequestInit = {}
) {
  const headers = new Headers(init.headers);
  headers.set("apikey", config.key);
  headers.set("Authorization", `Bearer ${config.key}`);

  const response = await fetch(`${config.url}${path}`, {
    ...init,
    cache: "no-store",
    headers,
  });

  if (!response.ok) {
    throw new Error(`Site view storage returned HTTP ${response.status}.`);
  }

  return response;
}

function parseCount(value: unknown) {
  const total = Number(value);
  if (!Number.isSafeInteger(total) || total < 0) {
    throw new Error("Site view storage returned an invalid count.");
  }
  return total;
}

function jsonResponse(total: number) {
  return NextResponse.json(
    { total },
    { headers: { "Cache-Control": "no-store" } }
  );
}

function unavailableResponse() {
  return NextResponse.json(
    { total: null, error: "Site view count unavailable" },
    { status: 503, headers: { "Cache-Control": "no-store" } }
  );
}

function hasAllowedOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (process.env.NODE_ENV !== "production") return true;
  return origin === request.nextUrl.origin;
}

function logServerError(error: unknown) {
  if (process.env.NODE_ENV !== "production") {
    console.warn("[site views]", error);
  }
}
