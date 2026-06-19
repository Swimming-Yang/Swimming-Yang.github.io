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
      button.textContent = "완료";
      button.classList.add("is-copied");
      window.setTimeout(resetLabel, 1600);
      return;
    }

    navigator.clipboard.writeText(text).then(() => {
      button.textContent = "완료";
      button.classList.add("is-copied");
      window.setTimeout(resetLabel, 1600);
    });
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
    enhanceCategoryMenu();
    enhanceComments();
  });
})();
