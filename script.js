// 타이핑 애니메이션을 위한 텍스트 배열
const typingTexts = [
  "AIONE Alumni",
  "SSAFY_14th",
  "소프트웨어 엔지니어",
  "풀스택 개발자",
  "동료와 함께하는 개발자",
];

class TypingAnimation {
  constructor(
    element,
    texts,
    typeSpeed = 100,
    deleteSpeed = 50,
    delayBetween = 2000
  ) {
    this.element = element;
    this.texts = texts;
    this.typeSpeed = typeSpeed;
    this.deleteSpeed = deleteSpeed;
    this.delayBetween = delayBetween;
    this.currentTextIndex = 0;
    this.currentCharIndex = 0;
    this.isDeleting = false;

    // 컨테이너 요소 찾기
    this.container = element.closest(".role-container");

    this.init();
  }

  init() {
    // 초기 텍스트 설정
    this.element.textContent = "";
    this.type();
  }

  type() {
    const currentText = this.texts[this.currentTextIndex];

    if (this.isDeleting) {
      // 삭제 중
      const displayText = currentText.substring(0, this.currentCharIndex - 1);
      this.element.textContent = displayText;
      this.currentCharIndex--;

      if (this.currentCharIndex === 0) {
        this.isDeleting = false;
        this.currentTextIndex = (this.currentTextIndex + 1) % this.texts.length;
        setTimeout(() => this.type(), 500);
        return;
      }

      setTimeout(() => this.type(), this.deleteSpeed);
    } else {
      // 타이핑 중
      const displayText = currentText.substring(0, this.currentCharIndex + 1);
      this.element.textContent = displayText;
      this.currentCharIndex++;

      if (this.currentCharIndex === currentText.length) {
        this.isDeleting = true;
        setTimeout(() => this.type(), this.delayBetween);
        return;
      }

      setTimeout(() => this.type(), this.typeSpeed);
    }
  }
}

// 네비게이션 관련 기능
class Navigation {
  constructor() {
    this.navbar = document.getElementById("navbar");
    this.navMenu = document.getElementById("nav-menu");
    this.hamburger = document.getElementById("hamburger");
    this.navLinks = document.querySelectorAll(".nav-link");

    this.init();
  }

  init() {
    this.setupScrollEffect();
    this.setupMobileMenu();
    this.setupSmoothScroll();
    this.setupActiveSection();
  }

  setupScrollEffect() {
    window.addEventListener("scroll", () => {
      if (window.scrollY > 100) {
        this.navbar.classList.add("scrolled");
      } else {
        this.navbar.classList.remove("scrolled");
      }
    });
  }

  setupMobileMenu() {
    this.hamburger.addEventListener("click", () => {
      this.hamburger.classList.toggle("active");
      this.navMenu.classList.toggle("active");
    });

    // 메뉴 링크 클릭시 모바일 메뉴 닫기
    this.navLinks.forEach((link) => {
      link.addEventListener("click", () => {
        this.hamburger.classList.remove("active");
        this.navMenu.classList.remove("active");
      });
    });
  }

  setupSmoothScroll() {
    this.navLinks.forEach((link) => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        const targetId = link.getAttribute("href");
        const targetSection = document.querySelector(targetId);

        if (targetSection) {
          const offsetTop = targetSection.offsetTop - 80;
          window.scrollTo({
            top: offsetTop,
            behavior: "smooth",
          });
        }
      });
    });

    // 히어로 버튼도 스무스 스크롤
    const heroBtn = document.querySelector(".btn-primary");
    if (heroBtn && heroBtn.getAttribute("href") === "#about") {
      heroBtn.addEventListener("click", (e) => {
        e.preventDefault();
        const aboutSection = document.querySelector("#about");
        if (aboutSection) {
          const offsetTop = aboutSection.offsetTop - 80;
          window.scrollTo({
            top: offsetTop,
            behavior: "smooth",
          });
        }
      });
    }
  }

  setupActiveSection() {
    const sections = document.querySelectorAll("section[id]");

    window.addEventListener("scroll", () => {
      const scrollPos = window.scrollY + 100;

      sections.forEach((section) => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.offsetHeight;
        const sectionId = section.getAttribute("id");

        if (scrollPos >= sectionTop && scrollPos < sectionTop + sectionHeight) {
          this.navLinks.forEach((link) => {
            link.classList.remove("active");
            if (link.getAttribute("href") === `#${sectionId}`) {
              link.classList.add("active");
            }
          });
        }
      });
    });
  }
}

// 스크롤 애니메이션
class ScrollAnimations {
  constructor() {
    this.init();
  }

  init() {
    // AOS 초기화
    if (typeof AOS !== "undefined") {
      AOS.init({
        duration: 1000,
        easing: "ease-in-out",
        once: true,
        mirror: false,
      });
    }

    this.setupCustomAnimations();
  }

  setupCustomAnimations() {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: "0px 0px -100px 0px",
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("animate-in");
        }
      });
    }, observerOptions);

    // 애니메이션 대상 요소들
    const animateElements = document.querySelectorAll(
      ".about-stats .stat-item"
    );
    animateElements.forEach((el) => {
      observer.observe(el);
    });
  }
}

// 유틸리티 함수들
class Utils {
  static smoothScrollTo(target, duration = 1000) {
    const targetPosition = target.offsetTop - 80;
    const startPosition = window.pageYOffset;
    const distance = targetPosition - startPosition;
    let startTime = null;

    function animation(currentTime) {
      if (startTime === null) startTime = currentTime;
      const timeElapsed = currentTime - startTime;
      const run = Utils.ease(timeElapsed, startPosition, distance, duration);
      window.scrollTo(0, run);
      if (timeElapsed < duration) requestAnimationFrame(animation);
    }

    requestAnimationFrame(animation);
  }

  static ease(t, b, c, d) {
    t /= d / 2;
    if (t < 1) return (c / 2) * t * t + b;
    t--;
    return (-c / 2) * (t * (t - 2) - 1) + b;
  }

  static debounce(func, wait, immediate) {
    let timeout;
    return function executedFunction() {
      const context = this;
      const args = arguments;
      const later = function () {
        timeout = null;
        if (!immediate) func.apply(context, args);
      };
      const callNow = immediate && !timeout;
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
      if (callNow) func.apply(context, args);
    };
  }
}

// 성능 최적화
class PerformanceOptimizer {
  constructor() {
    this.init();
  }

  init() {
    this.setupLazyLoading();
    this.optimizeScrollEvents();
  }

  setupLazyLoading() {
    const images = document.querySelectorAll("img[data-src]");
    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src;
          img.classList.remove("lazy");
          imageObserver.unobserve(img);
        }
      });
    });

    images.forEach((img) => imageObserver.observe(img));
  }

  optimizeScrollEvents() {
    const scrollEvents = ["scroll", "resize"];
    scrollEvents.forEach((eventType) => {
      window.addEventListener(
        eventType,
        Utils.debounce(() => {
          // 스크롤 이벤트 최적화된 핸들러
        }, 10)
      );
    });
  }
}

// 프로젝트 필터링 기능
class ProjectFilter {
  constructor() {
    this.init();
  }

  init() {
    const filterBtns = document.querySelectorAll(".filter-btn");
    const projectCards = document.querySelectorAll(".project-card");

    filterBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        const filter = btn.getAttribute("data-filter");

        // 버튼 활성화 상태 변경
        filterBtns.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");

        // 프로젝트 카드 필터링
        projectCards.forEach((card) => {
          const category = card.getAttribute("data-category");

          if (filter === "all" || category === filter) {
            card.style.display = "block";
            card.style.animation = "fadeInUp 0.5s ease";
          } else {
            card.style.display = "none";
          }
        });
      });
    });
  }
}

// 스킬 탭 및 바 애니메이션
class SkillTabs {
  constructor() {
    this.init();
  }

  init() {
    this.setupTabSwitching();
    this.setupSkillBarAnimation();
  }

  setupTabSwitching() {
    const filterBtns = document.querySelectorAll(".skill-filter-btn");
    const skillTabs = document.querySelectorAll(".skill-tab");

    filterBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        const filter = btn.getAttribute("data-filter");

        // 버튼 활성화 상태 변경
        filterBtns.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");

        // 탭 전환
        skillTabs.forEach((tab) => {
          const category = tab.getAttribute("data-category");

          if (category === filter) {
            tab.classList.add("active");
            // 해당 탭이 활성화될 때 스킬 바 애니메이션 실행
            setTimeout(() => {
              this.animateSkillBars(tab);
            }, 500);
          } else {
            tab.classList.remove("active");
          }
        });
      });
    });
  }

  setupSkillBarAnimation() {
    const observerOptions = {
      threshold: 0.3,
      rootMargin: "0px 0px -100px 0px",
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          // 현재 활성화된 탭의 스킬 바만 애니메이션
          const activeTab = document.querySelector(".skill-tab.active");
          if (activeTab) {
            this.animateSkillBars(activeTab);
          }
        }
      });
    }, observerOptions);

    const skillsSection = document.querySelector(".skills");
    if (skillsSection) {
      observer.observe(skillsSection);
    }
  }

  animateSkillBars(skillTab) {
    const skillCards = skillTab.querySelectorAll(".skill-card");

    skillCards.forEach((card, cardIndex) => {
      const levelBars = card.querySelectorAll(".level-bar.active");

      // 모든 active 바를 비활성화
      levelBars.forEach((bar) => {
        bar.classList.remove("active");
      });

      // 순차적으로 활성화
      levelBars.forEach((bar, barIndex) => {
        setTimeout(() => {
          bar.classList.add("active");
        }, cardIndex * 200 + barIndex * 100);
      });
    });
  }
}

// 폼 처리
class ContactForm {
  constructor() {
    this.init();
  }

  init() {
    const form = document.querySelector(".contact-form");
    if (form) {
      form.addEventListener("submit", this.handleSubmit.bind(this));
    }
  }

  handleSubmit(e) {
    e.preventDefault();

    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);

    // 여기에서 실제 폼 전송 처리
    console.log("폼 데이터:", data);

    // 성공 메시지 표시
    this.showMessage("메시지가 성공적으로 전송되었습니다!", "success");

    // 폼 초기화
    e.target.reset();
  }

  showMessage(message, type) {
    const messageDiv = document.createElement("div");
    messageDiv.className = `form-message ${type}`;
    messageDiv.textContent = message;

    const form = document.querySelector(".contact-form");
    form.appendChild(messageDiv);

    // 3초 후 메시지 제거
    setTimeout(() => {
      messageDiv.remove();
    }, 3000);
  }
}

// 페이지 로드 완료 후 초기화
document.addEventListener("DOMContentLoaded", () => {
  // 타이핑 애니메이션 시작
  const typingElement = document.getElementById("typing-text");
  if (typingElement) {
    new TypingAnimation(typingElement, typingTexts, 120, 60, 2500);
  }

  // 네비게이션 초기화
  new Navigation();

  // 스크롤 애니메이션 초기화
  new ScrollAnimations();

  // 프로젝트 필터 초기화
  new ProjectFilter();

  // 스킬 탭 및 바 애니메이션 초기화
  new SkillTabs();

  // 연락처 폼 초기화
  new ContactForm();

  // 성능 최적화 초기화
  new PerformanceOptimizer();

  // 페이지 로드 애니메이션
  setTimeout(() => {
    document.body.classList.add("loaded");
  }, 100);
});

// 페이지 가시성 변경 처리
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    // 페이지가 숨겨졌을 때
    console.log("페이지가 숨겨짐");
  } else {
    // 페이지가 다시 보일 때
    console.log("페이지가 다시 보임");
  }
});

// 에러 핸들링
window.addEventListener("error", (e) => {
  console.error("페이지 에러:", e.error);
});

// 모던 브라우저 기능 감지
const supportsIntersectionObserver = "IntersectionObserver" in window;
const supportsCustomProperties = CSS.supports("(--custom: property)");

if (!supportsIntersectionObserver) {
  console.warn("IntersectionObserver가 지원되지 않습니다.");
}

if (!supportsCustomProperties) {
  console.warn("CSS Custom Properties가 지원되지 않습니다.");
}

// 개발 환경에서만 실행되는 코드
if (
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1"
) {
  console.log("개발 모드로 실행 중");

  // 개발용 유틸리티
  window.portfolio = {
    scrollToSection: (sectionId) => {
      const section = document.querySelector(`#${sectionId}`);
      if (section) {
        Utils.smoothScrollTo(section);
      }
    },
    toggleMobileMenu: () => {
      const hamburger = document.getElementById("hamburger");
      const navMenu = document.getElementById("nav-menu");
      hamburger.classList.toggle("active");
      navMenu.classList.toggle("active");
    },
  };
}
