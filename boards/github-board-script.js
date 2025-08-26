// GitHub Issues API 기반 게시판 시스템
class GitHubBoardManager {
  constructor() {
    this.boardType = this.getBoardType();
    this.posts = [];
    this.currentPostId = null;
    this.isAuthenticated = false;
    this.adminPassword = "tndud2203!@#";
    this.quillEditor = null;
    
    // GitHub 설정
    this.githubOwner = "Swimming-Yang";
    this.githubRepo = "Swimming-Yang.github.io";
    this.githubToken = null; // 관리자 로그인 시 설정
    
    this.init();
  }

  getBoardType() {
    const path = window.location.pathname;
    if (path.includes("algorithm")) return "algorithm";
    if (path.includes("coding-test")) return "coding-test";
    if (path.includes("cs")) return "cs";
    return "general";
  }

  async init() {
    this.checkAuthenticationStatus();
    this.initializeQuillEditor();
    this.setupEventListeners();
    await this.loadPosts();
    this.renderPosts();
  }

  checkAuthenticationStatus() {
    this.isAuthenticated = sessionStorage.getItem("adminAuthenticated") === "true";
    this.githubToken = sessionStorage.getItem("githubToken");
    this.updateAdminStatus();
  }

  updateAdminStatus() {
    const adminStatus = document.getElementById("adminStatus");
    const writeBtn = document.getElementById("writeBtn");
    const floatingBtn = document.getElementById("floatingAdminBtn");

    if (this.isAuthenticated) {
      if (adminStatus) adminStatus.style.display = "block";
      if (writeBtn) writeBtn.style.display = "inline-block";
      if (floatingBtn) {
        floatingBtn.innerHTML = "🔓";
        floatingBtn.onclick = () => this.logout();
        floatingBtn.title = "관리자 모드 (로그아웃)";
      }
    } else {
      if (adminStatus) adminStatus.style.display = "none";
      if (writeBtn) writeBtn.style.display = "none";
      if (floatingBtn) {
        floatingBtn.innerHTML = "🔒";
        floatingBtn.onclick = () => this.showPasswordPrompt();
        floatingBtn.title = "관리자 로그인";
      }
    }
  }

  async loadPosts() {
    try {
      const label = `board:${this.boardType}`;
      const url = `https://api.github.com/repos/${this.githubOwner}/${this.githubRepo}/issues?labels=${encodeURIComponent(label)}&state=open&sort=created&direction=desc`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`GitHub API 오류: ${response.status}`);
      }
      
      const issues = await response.json();
      
      this.posts = issues.map(issue => ({
        id: issue.number,
        title: issue.title,
        content: issue.body || "",
        author: this.extractAuthor(issue.body),
        createdAt: issue.created_at,
        comments: issue.comments,
        githubUrl: issue.html_url
      }));
      
      console.log(`${this.boardType} 게시판: ${this.posts.length}개 게시글 로드됨`);
    } catch (error) {
      console.error("게시글 로드 실패:", error);
      this.showNotification("게시글을 불러오는데 실패했습니다.", "error");
      this.posts = [];
    }
  }

  extractAuthor(body) {
    if (!body) return "익명";
    const match = body.match(/작성자:\s*(.+?)(\n|$)/);
    return match ? match[1].trim() : "익명";
  }

  async createPost(title, content, author) {
    if (!this.isAuthenticated || !this.githubToken) {
      this.showNotification("관리자 인증이 필요합니다.", "error");
      return false;
    }

    try {
      const body = `작성자: ${author}\n작성일: ${new Date().toLocaleString()}\n\n${content}`;
      const labels = [`board:${this.boardType}`];

      const url = `https://api.github.com/repos/${this.githubOwner}/${this.githubRepo}/issues`;
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Authorization": `token ${this.githubToken}`,
          "Content-Type": "application/json",
          "Accept": "application/vnd.github.v3+json"
        },
        body: JSON.stringify({
          title: title,
          body: body,
          labels: labels
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`GitHub API 오류: ${response.status} - ${errorData.message}`);
      }

      const newIssue = await response.json();
      this.showNotification("게시글이 성공적으로 작성되었습니다!", "success");
      
      // 게시글 목록 다시 로드
      await this.loadPosts();
      this.renderPosts();
      return true;
    } catch (error) {
      console.error("게시글 작성 실패:", error);
      this.showNotification(`게시글 작성 실패: ${error.message}`, "error");
      return false;
    }
  }

  async deletePost(postId) {
    if (!this.isAuthenticated || !this.githubToken) {
      this.showNotification("관리자 인증이 필요합니다.", "error");
      return false;
    }

    if (!confirm("정말로 이 게시글을 삭제하시겠습니까?")) {
      return false;
    }

    try {
      const url = `https://api.github.com/repos/${this.githubOwner}/${this.githubRepo}/issues/${postId}`;
      const response = await fetch(url, {
        method: "PATCH",
        headers: {
          "Authorization": `token ${this.githubToken}`,
          "Content-Type": "application/json",
          "Accept": "application/vnd.github.v3+json"
        },
        body: JSON.stringify({
          state: "closed"
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`GitHub API 오류: ${response.status} - ${errorData.message}`);
      }

      this.showNotification("게시글이 삭제되었습니다.", "success");
      
      // 게시글 목록 다시 로드
      await this.loadPosts();
      this.renderPosts();
      return true;
    } catch (error) {
      console.error("게시글 삭제 실패:", error);
      this.showNotification(`게시글 삭제 실패: ${error.message}`, "error");
      return false;
    }
  }

  setupEventListeners() {
    // 글쓰기 버튼
    const writeBtn = document.getElementById("writeBtn");
    if (writeBtn) {
      writeBtn.addEventListener("click", () => this.openWriteModal());
    }

    // 글쓰기 모달 이벤트
    const writeModal = document.getElementById("writeModal");
    if (writeModal) {
      const form = writeModal.querySelector("form");
      if (form) {
        form.addEventListener("submit", (e) => this.handleSubmitPost(e));
      }

      const cancelBtn = writeModal.querySelector(".btn-secondary");
      if (cancelBtn) {
        cancelBtn.addEventListener("click", () => this.closeWriteModal());
      }

      const closeBtn = writeModal.querySelector(".close");
      if (closeBtn) {
        closeBtn.addEventListener("click", () => this.closeWriteModal());
      }
    }

    // 인증 모달 이벤트
    const authModal = document.getElementById("authModal");
    if (authModal) {
      const authForm = document.getElementById("authForm");
      if (authForm) {
        authForm.addEventListener("submit", (e) => this.handleAuthentication(e));
      }
    }

    // 모달 외부 클릭 시 닫기
    window.addEventListener("click", (e) => {
      if (e.target.classList.contains("modal")) {
        e.target.style.display = "none";
      }
    });
  }

  initializeQuillEditor() {
    const editorElement = document.getElementById("quillEditor");
    if (editorElement && typeof Quill !== 'undefined') {
      this.quillEditor = new Quill("#quillEditor", {
        theme: "snow",
        placeholder: "내용을 입력하세요...",
        modules: {
          toolbar: [
            [{ header: [1, 2, 3, false] }],
            ["bold", "italic", "underline", "strike"],
            [{ color: [] }, { background: [] }],
            [{ list: "ordered" }, { list: "bullet" }],
            ["blockquote", "code-block"],
            ["link", "image"],
            ["clean"]
          ]
        }
      });
    }
  }

  showPasswordPrompt() {
    const modal = document.getElementById("authModal");
    if (modal) {
      modal.style.display = "block";
      const passwordInput = document.getElementById("adminPasswordInput");
      if (passwordInput) {
        passwordInput.focus();
      }
    }
  }

  closeAuthModal() {
    const modal = document.getElementById("authModal");
    if (modal) {
      modal.style.display = "none";
      const passwordInput = document.getElementById("adminPasswordInput");
      if (passwordInput) {
        passwordInput.value = "";
      }
    }
  }

  async handleAuthentication(e) {
    e.preventDefault();
    const passwordInput = document.getElementById("adminPasswordInput");
    const password = passwordInput.value;

    if (password === this.adminPassword) {
      // GitHub Personal Access Token 요청
      const token = prompt(
        "GitHub Personal Access Token을 입력하세요:\n" +
        "1. GitHub Settings > Developer settings > Personal access tokens에서 생성\n" +
        "2. 'repo' 권한이 필요합니다\n" +
        "3. 토큰은 안전하게 보관하세요"
      );

      if (token) {
        // 토큰 유효성 검사
        try {
          const response = await fetch(`https://api.github.com/repos/${this.githubOwner}/${this.githubRepo}`, {
            headers: {
              "Authorization": `token ${token}`,
              "Accept": "application/vnd.github.v3+json"
            }
          });

          if (response.ok) {
            this.isAuthenticated = true;
            this.githubToken = token;
            sessionStorage.setItem("adminAuthenticated", "true");
            sessionStorage.setItem("githubToken", token);
            
            this.showNotification("관리자 인증에 성공했습니다!", "success");
            this.updateAdminStatus();
            this.closeAuthModal();
            this.renderPosts(); // 삭제 버튼 표시를 위해 다시 렌더링
          } else {
            throw new Error("토큰이 유효하지 않습니다.");
          }
        } catch (error) {
          this.showNotification("GitHub 토큰이 유효하지 않습니다.", "error");
        }
      }
    } else {
      this.showNotification("비밀번호가 올바르지 않습니다.", "error");
    }
  }

  logout() {
    this.isAuthenticated = false;
    this.githubToken = null;
    sessionStorage.removeItem("adminAuthenticated");
    sessionStorage.removeItem("githubToken");
    
    this.showNotification("로그아웃되었습니다.", "success");
    this.updateAdminStatus();
    this.renderPosts(); // 삭제 버튼 숨기기 위해 다시 렌더링
  }

  openWriteModal() {
    if (!this.isAuthenticated) {
      this.showPasswordPrompt();
      return;
    }
    
    this.showWriteModal();
  }

  showWriteModal() {
    const modal = document.getElementById("writeModal");
    if (modal) {
      modal.style.display = "block";
      
      // 폼 초기화
      const form = modal.querySelector("form");
      if (form) {
        form.reset();
      }
      
      // Quill 에디터 초기화
      if (this.quillEditor) {
        this.quillEditor.setContents([]);
      }
    }
  }

  closeWriteModal() {
    const modal = document.getElementById("writeModal");
    if (modal) {
      modal.style.display = "none";
    }
  }

  async handleSubmitPost(e) {
    e.preventDefault();
    
    const title = document.getElementById("postTitleInput").value.trim();
    const author = document.getElementById("postAuthorInput").value.trim();
    
    let content = "";
    if (this.quillEditor) {
      content = this.quillEditor.root.innerHTML;
    }
    
    if (!title || !author || !content || content === "<p><br></p>") {
      this.showNotification("모든 필드를 입력해주세요.", "error");
      return;
    }

    const success = await this.createPost(title, content, author);
    if (success) {
      this.closeWriteModal();
    }
  }

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

    container.innerHTML = this.posts
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
          <span>💬 ${post.comments}</span>
          ${this.isAuthenticated ? 
            `<button onclick="boardManager.deletePost(${post.id})" 
                     class="delete-btn" 
                     style="background: #f44336; color: white; border: none; border-radius: 4px; padding: 4px 8px; cursor: pointer; margin-left: 8px;"
                     title="게시글 삭제">🗑️</button>` : 
            ''
          }
        </div>
      </div>
    `
      )
      .join("");
  }

  openPost(postId) {
    const post = this.posts.find(p => p.id === postId);
    if (!post) return;

    this.currentPostId = postId;
    
    // 모달에 게시글 내용 표시
    document.getElementById("postTitle").textContent = post.title;
    document.getElementById("postAuthor").textContent = post.author;
    document.getElementById("postDate").textContent = this.formatDate(post.createdAt);
    document.getElementById("postContent").innerHTML = post.content;

    // 삭제 버튼 표시/숨김
    const deleteBtn = document.getElementById("deletePostBtn");
    if (deleteBtn) {
      deleteBtn.style.display = this.isAuthenticated ? "inline-block" : "none";
    }

    // GitHub 링크 추가
    const postContent = document.getElementById("postContent");
    if (postContent && post.githubUrl) {
      postContent.innerHTML += `
        <div style="margin-top: 2rem; padding-top: 1rem; border-top: 1px solid #eee;">
          <a href="${post.githubUrl}" target="_blank" style="color: #667eea; text-decoration: none;">
            🔗 GitHub에서 보기 (댓글 작성 가능)
          </a>
        </div>
      `;
    }

    // 모달 표시
    const modal = document.getElementById("postModal");
    if (modal) {
      modal.style.display = "block";
    }
  }

  async deletePostFromModal() {
    if (this.currentPostId) {
      const success = await this.deletePost(this.currentPostId);
      if (success) {
        const modal = document.getElementById("postModal");
        if (modal) {
          modal.style.display = "none";
        }
      }
    }
  }

  formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString("ko-KR");
  }

  escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  showNotification(message, type = "info") {
    // 알림 요소 생성 또는 가져오기
    let notification = document.getElementById("notification");
    if (!notification) {
      notification = document.createElement("div");
      notification.id = "notification";
      notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        color: white;
        font-weight: 500;
        z-index: 10000;
        max-width: 300px;
        opacity: 0;
        transform: translateX(100%);
        transition: all 0.3s ease;
      `;
      document.body.appendChild(notification);
    }

    // 타입에 따른 색상 설정
    const colors = {
      success: "#4CAF50",
      error: "#f44336",
      info: "#2196F3"
    };

    notification.style.backgroundColor = colors[type] || colors.info;
    notification.textContent = message;
    notification.style.display = "block";

    // 애니메이션으로 표시
    setTimeout(() => {
      notification.style.opacity = "1";
      notification.style.transform = "translateX(0)";
    }, 10);

    // 3초 후 자동 숨김
    setTimeout(() => {
      notification.style.opacity = "0";
      notification.style.transform = "translateX(100%)";
      setTimeout(() => {
        notification.style.display = "none";
      }, 300);
    }, 3000);
  }
}

// 전역 변수로 설정
let boardManager;

// 페이지 로드 시 초기화
document.addEventListener("DOMContentLoaded", () => {
  boardManager = new GitHubBoardManager();
});
