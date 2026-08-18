(() => {
  const wait = (duration) => new Promise((resolve) => window.setTimeout(resolve, duration));

  const setText = (selector, value) => {
    document.querySelectorAll(selector).forEach((element) => {
      element.textContent = value;
    });
  };

  const initializeTheme = () => {
    const button = document.querySelector("[data-theme-toggle]");
    if (!button) return;

    button.addEventListener("click", () => {
      const nextTheme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
      document.documentElement.dataset.theme = nextTheme;
      try {
        localStorage.setItem("site-theme", nextTheme);
      } catch (error) {
        // The current page can still use the selected theme.
      }
    });
  };

  const initializeHomeTyping = () => {
    const container = document.querySelector("[data-home-typing]");
    const title = container?.querySelector("[data-home-title-text]");
    const code = container?.querySelector("[data-home-code]");
    if (!container || !title || !code) return;

    const titleText = title.dataset.homeTitleText || "";
    const accent = title.dataset.homeTitleAccent || "";
    const examples = [
      [{ text: "Console", tone: "type" }, { text: ".", tone: "punctuation" }, { text: "WriteLine", tone: "method" }, { text: "(", tone: "punctuation" }, { text: '"Hello World!!"', tone: "string" }, { text: ");", tone: "punctuation" }],
      [{ text: "print", tone: "function" }, { text: "(", tone: "punctuation" }, { text: '"Hello World!!"', tone: "string" }, { text: ")", tone: "punctuation" }],
      [{ text: "console", tone: "namespace" }, { text: ".", tone: "punctuation" }, { text: "log", tone: "method" }, { text: "(", tone: "punctuation" }, { text: '"Hello World!!"', tone: "string" }, { text: ");", tone: "punctuation" }],
      [{ text: "어떻게~화이팅!", tone: "comment" }, { text: " Hello World!! ", tone: "string" }, { text: "~이 사람이름이냐ㅋㅋ", tone: "comment" }],
    ];

    const renderTitle = (length) => {
      const visible = titleText.slice(0, length);
      const accentIndex = accent ? visible.indexOf(accent) : -1;
      title.textContent = "";
      if (accentIndex < 0) {
        title.textContent = visible;
        return;
      }
      title.append(visible.slice(0, accentIndex));
      const accentElement = document.createElement("span");
      accentElement.className = "home-hero__title-accent";
      accentElement.textContent = accent;
      title.append(accentElement, visible.slice(accentIndex + accent.length));
    };

    const renderCode = (tokens, length) => {
      let consumed = 0;
      code.textContent = "";
      const fragment = document.createDocumentFragment();
      tokens.forEach((token) => {
        const visible = token.text.slice(0, Math.max(0, Math.min(token.text.length, length - consumed)));
        consumed += token.text.length;
        if (!visible) return;
        const span = document.createElement("span");
        span.className = `home-code-token home-code-token--${token.tone}`;
        span.textContent = visible;
        fragment.append(span);
      });
      code.append(fragment);
    };

    const typeTitle = async () => {
      for (let index = 1; index <= titleText.length; index += 1) {
        renderTitle(index);
        await wait(78);
      }
    };

    const animateCode = async (tokens) => {
      const text = tokens.map((token) => token.text).join("");
      for (let index = 1; index <= text.length; index += 1) {
        renderCode(tokens, index);
        await wait(52);
      }
      await wait(1600);
      for (let index = text.length - 1; index >= 0; index -= 1) {
        renderCode(tokens, index);
        await wait(28);
      }
      await wait(300);
    };

    const run = async () => {
      title.textContent = "";
      code.textContent = "";
      await typeTitle();
      container.classList.add("is-title-complete");
      await wait(260);
      while (document.body.contains(container)) {
        for (const example of examples) {
          code.classList.toggle("is-hangul-code", example.some((token) => /[ㄱ-ㅎㅏ-ㅣ가-힣]/.test(token.text)));
          await animateCode(example);
        }
      }
    };

    run().catch(() => {
      renderTitle(titleText.length);
      renderCode(examples[0], examples[0].map((token) => token.text).join("").length);
    });
  };

  const initializeHeroVideo = () => {
    const video = document.querySelector("[data-home-hero-video]");
    if (!video) return;
    const showVideo = () => video.classList.add("is-ready");
    if (video.readyState >= 2) showVideo();
    else ["loadeddata", "canplay", "playing"].forEach((eventName) => video.addEventListener(eventName, showVideo, { once: true }));
    video.play().catch(() => {});
  };

  const initializeVisitorStats = () => {
    const stats = document.querySelector("[data-visitor-endpoint]");
    const endpoint = stats?.dataset.visitorEndpoint;
    if (!endpoint) return;
    fetch(endpoint, { headers: { Accept: "application/json" } })
      .then((response) => (response.ok ? response.json() : Promise.reject(new Error("visitor request failed"))))
      .then((data) => {
        const format = (value) => new Intl.NumberFormat("ko-KR").format(Number(value) || 0);
        setText("[data-visitor-today]", format(data.today));
        setText("[data-visitor-total]", format(data.total));
      })
      .catch(() => {
        stats.classList.add("is-visitor-offline");
        setText("[data-visitor-today]", "-");
        setText("[data-visitor-total]", "-");
      });
  };

  document.addEventListener("DOMContentLoaded", () => {
    initializeTheme();
    initializeHomeTyping();
    initializeHeroVideo();
    initializeVisitorStats();
  });
})();
