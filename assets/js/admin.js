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
  const form = root.querySelector("[data-admin-form]");
  const codingTopicField = root.querySelector("[data-admin-coding-topic-field]");
  const lifeTopicField = root.querySelector("[data-admin-life-topic-field]");
  const formatSelect = root.querySelector("[data-admin-format]");
  const fontSelect = root.querySelector("[data-admin-font]");
  const fontSizeInput = root.querySelector("[data-admin-font-size]");
  const codeLanguageSelect = root.querySelector("[data-admin-code-language]");
  const imageUpload = root.querySelector("[data-admin-image-upload]");
  const writeView = root.querySelector("[data-admin-write-view]");
  const modeTitle = root.querySelector("[data-admin-mode-title]");
  const postPicker = root.querySelector("[data-admin-post-picker]");
  const loadPostButton = root.querySelector("[data-admin-load-post]");
  const publishButton = root.querySelector("[data-admin-publish]");
  const visualEditor = root.querySelector("[data-admin-visual-editor]");
  const fields = {};
  let token = tokenStorage.getItem(tokenKey) || window.localStorage.getItem(tokenKey) || "";
  let savedVisualRange = null;
  let currentPost = null;
  let postIndexLoaded = false;
  const allowedInlineClasses = new Set([
    "text-font-sans",
    "text-font-serif",
    "text-font-mono",
    "text-size-small",
    "text-size-large",
    "text-size-xl",
  ]);
  const codeLanguageNames = {
    csharp: "C#",
    "c#": "C#",
    cs: "C#",
    xaml: "XAML",
    xml: "XML",
    unity: "Unity",
    javascript: "JavaScript",
    js: "JavaScript",
    typescript: "TypeScript",
    ts: "TypeScript",
    css: "CSS",
    scss: "SCSS",
    html: "HTML",
    bash: "Shell",
    shell: "Shell",
    sh: "Shell",
    powershell: "PowerShell",
    ps1: "PowerShell",
    python: "Python",
    py: "Python",
    sql: "SQL",
    json: "JSON",
    yaml: "YAML",
    yml: "YAML",
    markdown: "Markdown",
    md: "Markdown",
    plaintext: "Code",
    text: "Code",
  };

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
    text.textContent = `${currentPost ? "수정" : "발행"} 완료. 글 목록으로 이동합니다.`;
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

    window.setTimeout(() => {
      window.location.href = data.siteUrl || "/blog/";
    }, 900);
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
    if (!apiBase) {
      throw new Error("관리자 API 주소가 없습니다.");
    }

    let response;

    try {
      response = await fetch(`${apiBase}${path}`, {
        ...options,
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          ...(options && options.headers ? options.headers : {}),
        },
      });
    } catch (error) {
      throw new Error(`API 연결 실패: ${apiBase}${path} (${error.message || "Failed to fetch"})`);
    }

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
    if (!apiBase) {
      throw new Error("관리자 API 주소가 없습니다.");
    }

    let response;

    try {
      response = await fetch(`${apiBase}${path}`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        body,
      });
    } catch (error) {
      throw new Error(`업로드 API 연결 실패: ${apiBase}${path} (${error.message || "Failed to fetch"})`);
    }

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

    loadPostIndex();
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
    syncSourceFromVisualEditor();

    return {
      category: fields.category.value,
      topic: getSelectedTopic(),
      date: currentPost?.dateInput || getKoreanDateInput(),
      slug: currentPost?.slug || "",
      tags: fields.tags.value.trim(),
      image: getFirstBodyImage(fields.body.value),
      title: fields.title.value.trim(),
      description: fields.description.value.trim(),
      body: fields.body.value.trim(),
    };
  }

  function initializeEditor() {
    updateTopicState();
    hydrateVisualEditorFromSource();
    updateEditorModeLabel();
  }

  function resetEditor() {
    if (!window.confirm("작성 중인 내용을 비울까요?")) {
      return;
    }

    Object.values(fields).forEach((field) => {
      field.value = "";
    });
    fields.category.value = "life";
    currentPost = null;
    updateTopicState();
    hydrateVisualEditorFromSource();
    updateEditorModeLabel();
    focusVisualEditor();
    setStatus("새 글을 시작합니다.", "info");
  }

  async function publish(event) {
    event.preventDefault();

    const payload = getPayload();

    if (!payload.title || !payload.body) {
      setStatus("제목과 본문을 입력해주세요.", "error");
      return;
    }

    if (!payload.topic) {
      setStatus("주제를 선택해주세요.", "error");
      return;
    }

    setStatus("GitHub에 커밋하는 중...", "info");

    try {
      const isEditing = Boolean(currentPost?.path);
      const data = await apiFetch(isEditing ? `/admin/posts?path=${encodeURIComponent(currentPost.path)}` : "/admin/posts", {
        method: isEditing ? "PUT" : "POST",
        body: JSON.stringify(payload),
      });

      setPublishedStatus(data);
    } catch (error) {
      const recovered = await recoverPublishedPost(payload).catch(() => null);

      if (recovered) {
        setPublishedStatus(recovered);
        return;
      }

      setStatus(error.message, "error");
    }
  }

  async function loadPostIndex() {
    if (!postPicker || postIndexLoaded || !token) {
      return;
    }

    postIndexLoaded = true;

    try {
      const data = await apiFetch("/admin/posts", { method: "GET" });
      const posts = Array.isArray(data.posts) ? data.posts : [];
      postPicker.innerHTML = '<option value="">수정할 글 선택</option>';

      posts.forEach((post) => {
        const option = document.createElement("option");
        option.value = post.path;
        option.textContent = `${post.date || ""} ${post.title || post.path}`.trim();
        postPicker.append(option);
      });
    } catch (error) {
      postIndexLoaded = false;
      setStatus(`글 목록을 불러오지 못했습니다: ${error.message}`, "error");
    }
  }

  async function loadSelectedPost() {
    const path = postPicker?.value || "";

    if (!path) {
      setStatus("수정할 글을 선택해주세요.", "error");
      return;
    }

    setStatus("글을 불러오는 중...", "info");

    try {
      const data = await apiFetch(`/admin/posts?path=${encodeURIComponent(path)}`, { method: "GET" });
      fillEditorFromPost(data.post);
      setStatus("수정 모드로 열었습니다.", "success");
    } catch (error) {
      setStatus(error.message, "error");
    }
  }

  function fillEditorFromPost(post) {
    currentPost = post || null;

    if (!currentPost) {
      return;
    }

    fields.title.value = currentPost.title || "";
    fields.category.value = currentPost.category || "life";
    fields.tags.value = Array.isArray(currentPost.tags) ? currentPost.tags.join(", ") : currentPost.tags || "";
    fields.description.value = currentPost.description || "";
    fields.body.value = currentPost.body || "";

    updateTopicState();

    if (fields.category.value === "coding") {
      fields.codingTopic.value = currentPost.topic || fields.codingTopic.value;
    } else {
      fields.lifeTopic.value = currentPost.topic || fields.lifeTopic.value;
    }

    hydrateVisualEditorFromSource();
    updateEditorModeLabel();
    focusVisualEditor();
  }

  async function recoverPublishedPost(payload) {
    if (currentPost) {
      return null;
    }

    const data = await apiFetch("/admin/posts", { method: "GET" });
    const posts = Array.isArray(data.posts) ? data.posts : [];
    const datePrefix = String(payload.date || "").slice(0, 10);
    const matched = posts.find((post) => post.title === payload.title && (!datePrefix || post.date === datePrefix));

    if (!matched) {
      return null;
    }

    return {
      ok: true,
      path: matched.path,
      title: matched.title,
      siteUrl: matched.url || "/blog/",
      htmlUrl: matched.htmlUrl || "",
    };
  }

  function updateEditorModeLabel() {
    if (modeTitle) {
      modeTitle.textContent = currentPost ? "글 수정" : "글쓰기";
    }

    if (publishButton) {
      const textNode = Array.from(publishButton.childNodes).find((node) => node.nodeType === Node.TEXT_NODE);

      if (textNode) {
        textNode.textContent = currentPost ? " 수정" : " 발행";
      }
    }
  }

  function touchBodyEditor() {
    syncSourceFromVisualEditor();
    focusVisualEditor();
  }

  function hydrateVisualEditorFromSource() {
    if (!visualEditor) {
      return;
    }

    visualEditor.innerHTML = "";

    if (fields.body.value.trim()) {
      renderMarkdownIntoVisualEditor(fields.body.value);
    }

    if (!visualEditor.childNodes.length) {
      appendEmptyVisualParagraph();
    }

    updateVisualEditorEmptyState();
    placeCaretInside(visualEditor.lastElementChild || visualEditor, false);
  }

  function renderMarkdownIntoVisualEditor(markdown, target = visualEditor) {
    if (!target) {
      return;
    }

    const lines = normalizePastedMarkdown(markdown).split(/\n/);
    let index = 0;

    while (index < lines.length) {
      const line = lines[index];
      const fence = line.match(/^```([a-zA-Z0-9#+._-]*)\s*$/);

      if (!line.trim()) {
        index += 1;
        continue;
      }

      if (/^(-{3,}|\*{3,}|_{3,})$/.test(line.trim())) {
        target.append(document.createElement("hr"));
        index += 1;
        continue;
      }

      if (isMarkdownTableLine(line)) {
        const tableLines = [];

        while (index < lines.length && isMarkdownTableLine(lines[index])) {
          tableLines.push(lines[index]);
          index += 1;
        }

        target.append(createVisualTable(parseMarkdownTableRows(tableLines)));
        continue;
      }

      if (fence) {
        const language = normalizeCodeLanguage(fence[1]);
        const codeLines = [];
        index += 1;

        while (index < lines.length && !/^```/.test(lines[index])) {
          codeLines.push(lines[index]);
          index += 1;
        }

        if (index < lines.length) {
          index += 1;
        }

        target.append(createVisualCodeBlock(language, codeLines.join("\n")));
        continue;
      }

      const heading = line.match(/^(#{1,4})\s+(.+)$/);
      const image = line.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
      const quote = line.match(/^>\s?(.*)$/);
      const unordered = line.match(/^[-*]\s+(.+)$/);
      const ordered = line.match(/^\d+\.\s+(.+)$/);

      if (heading) {
        const level = Math.max(2, Math.min(4, heading[1].length));
        appendVisualElement(`h${level}`, renderInlineMarkdownToHtml(heading[2]), target);
        index += 1;
        continue;
      }

      if (image) {
        target.append(createVisualImageFigure(image[2], image[1]));
        index += 1;
        continue;
      }

      if (quote) {
        const quoteLines = [];

        while (index < lines.length) {
          const quoteLine = lines[index].match(/^>\s?(.*)$/);

          if (!quoteLine) {
            break;
          }

          quoteLines.push(renderInlineMarkdownToHtml(quoteLine[1].trim()));
          index += 1;
        }

        appendVisualElement("blockquote", quoteLines.join("<br>"), target);
        continue;
      }

      if (unordered || ordered) {
        const list = document.createElement(unordered ? "ul" : "ol");

        while (index < lines.length) {
          const item = lines[index].match(unordered ? /^[-*]\s+(.+)$/ : /^\d+\.\s+(.+)$/);

          if (!item) {
            break;
          }

          const listItem = document.createElement("li");
          listItem.innerHTML = renderInlineMarkdownToHtml(item[1]);
          list.append(listItem);
          index += 1;
        }

        target.append(list);
        continue;
      }

      const paragraph = [];

      while (index < lines.length && lines[index].trim() && !/^```/.test(lines[index])) {
        if (/^(#{1,4})\s+/.test(lines[index]) || /^!\[/.test(lines[index]) || /^>\s?/.test(lines[index]) || /^[-*]\s+/.test(lines[index]) || /^\d+\.\s+/.test(lines[index])) {
          break;
        }

        paragraph.push(lines[index].trim());
        index += 1;
      }

      appendVisualElement("p", renderInlineMarkdownToHtml(paragraph.join(" ")), target);
    }
  }

  function appendVisualElement(tagName, html, target = visualEditor) {
    const element = document.createElement(tagName);
    element.innerHTML = html || "<br>";
    target.append(element);
    return element;
  }

  function appendEmptyVisualParagraph() {
    const paragraph = document.createElement("p");
    paragraph.innerHTML = "<br>";
    visualEditor.append(paragraph);
    return paragraph;
  }

  function createVisualBlocksFromMarkdown(markdown) {
    const fragment = document.createDocumentFragment();
    renderMarkdownIntoVisualEditor(markdown, fragment);
    return Array.from(fragment.childNodes);
  }

  function normalizePastedMarkdown(value) {
    return String(value || "")
      .replace(/\r\n?/g, "\n")
      .replace(/\u00a0/g, " ")
      .replace(/<aside\b[^>]*>([\s\S]*?)<\/aside>/gi, (_match, content) => normalizeAsideMarkdown(content))
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }

  function normalizeAsideMarkdown(content) {
    const lines = stripHtmlToText(content)
      .split(/\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    if (lines.length && isCalloutIconLine(lines[0])) {
      lines.shift();
    }

    return lines.map((line) => `> ${line}`).join("\n");
  }

  function isCalloutIconLine(line) {
    return /^[\p{Extended_Pictographic}\uFE0F\s]+$/u.test(String(line || "").trim());
  }

  function stripHtmlToText(value) {
    const source = String(value || "")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/(p|div|li|h[1-6]|blockquote|aside)>/gi, "\n")
      .replace(/<[^>]+>/g, "");

    return decodeHtmlEntities(source);
  }

  function decodeHtmlEntities(value) {
    const textarea = document.createElement("textarea");
    textarea.innerHTML = String(value || "");
    return textarea.value;
  }

  function getStructuredPasteMarkdown(event) {
    const text = event.clipboardData?.getData("text/plain") || "";
    const html = event.clipboardData?.getData("text/html") || "";
    const textMarkdown = normalizePastedMarkdown(text);

    if (isStructuredMarkdown(textMarkdown) || /<aside\b/i.test(text)) {
      return textMarkdown;
    }

    const htmlMarkdown = normalizePastedMarkdown(convertClipboardHtmlToMarkdown(html));

    if (isStructuredMarkdown(htmlMarkdown)) {
      return htmlMarkdown;
    }

    return "";
  }

  function isStructuredMarkdown(markdown) {
    const value = String(markdown || "").trim();

    if (!value) {
      return false;
    }

    return /(^|\n)\s*(#{1,4}\s+\S|```|>\s*\S|!\[[^\]]*\]\(|[-*]\s+\S|\d+\.\s+\S|(-{3,}|\*{3,}|_{3,})\s*$)/m.test(value) || value.split(/\n/).some(isMarkdownTableLine);
  }

  function convertClipboardHtmlToMarkdown(html) {
    if (!html) {
      return "";
    }

    const document = new DOMParser().parseFromString(html, "text/html");

    return Array.from(document.body.childNodes)
      .map((node) => htmlNodeToMarkdown(node))
      .filter((block) => block.trim())
      .join("\n\n");
  }

  function htmlNodeToMarkdown(node) {
    if (node.nodeType === Node.TEXT_NODE) {
      return cleanVisualText(node.textContent).trim();
    }

    if (node.nodeType !== Node.ELEMENT_NODE) {
      return "";
    }

    const element = node;
    const tagName = element.tagName.toLowerCase();

    if (/^h[1-4]$/.test(tagName)) {
      return `${"#".repeat(Number(tagName.slice(1)))} ${htmlInlineToMarkdown(element).trim()}`;
    }

    if (tagName === "pre" || isNotionCodeBlock(element)) {
      const code = tagName === "pre" ? element.innerText || element.textContent || "" : stripHtmlToText(element.innerHTML);
      return `\`\`\`${getPreferredCodeLanguage()}\n${cleanCodeText(code)}\n\`\`\``;
    }

    if (tagName === "aside" || tagName === "blockquote" || isNotionCallout(element)) {
      return markdownQuoteFromText(stripHtmlToText(element.innerHTML));
    }

    if (tagName === "ul" || tagName === "ol") {
      return Array.from(element.children)
        .filter((child) => child.tagName.toLowerCase() === "li")
        .map((child, index) => `${tagName === "ol" ? `${index + 1}.` : "-"} ${htmlInlineToMarkdown(child).trim()}`)
        .join("\n");
    }

    if (tagName === "table") {
      return htmlTableToMarkdown(element);
    }

    if (tagName === "img") {
      return htmlImageToMarkdown(element);
    }

    if (isInlineHtmlElement(element) || (tagName === "div" && !hasHtmlBlockChildren(element))) {
      return htmlInlineToMarkdown(element).trim();
    }

    const blockChildren = Array.from(element.childNodes)
      .map((child) => htmlNodeToMarkdown(child))
      .filter((block) => block.trim());

    if (blockChildren.length > 1) {
      return blockChildren.join("\n\n");
    }

    return blockChildren[0] || htmlInlineToMarkdown(element).trim();
  }

  function isInlineHtmlElement(element) {
    return /^(p|span|strong|b|em|i|a|code|mark|small|sub|sup)$/i.test(element.tagName);
  }

  function hasHtmlBlockChildren(element) {
    return Array.from(element.children).some((child) => /^(h[1-6]|p|div|pre|blockquote|aside|ul|ol|table|figure|img)$/i.test(child.tagName));
  }

  function htmlInlineToMarkdown(node) {
    if (node.nodeType === Node.TEXT_NODE) {
      return cleanVisualText(node.textContent);
    }

    if (node.nodeType !== Node.ELEMENT_NODE) {
      return "";
    }

    const element = node;
    const tagName = element.tagName.toLowerCase();

    if (tagName === "br") {
      return "\n";
    }

    if (tagName === "img") {
      return htmlImageToMarkdown(element);
    }

    const content = Array.from(element.childNodes).map((child) => htmlInlineToMarkdown(child)).join("");

    if (tagName === "strong" || tagName === "b") {
      return `**${content}**`;
    }

    if (tagName === "em" || tagName === "i") {
      return `*${content}*`;
    }

    if (tagName === "code") {
      return `\`${content}\``;
    }

    if (tagName === "a") {
      const href = element.getAttribute("href") || "";
      return href ? `[${content}](${href})` : content;
    }

    return content;
  }

  function htmlImageToMarkdown(image) {
    const src = image.getAttribute("src") || "";
    const alt = image.getAttribute("alt") || "";
    return src ? `![${alt}](${src})` : "";
  }

  function htmlTableToMarkdown(table) {
    const rows = Array.from(table.querySelectorAll("tr"))
      .map((row) => Array.from(row.children).map((cell) => htmlInlineToMarkdown(cell).trim() || " "))
      .filter((cells) => cells.length);

    if (!rows.length) {
      return "";
    }

    const columnCount = Math.max(...rows.map((row) => row.length));
    const normalizeRow = (row) => {
      const next = row.slice();

      while (next.length < columnCount) {
        next.push(" ");
      }

      return next;
    };
    const normalizedRows = rows.map(normalizeRow);
    const separator = Array.from({ length: columnCount }, () => "---");
    const formatRow = (row) => `| ${row.join(" | ")} |`;

    return [formatRow(normalizedRows[0]), formatRow(separator), ...normalizedRows.slice(1).map(formatRow)].join("\n");
  }

  function markdownQuoteFromText(value) {
    const lines = cleanVisualText(value)
      .split(/\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    if (lines.length && isCalloutIconLine(lines[0])) {
      lines.shift();
    }

    return lines.map((line) => `> ${line}`).join("\n");
  }

  function isNotionCallout(element) {
    const className = element.getAttribute("class") || "";
    const text = cleanVisualText(element.textContent).trim();

    return /callout|notion-callout/i.test(className) || isCalloutIconLine(text.split(/\n/)[0]);
  }

  function isNotionCodeBlock(element) {
    const className = element.getAttribute("class") || "";

    return /notion-code|code-block|source-code/i.test(className);
  }

  function syncSourceFromVisualEditor() {
    if (!visualEditor || !fields.body) {
      return;
    }

    fields.body.value = serializeVisualEditor().trim();
    updateVisualEditorEmptyState();
  }

  function serializeVisualEditor() {
    if (!visualEditor) {
      return fields.body?.value || "";
    }

    return Array.from(visualEditor.childNodes)
      .map((node) => serializeVisualBlock(node))
      .filter((block) => block.trim())
      .join("\n\n");
  }

  function serializeVisualBlock(node) {
    if (node.nodeType === Node.TEXT_NODE) {
      return cleanVisualText(node.textContent);
    }

    if (node.nodeType !== Node.ELEMENT_NODE) {
      return "";
    }

    const element = node;
    const tagName = element.tagName.toLowerCase();

    if (element.matches("[data-admin-code-block]")) {
      return serializeVisualCodeBlock(element);
    }

    if (tagName === "figure") {
      return serializeVisualFigure(element);
    }

    if (tagName === "img") {
      return serializeVisualImage(element);
    }

    if (tagName === "hr") {
      return "---";
    }

    if (tagName === "table") {
      return serializeVisualTable(element);
    }

    if (/^h[1-6]$/.test(tagName)) {
      const level = Math.max(2, Math.min(4, Number(tagName.slice(1))));
      return `${"#".repeat(level)} ${serializeVisualInline(element).trim()}`;
    }

    if (tagName === "blockquote") {
      const quote = serializeVisualInline(element).trim();
      return quote
        .split(/\n+/)
        .map((line) => `> ${line}`)
        .join("\n");
    }

    if (tagName === "ul" || tagName === "ol") {
      return Array.from(element.children)
        .filter((child) => child.tagName.toLowerCase() === "li")
        .map((child, index) => {
          const marker = tagName === "ol" ? `${index + 1}.` : "-";
          return `${marker} ${serializeVisualInline(child).trim() || "목록"}`;
        })
        .join("\n");
    }

    const nestedCode = element.querySelector(":scope > [data-admin-code-block]");

    if (nestedCode) {
      return serializeVisualCodeBlock(nestedCode);
    }

    return serializeVisualInline(element).trim();
  }

  function serializeVisualInline(node) {
    if (node.nodeType === Node.TEXT_NODE) {
      return cleanVisualText(node.textContent);
    }

    if (node.nodeType !== Node.ELEMENT_NODE) {
      return "";
    }

    const element = node;
    const tagName = element.tagName.toLowerCase();

    if (element.matches("[data-admin-code-block]")) {
      return `\n\n${serializeVisualCodeBlock(element)}\n\n`;
    }

    if (tagName === "br") {
      return "\n";
    }

    if (tagName === "img") {
      return serializeVisualImage(element);
    }

    const content = Array.from(element.childNodes).map((child) => serializeVisualInline(child)).join("");

    if (!content.trim()) {
      return "";
    }

    if (tagName === "strong" || tagName === "b") {
      return `**${content}**`;
    }

    if (tagName === "em" || tagName === "i") {
      return `*${content}*`;
    }

    if (tagName === "code" && !element.matches("[data-admin-code-content]")) {
      return `\`${content}\``;
    }

    if (tagName === "a") {
      const href = element.getAttribute("href") || "";
      return href ? `[${content}](${href})` : content;
    }

    if (tagName === "span") {
      const classes = getAllowedInlineClassList(element);
      const fontSize = getAllowedFontSize(element);
      const attributes = [];

      if (classes) {
        attributes.push(`class="${classes}"`);
      }

      if (fontSize) {
        attributes.push(`style="font-size: ${fontSize}pt"`);
      }

      if (attributes.length) {
        return `<span ${attributes.join(" ")}>${content}</span>`;
      }
    }

    return content;
  }

  function getAllowedInlineClassList(element) {
    return Array.from(element.classList || [])
      .filter((className) => allowedInlineClasses.has(className))
      .join(" ");
  }

  function getAllowedFontSize(element) {
    const rawValue = element.style?.fontSize || "";
    return normalizeFontSizeValue(rawValue);
  }

  function normalizeFontSizeValue(value) {
    const rawValue = String(value || "").trim();
    const match = rawValue.match(/font-size:\s*(\d{1,2})(px|pt)|^(\d{1,2})(px|pt)?$/i);

    if (!match) {
      return "";
    }

    const number = Number(match[1] || match[3]);
    const unit = String(match[2] || match[4] || "pt").toLowerCase();
    const pt = unit === "px" ? Math.round(number * 0.75) : number;

    if (!Number.isFinite(pt) || pt < 8 || pt > 72) {
      return "";
    }

    return String(pt);
  }

  function serializeVisualFigure(figure) {
    const image = figure.querySelector("img");
    return image ? serializeVisualImage(image) : "";
  }

  function serializeVisualImage(image) {
    const src = image.getAttribute("src") || "";
    const alt = image.getAttribute("alt") || "";
    return src ? `![${alt}](${src})` : "";
  }

  function serializeVisualTable(table) {
    const rows = Array.from(table.querySelectorAll("tr"))
      .map((row) => Array.from(row.children).map((cell) => serializeVisualInline(cell).trim() || " "))
      .filter((cells) => cells.length);

    if (!rows.length) {
      return "";
    }

    const columnCount = Math.max(...rows.map((row) => row.length));
    const normalizedRows = rows.map((row) => {
      const next = row.slice();

      while (next.length < columnCount) {
        next.push(" ");
      }

      return next;
    });
    const [head, ...body] = normalizedRows;
    const separator = Array.from({ length: columnCount }, () => "---");
    const formatRow = (row) => `| ${row.join(" | ")} |`;

    return [formatRow(head), formatRow(separator), ...body.map(formatRow)].join("\n");
  }

  function serializeVisualCodeBlock(block) {
    const language = normalizeCodeLanguage(block.dataset.language || getDefaultCodeLanguage());
    const codeElement = block.querySelector("[data-admin-code-content]");
    const code = cleanCodeText(getVisualCodeText(codeElement));

    return `\`\`\`${language}\n${code}\n\`\`\``;
  }

  function getVisualCodeText(codeElement) {
    if (!codeElement) {
      return "";
    }

    return Array.from(codeElement.childNodes).reduce((text, child) => {
      const needsLineBreak = isCodeLineElement(child) && text && !text.endsWith("\n");
      return `${text}${needsLineBreak ? "\n" : ""}${serializeCodeNode(child)}`;
    }, "");
  }

  function serializeCodeNode(node) {
    if (node.nodeType === Node.TEXT_NODE) {
      return node.textContent || "";
    }

    if (node.nodeType !== Node.ELEMENT_NODE) {
      return "";
    }

    const element = node;
    const tagName = element.tagName.toLowerCase();

    if (tagName === "br") {
      return "\n";
    }

    const content = Array.from(element.childNodes).reduce((text, child) => {
      const needsLineBreak = isCodeLineElement(child) && text && !text.endsWith("\n");
      return `${text}${needsLineBreak ? "\n" : ""}${serializeCodeNode(child)}`;
    }, "");

    if (isCodeLineElement(element)) {
      const line = content.replace(/\n+$/g, "");
      return line ? `${line}\n` : "\n";
    }

    return content;
  }

  function isCodeLineElement(node) {
    return node.nodeType === Node.ELEMENT_NODE && /^(div|p)$/i.test(node.tagName);
  }

  function cleanVisualText(value) {
    return String(value || "").replace(/\u00a0/g, " ");
  }

  function cleanCodeText(value) {
    return cleanVisualText(value)
      .replace(/\r\n?/g, "\n")
      .replace(/\n{2,}$/g, "\n")
      .replace(/\n$/g, "");
  }

  function renderInlineMarkdownToHtml(value) {
    return formatInline(value);
  }

  function updateVisualEditorEmptyState() {
    if (!visualEditor) {
      return;
    }

    const hasStructuredContent = Boolean(visualEditor.querySelector("img, [data-admin-code-block]"));
    const hasText = Boolean(cleanVisualText(visualEditor.textContent).trim());

    visualEditor.classList.toggle("is-empty", !hasStructuredContent && !hasText);
  }

  function focusVisualEditor() {
    if (!visualEditor) {
      fields.body.focus();
      return;
    }

    if (!visualEditor.childNodes.length) {
      appendEmptyVisualParagraph();
    }

    restoreVisualSelection();
  }

  function isInsideVisualEditor(node) {
    return Boolean(visualEditor && node && (node === visualEditor || visualEditor.contains(node)));
  }

  function saveVisualSelection() {
    if (!visualEditor) {
      return;
    }

    const selection = window.getSelection();

    if (!selection || !selection.rangeCount || !isInsideVisualEditor(selection.anchorNode) || !isInsideVisualEditor(selection.focusNode)) {
      return;
    }

    savedVisualRange = selection.getRangeAt(0).cloneRange();
  }

  function restoreVisualSelection() {
    if (!visualEditor) {
      return;
    }

    visualEditor.focus();

    const selection = window.getSelection();

    if (!selection) {
      return;
    }

    selection.removeAllRanges();

    if (savedVisualRange && isInsideVisualEditor(savedVisualRange.commonAncestorContainer)) {
      selection.addRange(savedVisualRange);
      return;
    }

    placeCaretInside(visualEditor.lastElementChild || visualEditor, false);
  }

  function placeCaretInside(element, atStart) {
    if (!element) {
      return;
    }

    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(element);
    range.collapse(Boolean(atStart));
    selection.removeAllRanges();
    selection.addRange(range);
    savedVisualRange = range.cloneRange();
  }

  function getCurrentTopLevelVisualBlock() {
    const selection = window.getSelection();

    if (!selection || !selection.rangeCount || !isInsideVisualEditor(selection.anchorNode)) {
      return null;
    }

    let node = selection.getRangeAt(0).startContainer;

    if (node.nodeType === Node.TEXT_NODE) {
      node = node.parentNode;
    }

    while (node && node.parentNode && node.parentNode !== visualEditor) {
      node = node.parentNode;
    }

    return node && node.parentNode === visualEditor ? node : null;
  }

  function takeVisualSelectionText() {
    restoreVisualSelection();

    const selection = window.getSelection();

    if (!selection || !selection.rangeCount || !isInsideVisualEditor(selection.anchorNode)) {
      return "";
    }

    const selected = selection.toString().replace(/^\n+|\n+$/g, "");

    if (!selected || selection.isCollapsed) {
      return "";
    }

    const range = selection.getRangeAt(0);
    range.deleteContents();
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);
    savedVisualRange = range.cloneRange();

    return selected;
  }

  function insertPlainTextAtVisualSelection(text) {
    const selection = window.getSelection();

    if (!selection || !selection.rangeCount || !isInsideVisualEditor(selection.anchorNode) || !isInsideVisualEditor(selection.focusNode)) {
      return false;
    }

    const range = selection.getRangeAt(0);
    const textNode = document.createTextNode(text);

    range.deleteContents();
    range.insertNode(textNode);
    range.setStart(textNode, textNode.textContent.length);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);
    savedVisualRange = range.cloneRange();

    return true;
  }

  function insertVisualBlock(block, focusTarget) {
    restoreVisualSelection();

    const currentBlock = getCurrentTopLevelVisualBlock();
    const trailing = document.createElement("p");
    trailing.innerHTML = "<br>";

    if (currentBlock && currentBlock !== visualEditor) {
      currentBlock.after(block, trailing);
    } else {
      visualEditor.append(block, trailing);
    }

    placeCaretInside(focusTarget || trailing, false);
    syncSourceFromVisualEditor();
    renderPreview();
  }

  function createVisualCodeBlock(language, code) {
    const safeLanguage = normalizeCodeLanguage(language);
    const block = document.createElement("div");
    block.className = `language-${safeLanguage} highlighter-rouge code-window admin-code-block`;
    block.dataset.language = safeLanguage;
    block.setAttribute("data-admin-code-block", "");

    const toolbar = document.createElement("div");
    toolbar.className = "code-window__toolbar";
    toolbar.contentEditable = "false";

    const mark = document.createElement("span");
    mark.className = "image-window__mark";
    mark.setAttribute("aria-hidden", "true");
    mark.textContent = "IMG";

    const label = document.createElement("span");
    label.className = "code-window__language";
    label.textContent = getCodeLanguageLabel(safeLanguage);

    const actions = document.createElement("div");
    actions.className = "code-window__actions";
    actions.append(label);

    toolbar.append(mark, actions);

    const highlight = document.createElement("div");
    highlight.className = "highlight";

    const pre = document.createElement("pre");
    pre.className = "highlight";

    const codeElement = document.createElement("code");
    codeElement.className = `language-${safeLanguage}`;
    codeElement.contentEditable = "true";
    codeElement.spellcheck = false;
    codeElement.dataset.adminCodeContent = "";
    codeElement.dataset.placeholder = "코드를 입력하세요.";
    codeElement.textContent = code || "";

    pre.append(codeElement);
    highlight.append(pre);
    block.append(toolbar, highlight);

    return block;
  }

  function createVisualImageFigure(src, alt) {
    const figure = document.createElement("figure");
    figure.className = "image-window";

    const toolbar = document.createElement("div");
    toolbar.className = "code-window__toolbar image-window__toolbar";
    toolbar.contentEditable = "false";

    const dots = document.createElement("span");
    dots.className = "code-window__dots";
    dots.setAttribute("aria-hidden", "true");
    dots.innerHTML = "<i></i><i></i><i></i>";

    const label = document.createElement("span");
    label.className = "code-window__language image-window__label";
    label.textContent = "Image";

    const actions = document.createElement("div");
    actions.className = "code-window__actions";
    actions.append(label);

    const body = document.createElement("div");
    body.className = "image-window__body";

    const image = document.createElement("img");
    image.src = src;
    image.alt = alt || "";
    body.append(image);
    toolbar.append(dots, actions);
    figure.append(toolbar, body);
    return figure;
  }

  function createVisualTable(rows) {
    const normalizedRows = rows && rows.length ? rows : [
      ["제목", "제목", "제목"],
      ["내용", "내용", "내용"],
      ["내용", "내용", "내용"],
    ];
    const table = document.createElement("table");
    const tbody = document.createElement("tbody");

    normalizedRows.forEach((row, rowIndex) => {
      const tableRow = document.createElement("tr");

      row.forEach((cell) => {
        const cellElement = document.createElement(rowIndex === 0 ? "th" : "td");
        cellElement.innerHTML = renderInlineMarkdownToHtml(cell || " ");
        tableRow.append(cellElement);
      });

      tbody.append(tableRow);
    });

    table.append(tbody);
    return table;
  }

  function isMarkdownTableLine(line) {
    return /^\s*\|.*\|\s*$/.test(line || "");
  }

  function isMarkdownTableSeparator(line) {
    return /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(line || "");
  }

  function parseMarkdownTableRows(lines) {
    return lines
      .filter((line) => !isMarkdownTableSeparator(line))
      .map((line) => line
        .trim()
        .replace(/^\|/, "")
        .replace(/\|$/, "")
        .split("|")
        .map((cell) => cell.trim() || " "));
  }

  function insertVisualCodeBlock() {
    const selected = takeVisualSelectionText() || "code";
    const block = createVisualCodeBlock(getPreferredCodeLanguage(), selected);
    insertVisualBlock(block, block.querySelector("[data-admin-code-content]"));
  }

  function insertVisualDivider() {
    insertVisualBlock(document.createElement("hr"), null);
  }

  function insertVisualTable() {
    const table = createVisualTable();
    insertVisualBlock(table, table.querySelector("td") || table.querySelector("th"));
  }

  function insertVisualImage(src, alt) {
    if (!src) {
      return;
    }

    insertVisualBlock(createVisualImageFigure(src, alt), null);
  }

  function applyVisualHeading(format) {
    restoreVisualSelection();
    document.execCommand("formatBlock", false, format === "paragraph" ? "p" : format);
    touchBodyEditor();
  }

  function applyVisualInlineClass(className, placeholder) {
    if (!allowedInlineClasses.has(className)) {
      return;
    }

    restoreVisualSelection();

    const selection = window.getSelection();
    const selected = selection && !selection.isCollapsed ? selection.toString() : placeholder;

    document.execCommand("insertHTML", false, `<span class="${className}">${escapeHtml(selected || "텍스트")}</span>`);
    touchBodyEditor();
  }

  function applyVisualFontSize(value) {
    const fontSize = normalizeFontSizeValue(value);

    if (!fontSize) {
      return;
    }

    restoreVisualSelection();

    const selection = window.getSelection();
    const selected = selection && !selection.isCollapsed ? selection.toString() : "텍스트";

    document.execCommand("insertHTML", false, `<span style="font-size: ${fontSize}pt">${escapeHtml(selected)}</span>`);
    touchBodyEditor();
  }

  function applyVisualEditorCommand(command) {
    if (command === "code") {
      insertVisualCodeBlock();
      return;
    }

    if (command === "divider") {
      insertVisualDivider();
      return;
    }

    if (command === "table") {
      insertVisualTable();
      return;
    }

    if (command === "image" && imageUpload) {
      imageUpload.value = "";
      imageUpload.click();
      return;
    }

    restoreVisualSelection();

    if (command === "bold") {
      document.execCommand("bold", false);
    }

    if (command === "italic") {
      document.execCommand("italic", false);
    }

    if (command === "quote") {
      document.execCommand("formatBlock", false, "blockquote");
    }

    if (command === "bullet") {
      document.execCommand("insertUnorderedList", false);
    }

    if (command === "number") {
      document.execCommand("insertOrderedList", false);
    }

    if (command === "link") {
      const url = window.prompt("링크 주소를 입력하세요.", "https://");

      if (!url) {
        return;
      }

      const selection = window.getSelection();
      const selected = selection && !selection.isCollapsed ? selection.toString() : "";

      if (selected) {
        document.execCommand("createLink", false, url.trim());
      } else {
        document.execCommand("insertHTML", false, `<a href="${escapeAttribute(url.trim())}" target="_blank" rel="noopener noreferrer">링크</a>`);
      }
    }

    touchBodyEditor();
  }

  function handleVisualEditorInput() {
    syncSourceFromVisualEditor();
    saveVisualSelection();
    updateCodeLanguageSelectFromSelection();
    renderPreview();
  }

  function handleVisualEditorBeforeInput(event) {
    const codeContent = getActiveVisualCodeContent();

    if (!codeContent || !["insertParagraph", "insertLineBreak"].includes(event.inputType)) {
      return;
    }

    event.preventDefault();

    if (insertPlainTextAtVisualSelection("\n")) {
      handleVisualEditorInput();
    }
  }

  function handleVisualEditorKeydown(event) {
    const activeElement = getActiveVisualElement();
    const codeContent = activeElement?.closest("[data-admin-code-content]");

    if (codeContent && event.key === "Enter") {
      event.preventDefault();

      if (insertPlainTextAtVisualSelection("\n")) {
        handleVisualEditorInput();
      }

      return;
    }

    if (event.key === "Enter" && !event.shiftKey) {
      const quote = activeElement?.closest("blockquote");

      if (quote && visualEditor.contains(quote)) {
        event.preventDefault();
        const paragraph = document.createElement("p");
        paragraph.innerHTML = "<br>";
        quote.after(paragraph);
        placeCaretInside(paragraph, true);
        handleVisualEditorInput();
        return;
      }
    }

    if (event.key === "Tab" && codeContent) {
      event.preventDefault();

      if (insertPlainTextAtVisualSelection("  ")) {
        handleVisualEditorInput();
      }
    }
  }

  function getActiveVisualElement() {
    const selection = window.getSelection();

    if (!selection || !selection.rangeCount || !isInsideVisualEditor(selection.anchorNode)) {
      return null;
    }

    return selection.anchorNode.nodeType === Node.TEXT_NODE ? selection.anchorNode.parentElement : selection.anchorNode;
  }

  function getActiveVisualCodeContent() {
    return getActiveVisualElement()?.closest("[data-admin-code-content]") || null;
  }

  function handleVisualEditorPaste(event) {
    const text = getClipboardPlainText(event);
    const html = event.clipboardData?.getData("text/html") || "";

    if (!text && !html) {
      return;
    }

    event.preventDefault();

    if (text && getActiveVisualCodeContent() && insertPlainTextAtVisualSelection(text.replace(/\r\n?/g, "\n"))) {
      handleVisualEditorInput();
      return;
    }

    const markdown = getStructuredPasteMarkdown(event);

    if (markdown && insertStructuredMarkdownPaste(markdown)) {
      return;
    }

    if (text) {
      document.execCommand("insertText", false, text);
    }
  }

  function getClipboardPlainText(event) {
    const text = event.clipboardData?.getData("text/plain") || "";

    if (text) {
      return text;
    }

    return stripHtmlToText(event.clipboardData?.getData("text/html") || "");
  }

  function insertStructuredMarkdownPaste(markdown) {
    const prepared = preparePastedPostMarkdown(markdown);
    const body = prepared.body || prepared.markdown;

    if (prepared.title && !fields.title.value.trim()) {
      fields.title.value = prepared.title;
    }

    const blocks = createVisualBlocksFromMarkdown(body);

    if (!blocks.length) {
      return false;
    }

    insertVisualBlocksAtSelection(blocks);
    return true;
  }

  function preparePastedPostMarkdown(markdown) {
    const normalized = normalizePastedMarkdown(markdown);
    const lines = normalized.split(/\n/);
    const firstContentIndex = lines.findIndex((line) => line.trim());
    let title = "";

    if (firstContentIndex >= 0) {
      const titleLine = lines[firstContentIndex].match(/^#\s+(.+)$/);

      if (titleLine && !fields.title.value.trim()) {
        title = cleanMarkdownTitle(titleLine[1]);
        lines.splice(firstContentIndex, 1);

        while (lines[firstContentIndex] !== undefined && !lines[firstContentIndex].trim()) {
          lines.splice(firstContentIndex, 1);
        }
      }
    }

    return {
      title,
      markdown: normalized,
      body: lines.join("\n").trim(),
    };
  }

  function cleanMarkdownTitle(value) {
    return stripHtmlToText(
      String(value || "")
        .replace(/`([^`]+)`/g, "$1")
        .replace(/\*\*([^*]+)\*\*/g, "$1")
        .replace(/\*([^*]+)\*/g, "$1")
        .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    ).trim();
  }

  function insertVisualBlocksAtSelection(blocks) {
    const nextBlocks = blocks.filter((block) => block.nodeType === Node.ELEMENT_NODE);

    if (!nextBlocks.length) {
      return;
    }

    const currentBlock = getCurrentTopLevelVisualBlock();

    if (isVisualEditorEmpty()) {
      visualEditor.innerHTML = "";
      visualEditor.append(...nextBlocks);
    } else if (currentBlock && isEmptyVisualParagraph(currentBlock)) {
      currentBlock.replaceWith(...nextBlocks);
    } else if (currentBlock && currentBlock !== visualEditor) {
      currentBlock.after(...nextBlocks);
    } else {
      visualEditor.append(...nextBlocks);
    }

    placeCaretInside(getVisualBlockCaretTarget(nextBlocks[nextBlocks.length - 1]), false);
    handleVisualEditorInput();
  }

  function getVisualBlockCaretTarget(block) {
    return block?.querySelector?.("[data-admin-code-content]") || block;
  }

  function isVisualEditorEmpty() {
    return !visualEditor.childNodes.length || Array.from(visualEditor.childNodes).every((node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        return !cleanVisualText(node.textContent).trim();
      }

      return node.nodeType === Node.ELEMENT_NODE && isEmptyVisualParagraph(node);
    });
  }

  function isEmptyVisualParagraph(element) {
    return element?.tagName?.toLowerCase() === "p" && !cleanVisualText(element.textContent).trim() && !element.querySelector("img, table, [data-admin-code-block]");
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

  function insertCodeBlock() {
    const textarea = fields.body;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = textarea.value.slice(start, end).replace(/^\n+|\n+$/g, "") || "code";
    const language = getDefaultCodeLanguage();
    const before = start > 0 && textarea.value[start - 1] !== "\n" ? "\n\n" : "";
    const after = end < textarea.value.length && textarea.value[end] !== "\n" ? "\n\n" : "";
    const fence = `\`\`\`${language}\n${selected}\n\`\`\``;
    const next = `${before}${fence}${after}`;
    const selectionStart = start + before.length + 3 + language.length + 1;
    const selectionEnd = selectionStart + selected.length;

    replaceBodyRange(start, end, next, selectionStart, selectionEnd);
  }

  function getDefaultCodeLanguage() {
    if (fields.category.value !== "coding") {
      return "text";
    }

    const topic = fields.codingTopic.value;

    if (topic === "database") {
      return "sql";
    }

    if (topic === "csharp" || topic === "wpf" || topic === "unity") {
      return "csharp";
    }

    return "text";
  }

  function getPreferredCodeLanguage() {
    const selected = String(codeLanguageSelect?.value || "").trim();

    return selected ? normalizeCodeLanguage(selected) : getDefaultCodeLanguage();
  }

  function getActiveVisualCodeBlock() {
    const selection = window.getSelection();

    if (!selection || !selection.rangeCount || !isInsideVisualEditor(selection.anchorNode)) {
      return null;
    }

    const node = selection.anchorNode.nodeType === Node.TEXT_NODE ? selection.anchorNode.parentElement : selection.anchorNode;

    return node?.closest?.("[data-admin-code-block]") || null;
  }

  function setVisualCodeBlockLanguage(block, language) {
    if (!block) {
      return;
    }

    const safeLanguage = normalizeCodeLanguage(language || getDefaultCodeLanguage());
    const codeElement = block.querySelector("[data-admin-code-content]");
    const label = block.querySelector(".code-window__language");

    block.dataset.language = safeLanguage;
    block.className = `language-${safeLanguage} highlighter-rouge code-window admin-code-block`;

    if (codeElement) {
      codeElement.className = `language-${safeLanguage}`;
    }

    if (label) {
      label.textContent = getCodeLanguageLabel(safeLanguage);
    }

    syncSourceFromVisualEditor();
    renderPreview();
  }

  function updateCodeLanguageSelectFromSelection() {
    if (!codeLanguageSelect) {
      return;
    }

    const block = getActiveVisualCodeBlock();

    if (!block) {
      return;
    }

    codeLanguageSelect.value = normalizeCodeLanguage(block.dataset.language || "");
  }

  function applyEditorCommand(command) {
    if (visualEditor) {
      applyVisualEditorCommand(command);
      return;
    }

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
      insertCodeBlock();
      return;
    }

    if (command === "divider") {
      const start = fields.body.selectionStart;
      const end = fields.body.selectionEnd;
      const before = start > 0 && fields.body.value[start - 1] !== "\n" ? "\n\n" : "";
      const after = end < fields.body.value.length && fields.body.value[end] !== "\n" ? "\n\n" : "";
      const divider = `${before}---${after}`;

      replaceBodyRange(start, end, divider, start + divider.length, start + divider.length);
      return;
    }

    if (command === "table") {
      const table = "\n\n| 제목 | 제목 | 제목 |\n| --- | --- | --- |\n| 내용 | 내용 | 내용 |\n| 내용 | 내용 | 내용 |\n\n";
      const start = fields.body.selectionStart;
      const end = fields.body.selectionEnd;

      replaceBodyRange(start, end, table, start + table.length, start + table.length);
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

      if (visualEditor) {
        insertVisualImage(data.url || getFirstBodyImage(markdown), file.name);
      } else {
        const insert = `\n\n${markdown}\n\n`;
        const start = fields.body.selectionStart;
        const end = fields.body.selectionEnd;

        replaceBodyRange(start, end, insert, start + insert.length, start + insert.length);
      }

      setStatus("이미지를 본문에 추가했습니다.", "success");
    } catch (error) {
      setStatus(error.message, "error");
    }
  }

  function updateTopicState() {
    const isCoding = fields.category.value === "coding";

    if (codingTopicField) {
      codingTopicField.hidden = !isCoding;
    }

    if (lifeTopicField) {
      lifeTopicField.hidden = isCoding;
    }

    fields.codingTopic.disabled = !isCoding;
    fields.lifeTopic.disabled = isCoding;

    if (isCoding && !fields.codingTopic.value) {
      fields.codingTopic.value = fields.codingTopic.querySelector("option")?.value || "";
    }

    if (!isCoding && !fields.lifeTopic.value) {
      fields.lifeTopic.value = fields.lifeTopic.querySelector("option")?.value || "";
    }
  }

  function getSelectedTopic() {
    return fields.category.value === "coding" ? fields.codingTopic.value : fields.lifeTopic.value;
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
    // The visual editor is already the publishing preview surface.
  }

  function renderMarkdown(markdown) {
    const lines = String(markdown || "").split(/\r?\n/);
    const html = [];
    const paragraph = [];
    let inCode = false;
    let codeLanguage = "text";
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
        codeLanguage = normalizeCodeLanguage(fence[1]);
        html.push(renderCodeBlockStart(codeLanguage));
        inCode = true;
        return;
      }

      if (fence && inCode) {
        html.push(renderCodeBlockEnd());
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
      const divider = /^(-{3,}|\*{3,}|_{3,})$/.test(line.trim());
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

      if (divider) {
        flushParagraph();
        closeList();
        html.push("<hr>");
        return;
      }

      if (heading) {
        flushParagraph();
        closeList();
        html.push(`<h${heading[1].length}>${formatInline(heading[2])}</h${heading[1].length}>`);
        return;
      }

      if (image) {
        flushParagraph();
        closeList();
        html.push(renderImageFigure(image[2], image[1]));
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
      html.push(renderCodeBlockEnd());
    }

    return html.join("");
  }

  function formatInline(value) {
    const protectedSpans = [];
    const source = String(value || "").replace(
      /<span\s+([^>]*)>([\s\S]*?)<\/span>/g,
      (_match, rawAttributes, content) => {
        const token = `@@ADMIN_INLINE_SPAN_${protectedSpans.length}@@`;
        const classMatch = String(rawAttributes).match(/\bclass="([^"]+)"/);
        const styleMatch = String(rawAttributes).match(/\bstyle="([^"]+)"/);
        const classes = String(classMatch?.[1] || "")
          .split(/\s+/)
          .filter((className) => allowedInlineClasses.has(className))
          .join(" ");
        const fontSize = normalizeFontSizeValue(styleMatch?.[1] || "");
        const attributes = [];

        if (classes) {
          attributes.push(`class="${escapeAttribute(classes)}"`);
        }

        if (fontSize) {
          attributes.push(`style="font-size: ${fontSize}pt"`);
        }

        protectedSpans.push(attributes.length ? `<span ${attributes.join(" ")}>${formatInline(content)}</span>` : formatInline(content));
        return token;
      }
    );
    let html = escapeHtml(source)
      .replace(/`([^`]+)`/g, "<code>$1</code>")
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      .replace(/\*([^*]+)\*/g, "<em>$1</em>")
      .replace(/\[([^\]]+)\]\((https?:\/\/[^)]+|\/[^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

    protectedSpans.forEach((span, index) => {
      html = html.replace(`@@ADMIN_INLINE_SPAN_${index}@@`, span);
    });

    return html;
  }

  function renderCodeBlockStart(language) {
    const safeLanguage = escapeAttribute(language);
    const label = escapeHtml(getCodeLanguageLabel(language));

    return [
      `<div class="language-${safeLanguage} highlighter-rouge code-window">`,
      '<div class="code-window__toolbar">',
      '<span class="code-window__dots" aria-hidden="true"><i></i><i></i><i></i></span>',
      '<div class="code-window__actions">',
      `<span class="code-window__language">${label}</span>`,
      `<button class="code-window__copy" type="button" data-admin-copy-code aria-label="코드 복사" title="코드 복사">${renderCodeCopyIcon(false)}</button>`,
      "</div>",
      "</div>",
      '<div class="highlight">',
      `<pre class="highlight"><code class="language-${safeLanguage}">`,
    ].join("");
  }

  function renderCodeCopyIcon(copied) {
    if (copied) {
      return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 6 9 17l-5-5"></path></svg>';
    }

    return '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>';
  }

  function setCodeCopyButtonState(button, copied) {
    const label = copied ? "복사 완료" : "코드 복사";

    button.innerHTML = renderCodeCopyIcon(copied);
    button.classList.toggle("is-copied", copied);
    button.setAttribute("aria-label", label);
    button.title = label;
  }

  function renderCodeBlockEnd() {
    return "</code></pre></div></div>";
  }

  function renderImageFigure(src, alt) {
    return [
      '<figure class="image-window">',
      '<div class="code-window__toolbar image-window__toolbar">',
      '<span class="image-window__mark" aria-hidden="true">IMG</span>',
      '<div class="code-window__actions">',
      '<span class="code-window__language image-window__label">Image</span>',
      "</div>",
      "</div>",
      '<div class="image-window__body">',
      `<img src="${escapeAttribute(src)}" alt="${escapeAttribute(alt)}">`,
      "</div>",
      "</figure>",
    ].join("");
  }

  function normalizeCodeLanguage(value) {
    const language = String(value || "text")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9#+._-]/g, "");

    const aliases = {
      "c#": "csharp",
      cs: "csharp",
      js: "javascript",
      ts: "typescript",
      py: "python",
      ps1: "powershell",
      shell: "bash",
      sh: "bash",
      yml: "yaml",
      plaintext: "text",
    };

    return aliases[language] || language || "text";
  }

  function getCodeLanguageLabel(language) {
    return codeLanguageNames[normalizeCodeLanguage(language)] || String(language || "text").toUpperCase();
  }

  function handlePreviewClick(event) {
    const button = event.target.closest("[data-admin-copy-code]");

    if (!button || !root.contains(button)) {
      return;
    }

    copyPreviewCode(button);
  }

  function copyPreviewCode(button) {
    const codeElement = button.closest(".code-window")?.querySelector("pre code");

    if (!codeElement) {
      return;
    }

    const resetLabel = () => {
      setCodeCopyButtonState(button, false);
    };
    const finish = () => {
      setCodeCopyButtonState(button, true);
      window.setTimeout(resetLabel, 1600);
    };
    const text = codeElement.innerText;

    if (!navigator.clipboard) {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.setAttribute("readonly", "");
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      textarea.remove();
      finish();
      return;
    }

    navigator.clipboard.writeText(text).then(finish);
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

    if (loadPostButton) {
      loadPostButton.addEventListener("click", loadSelectedPost);
    }

    root.querySelectorAll("[data-admin-command]").forEach((button) => {
      button.addEventListener("mousedown", (event) => event.preventDefault());
      button.addEventListener("click", () => applyEditorCommand(button.dataset.adminCommand));
    });

    if (formatSelect) {
      formatSelect.addEventListener("change", () => {
        if (visualEditor) {
          applyVisualHeading(formatSelect.value);
        } else {
          applyHeading(formatSelect.value);
        }

        formatSelect.value = "paragraph";
      });
    }

    if (fontSelect) {
      fontSelect.addEventListener("change", () => {
        if (visualEditor) {
          applyVisualInlineClass(fontSelect.value, "글꼴");
        } else if (fontSelect.value) {
          wrapBodySelection(`<span class="${fontSelect.value}">`, "</span>", "글꼴");
        }

        fontSelect.value = "";
      });
    }

    if (fontSizeInput) {
      fontSizeInput.addEventListener("change", () => {
        if (visualEditor) {
          applyVisualFontSize(fontSizeInput.value);
        } else {
          const fontSize = normalizeFontSizeValue(fontSizeInput.value);

          if (fontSize) {
            wrapBodySelection(`<span style="font-size: ${fontSize}pt">`, "</span>", "크기");
          }
        }
      });
    }

    if (codeLanguageSelect) {
      codeLanguageSelect.addEventListener("change", () => {
        const block = getActiveVisualCodeBlock();

        if (block) {
          setVisualCodeBlockLanguage(block, getPreferredCodeLanguage());
        }
      });
    }

    if (imageUpload) {
      imageUpload.addEventListener("change", uploadSelectedImage);
    }

    if (visualEditor) {
      visualEditor.addEventListener("beforeinput", handleVisualEditorBeforeInput);
      visualEditor.addEventListener("input", handleVisualEditorInput);
      visualEditor.addEventListener("keydown", handleVisualEditorKeydown);
      visualEditor.addEventListener("paste", handleVisualEditorPaste);
      visualEditor.addEventListener("focus", saveVisualSelection);
      visualEditor.addEventListener("keyup", () => {
        saveVisualSelection();
        updateCodeLanguageSelectFromSelection();
      });
      visualEditor.addEventListener("mouseup", () => {
        saveVisualSelection();
        updateCodeLanguageSelectFromSelection();
      });
      document.addEventListener("selectionchange", () => {
        saveVisualSelection();
        updateCodeLanguageSelectFromSelection();
      });
    }

    root.addEventListener("click", handlePreviewClick);
    form.addEventListener("submit", publish);
    form.addEventListener("input", handleInput);
    form.addEventListener("change", handleInput);
  }

  consumeHash();
  bindEvents();
  initializeEditor();
  verifySession();
})();
