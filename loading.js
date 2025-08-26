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
    console.log('페이지 로딩 표시 시작');
    if (this.overlay) {
      // 강제로 보이도록 설정
      this.overlay.style.display = 'flex';
      this.overlay.style.opacity = '0';
      this.overlay.style.visibility = 'visible';
      
      // 브라우저 렌더링 후 fade in
      setTimeout(() => {
        this.overlay.classList.add('show');
        this.overlay.style.opacity = '1';
      }, 10);
      
      // 로딩 비디오 재생 시작
      const video = this.overlay.querySelector('.loading-video');
      if (video) {
        console.log('페이지 비디오 재생 시도');
        video.currentTime = 0;
        video.play()
          .then(() => console.log('페이지 비디오 재생 성공'))
          .catch(e => console.log('페이지 로딩 비디오 재생 실패:', e));
      } else {
        console.log('페이지 로딩 비디오를 찾을 수 없음');
      }
    } else {
      console.log('페이지 로딩 오버레이를 찾을 수 없음');
    }
  }

  hideLoading() {
    console.log('페이지 로딩 숨기기 시작');
    if (this.overlay) {
      this.overlay.style.opacity = '0';
      setTimeout(() => {
        this.overlay.classList.remove('show');
        this.overlay.style.display = 'none';
        this.overlay.style.visibility = 'hidden';
      }, 500);
    }
  }
}

// 네비게이션 토글 기능
function initMobileNavigation() {
  const navToggle = document.getElementById("navToggle");
  const navLinks = document.getElementById("navLinks");
  
  if (navToggle && navLinks) {
    navToggle.addEventListener("click", () => {
      navToggle.classList.toggle("active");
      navLinks.classList.toggle("active");
    });
    
    // 링크 클릭 시 메뉴 닫기
    navLinks.addEventListener("click", (e) => {
      if (e.target.tagName === "A") {
        navToggle.classList.remove("active");
        navLinks.classList.remove("active");
      }
    });
    
    // 배경 클릭 시 메뉴 닫기
    document.addEventListener("click", (e) => {
      if (!navToggle.contains(e.target) && !navLinks.contains(e.target)) {
        navToggle.classList.remove("active");
        navLinks.classList.remove("active");
      }
    });
  }
}

// 페이지 로드 시 자동 초기화
document.addEventListener('DOMContentLoaded', () => {
  // 모바일 네비게이션 초기화
  initMobileNavigation();
  
  // 로딩 매니저 초기화
  new PageLoadingManager();
});
