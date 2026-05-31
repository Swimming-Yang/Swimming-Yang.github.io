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
      dots.innerHTML = "<i></i><i></i><i></i>";

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

  document.addEventListener("DOMContentLoaded", enhanceCodeBlocks);
})();
