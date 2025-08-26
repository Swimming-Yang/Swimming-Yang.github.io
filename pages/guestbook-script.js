// 방명록 관리 클래스
class GuestbookManager {
  constructor() {
    this.messages = this.loadMessages();
    this.isAuthenticated = false;
    this.adminPassword = "tndud2203!@#"; // 관리자 비밀번호
    this.init();
  }

  init() {
    this.checkAuthenticationStatus();
    this.setupEventListeners();
    this.renderMessages();
    this.updateCharCounter();
  }

  // 인증 상태 확인
  checkAuthenticationStatus() {
    const authStatus = sessionStorage.getItem('auth_guestbook');
    if (authStatus === "true") {
      this.isAuthenticated = true;
      this.updateAdminStatus();
    }
  }

  // 관리자 상태 업데이트
  updateAdminStatus() {
    const floatingBtn = document.getElementById("floatingAdminBtn");
    if (floatingBtn) {
      if (this.isAuthenticated) {
        floatingBtn.innerHTML = "🔓";
        floatingBtn.title = "관리자 모드 (로그아웃하려면 클릭)";
        floatingBtn.onclick = () => this.logout();
      } else {
        floatingBtn.innerHTML = "🔒";
        floatingBtn.title = "관리자 로그인";
        floatingBtn.onclick = () => this.showPasswordPrompt();
      }
    }
  }

  setupEventListeners() {
    // 메시지 작성 폼
    const form = document.getElementById('guestbookForm');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.submitMessage();
      });
    }

    // 글자 수 카운터
    const messageInput = document.getElementById('messageInput');
    if (messageInput) {
      messageInput.addEventListener('input', () => {
        this.updateCharCounter();
      });
    }

    // 인증 폼
    const authForm = document.getElementById("authForm");
    if (authForm) {
      authForm.addEventListener("submit", (e) => {
        e.preventDefault();
        this.handleAuthentication();
      });
    }

    // 모달 닫기
    const closeButtons = document.querySelectorAll(".close, .btn-secondary");
    closeButtons.forEach((btn) => {
      btn.addEventListener("click", () => this.closeAuthModal());
    });

    // 모달 외부 클릭으로 닫기
    const authModal = document.getElementById("authModal");
    if (authModal) {
      authModal.addEventListener("click", (e) => {
        if (e.target === authModal) {
          this.closeAuthModal();
        }
      });
    }

    // ESC 키로 모달 닫기
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        this.closeAuthModal();
      }
    });
  }

  // 글자 수 카운터 업데이트
  updateCharCounter() {
    const messageInput = document.getElementById('messageInput');
    const charCounter = document.getElementById('charCounter');
    const submitBtn = document.getElementById('submitBtn');
    
    if (messageInput && charCounter) {
      const currentLength = messageInput.value.length;
      const maxLength = 200;
      
      charCounter.textContent = `${currentLength} / ${maxLength}`;
      
      // 190자 이상일 때 경고 색상
      if (currentLength >= 190) {
        charCounter.classList.add('warning');
      } else {
        charCounter.classList.remove('warning');
      }
      
      // 최대 길이 초과 시 버튼 비활성화
      if (submitBtn) {
        if (currentLength > maxLength) {
          submitBtn.disabled = true;
          submitBtn.textContent = '⚠️ 글자 수 초과';
        } else {
          submitBtn.disabled = false;
          submitBtn.textContent = '💌 메시지 등록하기';
        }
      }
    }
  }

  // 메시지 작성
  submitMessage() {
    const author = document.getElementById('authorInput').value.trim();
    const message = document.getElementById('messageInput').value.trim();

    if (!author || !message) {
      alert('작성자와 메시지를 모두 입력해주세요.');
      return;
    }

    if (message.length > 200) {
      alert('메시지는 200자 이내로 작성해주세요.');
      return;
    }

    const newMessage = {
      id: Date.now(),
      author,
      message,
      createdAt: new Date().toISOString()
    };

    this.messages.unshift(newMessage); // 최신 메시지를 맨 앞에 추가
    this.saveMessages();
    this.renderMessages();
    
    // 폼 초기화
    document.getElementById('guestbookForm').reset();
    this.updateCharCounter();

    this.showNotification('💌 메시지가 등록되었습니다!');
  }

  // 메시지 삭제 (관리자 전용)
  deleteMessage(messageId) {
    if (!this.isAuthenticated) {
      this.showNotification("❌ 관리자 권한이 필요합니다.", "error");
      return;
    }

    if (confirm("정말로 이 메시지를 삭제하시겠습니까?")) {
      this.messages = this.messages.filter(msg => msg.id !== messageId);
      this.saveMessages();
      this.renderMessages();
      this.showNotification("🗑️ 메시지가 삭제되었습니다.");
    }
  }

  // 메시지 목록 렌더링
  renderMessages() {
    const container = document.getElementById('messagesContainer');
    const messageCount = document.getElementById('messageCount');
    
    if (messageCount) {
      messageCount.textContent = this.messages.length;
    }

    if (!container) return;

    if (this.messages.length === 0) {
      container.innerHTML = `
        <div class="empty-state" style="text-align: center; padding: 4rem 2rem; color: #666;">
          <h3 style="font-size: 1.5rem; margin-bottom: 1rem; color: #333;">아직 메시지가 없습니다 📝</h3>
          <p style="font-size: 1.1rem;">첫 번째 메시지를 남겨주세요!</p>
        </div>
      `;
      return;
    }

    container.innerHTML = this.messages.map(msg => `
      <div class="message-card">
        <div class="message-header">
          <div class="message-author">${this.escapeHtml(msg.author)}</div>
          <div class="message-date">${this.formatDate(msg.createdAt)}</div>
        </div>
        <div class="message-content">${this.escapeHtml(msg.message)}</div>
        ${this.isAuthenticated ? `
          <button onclick="guestbookManager.deleteMessage(${msg.id})" 
                  class="delete-btn" 
                  title="메시지 삭제">
            🗑️
          </button>
        ` : ''}
      </div>
    `).join('');
  }

  // 로컬 스토리지에서 메시지 로드
  loadMessages() {
    const stored = localStorage.getItem('guestbook_messages');
    return stored ? JSON.parse(stored) : [];
  }

  // 로컬 스토리지에 메시지 저장
  saveMessages() {
    localStorage.setItem('guestbook_messages', JSON.stringify(this.messages));
  }

  // 관리자 인증 모달 표시
  showPasswordPrompt() {
    const authModal = document.getElementById("authModal");
    if (authModal) {
      authModal.style.display = "block";
      document.body.style.overflow = "hidden";
      
      const passwordInput = document.getElementById("adminPasswordInput");
      if (passwordInput) {
        passwordInput.focus();
        passwordInput.value = "";
      }
    }
  }

  // 인증 처리
  handleAuthentication() {
    const passwordInput = document.getElementById("adminPasswordInput");
    const password = passwordInput.value;

    if (password === this.adminPassword) {
      this.isAuthenticated = true;
      this.showNotification("✅ 관리자 인증되었습니다!");
      
      sessionStorage.setItem('auth_guestbook', "true");
      this.updateAdminStatus();
      this.renderMessages(); // 삭제 버튼 표시를 위해 다시 렌더링
      
      this.closeAuthModal();
    } else {
      this.showNotification("❌ 비밀번호가 올바르지 않습니다.", "error");
      passwordInput.value = "";
      passwordInput.focus();
    }
  }

  // 인증 모달 닫기
  closeAuthModal() {
    const authModal = document.getElementById("authModal");
    if (authModal) {
      authModal.style.display = "none";
      document.body.style.overflow = "auto";
      
      const passwordInput = document.getElementById("adminPasswordInput");
      if (passwordInput) {
        passwordInput.value = "";
      }
    }
  }

  // 로그아웃
  logout() {
    this.isAuthenticated = false;
    sessionStorage.removeItem('auth_guestbook');
    this.updateAdminStatus();
    this.renderMessages(); // 삭제 버튼 숨기기 위해 다시 렌더링
    this.showNotification("🔒 로그아웃되었습니다.");
  }

  // HTML 이스케이프
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // 날짜 포맷팅
  formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffMinutes = Math.floor(diffTime / (1000 * 60));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffMinutes < 1) {
      return '방금 전';
    } else if (diffMinutes < 60) {
      return `${diffMinutes}분 전`;
    } else if (diffHours < 24) {
      return `${diffHours}시간 전`;
    } else if (diffDays === 1) {
      return '어제';
    } else if (diffDays <= 7) {
      return `${diffDays}일 전`;
    } else {
      return date.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
  }

  // 알림 표시
  showNotification(message, type = "success") {
    const existingNotification = document.querySelector(".notification");
    if (existingNotification) {
      existingNotification.remove();
    }

    const notification = document.createElement("div");
    notification.className = "notification";
    
    const backgroundColor = type === "error" ? "#f44336" : "#4CAF50";
    
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${backgroundColor};
      color: white;
      padding: 1rem 1.5rem;
      border-radius: 10px;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
      z-index: 3000;
      opacity: 0;
      transform: translateX(100%);
      transition: all 0.3s ease;
    `;
    notification.textContent = message;

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.style.opacity = "1";
      notification.style.transform = "translateX(0)";
    }, 100);

    setTimeout(() => {
      notification.style.opacity = "0";
      notification.style.transform = "translateX(100%)";
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, 3000);
  }
}

// 전역 변수
let guestbookManager;

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', () => {
  guestbookManager = new GuestbookManager();
});

// 에러 처리
window.addEventListener('error', (e) => {
  console.error('페이지 에러:', e.error);
});

// 언로드 시 정리
window.addEventListener('beforeunload', () => {
  document.body.style.overflow = 'auto';
});
