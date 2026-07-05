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
  const codingTopicField = root.querySelector("[data-admin-coding-topic-field]");
  const lifeTopicField = root.querySelector("[data-admin-life-topic-field]");
  const formatSelect = root.querySelector("[data-admin-format]");
  const imageUpload = root.querySelector("[data-admin-image-upload]");
  const writeView = root.querySelector("[data-admin-write-view]");
  const previewView = root.querySelector("[data-admin-preview-view]");
  const modeTitle = root.querySelector("[data-admin-mode-title]");
  const viewButtons = root.querySelectorAll("[data-admin-view]");
  const visualEditor = root.querySelector("[data-admin-visual-editor]");
  const fields = {};
  let token = tokenStorage.getItem(tokenKey) || window.localStorage.getItem(tokenKey) || "";
  let savedVisualRange = null;
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
    syncSourceFromVisualEditor();

    return {
      category: fields.category.value,
      topic: getSelectedTopic(),
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
    hydrateVisualEditorFromSource();
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
    hydrateVisualEditorFromSource();
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

    if (!payload.topic) {
      setStatus("주제를 선택해주세요.", "error");
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

    if (!isPreview) {
      focusVisualEditor();
    }
  }

  function touchBodyEditor() {
    syncSourceFromVisualEditor();
    renderPreview();
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

  function renderMarkdownIntoVisualEditor(markdown) {
    const lines = String(markdown || "").split(/\r?\n/);
    let index = 0;

    while (index < lines.length) {
      const line = lines[index];
      const fence = line.match(/^```([a-zA-Z0-9#+._-]*)\s*$/);

      if (!line.trim()) {
        index += 1;
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

        visualEditor.append(createVisualCodeBlock(language, codeLines.join("\n")));
        continue;
      }

      const heading = line.match(/^(#{2,4})\s+(.+)$/);
      const image = line.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
      const quote = line.match(/^>\s+(.+)$/);
      const unordered = line.match(/^[-*]\s+(.+)$/);
      const ordered = line.match(/^\d+\.\s+(.+)$/);

      if (heading) {
        appendVisualElement(`h${heading[1].length}`, renderInlineMarkdownToHtml(heading[2]));
        index += 1;
        continue;
      }

      if (image) {
        visualEditor.append(createVisualImageFigure(image[2], image[1]));
        index += 1;
        continue;
      }

      if (quote) {
        appendVisualElement("blockquote", renderInlineMarkdownToHtml(quote[1]));
        index += 1;
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

        visualEditor.append(list);
        continue;
      }

      const paragraph = [];

      while (index < lines.length && lines[index].trim() && !/^```/.test(lines[index])) {
        if (/^(#{2,4})\s+/.test(lines[index]) || /^!\[/.test(lines[index]) || /^>\s+/.test(lines[index]) || /^[-*]\s+/.test(lines[index]) || /^\d+\.\s+/.test(lines[index])) {
          break;
        }

        paragraph.push(lines[index].trim());
        index += 1;
      }

      appendVisualElement("p", renderInlineMarkdownToHtml(paragraph.join(" ")));
    }
  }

  function appendVisualElement(tagName, html) {
    const element = document.createElement(tagName);
    element.innerHTML = html || "<br>";
    visualEditor.append(element);
    return element;
  }

  function appendEmptyVisualParagraph() {
    const paragraph = document.createElement("p");
    paragraph.innerHTML = "<br>";
    visualEditor.append(paragraph);
    return paragraph;
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

    return content;
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

  function serializeVisualCodeBlock(block) {
    const language = normalizeCodeLanguage(block.dataset.language || getDefaultCodeLanguage());
    const codeElement = block.querySelector("[data-admin-code-content]");
    const code = cleanCodeText(codeElement?.innerText || "");

    return `\`\`\`${language}\n${code}\n\`\`\``;
  }

  function cleanVisualText(value) {
    return String(value || "").replace(/\u00a0/g, " ");
  }

  function cleanCodeText(value) {
    return cleanVisualText(value).replace(/\n{2,}$/g, "\n").replace(/\n$/g, "");
  }

  function renderInlineMarkdownToHtml(value) {
    return escapeHtml(value)
      .replace(/`([^`]+)`/g, "<code>$1</code>")
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      .replace(/\*([^*]+)\*/g, "<em>$1</em>")
      .replace(/\[([^\]]+)\]\((https?:\/\/[^)]+|\/[^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
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

    const dots = document.createElement("span");
    dots.className = "code-window__dots";
    dots.setAttribute("aria-hidden", "true");
    dots.innerHTML = "<i></i><i></i><i></i>";

    const label = document.createElement("span");
    label.className = "code-window__language";
    label.textContent = getCodeLanguageLabel(safeLanguage);

    const hint = document.createElement("span");
    hint.className = "admin-code-block__hint";
    hint.textContent = "직접 입력";

    toolbar.append(dots, label, hint);

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
    const image = document.createElement("img");
    image.src = src;
    image.alt = alt || "";
    figure.append(image);
    return figure;
  }

  function insertVisualCodeBlock() {
    const selected = takeVisualSelectionText() || "code";
    const block = createVisualCodeBlock(getDefaultCodeLanguage(), selected);
    insertVisualBlock(block, block.querySelector("[data-admin-code-content]"));
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

  function applyVisualEditorCommand(command) {
    if (command === "code") {
      insertVisualCodeBlock();
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
    renderPreview();
  }

  function handleVisualEditorKeydown(event) {
    if (event.key !== "Tab" || !event.target.closest("[data-admin-code-content]")) {
      return;
    }

    event.preventDefault();
    document.execCommand("insertText", false, "  ");
    handleVisualEditorInput();
  }

  function handleVisualEditorPaste(event) {
    const text = event.clipboardData?.getData("text/plain");

    if (!text) {
      return;
    }

    event.preventDefault();
    document.execCommand("insertText", false, text);
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
      html.push(renderCodeBlockEnd());
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

  function renderCodeBlockStart(language) {
    const safeLanguage = escapeAttribute(language);
    const label = escapeHtml(getCodeLanguageLabel(language));

    return [
      `<div class="language-${safeLanguage} highlighter-rouge code-window">`,
      '<div class="code-window__toolbar">',
      '<span class="code-window__dots" aria-hidden="true"><i></i><i></i><i></i></span>',
      `<span class="code-window__language">${label}</span>`,
      '<button class="code-window__copy" type="button" data-admin-copy-code aria-label="코드 복사">복사</button>',
      "</div>",
      '<div class="highlight">',
      `<pre class="highlight"><code class="language-${safeLanguage}">`,
    ].join("");
  }

  function renderCodeBlockEnd() {
    return "</code></pre></div></div>";
  }

  function normalizeCodeLanguage(value) {
    const language = String(value || "text")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9#+._-]/g, "");

    return language || "text";
  }

  function getCodeLanguageLabel(language) {
    return codeLanguageNames[normalizeCodeLanguage(language)] || String(language || "text").toUpperCase();
  }

  function handlePreviewClick(event) {
    const button = event.target.closest("[data-admin-copy-code]");

    if (!button || !preview.contains(button)) {
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
      button.textContent = "복사";
      button.classList.remove("is-copied");
    };
    const finish = () => {
      button.textContent = "완료";
      button.classList.add("is-copied");
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
    viewButtons.forEach((button) => {
      button.addEventListener("click", () => setEditorView(button.dataset.adminView));
    });

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

    if (imageUpload) {
      imageUpload.addEventListener("change", uploadSelectedImage);
    }

    if (visualEditor) {
      visualEditor.addEventListener("input", handleVisualEditorInput);
      visualEditor.addEventListener("keydown", handleVisualEditorKeydown);
      visualEditor.addEventListener("paste", handleVisualEditorPaste);
      visualEditor.addEventListener("focus", saveVisualSelection);
      visualEditor.addEventListener("keyup", saveVisualSelection);
      visualEditor.addEventListener("mouseup", saveVisualSelection);
      document.addEventListener("selectionchange", saveVisualSelection);
    }

    preview.addEventListener("click", handlePreviewClick);
    form.addEventListener("submit", publish);
    form.addEventListener("input", handleInput);
    form.addEventListener("change", handleInput);
  }

  consumeHash();
  bindEvents();
  initializeEditor();
  verifySession();
})();
