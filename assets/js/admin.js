(function () {
  const root = document.querySelector("[data-admin-app]");

  if (!root) {
    return;
  }

  const apiBase = String(root.dataset.adminApi || "").replace(/\/+$/, "");
  const tokenKey = "swimming-yang.admin.token";
  const draftKey = "swimming-yang.admin.draft";
  const authPanel = root.querySelector("[data-admin-auth]");
  const workspace = root.querySelector("[data-admin-workspace]");
  const userBadge = root.querySelector("[data-admin-user]");
  const avatar = root.querySelector("[data-admin-avatar]");
  const loginName = root.querySelector("[data-admin-login]");
  const status = root.querySelector("[data-admin-status]");
  const preview = root.querySelector("[data-admin-preview]");
  const form = root.querySelector("[data-admin-form]");
  const topicField = root.querySelector("[data-admin-topic-field]");
  const fields = {};
  let token = window.localStorage.getItem(tokenKey) || "";
  let slugTouched = false;

  root.querySelectorAll("[data-admin-field]").forEach((field) => {
    fields[field.dataset.adminField] = field;
  });

  function setStatus(message, type) {
    if (!status) {
      return;
    }

    status.textContent = message || "";
    status.classList.remove("is-error", "is-success", "is-info");

    if (type) {
      status.classList.add(`is-${type}`);
    }
  }

  function setPublishedStatus(data) {
    status.textContent = "";
    status.classList.remove("is-error", "is-info");
    status.classList.add("is-success");

    const text = document.createElement("span");
    text.textContent = `발행 완료: ${data.path}`;
    status.append(text);

    if (data.htmlUrl) {
      const link = document.createElement("a");
      link.href = data.htmlUrl;
      link.target = "_blank";
      link.rel = "noopener";
      link.textContent = "GitHub에서 보기";
      status.append(document.createTextNode(" "));
      status.append(link);
    }
  }

  function setToken(value) {
    token = value || "";

    if (token) {
      window.localStorage.setItem(tokenKey, token);
      return;
    }

    window.localStorage.removeItem(tokenKey);
  }

  function consumeHash() {
    if (!window.location.hash) {
      return;
    }

    const params = new URLSearchParams(window.location.hash.slice(1));
    const authToken = params.get("admin_token");
    const authError = params.get("admin_error");

    if (authToken) {
      setToken(authToken);
      setStatus("로그인 완료.", "success");
    }

    if (authError) {
      setStatus(`로그인 실패: ${authError}`, "error");
    }

    window.history.replaceState(null, document.title, window.location.pathname + window.location.search);
  }

  async function apiFetch(path, options) {
    const response = await fetch(`${apiBase}${path}`, {
      ...options,
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        ...(options && options.headers ? options.headers : {}),
      },
    });
    const data = await response.json().catch(() => ({}));

    if (response.status === 401) {
      setToken("");
      showAuth();
      throw new Error(data.error || "로그인이 필요합니다.");
    }

    if (!response.ok) {
      throw new Error(data.error || "요청에 실패했습니다.");
    }

    return data;
  }

  function showAuth() {
    authPanel.hidden = false;
    workspace.hidden = true;
    userBadge.hidden = true;
  }

  function showWorkspace(user) {
    authPanel.hidden = true;
    workspace.hidden = false;
    userBadge.hidden = false;

    if (avatar && user.avatarUrl) {
      avatar.src = user.avatarUrl;
    }

    if (loginName) {
      loginName.textContent = user.login || "admin";
    }
  }

  async function verifySession() {
    if (!token) {
      showAuth();
      return;
    }

    try {
      const data = await apiFetch("/admin/me", { method: "GET" });
      showWorkspace(data.user || {});
    } catch (error) {
      setStatus(error.message, "error");
    }
  }

  function login() {
    if (!apiBase) {
      setStatus("관리자 API 주소가 없습니다.", "error");
      return;
    }

    const redirectUri = `${window.location.origin}${window.location.pathname}`;
    window.location.href = `${apiBase}/admin/auth/start?redirect_uri=${encodeURIComponent(redirectUri)}`;
  }

  async function logout() {
    try {
      if (token) {
        await apiFetch("/admin/auth/logout", { method: "POST", body: "{}" });
      }
    } catch {
      // The local session is cleared even if the remote logout already expired.
    }

    setToken("");
    showAuth();
    setStatus("로그아웃 완료.", "success");
  }

  function getPayload() {
    return {
      category: fields.category.value,
      topic: fields.topic.value,
      date: fields.date.value,
      slug: fields.slug.value.trim(),
      tags: fields.tags.value.trim(),
      image: fields.image.value.trim(),
      title: fields.title.value.trim(),
      description: fields.description.value.trim(),
      body: fields.body.value.trim(),
    };
  }

  function setPayload(payload) {
    Object.keys(fields).forEach((key) => {
      if (Object.prototype.hasOwnProperty.call(payload, key)) {
        fields[key].value = payload[key] || "";
      }
    });

    slugTouched = Boolean(fields.slug.value);
    updateTopicState();
    renderPreview();
  }

  function saveDraft(silent) {
    window.localStorage.setItem(draftKey, JSON.stringify(getPayload()));

    if (!silent) {
      setStatus("임시저장 완료.", "success");
    }
  }

  function loadDraft() {
    const raw = window.localStorage.getItem(draftKey);

    if (!raw) {
      fields.date.value = getKoreanDateInput();
      updateTopicState();
      renderPreview();
      return;
    }

    try {
      setPayload(JSON.parse(raw));
    } catch {
      window.localStorage.removeItem(draftKey);
      fields.date.value = getKoreanDateInput();
    }

    if (!fields.date.value) {
      fields.date.value = getKoreanDateInput();
    }
  }

  function resetEditor() {
    if (!window.confirm("작성 중인 내용을 비울까요?")) {
      return;
    }

    Object.values(fields).forEach((field) => {
      field.value = "";
    });
    fields.category.value = "life";
    fields.date.value = getKoreanDateInput();
    slugTouched = false;
    window.localStorage.removeItem(draftKey);
    updateTopicState();
    renderPreview();
    setStatus("새 글을 시작합니다.", "info");
  }

  async function publish(event) {
    event.preventDefault();

    const payload = getPayload();

    if (!payload.title || !payload.body) {
      setStatus("제목과 본문을 입력해주세요.", "error");
      return;
    }

    if (payload.category === "coding" && !payload.topic) {
      setStatus("코딩 글은 주제를 선택해주세요.", "error");
      return;
    }

    setStatus("GitHub에 커밋하는 중...", "info");

    try {
      const data = await apiFetch("/admin/posts", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      window.localStorage.removeItem(draftKey);
      setPublishedStatus(data);
    } catch (error) {
      setStatus(error.message, "error");
    }
  }

  function updateTopicState() {
    const isCoding = fields.category.value === "coding";

    topicField.hidden = !isCoding;
    fields.topic.disabled = !isCoding;

    if (isCoding && !fields.topic.value) {
      fields.topic.value = fields.topic.querySelector("option")?.value || "";
    }
  }

  function handleInput(event) {
    const field = event.target.closest("[data-admin-field]");

    if (!field) {
      return;
    }

    if (field === fields.slug) {
      slugTouched = true;
      fields.slug.value = slugify(fields.slug.value);
    }

    if (field === fields.title && !slugTouched) {
      fields.slug.value = slugify(fields.title.value);
    }

    if (field === fields.category) {
      updateTopicState();
    }

    renderPreview();
    window.clearTimeout(handleInput.timer);
    handleInput.timer = window.setTimeout(() => saveDraft(true), 500);
  }

  function renderPreview() {
    const payload = getPayload();
    const title = payload.title || "제목";
    const body = payload.body || "";
    const date = payload.date ? payload.date.replace("T", " ") : "";
    const description = payload.description ? `<p class="admin-preview__desc">${escapeHtml(payload.description)}</p>` : "";

    preview.innerHTML = `
      <header class="admin-preview__header">
        <p>${escapeHtml(payload.category)}${payload.topic ? ` · ${escapeHtml(payload.topic)}` : ""}${date ? ` · ${escapeHtml(date)}` : ""}</p>
        <h1>${escapeHtml(title)}</h1>
        ${description}
      </header>
      ${renderMarkdown(body)}
    `;
  }

  function renderMarkdown(markdown) {
    const lines = String(markdown || "").split(/\r?\n/);
    const html = [];
    const paragraph = [];
    let inCode = false;
    let inList = false;

    function flushParagraph() {
      if (!paragraph.length) {
        return;
      }

      html.push(`<p>${formatInline(paragraph.join(" "))}</p>`);
      paragraph.length = 0;
    }

    function closeList() {
      if (!inList) {
        return;
      }

      html.push("</ul>");
      inList = false;
    }

    lines.forEach((line) => {
      const fence = line.match(/^```/);

      if (fence && !inCode) {
        flushParagraph();
        closeList();
        html.push("<pre><code>");
        inCode = true;
        return;
      }

      if (fence && inCode) {
        html.push("</code></pre>");
        inCode = false;
        return;
      }

      if (inCode) {
        html.push(`${escapeHtml(line)}\n`);
        return;
      }

      if (!line.trim()) {
        flushParagraph();
        closeList();
        return;
      }

      const heading = line.match(/^(#{1,3})\s+(.+)$/);
      const image = line.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
      const listItem = line.match(/^[-*]\s+(.+)$/);
      const quote = line.match(/^>\s+(.+)$/);

      if (heading) {
        flushParagraph();
        closeList();
        html.push(`<h${heading[1].length}>${formatInline(heading[2])}</h${heading[1].length}>`);
        return;
      }

      if (image) {
        flushParagraph();
        closeList();
        html.push(`<figure><img src="${escapeAttribute(image[2])}" alt="${escapeAttribute(image[1])}"></figure>`);
        return;
      }

      if (listItem) {
        flushParagraph();

        if (!inList) {
          html.push("<ul>");
          inList = true;
        }

        html.push(`<li>${formatInline(listItem[1])}</li>`);
        return;
      }

      if (quote) {
        flushParagraph();
        closeList();
        html.push(`<blockquote>${formatInline(quote[1])}</blockquote>`);
        return;
      }

      paragraph.push(line.trim());
    });

    flushParagraph();
    closeList();

    if (inCode) {
      html.push("</code></pre>");
    }

    return html.join("");
  }

  function formatInline(value) {
    return escapeHtml(value)
      .replace(/`([^`]+)`/g, "<code>$1</code>")
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      .replace(/\[([^\]]+)\]\((https?:\/\/[^)]+|\/[^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function escapeAttribute(value) {
    return escapeHtml(value).replace(/`/g, "&#096;");
  }

  function slugify(value) {
    return String(value || "")
      .normalize("NFKD")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 70);
  }

  function getKoreanDateInput() {
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

    return `${values.year}-${values.month}-${values.day}T${values.hour}:${values.minute}`;
  }

  function bindEvents() {
    root.querySelector("[data-admin-login-button]").addEventListener("click", login);
    root.querySelector("[data-admin-logout]").addEventListener("click", logout);
    root.querySelector("[data-admin-draft]").addEventListener("click", () => saveDraft(false));
    root.querySelector("[data-admin-new]").addEventListener("click", resetEditor);
    form.addEventListener("submit", publish);
    form.addEventListener("input", handleInput);
    form.addEventListener("change", handleInput);
  }

  consumeHash();
  bindEvents();
  loadDraft();
  verifySession();
})();
