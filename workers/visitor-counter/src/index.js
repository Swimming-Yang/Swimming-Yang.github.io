const DEFAULT_ALLOWED_ORIGINS = [
  "https://xn--9p4bn7dwj.com",
  "https://www.xn--9p4bn7dwj.com",
  "https://swimming-yang.github.io",
  "http://127.0.0.1:4000",
  "http://localhost:4000",
];

const DAILY_VISITOR_TTL_SECONDS = 60 * 60 * 24 * 400;

export default {
  async fetch(request, env) {
    const corsHeaders = getCorsHeaders(request, env);
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    if (request.method !== "GET") {
      return json({ error: "Method not allowed" }, 405, corsHeaders);
    }

    if (url.pathname === "/health") {
      return json({ ok: true }, 200, corsHeaders);
    }

    if (!env.VISITOR_STATS) {
      return json({ error: "VISITOR_STATS KV binding is missing" }, 500, corsHeaders);
    }

    if (url.pathname === "/" || url.pathname === "/visit") {
      return handleVisit(request, env, corsHeaders);
    }

    if (url.pathname === "/stats") {
      return handleStats(env, corsHeaders);
    }

    return json({ error: "Not found" }, 404, corsHeaders);
  },
};

async function handleVisit(request, env, corsHeaders) {
  const today = getKoreanDateKey();
  const visitorHash = await getVisitorHash(request, env);
  const dailyKey = `visitor:${today}:${visitorHash}`;
  const totalKey = `visitor:all:${visitorHash}`;

  await Promise.all([
    env.VISITOR_STATS.put(dailyKey, "1", { expirationTtl: DAILY_VISITOR_TTL_SECONDS }),
    env.VISITOR_STATS.put(totalKey, "1"),
  ]);

  const [todayCount, totalCount] = await Promise.all([
    countKeys(env, `visitor:${today}:`),
    countKeys(env, "visitor:all:"),
  ]);

  return json({ today: todayCount, total: totalCount }, 200, corsHeaders);
}

async function handleStats(env, corsHeaders) {
  const today = getKoreanDateKey();
  const [todayCount, totalCount] = await Promise.all([
    countKeys(env, `visitor:${today}:`),
    countKeys(env, "visitor:all:"),
  ]);

  return json({ today: todayCount, total: totalCount }, 200, corsHeaders);
}

async function getVisitorHash(request, env) {
  const source = [
    request.headers.get("CF-Connecting-IP") || request.headers.get("X-Forwarded-For") || "",
    request.headers.get("User-Agent") || "",
    env.VISITOR_SALT || "",
  ].join("|");
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(source));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function countKeys(env, prefix) {
  let cursor;
  let count = 0;

  do {
    const result = await env.VISITOR_STATS.list({ prefix, cursor });
    count += result.keys.length;
    cursor = result.list_complete ? undefined : result.cursor;
  } while (cursor);

  return count;
}

function getKoreanDateKey() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function getAllowedOrigins(env) {
  const configured = String(env.ALLOWED_ORIGINS || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
  return configured.length ? configured : DEFAULT_ALLOWED_ORIGINS;
}

function getCorsHeaders(request, env) {
  const origin = request.headers.get("Origin");
  const allowedOrigins = getAllowedOrigins(env);
  const allowedOrigin = origin && allowedOrigins.includes(origin) ? origin : allowedOrigins[0];

  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    Vary: "Origin",
  };
}

function json(data, status, corsHeaders) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
