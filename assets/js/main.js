(function () {
  const languageNames = {
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
    json: "JSON",
    yaml: "YAML",
    yml: "YAML",
    markdown: "Markdown",
    md: "Markdown",
    sql: "SQL",
    plaintext: "Code",
    text: "Code",
  };

  function getBaseUrl() {
    const meta = document.querySelector("meta[name='site-baseurl']");
    return meta ? meta.content.replace(/\/$/, "") : "";
  }

  function getLanguage(container) {
    const className = container.className || "";
    const match = className.match(/language-([a-zA-Z0-9#+._-]+)/);
    const key = match ? match[1].toLowerCase() : "plaintext";

    return languageNames[key] || key.toUpperCase();
  }

  function copyCode(button, codeElement) {
    const text = codeElement.innerText;
    const resetLabel = () => {
      setCodeCopyButtonState(button, false);
    };

    const finish = () => {
      setCodeCopyButtonState(button, true);
      window.setTimeout(resetLabel, 1600);
    };

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

  function getCurrentPageUrl() {
    const canonical = document.querySelector("link[rel='canonical']");
    const url = canonical ? canonical.href : window.location.href;
    return url.split("#")[0];
  }

  function copyText(text, finish) {
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

  let toastTimer;

  function showToast(message) {
    let toast = document.querySelector("[data-site-toast]");

    if (!toast) {
      toast = document.createElement("div");
      toast.className = "site-toast";
      toast.dataset.siteToast = "true";
      toast.setAttribute("role", "status");
      toast.setAttribute("aria-live", "polite");
      document.body.append(toast);
    }

    window.clearTimeout(toastTimer);
    toast.textContent = message;
    toast.classList.remove("is-visible");

    window.requestAnimationFrame(() => {
      toast.classList.add("is-visible");
    });

    toastTimer = window.setTimeout(() => {
      toast.classList.remove("is-visible");
    }, 2200);
  }

  function setShareButtonState(button, copied) {
    const label = copied ? "글 주소 복사 완료" : "글 주소 복사";

    button.classList.toggle("is-copied", copied);
    button.setAttribute("aria-label", label);
    button.title = label;
  }

  function enhanceClickCursor() {
    if (!window.matchMedia || !window.matchMedia("(pointer: fine)").matches) {
      return;
    }

    const root = document.documentElement;
    let clickCursorTimer;

    const clearClickCursor = () => {
      window.clearTimeout(clickCursorTimer);
      root.classList.remove("is-click-cursor");
    };

    const finishClickCursor = () => {
      window.clearTimeout(clickCursorTimer);
      clickCursorTimer = window.setTimeout(clearClickCursor, 160);
    };

    window.addEventListener("pointerdown", (event) => {
      if (event.button !== undefined && event.button !== 0) {
        return;
      }

      window.clearTimeout(clickCursorTimer);
      root.classList.add("is-click-cursor");
    });
    window.addEventListener("pointerup", finishClickCursor);
    window.addEventListener("pointercancel", clearClickCursor);
    window.addEventListener("blur", clearClickCursor);
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        clearClickCursor();
      }
    });
  }

  function enhancePostShare() {
    const button = document.querySelector("[data-post-share]");

    if (!button) {
      return;
    }

    setShareButtonState(button, false);

    button.addEventListener("click", () => {
      copyText(getCurrentPageUrl(), () => {
        setShareButtonState(button, true);
        showToast("링크가 복사되었습니다.");
        window.setTimeout(() => setShareButtonState(button, false), 1600);
      });
    });
  }

  function enhanceCodeBlocks() {
    const blocks = document.querySelectorAll(".content .highlighter-rouge");

    blocks.forEach((block) => {
      if (block.classList.contains("code-window")) {
        return;
      }

      const codeElement = block.querySelector("pre code");
      const highlight = block.querySelector(".highlight");

      if (!codeElement || !highlight) {
        return;
      }

      const toolbar = document.createElement("div");
      toolbar.className = "code-window__toolbar";

      const dots = document.createElement("span");
      dots.className = "code-window__dots";
      dots.setAttribute("aria-hidden", "true");

      for (let index = 0; index < 3; index += 1) {
        dots.append(document.createElement("i"));
      }

      const language = document.createElement("span");
      language.className = "code-window__language";
      language.textContent = getLanguage(block);

      const copyButton = document.createElement("button");
      copyButton.className = "code-window__copy";
      copyButton.type = "button";
      setCodeCopyButtonState(copyButton, false);
      copyButton.addEventListener("click", () => copyCode(copyButton, codeElement));

      const actions = document.createElement("div");
      actions.className = "code-window__actions";
      actions.append(language, copyButton);

      toolbar.append(dots, actions);
      block.classList.add("code-window");
      block.insertBefore(toolbar, highlight);
    });
  }

  function createImageWindowMark() {
    const mark = document.createElement("span");
    mark.className = "image-window__mark";
    mark.setAttribute("aria-hidden", "true");
    mark.textContent = "IMG";
    return mark;
  }

  function createImageWindow(image) {
    const figure = document.createElement("figure");
    figure.append(image);
    enhanceImageWindow(figure);
    return figure;
  }

  function enhanceImageWindow(figure) {
    if (!figure || figure.querySelector(":scope > .image-window__toolbar")) {
      return;
    }

    const image = figure.querySelector(":scope > img");

    if (!image) {
      return;
    }

    figure.classList.add("image-window");

    const toolbar = document.createElement("div");
    toolbar.className = "code-window__toolbar image-window__toolbar";

    const label = document.createElement("span");
    label.className = "code-window__language image-window__label";
    label.textContent = "Image";

    const actions = document.createElement("div");
    actions.className = "code-window__actions";
    actions.append(label);

    const body = document.createElement("div");
    body.className = "image-window__body";
    body.append(image);

    toolbar.append(createImageWindowMark(), actions);
    figure.prepend(toolbar, body);
  }

  function enhanceImageBlocks() {
    const content = document.querySelector(".post-content");

    if (!content) {
      return;
    }

    Array.from(content.children).forEach((element) => {
      if (element.matches("p")) {
        const image = element.querySelector(":scope > img:only-child");

        if (image && element.textContent.trim() === "") {
          element.replaceWith(createImageWindow(image));
        }

        return;
      }

      if (element.matches("img")) {
        element.replaceWith(createImageWindow(element));
        return;
      }

      if (element.matches("figure:not(.image-window)")) {
        enhanceImageWindow(element);
      }
    });
  }

  function getKoreanDayNumber(date) {
    const parts = new Intl.DateTimeFormat("en", {
      timeZone: "Asia/Seoul",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(date);

    const values = parts.reduce((result, part) => {
      result[part.type] = part.value;
      return result;
    }, {});

    return Date.UTC(Number(values.year), Number(values.month) - 1, Number(values.day)) / 86400000;
  }

  function getStartDayNumber(value) {
    const match = String(value || "").match(/^(\d{4})-(\d{2})-(\d{2})$/);

    if (!match) {
      return null;
    }

    return Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])) / 86400000;
  }

  function setText(selector, value) {
    const element = document.querySelector(selector);

    if (element) {
      element.textContent = value;
    }
  }

  function formatCount(value) {
    const count = Number(value);

    if (!Number.isFinite(count)) {
      return null;
    }

    return new Intl.NumberFormat("ko-KR").format(count);
  }

  function enhanceBlogStats() {
    const stats = document.querySelector("[data-blog-start]");

    if (!stats) {
      return;
    }

    const startDay = getStartDayNumber(stats.dataset.blogStart);
    const today = getKoreanDayNumber(new Date());

    if (startDay) {
      setText("[data-blog-day]", String(Math.max(1, today - startDay + 1)));
    }

    if (!stats.dataset.visitorEndpoint) {
      return;
    }

    const url = new URL(stats.dataset.visitorEndpoint, window.location.href);
    url.searchParams.set("path", window.location.pathname);

    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 5000);

    fetch(url.toString(), {
      cache: "no-store",
      signal: controller.signal,
      headers: {
        Accept: "application/json",
      },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Visitor stats request failed");
        }

        return response.json();
      })
      .then((data) => {
        window.clearTimeout(timeout);

        const todayCount = formatCount(data.today ?? data.todayCount);
        const totalCount = formatCount(data.total ?? data.totalCount);

        if (todayCount) {
          setText("[data-visitor-today]", todayCount);
        }

        if (totalCount) {
          setText("[data-visitor-total]", totalCount);
        }
      })
      .catch(() => {
        window.clearTimeout(timeout);
        stats.classList.add("is-visitor-offline");
      });
  }

  function enhanceHomeTyping() {
    const container = document.querySelector("[data-home-typing]");

    if (!container) {
      return;
    }

    const titleElement = container.querySelector("[data-home-title-text]");
    const codeElement = container.querySelector("[data-home-code]");

    if (!titleElement || !codeElement) {
      return;
    }

    const titleText = titleElement.dataset.homeTitleText || titleElement.textContent.trim();
    const titleAccentText = titleElement.dataset.homeTitleAccent || "";
    const token = (text, tone = "plain") => ({ text, tone });
    const hangulPattern = /[ㄱ-ㅎㅏ-ㅣ가-힣]/;
    const examples = [
      [
        token("std", "namespace"),
        token("::", "operator"),
        token("cout", "property"),
        token(" << ", "operator"),
        token('"Hello World!!"', "string"),
        token(" << ", "operator"),
        token("std", "namespace"),
        token("::", "operator"),
        token("endl", "property"),
        token(";", "punctuation"),
      ],
      [
        token("Console", "type"),
        token(".", "punctuation"),
        token("WriteLine", "method"),
        token("(", "punctuation"),
        token('"Hello World!!"', "string"),
        token(");", "punctuation"),
      ],
      [
        token("System", "type"),
        token(".", "punctuation"),
        token("out", "property"),
        token(".", "punctuation"),
        token("println", "method"),
        token("(", "punctuation"),
        token('"Hello World!!"', "string"),
        token(");", "punctuation"),
      ],
      [
        token("print", "function"),
        token("(", "punctuation"),
        token('"Hello World!!"', "string"),
        token(")", "punctuation"),
      ],
      [
        token("console", "namespace"),
        token(".", "punctuation"),
        token("log", "method"),
        token("(", "punctuation"),
        token('"Hello World!!"', "string"),
        token(");", "punctuation"),
      ],
      [
        token("어떻게~화이팅!", "comment"),
        token("Hello World!!", "string"),
        token("~이 사람이름이냐ㅋㅋ", "comment"),
      ],
    ];

    const wait = (duration) => new Promise((resolve) => window.setTimeout(resolve, duration));

    const renderTitleText = (element, text, visibleLength) => {
      const accentIndex = titleAccentText ? text.indexOf(titleAccentText) : -1;

      element.textContent = "";

      if (accentIndex < 0) {
        element.textContent = text.slice(0, visibleLength);
        return;
      }

      const fragment = document.createDocumentFragment();
      const titleParts = [
        { text: text.slice(0, accentIndex), isAccent: false },
        { text: titleAccentText, isAccent: true },
        { text: text.slice(accentIndex + titleAccentText.length), isAccent: false },
      ];
      let consumed = 0;

      titleParts.forEach((part) => {
        const remaining = visibleLength - consumed;

        if (remaining <= 0) {
          return;
        }

        const visibleText = part.text.slice(0, Math.min(part.text.length, remaining));

        if (visibleText) {
          const span = document.createElement("span");
          span.textContent = visibleText;

          if (part.isAccent) {
            span.className = "home-hero__title-accent";
          }

          fragment.append(span);
        }

        consumed += part.text.length;
      });

      element.append(fragment);
    };

    const typeText = async (element, text, delay) => {
      element.textContent = "";

      for (let index = 1; index <= text.length; index += 1) {
        renderTitleText(element, text, index);
        await wait(delay);
      }
    };

    const getCodeText = (tokens) => tokens.map((part) => part.text).join("");
    const hasHangul = (tokens) => tokens.some((part) => hangulPattern.test(part.text));

    const setCodeTone = (element, tokens) => {
      element.classList.toggle("is-hangul-code", hasHangul(tokens));
    };

    const renderCodeTokens = (element, tokens, visibleLength) => {
      const fragment = document.createDocumentFragment();
      let consumed = 0;

      element.textContent = "";

      tokens.forEach((part) => {
        const remaining = visibleLength - consumed;

        if (remaining <= 0) {
          return;
        }

        const visibleText = part.text.slice(0, Math.min(part.text.length, remaining));

        if (visibleText) {
          const span = document.createElement("span");
          span.className = `home-code-token home-code-token--${part.tone}`;
          span.textContent = visibleText;
          fragment.append(span);
        }

        consumed += part.text.length;
      });

      element.append(fragment);
    };

    const typeCode = async (element, tokens, delay) => {
      const text = getCodeText(tokens);

      for (let index = 1; index <= text.length; index += 1) {
        renderCodeTokens(element, tokens, index);
        await wait(delay);
      }
    };

    const eraseCode = async (element, tokens, delay) => {
      const text = getCodeText(tokens);

      for (let index = text.length - 1; index >= 0; index -= 1) {
        renderCodeTokens(element, tokens, index);
        await wait(delay);
      }
    };

    const run = async () => {
      await typeText(titleElement, titleText, 78);
      container.classList.add("is-title-complete");
      await wait(260);

      while (document.body.contains(container)) {
        for (const example of examples) {
          setCodeTone(codeElement, example);
          await typeCode(codeElement, example, 58);
          await wait(1700);
          await eraseCode(codeElement, example, 34);
          await wait(340);
        }
      }
    };

    titleElement.textContent = "";
    codeElement.textContent = "";
    run().catch(() => {
      renderTitleText(titleElement, titleText, titleText.length);
      setCodeTone(codeElement, examples[0]);
      renderCodeTokens(codeElement, examples[0], getCodeText(examples[0]).length);
      container.classList.add("is-title-complete");
    });
  }

  function enhanceHomeHeroVideo() {
    const video = document.querySelector("[data-home-hero-video]");

    if (!video) {
      return;
    }

    const showVideo = () => {
      video.classList.add("is-ready");
    };

    if (video.readyState >= 2) {
      showVideo();
      return;
    }

    video.addEventListener("loadeddata", showVideo, { once: true });
    video.addEventListener("canplay", showVideo, { once: true });
    video.addEventListener("playing", showVideo, { once: true });
  }

  function enhanceCategoryMenu() {
    const menu = document.querySelector("[data-category-menu]");

    if (!menu) {
      return;
    }

    const summary = menu.querySelector("summary");
    const prefersReducedMotion = window.matchMedia
      ? window.matchMedia("(prefers-reduced-motion: reduce)")
      : { matches: false };
    const closeDuration = 220;
    let closeTimer;

    const finishClose = (focusSummary) => {
      menu.open = false;
      menu.classList.remove("is-closing");

      if (focusSummary && summary) {
        summary.focus();
      }
    };

    const closeMenu = (options = {}) => {
      if (!menu.open) {
        return;
      }

      window.clearTimeout(closeTimer);

      if (prefersReducedMotion.matches) {
        finishClose(options.focusSummary);
        return;
      }

      menu.classList.add("is-closing");
      closeTimer = window.setTimeout(() => {
        finishClose(options.focusSummary);
      }, closeDuration);
    };

    if (summary) {
      summary.addEventListener("click", (event) => {
        if (!menu.open) {
          menu.classList.remove("is-closing");
          return;
        }

        event.preventDefault();
        closeMenu();
      });
    }

    menu.addEventListener("toggle", () => {
      if (!menu.open) {
        return;
      }

      window.clearTimeout(closeTimer);
      menu.classList.remove("is-closing");
    });

    document.addEventListener("click", (event) => {
      if (menu.open && !menu.contains(event.target)) {
        closeMenu();
      }
    });

    menu.addEventListener("keydown", (event) => {
      if (event.key !== "Escape") {
        return;
      }

      closeMenu({ focusSummary: true });
    });
  }

  function updateThemeImages(theme = document.documentElement.dataset.theme || "light") {
    const images = document.querySelectorAll("[data-theme-image-light][data-theme-image-dark]");

    images.forEach((image) => {
      const nextSource = theme === "dark" ? image.dataset.themeImageDark : image.dataset.themeImageLight;

      if (nextSource && image.getAttribute("src") !== nextSource) {
        image.setAttribute("src", nextSource);
      }
    });
  }

  function enhanceThemeToggle() {
    const button = document.querySelector("[data-theme-toggle]");

    if (!button) {
      return;
    }

    let transitionTimer;

    const setTheme = (theme) => {
      document.documentElement.dataset.theme = theme;
      updateThemeImages(theme);
      button.setAttribute("aria-label", theme === "dark" ? "밝은 테마로 변경" : "어두운 테마로 변경");

      try {
        localStorage.setItem("site-theme", theme);
      } catch (error) {
        return;
      }
    };

    setTheme(document.documentElement.dataset.theme || "light");

    button.addEventListener("click", () => {
      window.clearTimeout(transitionTimer);
      document.documentElement.classList.add("is-theme-switching");
      setTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark");
      transitionTimer = window.setTimeout(() => {
        document.documentElement.classList.remove("is-theme-switching");
      }, 460);
    });
  }

  function enhanceAdminEntry() {
    const entries = Array.from(document.querySelectorAll("[data-admin-entry]"));
    const header = document.querySelector("[data-admin-api]");

    if (!entries.length || !header) {
      return;
    }

    const apiBase = String(header.dataset.adminApi || "").replace(/\/+$/, "");
    const tokenKey = "swimming-yang.admin.token";
    const params = window.location.hash ? new URLSearchParams(window.location.hash.slice(1)) : null;
    const hashToken = params ? params.get("admin_token") : "";
    let token = hashToken || window.sessionStorage.getItem(tokenKey) || "";

    const showEntries = (isVisible) => {
      entries.forEach((entry) => {
        entry.hidden = !isVisible;
      });
    };

    if (hashToken) {
      window.sessionStorage.setItem(tokenKey, hashToken);
      window.localStorage.removeItem(tokenKey);
      token = hashToken;
    }

    if (!apiBase || !token) {
      showEntries(false);
      return;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 4000);

    fetch(`${apiBase}/admin/me`, {
      cache: "no-store",
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    })
      .then((response) => {
        window.clearTimeout(timeout);

        if (response.status === 401) {
          window.sessionStorage.removeItem(tokenKey);
          showEntries(false);
          return null;
        }

        if (!response.ok) {
          showEntries(false);
          return null;
        }

        return response.json();
      })
      .then((data) => {
        if (data && data.ok) {
          showEntries(true);
        }
      })
      .catch(() => {
        window.clearTimeout(timeout);
        showEntries(false);
      });
  }

  function getSearchPageUrl(query) {
    const keyword = String(query || "").trim();
    const path = `${getBaseUrl()}/search/`;

    if (!keyword) {
      return path;
    }

    return `${path}?q=${encodeURIComponent(keyword)}`;
  }

  function enhanceSearch() {
    const openButtons = document.querySelectorAll("[data-search-open]");
    const headerSearchForm = document.querySelector("[data-header-search-form]");
    const headerSearchInput = document.querySelector("[data-header-search-input]");
    const homeSearchForm = document.querySelector("[data-home-search-form]");
    const homeSearchInput = document.querySelector("[data-home-search-input]");

    const goToSearch = (query) => {
      window.location.href = getSearchPageUrl(query);
    };

    openButtons.forEach((button) => {
      button.addEventListener("click", (event) => {
        event.preventDefault();
        goToSearch("");
      });
    });

    if (headerSearchForm && headerSearchInput) {
      headerSearchForm.addEventListener("submit", (event) => {
        event.preventDefault();
        goToSearch(headerSearchInput.value);
      });
    }

    if (homeSearchForm && homeSearchInput) {
      homeSearchForm.addEventListener("submit", (event) => {
        event.preventDefault();
        goToSearch(homeSearchInput.value);
      });
    }
  }

  function enhanceSearchPage() {
    const page = document.querySelector("[data-search-page]");

    if (!page) {
      return;
    }

    const form = page.querySelector("[data-search-page-form]");
    const input = page.querySelector("[data-search-page-input]");
    const cards = Array.from(page.querySelectorAll("[data-search-card]"));
    const empty = page.querySelector("[data-search-page-empty]");
    const summary = page.querySelector("[data-search-page-summary]");

    if (!form || !input || cards.length === 0) {
      return;
    }

    const render = (query) => {
      const rawKeyword = String(query || "").trim();
      const keyword = rawKeyword.toLowerCase();
      let visibleCount = 0;

      cards.forEach((card) => {
        const haystack = String(card.dataset.searchText || "").toLowerCase();
        const isMatch = !keyword || haystack.includes(keyword);
        card.hidden = !isMatch;

        if (isMatch) {
          visibleCount += 1;
        }
      });

      if (summary) {
        summary.textContent = keyword ? `"${rawKeyword}" 검색 결과 ${visibleCount}개` : `전체 글 ${visibleCount}개`;
      }

      if (empty) {
        empty.hidden = visibleCount !== 0;
      }
    };

    const syncFromUrl = () => {
      const query = new URLSearchParams(window.location.search).get("q") || "";
      input.value = query;
      render(query);
    };

    form.addEventListener("submit", (event) => {
      event.preventDefault();

      const query = input.value.trim();
      window.history.pushState({}, "", getSearchPageUrl(query));
      render(query);
    });

    input.addEventListener("input", () => render(input.value));
    window.addEventListener("popstate", syncFromUrl);
    syncFromUrl();
  }

  function slugify(value, index) {
    const slug = String(value || "")
      .trim()
      .toLowerCase()
      .replace(/[^\w가-힣]+/g, "-")
      .replace(/^-+|-+$/g, "");

    return slug || `section-${index}`;
  }

  function enhanceToc() {
    const toc = document.querySelector("[data-toc]");
    const list = document.querySelector("[data-toc-list]");
    const headings = Array.from(document.querySelectorAll(".post-content h2, .post-content h3"));

    if (!toc || !list || headings.length === 0) {
      if (toc) {
        toc.hidden = true;
      }
      return;
    }

    headings.forEach((heading, index) => {
      if (!heading.id) {
        heading.id = slugify(heading.textContent, index);
      }

      const link = document.createElement("a");
      link.href = `#${heading.id}`;
      link.textContent = heading.textContent;
      link.className = heading.tagName === "H3" ? "is-sub" : "";
      list.append(link);
    });
  }

  function loadGiscus(section) {
    if (!section || section.dataset.giscusLoaded === "true") {
      return;
    }

    section.dataset.giscusLoaded = "true";

    const loader = section.querySelector("[data-giscus-loader]");
    const button = section.querySelector("[data-giscus-load]");

    if (button) {
      button.disabled = true;
      button.textContent = "댓글 불러오는 중";
    }

    const script = document.createElement("script");
    script.src = "https://giscus.app/client.js";
    script.async = true;
    script.crossOrigin = "anonymous";

    const dataAttributes = {
      repo: "repo",
      repoId: "repo-id",
      category: "category",
      categoryId: "category-id",
      mapping: "mapping",
      strict: "strict",
      reactionsEnabled: "reactions-enabled",
      emitMetadata: "emit-metadata",
      inputPosition: "input-position",
      theme: "theme",
      lang: "lang",
    };

    Object.entries(dataAttributes).forEach(([key, attribute]) => {
      if (section.dataset[key]) {
        script.setAttribute(`data-${attribute}`, section.dataset[key]);
      }
    });

    script.addEventListener("load", () => {
      if (loader) {
        loader.hidden = true;
      }
    });

    script.addEventListener("error", () => {
      section.dataset.giscusLoaded = "false";

      if (button) {
        button.disabled = false;
        button.textContent = "댓글 다시 불러오기";
      }
    });

    section.append(script);
  }

  function updateGiscusManageLink(section, discussion) {
    const manageLink = section.querySelector("[data-giscus-manage]");

    if (!manageLink || !discussion || !discussion.url) {
      return;
    }

    manageLink.href = discussion.url;
    manageLink.hidden = false;
  }

  function listenForGiscusMetadata(section) {
    window.addEventListener("message", (event) => {
      if (event.origin !== "https://giscus.app") {
        return;
      }

      const message = event.data;

      if (!message || typeof message !== "object" || !message.giscus) {
        return;
      }

      updateGiscusManageLink(section, message.giscus.discussion);
    });
  }

  function enhancePageTransitions() {
    const overlay = document.querySelector("[data-page-transition]");

    if (!overlay) {
      return;
    }

    const tipElement = overlay.querySelector("[data-page-transition-tip]");
    const progressElement = overlay.querySelector("[data-page-transition-progress]");
    const percentElement = overlay.querySelector("[data-page-transition-percent]");
    const tips = [
      "함수는 한 가지 일을 잘할수록 오래 살아남습니다.",
      "좋은 이름은 주석보다 먼저 읽히는 문서입니다.",
      "버그를 줄이는 첫 단계는 상태를 줄이는 것입니다.",
      "중복 제거보다 의도 보존이 먼저입니다.",
      "빠른 코드는 측정 뒤에 만들어도 늦지 않습니다.",
      "테스트 이름은 실패했을 때 읽는 문장입니다.",
      "에러 메시지는 사용자를 위한 작은 UI입니다.",
      "복잡한 조건문은 이름 붙인 변수로 숨을 쉽니다.",
      "캐시는 빠르지만 무효화 전략이 없으면 빚이 됩니다.",
      "비동기 코드는 취소와 실패 경로까지 설계해야 합니다.",
      "로그는 미래의 디버깅 시간을 사는 메모입니다.",
      "작은 커밋은 버그를 되돌릴 수 있는 손잡이입니다.",
      "인터페이스는 구현보다 오래 남는 약속입니다.",
      "널 처리는 코드의 가장 조용한 안전장치입니다.",
      "마법 숫자는 의미 있는 상수로 바꾸면 덜 무섭습니다.",
      "성능 문제는 대부분 추측보다 프로파일러가 빨리 찾습니다.",
      "좋은 추상화는 이름을 줄이는 게 아니라 결정을 줄입니다.",
      "CSS는 작은 규칙이 쌓여 레이아웃의 성격을 만듭니다.",
      "접근성은 나중에 붙이는 기능이 아니라 기본 사용성입니다.",
      "반응형 디자인은 화면 크기가 아니라 정보 우선순위의 문제입니다.",
      "API 응답은 성공보다 실패 모양을 먼저 정하면 단단해집니다.",
      "데이터 검증은 클라이언트와 서버 양쪽에서 서로 다른 이유로 필요합니다.",
      "정규식은 짧을수록 읽기 어렵기 쉬우니 예시 테스트를 곁들이면 좋습니다.",
      "시간대 처리는 저장, 표시, 계산의 기준을 분리하면 덜 꼬입니다.",
      "날짜는 문자열보다 날짜 타입으로 오래 버팁니다.",
      "동시성 버그는 재현보다 예방 설계가 싸게 먹힙니다.",
      "락은 필요한 만큼만 좁게 잡는 것이 기본입니다.",
      "불변 데이터는 추적할 시간을 줄여줍니다.",
      "상태 변경은 한곳으로 모일수록 디버깅이 쉬워집니다.",
      "사용하지 않는 코드는 읽는 사람에게도 비용을 청구합니다.",
      "리팩터링은 동작을 바꾸지 않는 작은 이동입니다.",
      "큰 변경은 먼저 동작을 고정하는 테스트가 있으면 편해집니다.",
      "배포 자동화는 실수를 줄이는 팀의 기억입니다.",
      "환경 변수는 코드와 비밀을 분리하는 약속입니다.",
      "보안은 입력을 믿지 않는 습관에서 시작합니다.",
      "권한은 필요한 만큼만 주는 것이 가장 덜 피곤합니다.",
      "비밀번호는 저장하지 말고 검증 가능한 해시만 남깁니다.",
      "HTTPS는 선택지가 아니라 기본 통신 예절입니다.",
      "SQL 인젝션은 문자열 조립 대신 파라미터 바인딩으로 막습니다.",
      "XSS는 출력 위치에 맞는 이스케이프가 핵심입니다.",
      "CSRF는 사용자의 브라우저가 자동으로 보내는 신뢰를 의심하는 문제입니다.",
      "의존성 업데이트는 보안 작업이면서 유지보수 작업입니다.",
      "패키지는 적을수록 업데이트해야 할 약속도 적습니다.",
      "빌드가 빠르면 개발자의 실험 횟수가 늘어납니다.",
      "CI는 사람이 까먹기 쉬운 확인을 대신 반복합니다.",
      "린터는 취향 싸움을 자동화로 바꾸는 도구입니다.",
      "포매터는 코드 리뷰에서 소음을 덜어냅니다.",
      "코드 리뷰는 사람 평가가 아니라 변경 위험 평가입니다.",
      "좋은 리뷰 코멘트는 문제와 이유와 제안을 함께 줍니다.",
      "문서는 완벽할 필요보다 최신일 필요가 큽니다.",
      "README는 프로젝트의 첫 번째 온보딩 화면입니다.",
      "예제 코드는 가장 빨리 낡는 문서라서 작게 유지하는 편이 좋습니다.",
      "CLI 옵션은 기본값이 좋아야 오래 씁니다.",
      "UX의 로딩 상태는 기다림을 덜 불안하게 만듭니다.",
      "스켈레톤 UI는 실제 레이아웃과 비슷할수록 자연스럽습니다.",
      "애니메이션은 방향과 원인을 알 수 있을 때 설득력이 생깁니다.",
      "모션은 짧고 일관될수록 인터페이스가 가볍게 느껴집니다.",
      "이미지는 크기와 포맷만 잘 잡아도 페이지가 빨라집니다.",
      "Lazy loading은 보이지 않는 리소스를 나중으로 미루는 예의입니다.",
      "CSS 변수는 테마를 코드가 아니라 언어처럼 다루게 해줍니다.",
      "z-index 문제는 쌓임 맥락을 이해하면 절반은 풀립니다.",
      "Grid는 2차원 배치, Flex는 1차원 흐름에 강합니다.",
      "폼 라벨은 시각 디자인보다 먼저 의미 구조입니다.",
      "키보드 포커스는 마우스가 없는 사용자만을 위한 것이 아닙니다.",
      "색상만으로 상태를 전달하면 누군가는 놓칩니다.",
      "HTTP 캐시는 빠른 웹의 오래된 비밀 무기입니다.",
      "상태 코드는 서버가 클라이언트에게 보내는 짧은 문장입니다.",
      "404는 실패 화면이 아니라 다음 행동을 안내하는 화면입니다.",
      "리다이렉트는 임시와 영구를 구분해야 검색 엔진도 덜 헤맵니다.",
      "JSON은 간단하지만 스키마가 없으면 약속이 흐려집니다.",
      "타입은 런타임 전에 만나는 작은 경고등입니다.",
      "제네릭은 반복되는 타입 관계에 이름을 붙이는 방법입니다.",
      "객체지향은 상속보다 메시지와 책임이 먼저입니다.",
      "상속은 강한 결합이고 합성은 교체 가능한 조립에 가깝습니다.",
      "함수형 스타일은 데이터 흐름을 드러내는 데 강합니다.",
      "순수 함수는 테스트와 캐싱이 편한 작은 섬입니다.",
      "예외는 복구할 수 있는 곳까지 의미를 잃지 않고 가야 합니다.",
      "도메인 용어를 코드에 남기면 비즈니스와 코드가 덜 멀어집니다.",
      "서비스 경계는 배포 단위보다 데이터 소유권에서 먼저 보입니다.",
      "마이크로서비스는 조직 문제까지 함께 가져옵니다.",
      "모놀리스도 경계가 좋으면 오래 건강할 수 있습니다.",
      "큐는 순간 부하를 시간으로 분산하는 장치입니다.",
      "재시도는 지수 백오프와 한계가 있어야 친절합니다.",
      "멱등성은 네트워크가 불안할 때 시스템을 덜 예민하게 만듭니다.",
      "관측 가능성은 로그, 메트릭, 트레이스가 함께 있어야 선명합니다.",
      "메트릭은 알람이 아니라 의사결정의 재료입니다.",
      "알람은 행동 가능한 것만 남겨야 사람이 믿습니다.",
      "데이터베이스 인덱스는 읽기를 빠르게 하지만 쓰기의 비용을 늘립니다.",
      "쿼리 플랜은 데이터베이스가 실제로 한 생각입니다.",
      "트랜잭션은 함께 성공하거나 함께 실패해야 할 약속입니다.",
      "정규화는 중복을 줄이고, 역정규화는 조회 비용을 줄입니다.",
      "백업은 복구 연습을 해보기 전까지 완성된 것이 아닙니다.",
      "마이그레이션은 되돌아가는 길까지 생각하면 마음이 편합니다.",
      "버전 관리는 코드뿐 아니라 결정의 기록입니다.",
      "충돌 해결은 어느 쪽 코드가 맞는지가 아니라 새 문맥이 맞는지를 보는 일입니다.",
      "좋은 개발 환경은 프로젝트에 다시 들어오는 시간을 줄입니다.",
      "디버거는 시간을 멈추는 도구이고 로그는 시간을 되감는 단서입니다.",
      "문제를 작게 재현하면 해결책도 작아질 가능성이 커집니다.",
      "가장 좋은 최적화는 하지 않아도 되는 일을 없애는 것입니다.",
      "코드는 컴퓨터보다 사람에게 더 자주 읽힙니다.",
      {
        text: "히든 : 페이지 주인장은 장송의 프리렌에 푹 빠져있습니다.",
        hidden: true,
      },
      {
        text: "히든 : 이 페이지에는 102개의 토막글 중 2개의 히든이 있습니다.",
        hidden: true,
      },
    ];

    const tipElementDefaultText = tipElement ? tipElement.textContent : "";
    const minVisibleMs = 500;
    const hiddenTipMinVisibleMs = 3000;
    const maxWaitMs = 4500;
    let progressFrame = 0;
    let currentProgress = 0;
    let isNavigating = false;

    const wait = (duration) => new Promise((resolve) => window.setTimeout(resolve, duration));

    const setProgress = (value) => {
      currentProgress = Math.max(0, Math.min(100, value));

      if (progressElement) {
        progressElement.style.width = `${currentProgress}%`;
      }

      if (percentElement) {
        percentElement.textContent = `${Math.round(currentProgress)}%`;
      }
    };

    const resetProgress = () => {
      if (progressElement) {
        progressElement.classList.add("is-resetting");
      }

      setProgress(0);

      window.requestAnimationFrame(() => {
        if (progressElement) {
          progressElement.classList.remove("is-resetting");
        }
      });
    };

    const chooseTip = () => {
      const item = tips[Math.floor(Math.random() * tips.length)] || tipElementDefaultText;
      const tip = typeof item === "string" ? item : item.text;

      if (tipElement) {
        tipElement.textContent = tip;
        tipElement.classList.toggle("is-hidden-tip", Boolean(item.hidden));
      }

      return tip;
    };

    const applySavedTip = () => {
      try {
        const savedTip = sessionStorage.getItem("page-transition-tip");
        const savedTipHidden = sessionStorage.getItem("page-transition-tip-hidden") === "true";

        if (savedTip && tipElement) {
          tipElement.textContent = savedTip;
          tipElement.classList.toggle("is-hidden-tip", savedTipHidden);
          return;
        }
      } catch (error) {
        return;
      }

      chooseTip();
    };

    const showOverlay = () => {
      chooseTip();
      resetProgress();
      document.body.classList.add("is-page-transition-locked");
      overlay.classList.add("is-visible");
    };

    const hideOverlay = () => {
      overlay.classList.remove("is-visible");
      document.documentElement.classList.remove("is-page-transition-arriving");
      document.body.classList.remove("is-page-transition-locked");

      try {
        sessionStorage.removeItem("page-transition-active");
        sessionStorage.removeItem("page-transition-tip");
        sessionStorage.removeItem("page-transition-tip-hidden");
      } catch (error) {
        return;
      }
    };

    const startProgress = () => {
      const startTime = window.performance.now();

      const tick = () => {
        const elapsed = window.performance.now() - startTime;
        const softLimit = Math.min(92, 14 + elapsed / 42);

        setProgress(currentProgress + (softLimit - currentProgress) * 0.12);
        progressFrame = window.requestAnimationFrame(tick);
      };

      progressFrame = window.requestAnimationFrame(tick);
    };

    const stopProgress = () => {
      if (progressFrame) {
        window.cancelAnimationFrame(progressFrame);
        progressFrame = 0;
      }
    };

    const isTransitionableLink = (link, event) => {
      if (
        event.defaultPrevented ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey ||
        link.hasAttribute("download") ||
        link.dataset.noTransition === "true"
      ) {
        return false;
      }

      const target = link.getAttribute("target");

      if (target && target !== "_self") {
        return false;
      }

      const url = new URL(link.href, window.location.href);
      const currentUrl = new URL(window.location.href);

      if (!["http:", "https:"].includes(url.protocol) || url.origin !== currentUrl.origin) {
        return false;
      }

      if (url.pathname === currentUrl.pathname && url.search === currentUrl.search) {
        return !url.hash && url.href !== currentUrl.href;
      }

      return !/\.(?:avif|gif|jpe?g|json|pdf|png|svg|webp|xml|zip)$/i.test(url.pathname);
    };

    const prepareNextPage = (url) => {
      if (!window.fetch || !window.AbortController) {
        return Promise.resolve();
      }

      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), maxWaitMs);

      return fetch(url.href, {
        cache: "force-cache",
        credentials: "same-origin",
        signal: controller.signal,
      })
        .catch(() => undefined)
        .finally(() => window.clearTimeout(timeout));
    };

    const navigateWithOverlay = async (url) => {
      if (isNavigating) {
        return;
      }

      isNavigating = true;
      showOverlay();
      startProgress();

      try {
        if (tipElement) {
          sessionStorage.setItem("page-transition-tip", tipElement.textContent);
          sessionStorage.setItem("page-transition-tip-hidden", String(tipElement.classList.contains("is-hidden-tip")));
        }
      } catch (error) {
        // The overlay still works if storage is unavailable.
      }

      const visibleMs =
        tipElement && tipElement.classList.contains("is-hidden-tip") ? hiddenTipMinVisibleMs : minVisibleMs;

      await Promise.all([wait(visibleMs), prepareNextPage(url)]);
      stopProgress();
      setProgress(100);

      try {
        sessionStorage.setItem("page-transition-active", "true");
      } catch (error) {
        // Navigation should not depend on session storage.
      }

      window.setTimeout(() => {
        window.location.assign(url.href);
      }, 170);
    };

    document.addEventListener("click", (event) => {
      const link = event.target.closest("a[href]");

      if (!link || !isTransitionableLink(link, event)) {
        return;
      }

      event.preventDefault();
      navigateWithOverlay(new URL(link.href, window.location.href));
    });

    if (document.documentElement.classList.contains("is-page-transition-arriving")) {
      applySavedTip();
      setProgress(100);
      document.body.classList.add("is-page-transition-locked");

      const fadeAfterLoad = () => window.setTimeout(hideOverlay, 260);

      if (document.readyState === "complete") {
        fadeAfterLoad();
      } else {
        window.addEventListener("load", fadeAfterLoad, { once: true });
      }
    }

    window.addEventListener("pageshow", (event) => {
      if (event.persisted) {
        stopProgress();
        resetProgress();
        hideOverlay();
        isNavigating = false;
      }
    });
  }

  function enhanceComments() {
    const section = document.querySelector("[data-giscus-comments]");

    if (!section) {
      return;
    }

    listenForGiscusMetadata(section);

    const button = section.querySelector("[data-giscus-load]");

    if (button) {
      button.addEventListener("click", () => loadGiscus(section));
    }

    if (!("IntersectionObserver" in window)) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) {
          return;
        }

        observer.disconnect();
        loadGiscus(section);
      },
      { rootMargin: "420px 0px" }
    );

    observer.observe(section);
  }

  document.addEventListener("DOMContentLoaded", () => {
    enhanceClickCursor();
    enhancePostShare();
    enhanceCodeBlocks();
    enhanceImageBlocks();
    enhanceBlogStats();
    enhanceHomeHeroVideo();
    enhanceHomeTyping();
    enhanceCategoryMenu();
    updateThemeImages();
    enhanceThemeToggle();
    enhanceAdminEntry();
    enhanceSearch();
    enhanceSearchPage();
    enhanceToc();
    enhancePageTransitions();
    enhanceComments();
  });
})();
