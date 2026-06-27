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
      button.textContent = "복사";
      button.classList.remove("is-copied");
    };

    const finish = () => {
      button.textContent = "완료";
      button.classList.add("is-copied");
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

  function enhanceCodeBlocks() {
    const blocks = document.querySelectorAll(".content div[class*='language-'].highlighter-rouge");

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
      copyButton.textContent = "복사";
      copyButton.setAttribute("aria-label", "코드 복사");
      copyButton.addEventListener("click", () => copyCode(copyButton, codeElement));

      toolbar.append(dots, language, copyButton);
      block.classList.add("code-window");
      block.insertBefore(toolbar, highlight);
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
    const examples = [
      'std::cout << "Hello World!!" << std::endl;',
      'Console.WriteLine("Hello World!!");',
      'System.out.println("Hello World!!");',
      'print("Hello World!!")',
      'console.log("Hello World!!");',
      "어떻게~화이팅!Hello World!!~이 사람이름이냐ㅋㅋ",
    ];

    const wait = (duration) => new Promise((resolve) => window.setTimeout(resolve, duration));

    const typeText = async (element, text, delay) => {
      element.textContent = "";

      for (let index = 1; index <= text.length; index += 1) {
        element.textContent = text.slice(0, index);
        await wait(delay);
      }
    };

    const eraseText = async (element, delay) => {
      const text = element.textContent;

      for (let index = text.length - 1; index >= 0; index -= 1) {
        element.textContent = text.slice(0, index);
        await wait(delay);
      }
    };

    const run = async () => {
      await typeText(titleElement, titleText, 78);
      container.classList.add("is-title-complete");
      await wait(260);

      while (document.body.contains(container)) {
        for (const example of examples) {
          await typeText(codeElement, example, 58);
          await wait(1700);
          await eraseText(codeElement, 34);
          await wait(340);
        }
      }
    };

    titleElement.textContent = "";
    codeElement.textContent = "";
    run().catch(() => {
      titleElement.textContent = titleText;
      codeElement.textContent = examples[0];
      container.classList.add("is-title-complete");
    });
  }

  function enhanceCategoryMenu() {
    const menu = document.querySelector("[data-category-menu]");

    if (!menu) {
      return;
    }

    document.addEventListener("click", (event) => {
      if (menu.open && !menu.contains(event.target)) {
        menu.open = false;
      }
    });

    menu.addEventListener("keydown", (event) => {
      if (event.key !== "Escape") {
        return;
      }

      menu.open = false;
      const summary = menu.querySelector("summary");

      if (summary) {
        summary.focus();
      }
    });
  }

  function enhanceThemeToggle() {
    const button = document.querySelector("[data-theme-toggle]");

    if (!button) {
      return;
    }

    const setTheme = (theme) => {
      document.documentElement.dataset.theme = theme;
      button.setAttribute("aria-label", theme === "dark" ? "밝은 테마로 변경" : "어두운 테마로 변경");

      try {
        localStorage.setItem("site-theme", theme);
      } catch (error) {
        return;
      }
    };

    setTheme(document.documentElement.dataset.theme || "light");

    button.addEventListener("click", () => {
      setTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark");
    });
  }

  function escapeHtml(value) {
    return String(value || "").replace(/[&<>"']/g, (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    })[char]);
  }

  function createSearchResult(post) {
    const link = document.createElement("a");
    link.className = "search-result";
    link.href = post.url;
    link.innerHTML = `
      <span>${escapeHtml(post.topic)} · ${escapeHtml(post.date)}</span>
      <strong>${escapeHtml(post.title)}</strong>
      <em>${escapeHtml(post.excerpt)}</em>
    `;
    return link;
  }

  function enhanceSearch() {
    const panel = document.querySelector("[data-search-panel]");
    const input = document.querySelector("[data-search-input]");
    const results = document.querySelector("[data-search-results]");
    const openButtons = document.querySelectorAll("[data-search-open]");
    const closeButtons = document.querySelectorAll("[data-search-close]");
    const homeSearchForm = document.querySelector("[data-home-search-form]");
    const homeSearchInput = document.querySelector("[data-home-search-input]");

    if (!panel || !input || !results) {
      return;
    }

    let posts = [];
    let loaded = false;

    const render = (query) => {
      const keyword = query.trim().toLowerCase();
      results.innerHTML = "";

      if (!keyword) {
        results.innerHTML = '<p class="search-panel__empty">검색어를 입력하면 글을 찾아볼 수 있습니다.</p>';
        return;
      }

      const matches = posts
        .filter((post) => `${post.title} ${post.excerpt} ${post.topic} ${post.tags}`.toLowerCase().includes(keyword))
        .slice(0, 8);

      if (matches.length === 0) {
        results.innerHTML = '<p class="search-panel__empty">검색 결과가 없습니다.</p>';
        return;
      }

      matches.forEach((post) => results.append(createSearchResult(post)));
    };

    const load = () => {
      if (loaded) {
        return Promise.resolve();
      }

      loaded = true;
      return fetch(`${getBaseUrl()}/search.json`, { cache: "no-store" })
        .then((response) => response.json())
        .then((data) => {
          posts = Array.isArray(data) ? data : [];
        })
        .catch(() => {
          posts = [];
          results.innerHTML = '<p class="search-panel__empty">검색 데이터를 불러오지 못했습니다.</p>';
        });
    };

    const open = (query) => {
      if (typeof query === "string") {
        input.value = query;
      }

      panel.hidden = false;
      document.body.classList.add("is-search-open");
      load().then(() => {
        input.focus();
        render(input.value);
      });
    };

    const close = () => {
      panel.hidden = true;
      document.body.classList.remove("is-search-open");
    };

    openButtons.forEach((button) => button.addEventListener("click", open));
    closeButtons.forEach((button) => button.addEventListener("click", close));
    input.addEventListener("input", () => render(input.value));

    if (homeSearchForm && homeSearchInput) {
      homeSearchForm.addEventListener("submit", (event) => {
        event.preventDefault();
        open(homeSearchInput.value);
      });
    }

    document.addEventListener("keydown", (event) => {
      if (event.key === "/" && !panel.hidden && document.activeElement !== input) {
        event.preventDefault();
        input.focus();
      }

      if (event.key === "Escape" && !panel.hidden) {
        close();
      }
    });
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

  function enhanceComments() {
    const section = document.querySelector("[data-giscus-comments]");

    if (!section) {
      return;
    }

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
    enhanceCodeBlocks();
    enhanceBlogStats();
    enhanceHomeTyping();
    enhanceCategoryMenu();
    enhanceThemeToggle();
    enhanceSearch();
    enhanceToc();
    enhanceComments();
  });
})();
