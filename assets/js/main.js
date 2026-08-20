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
    const code = container?.querySelector("[data-home-code]");
    if (!container || !code) return;

    const examples = [
      [{ text: "Console", tone: "type" }, { text: ".", tone: "punctuation" }, { text: "WriteLine", tone: "method" }, { text: "(", tone: "punctuation" }, { text: '"Hello, I\'m YangSuYeong"', tone: "string" }, { text: ");", tone: "punctuation" }],
      [{ text: "print", tone: "function" }, { text: "(", tone: "punctuation" }, { text: '"Hello, I\'m YangSuYeong"', tone: "string" }, { text: ")", tone: "punctuation" }],
      [{ text: "console", tone: "namespace" }, { text: ".", tone: "punctuation" }, { text: "log", tone: "method" }, { text: "(", tone: "punctuation" }, { text: '"Hello, I\'m YangSuYeong"', tone: "string" }, { text: ");", tone: "punctuation" }],
      [{ text: "어떻게~화이팅!", tone: "comment" }, { text: " Hello, I'm YangSuYeong ", tone: "string" }, { text: "~이 사람이름이냐ㅋㅋ", tone: "comment" }],
    ];

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
      code.textContent = "";
      while (document.body.contains(container)) {
        for (const example of examples) {
          code.classList.toggle("is-hangul-code", example.some((token) => /[ㄱ-ㅎㅏ-ㅣ가-힣]/.test(token.text)));
          await animateCode(example);
        }
      }
    };

    run().catch(() => {
      renderCode(examples[0], examples[0].map((token) => token.text).join("").length);
    });
  };

  const initializeHomeGreeting = () => {
    const viewport = document.querySelector("[data-home-greeting]");
    const greetings = [...(viewport?.querySelectorAll("[data-home-greeting-item]") || [])];
    if (!viewport || greetings.length < 2) return;

    let activeIndex = 0;

    const showNextGreeting = async () => {
      const current = greetings[activeIndex];
      const nextIndex = (activeIndex + 1) % greetings.length;
      const next = greetings[nextIndex];

      next.hidden = false;
      next.classList.remove("is-leaving");
      await new Promise((resolve) => window.requestAnimationFrame(() => window.requestAnimationFrame(resolve)));

      current.classList.remove("is-active");
      current.classList.add("is-leaving");
      next.classList.add("is-active");

      await wait(680);
      current.hidden = true;
      current.classList.remove("is-leaving");
      activeIndex = nextIndex;
    };

    const run = async () => {
      await wait(3500);
      while (document.body.contains(viewport)) {
        await showNextGreeting();
        await wait(3500);
      }
    };

    run().catch(() => {
      greetings.forEach((greeting, index) => {
        greeting.hidden = index !== activeIndex;
        greeting.classList.toggle("is-active", index === activeIndex);
        greeting.classList.remove("is-leaving");
      });
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
    initializeHomeGreeting();
    initializeHomeTyping();
    initializeHeroVideo();
    initializeVisitorStats();
  });
})();
