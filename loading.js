// 공통 로딩 스크립트
class PageLoadingManager {
  constructor() {
    this.overlay = null;
    this.createLoadingOverlay();
    this.init();
  }

  createLoadingOverlay() {
    // 로딩 오버레이 HTML 생성
    const overlay = document.createElement('div');
    overlay.id = 'loadingOverlay';
    overlay.className = 'loading-overlay';
    overlay.innerHTML = `
      <div class="loading-content">
        <video 
          class="loading-video" 
          autoplay 
          muted 
          loop 
          playsinline
        >
          <source src="../asserts/videos/loading_frieren.mp4" type="video/mp4" />
          <source src="asserts/videos/loading_frieren.mp4" type="video/mp4" />
        </video>
      </div>
    `;
    
    document.body.insertBefore(overlay, document.body.firstChild);
    this.overlay = overlay;
  }

  init() {
    // 페이지 로드 시 로딩 숨기기
    window.addEventListener('load', () => {
      this.hideLoading();
    });

    // 모든 링크에 로딩 이벤트 추가
    this.addLoadingToLinks();
  }

  addLoadingToLinks() {
    // 페이지 로드 후 약간의 지연을 두고 링크 이벤트 추가
    setTimeout(() => {
      const links = document.querySelectorAll('a[href]:not([href^="http"]):not([href^="mailto"]):not([href^="tel"])');
      
      links.forEach(link => {
        // 이미 이벤트가 추가되었는지 확인
        if (!link.hasAttribute('data-loading-added')) {
          link.setAttribute('data-loading-added', 'true');
          link.addEventListener('click', (e) => {
            e.preventDefault();
            const href = link.getAttribute('href');
            if (href && href !== '#') {
              this.showLoadingAndNavigate(href);
            }
          });
        }
      });
    }, 100);
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

// 페이지 로드 시 자동 초기화
document.addEventListener('DOMContentLoaded', () => {
  new PageLoadingManager();
});
