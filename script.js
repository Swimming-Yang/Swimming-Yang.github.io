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
    console.log("🎯 이벤트 위임 설정 시작");

    // 문서 전체에 클릭 이벤트 위임
    document.addEventListener(
      "click",
      (e) => {
        console.log("📱 문서 클릭 감지:", e.target);

        // 그리드 버튼인지 확인
        let target = e.target;

        // 클릭된 요소가 그리드 버튼이거나 그 자식인지 확인
        while (target && target !== document) {
          if (target.classList && target.classList.contains("grid-btn")) {
            console.log("🎯 그리드 버튼 클릭 감지:", target);

            const href = target.getAttribute("href");
            const isDisabled = target.classList.contains("btn-disabled");

            if (href && !isDisabled) {
              console.log("🚀 로딩 시작! href:", href);
              e.preventDefault();
              e.stopPropagation();
              this.showLoadingAndNavigate(href);
              return;
            }
            break;
          }
          target = target.parentElement;
        }
      },
      true
    ); // useCapture: true

    console.log("✅ 이벤트 위임 설정 완료");
  }

  addLoadingToLinks() {
    console.log("=== addLoadingToLinks 시작 ===");

    // 즉시 한 번 시도
    this.attachLoadingEvents();

    // 그리고 여러 타이밍에서 재시도 (DOM 완전 로드 대기)
    setTimeout(() => this.attachLoadingEvents(), 100);
    setTimeout(() => this.attachLoadingEvents(), 500);
    setTimeout(() => this.attachLoadingEvents(), 1000);
  }

  attachLoadingEvents() {
    console.log("=== attachLoadingEvents 실행 ===");

    // 모든 그리드 버튼들을 우선 처리
    const gridBtns = document.querySelectorAll(".grid-btn");
    console.log(`그리드 버튼 ${gridBtns.length}개 발견`);

    gridBtns.forEach((btn, index) => {
      const href = btn.getAttribute("href");
      const isDisabled = btn.classList.contains("btn-disabled");
      const hasListener = btn.hasAttribute("data-loading-added");

      console.log(`그리드 버튼 ${index}:`, {
        href,
        disabled: isDisabled,
        hasListener,
        tagName: btn.tagName,
        className: btn.className,
      });

      if (href && !isDisabled && !hasListener) {
        btn.setAttribute("data-loading-added", "true");

        // 기존 이벤트 제거 후 새로 추가
        btn.removeEventListener("click", this.handleGridButtonClick);
        btn.addEventListener(
          "click",
          (e) => {
            console.log(`🚀 그리드 버튼 클릭됨: ${href}`);
            e.preventDefault();
            e.stopPropagation();
            this.showLoadingAndNavigate(href);
          },
          true
        ); // useCapture: true로 설정

        console.log(`✅ 그리드 버튼 ${index}에 이벤트 리스너 추가됨`);
      } else {
        console.log(
          `❌ 그리드 버튼 ${index} 건너뜀 - href:${href}, disabled:${isDisabled}, hasListener:${hasListener}`
        );
      }
    });

    // 기타 모든 내부 링크들 처리
    const allLinks = document.querySelectorAll(
      'a[href]:not([href^="http"]):not([href^="mailto"]):not([href^="tel"]):not([href="#"])'
    );

    console.log(`전체 링크 ${allLinks.length}개 발견`);

    allLinks.forEach((link) => {
      if (!link.hasAttribute("data-loading-added")) {
        link.setAttribute("data-loading-added", "true");
        link.addEventListener("click", (e) => {
          console.log(`🔗 일반 링크 클릭됨: ${link.href}`);
          e.preventDefault();
          const href = link.getAttribute("href");
          this.showLoadingAndNavigate(href);
        });
      }
    });

    console.log("=== 이벤트 리스너 추가 완료 ===");
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
      console.log("🔍 오버레이 검색 결과:", this.overlay);
    }
    return this.overlay;
  }

  showLoading() {
    console.log("🎬 로딩 표시 시작");

    const overlay = this.getOverlay();
    if (!overlay) {
      console.error("❌ loadingOverlay 요소를 찾을 수 없음!");
      console.log("📋 현재 DOM 상태:");
      console.log("- document.readyState:", document.readyState);
      console.log("- document.body:", document.body);
      console.log("- All elements with id:", document.querySelectorAll("[id]"));

      // 동적으로 오버레이 생성 시도
      this.createOverlay();
      return;
    }

    console.log("✅ 로딩 오버레이 발견:", overlay);

    // 🎯 간단하고 확실한 접근법: 바로 보이게 하기
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
      opacity: 1 !important;
    `;
    
    overlay.className = "loading-overlay show";

    console.log("📦 오버레이 강제 표시 완료 - 바로 보임!");

    // 로딩 비디오 재생 시작
    const video = overlay.querySelector(".loading-video");
    if (video) {
      console.log("🎥 프리렌 비디오 재생 시도");
      video.currentTime = 0;
      video.style.display = "block";
      video
        .play()
        .then(() => console.log("🎬 프리렌 비디오 재생 성공"))
        .catch((e) => console.log("❌ 프리렌 비디오 재생 실패:", e));
    } else {
      console.log("❌ 프리렌 비디오를 찾을 수 없음");
    }
  }

  createOverlay() {
    console.log("🛠️ 동적으로 로딩 오버레이 생성 시작");

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

    console.log("✅ 동적 오버레이 생성 완료:", overlay);

    // 다시 showLoading 호출
    this.showLoading();
  }

  hideLoading() {
    console.log("🫥 로딩 숨기기 시작");
    const overlay = this.getOverlay();
    if (overlay) {
      // 즉시 숨기기
      overlay.style.opacity = "0 !important";
      overlay.style.display = "none !important";
      overlay.style.visibility = "hidden !important";
      overlay.classList.remove("show");
      console.log("✅ 로딩 숨기기 완료");
    }
  }

  // 디버깅을 위한 수동 로딩 테스트 함수
  testLoading() {
    console.log("🧪 로딩 테스트 시작");
    console.log("🔍 현재 오버레이 상태:", this.overlay);
    this.showLoading();
    setTimeout(() => {
      this.hideLoading();
    }, 3000);
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
  console.log("🚀 DOMContentLoaded 이벤트 발생");

  // 로딩 매니저를 먼저 초기화 (가장 중요!)
  const loadingManager = new LoadingManager();
  console.log("✅ LoadingManager 초기화 완료");

  // 비디오 매니저 초기화
  const videoManager = new VideoBackgroundManager();
  console.log("✅ VideoBackgroundManager 초기화 완료");

  // 전역에서 접근 가능하도록 설정 (디버깅용)
  window.loadingManager = loadingManager;
  window.videoManager = videoManager;

  // 디버깅: 콘솔에서 window.testLoading() 호출 가능
  window.testLoading = () => loadingManager.testLoading();

  // 테스트용 버튼 추가 (임시)
  setTimeout(() => {
    const testBtn = document.createElement("button");
    testBtn.textContent = "로딩 테스트";
    testBtn.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      z-index: 10000;
      background: red;
      color: white;
      padding: 10px;
      border: none;
      border-radius: 5px;
      cursor: pointer;
    `;
    testBtn.onclick = () => {
      console.log("🧪 테스트 버튼 클릭됨");
      loadingManager.showLoading();
    };
    document.body.appendChild(testBtn);
    console.log("🧪 테스트 버튼 추가됨");
  }, 1000);

  console.log("🎉 모든 매니저 초기화 완료");

  // 페이지 가시성 변경 시 비디오 제어
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      videoManager.pauseAllVideos();
    } else {
      videoManager.playVideo(videoManager.currentIndex);
    }
  });

  // 콘텐츠 버튼 클릭 이벤트 (예시)
  const btn = document.querySelector(".btn");
  if (btn) {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      // 여기에 원하는 동작 추가
      console.log("더 알아보기 버튼 클릭됨");
      // 예: 스크롤 이동, 페이지 전환 등
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
