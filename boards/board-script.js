// 게시판 관리 클래스
class BoardManager {
  constructor(boardType) {
    this.boardType = boardType;
    this.posts = this.loadPosts();
    this.currentPostId = null;
    this.isAuthenticated = false;
    this.adminPassword = "tndud2203!@#"; // 관리자 비밀번호
    this.quillEditor = null; // Quill 에디터 인스턴스
    this.init();
  }

  init() {
    this.checkAuthenticationStatus();
    this.setupEventListeners();
    this.renderPosts();
    this.initializeQuillEditor();
  }

  // Quill 에디터 초기화
  initializeQuillEditor() {
    if (typeof Quill !== 'undefined') {
      const editorContainer = document.getElementById('quillEditor');
      if (editorContainer) {
        this.quillEditor = new Quill('#quillEditor', {
          theme: 'snow',
          modules: {
            toolbar: [
              [{ 'header': [1, 2, 3, false] }],
              ['bold', 'italic', 'underline', 'strike'],
              [{ 'color': [] }, { 'background': [] }],
              [{ 'list': 'ordered'}, { 'list': 'bullet' }],
              [{ 'indent': '-1'}, { 'indent': '+1' }],
              ['blockquote', 'code-block'],
              ['link', 'image'],
              ['clean']
            ]
          },
          placeholder: '게시글 내용을 입력하세요...\n\n• 텍스트 서식 (굵게, 기울임, 밑줄)\n• 헤더와 목록\n• 코드 블록과 인용문\n• 이미지와 링크\n• 다양한 색상 옵션'
        });
      }
    }
  }

  // 인증 상태 확인 (세션 스토리지에서)
  checkAuthenticationStatus() {
    const authStatus = sessionStorage.getItem(`auth_${this.boardType}`);
    if (authStatus === "true") {
      this.isAuthenticated = true;
      this.updateAdminStatus();
    }
  }

  // 관리자 상태 표시 업데이트
  updateAdminStatus() {
    const adminStatus = document.getElementById("adminStatus");
    const writeBtn = document.getElementById("writeBtn");
    
    if (this.isAuthenticated) {
      // 관리자 인증 시
      if (adminStatus) adminStatus.style.display = "block";
      if (writeBtn) writeBtn.style.display = "inline-block";
    } else {
      // 비인증 시
      if (adminStatus) adminStatus.style.display = "none";
      if (writeBtn) writeBtn.style.display = "none";
    }

    // 플로팅 버튼 아이콘 업데이트
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

  // 로그아웃
  logout() {
    this.isAuthenticated = false;
    sessionStorage.removeItem(`auth_${this.boardType}`);
    this.updateAdminStatus();
    this.renderPosts(); // 삭제 버튼 숨기기 위해 다시 렌더링
    this.showNotification("🔒 로그아웃되었습니다.");
  }

  // 게시글 삭제 (관리자 전용)
  deletePost(postId) {
    if (!this.isAuthenticated) {
      this.showNotification("❌ 관리자 권한이 필요합니다.", "error");
      return;
    }

    if (confirm("정말로 이 게시글을 삭제하시겠습니까?")) {
      this.posts = this.posts.filter(post => post.id !== postId);
      this.savePosts();
      this.renderPosts();
      this.showNotification("🗑️ 게시글이 삭제되었습니다.");
    }
  }

  // 모달에서 게시글 삭제 (관리자 전용)
  deletePostFromModal() {
    if (!this.isAuthenticated) {
      this.showNotification("❌ 관리자 권한이 필요합니다.", "error");
      return;
    }

    if (!this.currentPostId) return;

    if (confirm("정말로 이 게시글을 삭제하시겠습니까?")) {
      this.posts = this.posts.filter(post => post.id !== this.currentPostId);
      this.savePosts();
      this.closeModal(); // 모달 닫기
      this.renderPosts(); // 목록 새로고침
      this.showNotification("🗑️ 게시글이 삭제되었습니다.");
    }
  }

  setupEventListeners() {
    // 글쓰기 버튼
    const writeBtn = document.getElementById("writeBtn");
    if (writeBtn) {
      writeBtn.addEventListener("click", () => this.openWriteModal());
    }

    // 인증 폼 제출
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
      btn.addEventListener("click", () => this.closeModal());
    });

    // 모달 외부 클릭으로 닫기
    const modals = document.querySelectorAll(".modal");
    modals.forEach((modal) => {
      modal.addEventListener("click", (e) => {
        if (e.target === modal) {
          this.closeModal();
        }
      });
    });

    // 글 작성 폼 제출
    const writeForm = document.getElementById("writeForm");
    if (writeForm) {
      writeForm.addEventListener("submit", (e) => {
        e.preventDefault();
        this.submitPost();
      });
    }

    // 댓글 작성 폼 제출
    const commentForm = document.getElementById("commentForm");
    if (commentForm) {
      commentForm.addEventListener("submit", (e) => {
        e.preventDefault();
        this.submitComment();
      });
    }

    // ESC 키로 모달 닫기
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        this.closeModal();
      }
    });
  }

  // 로컬 스토리지에서 게시글 로드
  loadPosts() {
    const stored = localStorage.getItem(`posts_${this.boardType}`);
    return stored ? JSON.parse(stored) : [];
  }

  // 로컬 스토리지에 게시글 저장
  savePosts() {
    localStorage.setItem(`posts_${this.boardType}`, JSON.stringify(this.posts));
  }

  // 게시글 목록 렌더링
  renderPosts() {
    const container = document.getElementById("postsContainer");
    if (!container) return;

    // 게시글 수 업데이트
    const postCountElement = document.getElementById("postCount");
    if (postCountElement) {
      postCountElement.textContent = `${this.posts.length}개의 게시글`;
    }

    if (this.posts.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <h3>아직 게시글이 없습니다</h3>
          <p>첫 번째 게시글을 작성해보세요!</p>
        </div>
      `;
      return;
    }

    // 최신순으로 정렬
    const sortedPosts = [...this.posts].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );

    container.innerHTML = sortedPosts
      .map(
        (post) => `
      <div class="post-item">
        <div class="post-info" onclick="boardManager.openPost(${post.id})" style="cursor: pointer; flex: 1;">
          <div class="post-title">${this.escapeHtml(post.title)}</div>
          <div class="post-meta">
            <span>작성자: ${this.escapeHtml(post.author)}</span>
            <span>작성일: ${this.formatDate(post.createdAt)}</span>
          </div>
        </div>
        <div class="post-stats">
          <span>댓글 ${post.comments ? post.comments.length : 0}개</span>
          ${this.isAuthenticated ? `
            <button onclick="event.stopPropagation(); boardManager.deletePost(${post.id})" 
                    class="delete-btn" 
                    style="margin-left: 10px; background: #f44336; color: white; border: none; border-radius: 4px; padding: 4px 8px; cursor: pointer; font-size: 0.8rem;"
                    title="게시글 삭제">
              🗑️
            </button>
          ` : ''}
        </div>
      </div>
    `
      )
      .join("");
  }

  // 글쓰기 모달 열기 (인증 필요)
  openWriteModal() {
    // 이미 인증되었다면 바로 모달 열기
    if (this.isAuthenticated) {
      this.showWriteModal();
      return;
    }

    // 인증되지 않았다면 비밀번호 요구
    this.showPasswordPrompt();
  }

  // 인증 모달 표시
  showPasswordPrompt() {
    const authModal = document.getElementById("authModal");
    if (authModal) {
      authModal.style.display = "block";
      document.body.style.overflow = "hidden";
      
      // 비밀번호 입력 필드에 포커스
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
      this.showNotification("✅ 인증되었습니다! 이제 글을 작성할 수 있습니다.");
      
      // 세션 동안 인증 상태 유지
      sessionStorage.setItem(`auth_${this.boardType}`, "true");
      
      // 관리자 상태 표시 업데이트
      this.updateAdminStatus();
      
      // 삭제 버튼 표시를 위해 게시글 다시 렌더링
      this.renderPosts();
      
      this.closeAuthModal();
      this.showWriteModal();
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
      
      // 비밀번호 입력 필드 초기화
      const passwordInput = document.getElementById("adminPasswordInput");
      if (passwordInput) {
        passwordInput.value = "";
      }
    }
  }

  // 실제 글쓰기 모달 표시
  showWriteModal() {
    const modal = document.getElementById("writeModal");
    if (modal) {
      modal.style.display = "block";
      document.body.style.overflow = "hidden";

      // 폼 초기화
      const form = document.getElementById("writeForm");
      if (form) {
        form.reset();
      }

      // Quill 에디터 초기화 (아직 초기화되지 않았다면)
      if (!this.quillEditor) {
        this.initializeQuillEditor();
      } else {
        // 이미 초기화된 경우 내용 초기화
        this.quillEditor.setContents([]);
      }
    }
  }

  // 게시글 상세보기 모달 열기
  openPost(postId) {
    const post = this.posts.find((p) => p.id === postId);
    if (!post) return;

    this.currentPostId = postId;
    const modal = document.getElementById("postModal");
    if (!modal) return;

    // 게시글 내용 설정
    document.getElementById("postTitle").textContent = post.title;
    document.getElementById("postAuthor").textContent = post.author;
    document.getElementById("postDate").textContent = this.formatDate(
      post.createdAt
    );
    // HTML 내용으로 설정 (Quill 에디터로 작성된 내용 지원)
    const postContentElement = document.getElementById("postContent");
    if (postContentElement) {
      postContentElement.innerHTML = post.content;
    }

    // 관리자일 때만 삭제 버튼 표시
    const deletePostBtn = document.getElementById("deletePostBtn");
    if (deletePostBtn) {
      deletePostBtn.style.display = this.isAuthenticated ? "block" : "none";
    }

    // 댓글 렌더링 (현재 인증 상태 반영)
    this.renderComments(post.comments || []);

    modal.style.display = "block";
    document.body.style.overflow = "hidden";
  }

  // 모달 닫기
  closeModal() {
    const modals = document.querySelectorAll(".modal");
    modals.forEach((modal) => {
      modal.style.display = "none";
    });
    document.body.style.overflow = "auto";
    this.currentPostId = null;
  }

  // 게시글 작성
  submitPost() {
    const title = document.getElementById("postTitleInput").value.trim();
    const author = document.getElementById("postAuthorInput").value.trim();
    
    // Quill 에디터에서 HTML 내용 가져오기
    let content = "";
    if (this.quillEditor) {
      const delta = this.quillEditor.getContents();
      content = this.quillEditor.root.innerHTML.trim();
      
      // 빈 에디터인지 확인 (Quill은 빈 내용이어도 <p><br></p> 형태로 저장됨)
      if (content === "<p><br></p>" || content === "" || !this.quillEditor.getText().trim()) {
        content = "";
      }
    }

    if (!title || !author || !content) {
      alert("모든 필드를 입력해주세요.");
      return;
    }

    const newPost = {
      id: Date.now(),
      title,
      author,
      content,
      createdAt: new Date().toISOString(),
      comments: [],
    };

    this.posts.push(newPost);
    this.savePosts();
    this.renderPosts();
    this.closeModal();

    // 성공 메시지
    this.showNotification("게시글이 성공적으로 작성되었습니다!");
  }

  // 댓글 렌더링
  renderComments(comments) {
    const container = document.getElementById("commentsContainer");
    if (!container) return;

    if (comments.length === 0) {
      container.innerHTML =
        '<p style="text-align: center; color: #666; padding: 2rem;">아직 댓글이 없습니다. 첫 번째 댓글을 작성해보세요!</p>';
      return;
    }

    container.innerHTML = comments
      .map(
        (comment) => `
      <div class="comment-item">
        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
          <div style="flex: 1;">
            <div class="comment-author">${this.escapeHtml(comment.author)}</div>
            <div class="comment-content">${this.escapeHtml(comment.content)}</div>
            <div class="comment-date">${this.formatDate(comment.createdAt)}</div>
          </div>
          ${this.isAuthenticated ? `
            <button onclick="boardManager.deleteComment(${comment.id})" 
                    class="delete-btn" 
                    style="background: #f44336; color: white; border: none; border-radius: 4px; padding: 4px 8px; cursor: pointer; font-size: 0.8rem; margin-left: 10px;"
                    title="댓글 삭제">
              🗑️
            </button>
          ` : ''}
        </div>
      </div>
    `
      )
      .join("");
  }

  // 댓글 작성
  submitComment() {
    if (!this.currentPostId) return;

    const author = document.getElementById("commentAuthorInput").value.trim();
    const content = document.getElementById("commentContentInput").value.trim();

    if (!author || !content) {
      alert("작성자와 내용을 모두 입력해주세요.");
      return;
    }

    const post = this.posts.find((p) => p.id === this.currentPostId);
    if (!post) return;

    const newComment = {
      id: Date.now(),
      author,
      content,
      createdAt: new Date().toISOString(),
    };

    if (!post.comments) {
      post.comments = [];
    }
    post.comments.push(newComment);

    this.savePosts();
    this.renderComments(post.comments);
    this.renderPosts(); // 댓글 수 업데이트

    // 폼 초기화
    document.getElementById("commentForm").reset();

    this.showNotification("댓글이 성공적으로 작성되었습니다!");
  }

  // 댓글 삭제 (관리자 전용)
  deleteComment(commentId) {
    if (!this.isAuthenticated) {
      this.showNotification("❌ 관리자 권한이 필요합니다.", "error");
      return;
    }

    if (!this.currentPostId) return;

    if (confirm("정말로 이 댓글을 삭제하시겠습니까?")) {
      const post = this.posts.find((p) => p.id === this.currentPostId);
      if (post && post.comments) {
        post.comments = post.comments.filter(comment => comment.id !== commentId);
        this.savePosts();
        this.renderComments(post.comments);
        this.renderPosts(); // 댓글 수 업데이트
        this.showNotification("🗑️ 댓글이 삭제되었습니다.");
      }
    }
  }

  // HTML 이스케이프
  escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  // 날짜 포맷팅
  formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      return "오늘";
    } else if (diffDays === 2) {
      return "어제";
    } else if (diffDays <= 7) {
      return `${diffDays - 1}일 전`;
    } else {
      return date.toLocaleDateString("ko-KR", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    }
  }

  // 알림 표시
  showNotification(message, type = "success") {
    // 기존 알림 제거
    const existingNotification = document.querySelector(".notification");
    if (existingNotification) {
      existingNotification.remove();
    }

    // 새 알림 생성
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

    // 애니메이션
    setTimeout(() => {
      notification.style.opacity = "1";
      notification.style.transform = "translateX(0)";
    }, 100);

    // 3초 후 제거
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

  // 게시글 검색 (향후 기능)
  searchPosts(query) {
    if (!query) {
      this.renderPosts();
      return;
    }

    const filteredPosts = this.posts.filter(
      (post) =>
        post.title.toLowerCase().includes(query.toLowerCase()) ||
        post.content.toLowerCase().includes(query.toLowerCase()) ||
        post.author.toLowerCase().includes(query.toLowerCase())
    );

    // 검색 결과 렌더링 로직 구현
    console.log("검색 결과:", filteredPosts);
  }
}

// 전역 변수
let boardManager;

// 페이지 로드 시 초기화
document.addEventListener("DOMContentLoaded", () => {
  // URL에서 게시판 타입 추출
  const path = window.location.pathname;
  let boardType = "general";

  if (path.includes("algorithm")) {
    boardType = "algorithm";
  } else if (path.includes("coding-test")) {
    boardType = "coding-test";
  } else if (path.includes("cs")) {
    boardType = "cs";
  }

  // 게시판 매니저 초기화
  boardManager = new BoardManager(boardType);

  // 현재 페이지에 맞는 네비게이션 활성화
  const navLinks = document.querySelectorAll(".nav-links a");
  navLinks.forEach((link) => {
    if (link.href.includes(boardType)) {
      link.classList.add("active");
    }
  });
});

// 에러 처리
window.addEventListener("error", (e) => {
  console.error("페이지 에러:", e.error);
});

// 언로드 시 정리
window.addEventListener("beforeunload", () => {
  document.body.style.overflow = "auto";
});
