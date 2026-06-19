const DEFAULT_ALLOWED_ORIGINS = [
  "https://xn--9p4bn7dwj.com",
  "https://swimming-yang.github.io",
  "http://127.0.0.1:4000",
  "http://localhost:4000",
];

const DEFAULT_GITHUB_OWNER = "Swimming-Yang";
const DEFAULT_GITHUB_REPO = "Swimming-Yang.github.io";
const DEFAULT_GITHUB_BRANCH = "main";
const DEFAULT_ADMIN_LOGIN = "Swimming-Yang";
const DEFAULT_SESSION_TTL_SECONDS = 60 * 60 * 4;
const MAX_POST_BODY_BYTES = 1024 * 1024;
const CODING_TOPICS = new Set(["csharp", "wpf", "unity", "cs", "ps"]);

export default {
  async fetch(request, env) {
    const corsHeaders = getCorsHeaders(request, env);
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders,
      });
    }

    if (url.pathname.startsWith("/admin/")) {
      return handleAdmin(request, env, corsHeaders);
    }

    if (request.method !== "GET") {
      return json({ error: "Method not allowed" }, 405, corsHeaders);
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

    if (url.pathname === "/health") {
      return json({ ok: true }, 200, corsHeaders);
    }

    return json({ error: "Not found" }, 404, corsHeaders);
  },
};

async function handleAdmin(request, env, corsHeaders) {
  const url = new URL(request.url);

  if (!env.VISITOR_STATS) {
    return json({ error: "VISITOR_STATS KV binding is missing" }, 500, corsHeaders);
  }

  try {
    if (url.pathname === "/admin/auth/start" && request.method === "GET") {
      return handleAuthStart(request, env);
    }

    if (url.pathname === "/admin/auth/callback" && request.method === "GET") {
      return handleAuthCallback(request, env);
    }

    if (url.pathname === "/admin/config" && request.method === "GET") {
      return json({ ok: true, config: getPublicAdminConfig(env) }, 200, corsHeaders);
    }

    if (url.pathname === "/admin/me" && request.method === "GET") {
      const session = await requireAdminSession(request, env, corsHeaders);

      if (session instanceof Response) {
        return session;
      }

      return json(
        {
          ok: true,
          user: session.user,
          config: getPublicAdminConfig(env),
        },
        200,
        corsHeaders
      );
    }

    if (url.pathname === "/admin/auth/logout" && request.method === "POST") {
      const session = await requireAdminSession(request, env, corsHeaders);

      if (session instanceof Response) {
        return session;
      }

      await env.VISITOR_STATS.delete(session.key);
      return json({ ok: true }, 200, corsHeaders);
    }

    if (url.pathname === "/admin/posts" && request.method === "POST") {
      const session = await requireAdminSession(request, env, corsHeaders);

      if (session instanceof Response) {
        return session;
      }

      return handleCreatePost(request, env, corsHeaders, session.user);
    }

    return json({ error: "Not found" }, 404, corsHeaders);
  } catch (error) {
    return json({ error: error.message || "Admin request failed" }, error.status || 500, corsHeaders);
  }
}

async function handleAuthStart(request, env) {
  const clientId = env.GITHUB_CLIENT_ID;

  if (!clientId || !env.GITHUB_CLIENT_SECRET) {
    return text("GitHub OAuth is not configured.", 500);
  }

  requireEnv(env, "SESSION_SIGNING_SECRET");

  const requestUrl = new URL(request.url);
  const redirectUri = getSafeAdminRedirectUri(requestUrl.searchParams.get("redirect_uri"), env);

  if (!redirectUri) {
    return text("Invalid redirect_uri.", 400);
  }

  const state = randomToken();
  const callbackUrl = new URL("/admin/auth/callback", request.url).toString();

  await env.VISITOR_STATS.put(
    `admin:oauth:${state}`,
    JSON.stringify({
      redirectUri,
      callbackUrl,
      createdAt: new Date().toISOString(),
    }),
    { expirationTtl: 600 }
  );

  const authorizeUrl = new URL("https://github.com/login/oauth/authorize");
  authorizeUrl.searchParams.set("client_id", clientId);
  authorizeUrl.searchParams.set("redirect_uri", callbackUrl);
  authorizeUrl.searchParams.set("state", state);
  authorizeUrl.searchParams.set("allow_signup", "false");

  return Response.redirect(authorizeUrl.toString(), 302);
}

async function handleAuthCallback(request, env) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const clientId = requireEnv(env, "GITHUB_CLIENT_ID");
  const clientSecret = requireEnv(env, "GITHUB_CLIENT_SECRET");

  requireEnv(env, "SESSION_SIGNING_SECRET");

  let redirectUri = getSafeAdminRedirectUri(env.ADMIN_REDIRECT_URI, env) || "https://xn--9p4bn7dwj.com/admin/";

  try {
    if (!code || !state) {
      throw new Error("missing_oauth_code");
    }

    const stateKey = `admin:oauth:${state}`;
    const stateValue = await env.VISITOR_STATS.get(stateKey, "json");

    if (!stateValue) {
      throw new Error("expired_oauth_state");
    }

    await env.VISITOR_STATS.delete(stateKey);
    redirectUri = stateValue.redirectUri;

    const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "User-Agent": "Swimming-Yang-blog-admin",
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: stateValue.callbackUrl,
      }),
    });
    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok || !tokenData.access_token) {
      throw new Error(tokenData.error || "github_token_exchange_failed");
    }

    const githubUser = await fetchGitHubUser(tokenData.access_token);
    const allowedLogins = getAllowedAdminLogins(env);

    if (!allowedLogins.includes(String(githubUser.login || "").toLowerCase())) {
      throw new Error("not_allowed");
    }

    const token = randomToken(48);
    const tokenHash = await hashSessionToken(token, env);
    const ttl = getSessionTtl(env);
    const user = {
      login: githubUser.login,
      name: githubUser.name || githubUser.login,
      avatarUrl: githubUser.avatar_url || "",
      htmlUrl: githubUser.html_url || "",
    };

    await env.VISITOR_STATS.put(
      `admin:session:${tokenHash}`,
      JSON.stringify({
        user,
        createdAt: new Date().toISOString(),
      }),
      { expirationTtl: ttl }
    );

    return Response.redirect(withHash(redirectUri, { admin_token: token }), 302);
  } catch (error) {
    return Response.redirect(withHash(redirectUri, { admin_error: error.message || "auth_failed" }), 302);
  }
}

async function fetchGitHubUser(accessToken) {
  const response = await fetch("https://api.github.com/user", {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${accessToken}`,
      "User-Agent": "Swimming-Yang-blog-admin",
      "X-GitHub-Api-Version": "2026-03-10",
    },
  });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "github_user_failed");
  }

  return data;
}

async function handleCreatePost(request, env, corsHeaders, user) {
  requireEnv(env, "GITHUB_CONTENT_TOKEN");

  const input = await readJson(request);
  const post = normalizePostInput(input);
  const markdown = buildPostMarkdown(post);
  const path = getPostPath(post);
  const result = await createGitHubFile(env, path, markdown, post, user);

  return json(
    {
      ok: true,
      path,
      title: post.title,
      htmlUrl: result.content?.html_url || result.commit?.html_url || "",
      commitUrl: result.commit?.html_url || "",
      commitSha: result.commit?.sha || "",
    },
    201,
    corsHeaders
  );
}

async function createGitHubFile(env, path, markdown, post, user) {
  const owner = env.GITHUB_OWNER || DEFAULT_GITHUB_OWNER;
  const repo = env.GITHUB_REPO || DEFAULT_GITHUB_REPO;
  const branch = env.GITHUB_BRANCH || DEFAULT_GITHUB_BRANCH;
  const url = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents/${encodePath(path)}`;
  const response = await fetch(url, {
    method: "PUT",
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${requireEnv(env, "GITHUB_CONTENT_TOKEN")}`,
      "Content-Type": "application/json",
      "User-Agent": "Swimming-Yang-blog-admin",
      "X-GitHub-Api-Version": "2026-03-10",
    },
    body: JSON.stringify({
      branch,
      message: `post: ${post.title}`,
      content: base64Encode(markdown),
      committer: {
        name: env.GITHUB_COMMITTER_NAME || user.name || user.login,
        email: env.GITHUB_COMMITTER_EMAIL || "ysw1mst@gmail.com",
      },
      author: {
        name: env.GITHUB_AUTHOR_NAME || user.name || user.login,
        email: env.GITHUB_AUTHOR_EMAIL || env.GITHUB_COMMITTER_EMAIL || "ysw1mst@gmail.com",
      },
    }),
  });
  const data = await response.json();

  if (!response.ok) {
    const detail = data.message || "github_create_file_failed";
    throw new HttpError(detail, response.status);
  }

  return data;
}

function normalizePostInput(input) {
  const title = cleanInline(input.title).slice(0, 140);
  const category = cleanInline(input.category || "life").toLowerCase();
  const topic = cleanInline(input.topic || "").toLowerCase();
  const body = String(input.body || "").trim();
  const description = cleanInline(input.description || "").slice(0, 220);
  const image = cleanInline(input.image || "").slice(0, 240);
  const tags = normalizeTags(input.tags);
  const date = formatJekyllDate(input.date);
  const datePrefix = date.slice(0, 10);
  const slug = sanitizeSlug(input.slug || title);

  if (!title) {
    throw new HttpError("Title is required.", 400);
  }

  if (!body) {
    throw new HttpError("Body is required.", 400);
  }

  if (new TextEncoder().encode(body).length > MAX_POST_BODY_BYTES) {
    throw new HttpError("Post body is too large.", 413);
  }

  if (!["life", "coding"].includes(category)) {
    throw new HttpError("Category must be life or coding.", 400);
  }

  if (category === "coding" && !CODING_TOPICS.has(topic)) {
    throw new HttpError("A valid coding topic is required.", 400);
  }

  return {
    title,
    category,
    topic: category === "coding" ? topic : "",
    body,
    description,
    image,
    tags,
    date,
    datePrefix,
    slug,
  };
}

function buildPostMarkdown(post) {
  const categories = post.category === "coding" ? ["coding", post.topic] : ["life"];
  const lines = [
    "---",
    "layout: post",
    `title: ${yamlString(post.title)}`,
    `date: ${post.date}`,
    `categories: [${categories.map(yamlString).join(", ")}]`,
  ];

  if (post.topic) {
    lines.push(`topic: ${yamlString(post.topic)}`);
  }

  if (post.description) {
    lines.push(`description: ${yamlString(post.description)}`);
  }

  if (post.image) {
    lines.push(`image: ${yamlString(post.image)}`);
  }

  if (post.tags.length) {
    lines.push(`tags: [${post.tags.map(yamlString).join(", ")}]`);
  }

  lines.push("---", "", post.body, "");
  return lines.join("\n");
}

function getPostPath(post) {
  if (post.category === "coding") {
    return `_posts/coding/${post.topic}/${post.datePrefix}-${post.slug}.md`;
  }

  return `_posts/life/${post.datePrefix}-${post.slug}.md`;
}

async function requireAdminSession(request, env, corsHeaders) {
  const auth = request.headers.get("Authorization") || "";
  const match = auth.match(/^Bearer\s+(.+)$/i);

  if (!match) {
    return json({ error: "Unauthorized" }, 401, corsHeaders);
  }

  const tokenHash = await hashSessionToken(match[1], env);
  const key = `admin:session:${tokenHash}`;
  const session = await env.VISITOR_STATS.get(key, "json");

  if (!session || !session.user) {
    return json({ error: "Session expired" }, 401, corsHeaders);
  }

  return {
    key,
    user: session.user,
  };
}

async function handleVisit(request, env, corsHeaders) {
  const todayKey = getKoreanDateKey();
  const visitorHash = await getVisitorHash(request, env);
  const dailyVisitorKey = `visitor:${todayKey}:${visitorHash}`;
  const totalVisitorKey = `visitor:all:${visitorHash}`;
  const dailySeen = await env.VISITOR_STATS.get(dailyVisitorKey);
  const totalSeen = await env.VISITOR_STATS.get(totalVisitorKey);

  if (!dailySeen) {
    await env.VISITOR_STATS.put(dailyVisitorKey, "1", {
      expirationTtl: 60 * 60 * 24 * 60,
    });
  }

  if (!totalSeen) {
    await env.VISITOR_STATS.put(totalVisitorKey, "1");
  }

  const [today, total] = await Promise.all([
    countKeys(env, `visitor:${todayKey}:`),
    countKeys(env, "visitor:all:"),
  ]);

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
      today: await countKeys(env, `visitor:${todayKey}:`),
      total: await countKeys(env, "visitor:all:"),
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
  const salt = requireEnv(env, "VISITOR_SALT");
  const source = `${salt}|${ip}|${userAgent}|${language}`;
  const bytes = new TextEncoder().encode(source);
  const digest = await crypto.subtle.digest("SHA-256", bytes);

  return hex(digest);
}

function getPublicAdminConfig(env) {
  return {
    owner: env.GITHUB_OWNER || DEFAULT_GITHUB_OWNER,
    repo: env.GITHUB_REPO || DEFAULT_GITHUB_REPO,
    branch: env.GITHUB_BRANCH || DEFAULT_GITHUB_BRANCH,
    adminLogin: getPrimaryAdminLogin(env),
    categories: ["life", "coding"],
    codingTopics: [...CODING_TOPICS],
  };
}

function getAllowedAdminLogins(env) {
  return String(env.ADMIN_GITHUB_LOGIN || DEFAULT_ADMIN_LOGIN)
    .split(",")
    .map((login) => login.trim().toLowerCase())
    .filter(Boolean);
}

function getPrimaryAdminLogin(env) {
  return String(env.ADMIN_GITHUB_LOGIN || DEFAULT_ADMIN_LOGIN).split(",")[0].trim() || DEFAULT_ADMIN_LOGIN;
}

function getSessionTtl(env) {
  const ttl = Number(env.ADMIN_SESSION_TTL_SECONDS);

  return Number.isFinite(ttl) && ttl > 0 ? ttl : DEFAULT_SESSION_TTL_SECONDS;
}

function requireEnv(env, name) {
  const value = env[name];

  if (!value) {
    throw new HttpError(`${name} environment variable is missing`, 500);
  }

  return value;
}

function getSafeAdminRedirectUri(value, env) {
  if (!value) {
    return null;
  }

  try {
    const url = new URL(value);
    const allowedOrigins = getAllowedOrigins(env);

    if (!allowedOrigins.includes("*") && !allowedOrigins.includes(url.origin)) {
      return null;
    }

    if (!url.pathname.startsWith("/admin")) {
      return null;
    }

    url.hash = "";
    return url.toString();
  } catch {
    return null;
  }
}

function getAllowedOrigins(env) {
  const configuredOrigins = String(env.ALLOWED_ORIGINS || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  return configuredOrigins.length ? configuredOrigins : DEFAULT_ALLOWED_ORIGINS;
}

function getCorsHeaders(request, env) {
  const allowedOrigins = getAllowedOrigins(env);
  const origin = request.headers.get("Origin");
  const allowOrigin = allowedOrigins.includes("*")
    ? "*"
    : allowedOrigins.includes(origin)
      ? origin
      : allowedOrigins[0];

  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Accept, Authorization",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
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

async function countKeys(env, prefix) {
  let cursor;
  let count = 0;

  do {
    const result = await env.VISITOR_STATS.list({ prefix, cursor });
    count += result.keys.length;
    cursor = result.cursor;

    if (result.list_complete) {
      cursor = undefined;
    }
  } while (cursor);

  return count;
}

async function readJson(request) {
  const textValue = await request.text();

  if (new TextEncoder().encode(textValue).length > MAX_POST_BODY_BYTES + 4096) {
    throw new HttpError("Request body is too large.", 413);
  }

  try {
    return JSON.parse(textValue);
  } catch {
    throw new HttpError("Invalid JSON.", 400);
  }
}

function normalizeTags(tags) {
  const value = Array.isArray(tags) ? tags.join(",") : String(tags || "");

  return value
    .split(",")
    .map((tag) => cleanInline(tag).slice(0, 40))
    .filter(Boolean)
    .slice(0, 12);
}

function cleanInline(value) {
  return String(value || "")
    .replace(/[\r\n\t]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function sanitizeSlug(value) {
  const slug = String(value || "")
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70);

  return slug || `post-${Date.now()}`;
}

function formatJekyllDate(value) {
  const input = String(value || "").trim();
  const match = input.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T\s](\d{2}):(\d{2}))?/);

  if (match) {
    const hour = match[4] || "00";
    const minute = match[5] || "00";

    return `${match[1]}-${match[2]}-${match[3]} ${hour}:${minute}:00 +0900`;
  }

  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date());
  const values = parts.reduce((result, part) => {
    result[part.type] = part.value;
    return result;
  }, {});

  return `${values.year}-${values.month}-${values.day} ${values.hour}:${values.minute}:00 +0900`;
}

function yamlString(value) {
  return JSON.stringify(String(value));
}

function base64Encode(value) {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  const chunkSize = 0x8000;

  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.slice(i, i + chunkSize));
  }

  return btoa(binary);
}

function encodePath(path) {
  return path
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/");
}

function withHash(url, params) {
  const result = new URL(url);
  const hash = new URLSearchParams(params);

  result.hash = hash.toString();
  return result.toString();
}

function randomToken(size = 32) {
  const bytes = new Uint8Array(size);
  crypto.getRandomValues(bytes);

  return base64Url(bytes);
}

async function hashSessionToken(token, env) {
  const secret = requireEnv(env, "SESSION_SIGNING_SECRET");
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`${secret}:${token}`));

  return hex(digest);
}

function base64Url(bytes) {
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function hex(buffer) {
  return [...new Uint8Array(buffer)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function text(message, status) {
  return new Response(message, {
    status,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
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

class HttpError extends Error {
  constructor(message, status = 500) {
    super(message);
    this.status = status;
  }
}
