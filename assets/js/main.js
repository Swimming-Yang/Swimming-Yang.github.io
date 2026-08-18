(() => {
  const setText = (selector, value) => {
    document.querySelectorAll(selector).forEach((element) => {
      element.textContent = value;
    });
  };

  const formatCount = (value) => new Intl.NumberFormat("ko-KR").format(Number(value) || 0);

  const initializeTheme = () => {
    const button = document.querySelector("[data-theme-toggle]");
    if (!button) return;

    button.addEventListener("click", () => {
      const nextTheme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
      document.documentElement.dataset.theme = nextTheme;
      try {
        localStorage.setItem("site-theme", nextTheme);
      } catch (error) {
        // Theme still works for the current session when storage is unavailable.
      }
    });
  };

  const initializeHero = () => {
    const title = document.querySelector("[data-home-title-text]");
    const video = document.querySelector("[data-home-hero-video]");

    if (title) {
      const text = title.dataset.homeTitleText || "";
      title.textContent = "";
      [...text].forEach((character, index) => {
        window.setTimeout(() => {
          title.textContent += character;
        }, 55 * index);
      });
    }

    if (video) {
      video.play().catch(() => {
        video.hidden = true;
      });
    }
  };

  const initializeVisitorStats = () => {
    const stats = document.querySelector("[data-visitor-endpoint]");
    const endpoint = stats?.dataset.visitorEndpoint;
    if (!endpoint) return;

    fetch(endpoint, { headers: { Accept: "application/json" } })
      .then((response) => (response.ok ? response.json() : Promise.reject(new Error("visitor request failed"))))
      .then((data) => {
        setText("[data-visitor-today]", formatCount(data.today));
        setText("[data-visitor-total]", formatCount(data.total));
      })
      .catch(() => {
        setText("[data-visitor-today]", "-");
        setText("[data-visitor-total]", "-");
      });
  };

  document.addEventListener("DOMContentLoaded", () => {
    initializeTheme();
    initializeHero();
    initializeVisitorStats();
  });
})();
