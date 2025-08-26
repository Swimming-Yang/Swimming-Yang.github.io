// 페이지 로딩 관리 클래스
class LoadingManager {
  constructor() {
    this.overlay = document.getElementById("loadingOverlay");
    this.init();
  }

  init() {
    // 페이지 로드 시 로딩 즉시 숨기기 (첫 진입 시 로딩창 방지)
    this.hideLoading();

    // 모든 링크에 로딩 이벤트 추가
    this.addLoadingToLinks();
  }

    addLoadingToLinks() {
    // 페이지 로드 후 확실한 지연을 두고 링크 이벤트 추가
    setTimeout(() => {
      // 모든 그리드 버튼들을 우선 처리
      const gridBtns = document.querySelectorAll(".grid-btn");
      console.log(`그리드 버튼 ${gridBtns.length}개 발견`);
      
      gridBtns.forEach((btn, index) => {
        const href = btn.getAttribute("href");
        console.log(`그리드 버튼 ${index}: href=${href}, 클래스=${btn.className}`);
        
        if (href && !btn.classList.contains("btn-disabled") && !btn.hasAttribute("data-loading-added")) {
          btn.setAttribute("data-loading-added", "true");
          btn.addEventListener("click", (e) => {
            e.preventDefault();
            console.log(`그리드 버튼 클릭: ${href}`);
            this.showLoadingAndNavigate(href);
          });
          console.log(`그리드 버튼 ${index}에 이벤트 리스너 추가됨`);
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
            e.preventDefault();
            const href = link.getAttribute("href");
            console.log(`일반 링크 클릭: ${href}`);
            this.showLoadingAndNavigate(href);
          });
        }
      });
      
      console.log("모든 링크 이벤트 리스너 추가 완료");
    }, 300);
  }

  showLoadingAndNavigate(url) {
    this.showLoading();

    // 0.5초에서 1초 사이의 랜덤 시간
    const randomDelay = Math.random() * 500 + 500; // 500-1000ms

    setTimeout(() => {
      window.location.href = url;
    }, randomDelay);
  }

  showLoading() {
    console.log("로딩 표시 시작");
    if (this.overlay) {
      // 강제로 보이도록 설정
      this.overlay.style.display = "flex";
      this.overlay.style.opacity = "0";
      this.overlay.style.visibility = "visible";

      // 브라우저 렌더링 후 fade in
      setTimeout(() => {
        this.overlay.classList.add("show");
        this.overlay.style.opacity = "1";
      }, 10);

      // 로딩 비디오 재생 시작
      const video = this.overlay.querySelector(".loading-video");
      if (video) {
        console.log("비디오 재생 시도");
        video.currentTime = 0;
        video
          .play()
          .then(() => console.log("비디오 재생 성공"))
          .catch((e) => console.log("로딩 비디오 재생 실패:", e));
      } else {
        console.log("로딩 비디오를 찾을 수 없음");
      }
    } else {
      console.log("로딩 오버레이를 찾을 수 없음");
    }
  }

  hideLoading() {
    console.log("로딩 숨기기 시작");
    if (this.overlay) {
      this.overlay.style.opacity = "0";
      setTimeout(() => {
        this.overlay.classList.remove("show");
        this.overlay.style.display = "none";
        this.overlay.style.visibility = "hidden";
      }, 500);
    }
  }

  // 디버깅을 위한 수동 로딩 테스트 함수
  testLoading() {
    console.log("로딩 테스트 시작");
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
      video.setAttribute('playsinline', '');
      video.setAttribute('webkit-playsinline', '');
      video.muted = true;
      
      video.play().catch((e) => {
        console.error(`비디오 ${index} 재생 실패:`, e);
        // 모바일에서 자동재생 실패 시 사용자 상호작용 후 재시도
        document.addEventListener('touchstart', () => {
          video.play().catch(console.error);
        }, { once: true });
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
  // 비디오 백그라운드 매니저 먼저 초기화
  const videoManager = new VideoBackgroundManager();

  // 로딩 매니저 나중에 초기화 (DOM 완전 준비 후)
  setTimeout(() => {
    const loadingManager = new LoadingManager();
    
    // 전역에서 접근 가능하도록 설정 (디버깅용)
    window.loadingManager = loadingManager;
    
    // 디버깅: 콘솔에서 window.testLoading() 호출 가능
    window.testLoading = () => loadingManager.testLoading();
  }, 500); // 500ms로 증가하여 확실하게 DOM 준비 대기

  // 전역에서 접근 가능하도록 설정 (디버깅용)
  window.videoManager = videoManager;

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
        video.setAttribute('playsinline', '');
        if (index === window.videoManager.currentIndex) {
          video.play().catch(e => console.error(`비디오 ${index} 재생 실패:`, e));
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
