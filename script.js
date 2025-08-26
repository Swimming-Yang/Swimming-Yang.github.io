// 페이지 로딩 관리 클래스
class LoadingManager {
  constructor() {
    this.overlay = document.getElementById('loadingOverlay');
    this.init();
  }

  init() {
    // 모든 링크에 로딩 이벤트 추가
    this.addLoadingToLinks();
    
    // 페이지 로드 시 로딩 숨기기
    window.addEventListener('load', () => {
      this.hideLoading();
    });
  }

  addLoadingToLinks() {
    // 모든 내부 링크에 로딩 이벤트 추가
    const links = document.querySelectorAll('a[href^="boards/"], a[href^="pages/"], a[href="index.html"]');
    
    links.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const href = link.getAttribute('href');
        this.showLoadingAndNavigate(href);
      });
    });

    // 그리드 버튼들에도 로딩 추가
    const gridBtns = document.querySelectorAll('.grid-btn:not(.btn-disabled)');
    gridBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const href = btn.getAttribute('href');
        if (href) {
          this.showLoadingAndNavigate(href);
        }
      });
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

  showLoading() {
    if (this.overlay) {
      this.overlay.classList.add('show');
      // 로딩 비디오 재생 시작
      const video = this.overlay.querySelector('.loading-video');
      if (video) {
        video.currentTime = 0;
        video.play().catch(e => console.log('로딩 비디오 재생 실패:', e));
      }
    }
  }

  hideLoading() {
    if (this.overlay) {
      setTimeout(() => {
        this.overlay.classList.remove('show');
      }, 100);
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
      video.play().catch((e) => {
        console.error(`비디오 ${index} 재생 실패:`, e);
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

// 페이지 로드 완료 후 초기화
document.addEventListener("DOMContentLoaded", () => {
  // 로딩 매니저 초기화
  const loadingManager = new LoadingManager();
  
  // 비디오 백그라운드 매니저 초기화
  const videoManager = new VideoBackgroundManager();

  // 전역에서 접근 가능하도록 설정 (디버깅용)
  window.videoManager = videoManager;
  window.loadingManager = loadingManager;

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
    // 사용자가 상호작용한 후 비디오 재생 보장
    if (window.videoManager) {
      window.videoManager.playVideo(window.videoManager.currentIndex);
    }
  }
};

document.addEventListener("click", enableAutoplay);
document.addEventListener("keydown", enableAutoplay);
document.addEventListener("touchstart", enableAutoplay);
