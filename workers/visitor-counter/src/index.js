const DEFAULT_ALLOWED_ORIGINS = [
  "https://xn--9p4bn7dwj.com",
  "https://양수영.com",
  "http://127.0.0.1:4000",
  "http://localhost:4000",
];

export default {
  async fetch(request, env) {
    const corsHeaders = getCorsHeaders(request, env);

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders,
      });
    }

    if (request.method !== "GET") {
      return json({ error: "Method not allowed" }, 405, corsHeaders);
    }

    if (!env.VISITOR_STATS) {
      return json({ error: "VISITOR_STATS KV binding is missing" }, 500, corsHeaders);
    }

    const url = new URL(request.url);

    if (url.pathname === "/" || url.pathname === "/visit") {
      return handleVisit(request, env, corsHeaders);
    }

    if (url.pathname === "/stats") {
      return handleStats(env, corsHeaders);
    }

    if (url.pathname === "/health") {
      return json({ ok: true }, 200, corsHeaders);
    }

    return json({ error: "Not found" }, 404, corsHeaders);
  },
};

async function handleVisit(request, env, corsHeaders) {
  const todayKey = getKoreanDateKey();
  const visitorHash = await getVisitorHash(request, env);
  const dailyVisitorKey = `visitor:${todayKey}:${visitorHash}`;
  const totalVisitorKey = `visitor:all:${visitorHash}`;
  const dailySeen = await env.VISITOR_STATS.get(dailyVisitorKey);
  const totalSeen = await env.VISITOR_STATS.get(totalVisitorKey);

  let today = await getCount(env, `count:${todayKey}`);
  let total = await getCount(env, "count:total");

  if (!dailySeen) {
    today = await incrementCount(env, `count:${todayKey}`);
    await env.VISITOR_STATS.put(dailyVisitorKey, "1", {
      expirationTtl: 60 * 60 * 24 * 60,
    });
  }

  if (!totalSeen) {
    total = await incrementCount(env, "count:total");
    await env.VISITOR_STATS.put(totalVisitorKey, "1");
  }

  return json(
    {
      today,
      total,
      date: todayKey,
      countedToday: !dailySeen,
      countedTotal: !totalSeen,
    },
    200,
    corsHeaders
  );
}

async function handleStats(env, corsHeaders) {
  const todayKey = getKoreanDateKey();

  return json(
    {
      today: await getCount(env, `count:${todayKey}`),
      total: await getCount(env, "count:total"),
      date: todayKey,
    },
    200,
    corsHeaders
  );
}

async function getVisitorHash(request, env) {
  const ip =
    request.headers.get("CF-Connecting-IP") ||
    request.headers.get("X-Forwarded-For") ||
    "local";
  const userAgent = request.headers.get("User-Agent") || "unknown";
  const language = request.headers.get("Accept-Language") || "";
  const salt = env.VISITOR_SALT || "ysw1mst-blog-visitor-counter";
  const source = `${salt}|${ip}|${userAgent}|${language}`;
  const bytes = new TextEncoder().encode(source);
  const digest = await crypto.subtle.digest("SHA-256", bytes);

  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function getKoreanDateKey() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const values = parts.reduce((result, part) => {
    result[part.type] = part.value;
    return result;
  }, {});

  return `${values.year}-${values.month}-${values.day}`;
}

async function getCount(env, key) {
  const value = Number(await env.VISITOR_STATS.get(key));

  return Number.isFinite(value) ? value : 0;
}

async function incrementCount(env, key) {
  const next = (await getCount(env, key)) + 1;

  await env.VISITOR_STATS.put(key, String(next));
  return next;
}

function getCorsHeaders(request, env) {
  const configuredOrigins = String(env.ALLOWED_ORIGINS || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
  const allowedOrigins = configuredOrigins.length ? configuredOrigins : DEFAULT_ALLOWED_ORIGINS;
  const origin = request.headers.get("Origin");
  const allowOrigin = allowedOrigins.includes("*")
    ? "*"
    : allowedOrigins.includes(origin)
      ? origin
      : allowedOrigins[0];

  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Accept",
    "Access-Control-Max-Age": "86400",
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
