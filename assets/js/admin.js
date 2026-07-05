(function () {
  const root = document.querySelector("[data-admin-app]");

  if (!root) {
    return;
  }

  const apiBase = String(root.dataset.adminApi || "").replace(/\/+$/, "");
  const tokenKey = "swimming-yang.admin.token";
  const tokenStorage = window.sessionStorage;
  const authPanel = root.querySelector("[data-admin-auth]");
  const workspace = root.querySelector("[data-admin-workspace]");
  const userBadge = root.querySelector("[data-admin-user]");
  const avatar = root.querySelector("[data-admin-avatar]");
  const loginName = root.querySelector("[data-admin-login]");
  const status = root.querySelector("[data-admin-status]");
  const preview = root.querySelector("[data-admin-preview]");
  const form = root.querySelector("[data-admin-form]");
  const topicField = root.querySelector("[data-admin-topic-field]");
  const formatSelect = root.querySelector("[data-admin-format]");
  const imageUpload = root.querySelector("[data-admin-image-upload]");
  const writeView = root.querySelector("[data-admin-write-view]");
  const previewView = root.querySelector("[data-admin-preview-view]");
  const modeTitle = root.querySelector("[data-admin-mode-title]");
  const viewButtons = root.querySelectorAll("[data-admin-view]");
  const fields = {};
  let token = tokenStorage.getItem(tokenKey) || window.localStorage.getItem(tokenKey) || "";

  window.localStorage.removeItem(tokenKey);

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
      link.rel = "noopener noreferrer";
      link.textContent = "GitHub에서 보기";
      status.append(document.createTextNode(" "));
      status.append(link);
    }
  }

  function setToken(value) {
    token = value || "";

    if (token) {
      tokenStorage.setItem(tokenKey, token);
      window.localStorage.removeItem(tokenKey);
      return;
    }

    tokenStorage.removeItem(tokenKey);
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

  async function apiUpload(path, body) {
    const response = await fetch(`${apiBase}${path}`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      body,
    });
    const data = await response.json().catch(() => ({}));

    if (response.status === 401) {
      setToken("");
      showAuth();
      throw new Error(data.error || "로그인이 필요합니다.");
    }

    if (!response.ok) {
      throw new Error(data.error || "업로드에 실패했습니다.");
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
      date: getKoreanDateInput(),
      slug: "",
      tags: fields.tags.value.trim(),
      image: getFirstBodyImage(fields.body.value),
      title: fields.title.value.trim(),
      description: fields.description.value.trim(),
      body: fields.body.value.trim(),
    };
  }

  function initializeEditor() {
    updateTopicState();
    renderPreview();
  }

  function resetEditor() {
    if (!window.confirm("작성 중인 내용을 비울까요?")) {
      return;
    }

    Object.values(fields).forEach((field) => {
      field.value = "";
    });
    fields.category.value = "life";
    updateTopicState();
    renderPreview();
    setEditorView("write");
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

      setPublishedStatus(data);
    } catch (error) {
      setStatus(error.message, "error");
    }
  }

  function setEditorView(view) {
    const isPreview = view === "preview";

    if (isPreview) {
      renderPreview();
    }

    if (writeView) {
      writeView.hidden = isPreview;
    }

    if (previewView) {
      previewView.hidden = !isPreview;
    }

    if (modeTitle) {
      modeTitle.textContent = isPreview ? "미리보기" : "글쓰기";
    }

    viewButtons.forEach((button) => {
      const isActive = button.dataset.adminView === view;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-pressed", String(isActive));
    });

    if (!isPreview && fields.body) {
      fields.body.focus();
    }
  }

  function touchBodyEditor() {
    renderPreview();
    fields.body.focus();
  }

  function replaceBodyRange(start, end, value, selectionStart, selectionEnd) {
    fields.body.setRangeText(value, start, end, "end");

    if (Number.isInteger(selectionStart) && Number.isInteger(selectionEnd)) {
      fields.body.setSelectionRange(selectionStart, selectionEnd);
    }

    touchBodyEditor();
  }

  function wrapBodySelection(before, after, placeholder) {
    const textarea = fields.body;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = textarea.value.slice(start, end) || placeholder;
    const next = `${before}${selected}${after}`;
    const innerStart = start + before.length;
    const innerEnd = innerStart + selected.length;

    replaceBodyRange(start, end, next, innerStart, innerEnd);
  }

  function transformSelectedLines(transform, fallback) {
    const textarea = fields.body;
    const value = textarea.value;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const lineStart = value.lastIndexOf("\n", Math.max(0, start - 1)) + 1;
    const nextBreak = value.indexOf("\n", end);
    const lineEnd = nextBreak === -1 ? value.length : nextBreak;
    const block = value.slice(lineStart, lineEnd) || fallback;
    const lines = block.split("\n");
    const next = lines.map((line, index) => transform(line, index)).join("\n");

    replaceBodyRange(lineStart, lineEnd, next, lineStart, lineStart + next.length);
  }

  function stripBlockPrefix(line) {
    return line.replace(/^\s*(#{1,6}\s+|[-*]\s+|\d+\.\s+|>\s+)/, "");
  }

  function applyHeading(format) {
    const markers = {
      h2: "## ",
      h3: "### ",
      h4: "#### ",
    };
    const marker = markers[format] || "";

    transformSelectedLines((line) => {
      const content = stripBlockPrefix(line).trim() || "제목";
      return marker ? `${marker}${content}` : content;
    }, "제목");
  }

  function applyLineCommand(command) {
    const transforms = {
      quote: (line) => `> ${stripBlockPrefix(line).trim() || "인용문"}`,
      bullet: (line) => `- ${stripBlockPrefix(line).trim() || "목록"}`,
      number: (line, index) => `${index + 1}. ${stripBlockPrefix(line).trim() || "목록"}`,
    };

    transformSelectedLines(transforms[command], command === "quote" ? "인용문" : "목록");
  }

  function applyEditorCommand(command) {
    if (command === "bold") {
      wrapBodySelection("**", "**", "굵은 글씨");
      return;
    }

    if (command === "italic") {
      wrapBodySelection("*", "*", "기울임 글씨");
      return;
    }

    if (command === "quote" || command === "bullet" || command === "number") {
      applyLineCommand(command);
      return;
    }

    if (command === "code") {
      const selected = fields.body.value.slice(fields.body.selectionStart, fields.body.selectionEnd);

      if (selected.includes("\n")) {
        wrapBodySelection("```\n", "\n```", "code");
        return;
      }

      wrapBodySelection("`", "`", "code");
      return;
    }

    if (command === "link") {
      const url = window.prompt("링크 주소를 입력하세요.", "https://");

      if (!url) {
        return;
      }

      wrapBodySelection("[", `](${url.trim()})`, "링크");
      return;
    }

    if (command === "image" && imageUpload) {
      imageUpload.value = "";
      imageUpload.click();
    }
  }

  async function uploadSelectedImage() {
    const file = imageUpload?.files?.[0];

    if (!file) {
      return;
    }

    const body = new FormData();
    body.append("image", file);
    setStatus("이미지 업로드 중...", "info");

    try {
      const data = await apiUpload("/admin/uploads", body);
      const markdown = data.markdown || `![${file.name}](${data.url})`;
      const insert = `\n\n${markdown}\n\n`;
      const start = fields.body.selectionStart;
      const end = fields.body.selectionEnd;

      replaceBodyRange(start, end, insert, start + insert.length, start + insert.length);
      setStatus("이미지를 본문에 추가했습니다.", "success");
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

    if (field === fields.category) {
      updateTopicState();
    }

    renderPreview();
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
    let listType = "";
    let tableRows = [];

    function flushParagraph() {
      if (!paragraph.length) {
        return;
      }

      html.push(`<p>${formatInline(paragraph.join(" "))}</p>`);
      paragraph.length = 0;
    }

    function closeList() {
      if (!listType) {
        return;
      }

      html.push(`</${listType}>`);
      listType = "";
    }

    function parseTableRow(line) {
      return line
        .trim()
        .replace(/^\|/, "")
        .replace(/\|$/, "")
        .split("|")
        .map((cell) => formatInline(cell.trim()));
    }

    function isTableSeparator(line) {
      return /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(line);
    }

    function flushTable() {
      if (!tableRows.length) {
        return;
      }

      const [head, ...body] = tableRows;
      html.push("<table><thead><tr>");
      head.forEach((cell) => html.push(`<th>${cell}</th>`));
      html.push("</tr></thead>");

      if (body.length) {
        html.push("<tbody>");
        body.forEach((row) => {
          html.push("<tr>");
          row.forEach((cell) => html.push(`<td>${cell}</td>`));
          html.push("</tr>");
        });
        html.push("</tbody>");
      }

      html.push("</table>");
      tableRows = [];
    }

    lines.forEach((line) => {
      const fence = line.match(/^```([a-zA-Z0-9#+._-]*)\s*$/);

      if (fence && !inCode) {
        flushParagraph();
        closeList();
        flushTable();
        const language = fence[1] ? ` class="language-${escapeAttribute(fence[1])}"` : "";
        html.push(`<pre><code${language}>`);
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
        flushTable();
        return;
      }

      const heading = line.match(/^(#{1,4})\s+(.+)$/);
      const image = line.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
      const listItem = line.match(/^[-*]\s+(.+)$/);
      const orderedListItem = line.match(/^\d+\.\s+(.+)$/);
      const quote = line.match(/^>\s+(.+)$/);
      const table = line.includes("|") && line.trim().startsWith("|");

      if (table) {
        flushParagraph();
        closeList();

        if (!isTableSeparator(line)) {
          tableRows.push(parseTableRow(line));
        }

        return;
      }

      flushTable();

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

        if (listType && listType !== "ul") {
          closeList();
        }

        if (!listType) {
          html.push("<ul>");
          listType = "ul";
        }

        html.push(`<li>${formatInline(listItem[1])}</li>`);
        return;
      }

      if (orderedListItem) {
        flushParagraph();

        if (listType && listType !== "ol") {
          closeList();
        }

        if (!listType) {
          html.push("<ol>");
          listType = "ol";
        }

        html.push(`<li>${formatInline(orderedListItem[1])}</li>`);
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
    flushTable();

    if (inCode) {
      html.push("</code></pre>");
    }

    return html.join("");
  }

  function formatInline(value) {
    return escapeHtml(value)
      .replace(/`([^`]+)`/g, "<code>$1</code>")
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      .replace(/\*([^*]+)\*/g, "<em>$1</em>")
      .replace(/\[([^\]]+)\]\((https?:\/\/[^)]+|\/[^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
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

  function getFirstBodyImage(markdown) {
    const value = String(markdown || "");
    const markdownImage = value.match(/!\[[^\]]*\]\(([^)\s]+)(?:\s+["'][^"']*["'])?\)/);
    const htmlImage = value.match(/<img\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/i);

    return cleanImageUrl(markdownImage?.[1] || htmlImage?.[1] || "");
  }

  function cleanImageUrl(value) {
    const image = String(value || "").trim();

    if (/^(https?:\/\/|\/)/i.test(image)) {
      return image.slice(0, 240);
    }

    if (/^assets\//i.test(image)) {
      return `/${image}`.slice(0, 240);
    }

    return "";
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
    root.querySelector("[data-admin-new]").addEventListener("click", resetEditor);
    viewButtons.forEach((button) => {
      button.addEventListener("click", () => setEditorView(button.dataset.adminView));
    });

    root.querySelectorAll("[data-admin-command]").forEach((button) => {
      button.addEventListener("click", () => applyEditorCommand(button.dataset.adminCommand));
    });

    if (formatSelect) {
      formatSelect.addEventListener("change", () => {
        applyHeading(formatSelect.value);
        formatSelect.value = "paragraph";
      });
    }

    if (imageUpload) {
      imageUpload.addEventListener("change", uploadSelectedImage);
    }

    form.addEventListener("submit", publish);
    form.addEventListener("input", handleInput);
    form.addEventListener("change", handleInput);
  }

  consumeHash();
  bindEvents();
  initializeEditor();
  verifySession();
})();
