// 페이지 로딩 관리 클래스
class LoadingManager {
  constructor() {
    this.overlay = null;
    this.init();
  }

  init() {
    // 페이지 로드 시 로딩 즉시 숨기기 (첫 진입 시 로딩창 방지)
    this.hideLoading();

    // 이벤트 위임 방식으로 문서 전체에 클릭 이벤트 설정
    this.setupEventDelegation();

    // 추가적으로 직접 바인딩도 시도
    this.addLoadingToLinks();
  }

  setupEventDelegation() {
    // 더 이상 외부 페이지 이동이 없으므로 단순화
    // 외부 링크들은 attachLoadingEvents에서 처리
  }

  addLoadingToLinks() {
    // 즉시 한 번 시도
    this.attachLoadingEvents();

    // 그리고 여러 타이밍에서 재시도 (DOM 완전 로드 대기)
    setTimeout(() => this.attachLoadingEvents(), 100);
    setTimeout(() => this.attachLoadingEvents(), 500);
    setTimeout(() => this.attachLoadingEvents(), 1000);
  }

  attachLoadingEvents() {
    // 외부 링크들만 처리 (GitHub, LinkedIn 등)
    const externalLinks = document.querySelectorAll(
      'a[href^="http"]:not([href^="#"])'
    );

    externalLinks.forEach((link) => {
      const href = link.getAttribute("href");
      const hasListener = link.hasAttribute("data-loading-added");

      if (href && !hasListener) {
        link.setAttribute("data-loading-added", "true");
        link.addEventListener("click", (e) => {
          // 외부 링크는 새 탭에서 열기
          link.setAttribute("target", "_blank");
          link.setAttribute("rel", "noopener noreferrer");
        });
      }
    });
  }

  showLoadingAndNavigate(url) {
    this.showLoading();

    // 0.5초에서 1초 사이의 랜덤 시간
    const randomDelay = Math.random() * 500 + 500; // 500-1000ms

    setTimeout(() => {
      window.location.href = url;
    }, randomDelay);
  }

  getOverlay() {
    if (!this.overlay) {
      this.overlay = document.getElementById("loadingOverlay");
    }
    return this.overlay;
  }

  showLoading() {
    const overlay = this.getOverlay();
    if (!overlay) {
      // 동적으로 오버레이 생성 시도
      this.createOverlay();
      return;
    }

    // 초기 상태 (투명하게 시작)
    overlay.style.cssText = `
      position: fixed !important;
      top: 0 !important;
      left: 0 !important;
      width: 100vw !important;
      height: 100vh !important;
      background: rgb(255, 255, 255) !important;
      z-index: 99999 !important;
      display: flex !important;
      justify-content: center !important;
      align-items: center !important;
      visibility: visible !important;
      pointer-events: auto !important;
      opacity: 0 !important;
      transition: opacity 0.3s ease-in-out !important;
    `;

    overlay.className = "loading-overlay";

    // 로딩 비디오 재생 시작
    const video = overlay.querySelector(".loading-video");
    if (video) {
      video.currentTime = 0;
      video.style.display = "block";
      video.play().catch(() => {});
    }

    // 페이드인 효과 (브라우저 렌더링 후)
    requestAnimationFrame(() => {
      overlay.style.opacity = "1 !important";
      overlay.classList.add("show");
    });
  }

  createOverlay() {
    // 오버레이 생성
    const overlay = document.createElement("div");
    overlay.id = "loadingOverlay";
    overlay.className = "loading-overlay";

    // 컨텐츠 컨테이너 생성
    const content = document.createElement("div");
    content.className = "loading-content";

    // 비디오 생성
    const video = document.createElement("video");
    video.className = "loading-video";
    video.autoplay = true;
    video.muted = true;
    video.loop = true;
    video.setAttribute("playsinline", "");

    // 비디오 소스 생성
    const source = document.createElement("source");
    source.src = "asserts/videos/loading_frieren.mp4";
    source.type = "video/mp4";

    // 요소들 조립
    video.appendChild(source);
    content.appendChild(video);
    overlay.appendChild(content);

    // DOM에 추가
    document.body.appendChild(overlay);

    // 캐시 업데이트
    this.overlay = overlay;

    // 다시 showLoading 호출
    this.showLoading();
  }

  hideLoading() {
    const overlay = this.getOverlay();
    if (overlay) {
      // 페이드아웃 효과 시작
      overlay.style.transition = "opacity 0.3s ease-in-out !important";
      overlay.style.opacity = "0 !important";
      overlay.classList.remove("show");

      // 페이드아웃 완료 후 완전히 숨기기
      setTimeout(() => {
        overlay.style.display = "none !important";
        overlay.style.visibility = "hidden !important";
      }, 300); // 0.3초 후
    }
  }
}

class VideoBackgroundManager {
  constructor() {
    this.videos = document.querySelectorAll(".background-video");
    this.indicators = document.querySelectorAll(".indicator");
    this.currentIndex = 0;
    this.isTransitioning = false;

    this.init();
  }

  init() {
    // 첫 번째 비디오 재생 시작
    this.playVideo(0);

    // 각 비디오에 이벤트 리스너 추가
    this.videos.forEach((video, index) => {
      // 비디오 끝날 때 다음 비디오로 전환
      video.addEventListener("ended", () => {
        if (index === this.currentIndex) {
          this.nextVideo();
        }
      });

      // 비디오 로드 에러 처리
      video.addEventListener("error", (e) => {
        console.error(`비디오 ${index} 로드 실패:`, e);
        if (index === this.currentIndex) {
          this.nextVideo();
        }
      });

      // 비디오 로드 완료
      video.addEventListener("loadeddata", () => {
        console.log(`비디오 ${index} 로드 완료`);
      });
    });

    // 인디케이터 클릭 이벤트
    this.indicators.forEach((indicator, index) => {
      indicator.addEventListener("click", () => {
        this.goToVideo(index);
      });
    });

    // 키보드 이벤트 (선택사항)
    document.addEventListener("keydown", (e) => {
      switch (e.key) {
        case "ArrowRight":
          this.nextVideo();
          break;
        case "ArrowLeft":
          this.prevVideo();
          break;
      }
    });
  }

  playVideo(index) {
    const video = this.videos[index];
    if (video) {
      video.currentTime = 0;

      // 모바일에서 비디오 재생을 위한 추가 속성 설정
      video.setAttribute("playsinline", "");
      video.setAttribute("webkit-playsinline", "");
      video.muted = true;

      video.play().catch((e) => {
        console.error(`비디오 ${index} 재생 실패:`, e);
        // 모바일에서 자동재생 실패 시 사용자 상호작용 후 재시도
        document.addEventListener(
          "touchstart",
          () => {
            video.play().catch(console.error);
          },
          { once: true }
        );
      });
    }
  }

  nextVideo() {
    if (this.isTransitioning) return;

    const nextIndex = (this.currentIndex + 1) % this.videos.length;
    this.transitionToVideo(nextIndex);
  }

  prevVideo() {
    if (this.isTransitioning) return;

    const prevIndex =
      (this.currentIndex - 1 + this.videos.length) % this.videos.length;
    this.transitionToVideo(prevIndex);
  }

  goToVideo(index) {
    if (
      this.isTransitioning ||
      index === this.currentIndex ||
      index >= this.videos.length
    )
      return;

    this.transitionToVideo(index);
  }

  transitionToVideo(nextIndex) {
    this.isTransitioning = true;

    const currentVideo = this.videos[this.currentIndex];
    const nextVideo = this.videos[nextIndex];

    // 현재 비디오 페이드 아웃
    currentVideo.classList.remove("active");

    // 페이드 아웃 시간 후 다음 비디오 시작
    setTimeout(() => {
      // 다음 비디오 준비 및 페이드 인
      nextVideo.currentTime = 0;
      nextVideo.classList.add("active");
      this.playVideo(nextIndex);

      // 현재 비디오 정지
      currentVideo.pause();

      // 인덱스 및 인디케이터 업데이트
      this.currentIndex = nextIndex;
      this.updateIndicators();

      // 전환 완료
      setTimeout(() => {
        this.isTransitioning = false;
      }, 100);
    }, 500); // 페이드 아웃 시간의 절반
  }

  updateIndicators() {
    this.indicators.forEach((indicator, index) => {
      if (index === this.currentIndex) {
        indicator.classList.add("active");
      } else {
        indicator.classList.remove("active");
      }
    });
  }

  // 모든 비디오 일시정지
  pauseAllVideos() {
    this.videos.forEach((video) => {
      video.pause();
    });
  }

  // 현재 비디오 재생/일시정지 토글
  toggleCurrentVideo() {
    const currentVideo = this.videos[this.currentIndex];
    if (currentVideo.paused) {
      currentVideo.play();
    } else {
      currentVideo.pause();
    }
  }
}

// 모바일 네비게이션 기능 제거됨 (헤더 제거로 인해)

// 페이지 로드 완료 후 초기화
document.addEventListener("DOMContentLoaded", () => {
  // 로딩 매니저를 먼저 초기화 (가장 중요!)
  const loadingManager = new LoadingManager();

  // 비디오 매니저 초기화
  const videoManager = new VideoBackgroundManager();

  // 전역에서 접근 가능하도록 설정 (디버깅용)
  window.loadingManager = loadingManager;
  window.videoManager = videoManager;

  // 페이지 가시성 변경 시 비디오 제어
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      videoManager.pauseAllVideos();
    } else {
      videoManager.playVideo(videoManager.currentIndex);
    }
  });

  // 네비게이션 링크 스무스 스크롤
  const navLinks = document.querySelectorAll('.nav-link[href^="#"]');
  navLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const targetId = link.getAttribute("href");
      const targetElement = document.querySelector(targetId);

      if (targetElement) {
        targetElement.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    });
  });

  // 히어로 버튼 스무스 스크롤
  const heroButtons = document.querySelectorAll(
    '.btn-primary[href^="#"], .btn-secondary[href^="#"]'
  );
  heroButtons.forEach((button) => {
    button.addEventListener("click", (e) => {
      e.preventDefault();
      const targetId = button.getAttribute("href");
      const targetElement = document.querySelector(targetId);

      if (targetElement) {
        targetElement.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    });
  });

  // 연락처 폼 처리
  const contactForm = document.querySelector(".form");
  if (contactForm) {
    contactForm.addEventListener("submit", (e) => {
      e.preventDefault();

      const formData = new FormData(contactForm);
      const name = contactForm.querySelector('input[type="text"]').value;
      const email = contactForm.querySelector('input[type="email"]').value;
      const message = contactForm.querySelector("textarea").value;

      if (name && email && message) {
        // 여기서 실제 폼 제출 로직을 구현할 수 있습니다
        alert(
          `메시지가 전송되었습니다!\n\n이름: ${name}\n이메일: ${email}\n메시지: ${message}`
        );
        contactForm.reset();
      } else {
        alert("모든 필드를 입력해주세요.");
      }
    });
  }
});

// 에러 핸들링
window.addEventListener("error", (e) => {
  console.error("페이지 에러:", e.error);
});

// 사용자 상호작용 감지 (자동재생 정책 대응)
let userInteracted = false;
const enableAutoplay = () => {
  if (!userInteracted) {
    userInteracted = true;
    console.log("사용자 상호작용 감지됨 - 비디오 재생 시도");
    // 사용자가 상호작용한 후 모든 비디오 재생 보장
    if (window.videoManager) {
      // 모든 비디오에 대해 재생 시도
      window.videoManager.videos.forEach((video, index) => {
        video.muted = true;
        video.setAttribute("playsinline", "");
        if (index === window.videoManager.currentIndex) {
          video
            .play()
            .catch((e) => console.error(`비디오 ${index} 재생 실패:`, e));
        }
      });
    }
  }
};

// 다양한 사용자 상호작용 이벤트 리스닝
document.addEventListener("click", enableAutoplay);
document.addEventListener("keydown", enableAutoplay);
document.addEventListener("touchstart", enableAutoplay);
document.addEventListener("touchend", enableAutoplay);
document.addEventListener("mousedown", enableAutoplay);
