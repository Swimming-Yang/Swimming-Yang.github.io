---
layout: default
title: Admin
permalink: /admin/
wide: true
extra_js:
  - /assets/js/admin.js
---

<section
  class="admin-shell"
  data-admin-app
  data-admin-api="{{ site.admin_api_endpoint | default: site.visitor_api_endpoint | replace: '/visit', '' }}"
>
  <header class="admin-hero">
    <div>
      <p class="admin-hero__eyebrow">Swimming-Yang</p>
      <h1>글쓰기</h1>
    </div>
    <div class="admin-user" data-admin-user hidden>
      <img src="" alt="" data-admin-avatar>
      <span data-admin-login></span>
    </div>
  </header>

  <section class="admin-auth" data-admin-auth>
    <div class="admin-auth__panel">
      <h2>관리자 로그인</h2>
      <p>GitHub 계정 확인 후 글쓰기 화면을 엽니다.</p>
      <button class="admin-button admin-button--primary" type="button" data-admin-login-button>
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 2a10 10 0 0 0-3.2 19.5c.5.1.7-.2.7-.5v-1.8c-2.8.6-3.4-1.2-3.4-1.2-.5-1.1-1.1-1.4-1.1-1.4-.9-.6.1-.6.1-.6 1 0 1.6 1.1 1.6 1.1.9 1.5 2.4 1.1 3 .8.1-.7.4-1.1.7-1.4-2.2-.3-4.6-1.1-4.6-5A3.9 3.9 0 0 1 6.8 6.8c-.1-.3-.5-1.3.1-2.7 0 0 .9-.3 2.8 1a9.7 9.7 0 0 1 5.1 0c1.9-1.3 2.8-1 2.8-1 .6 1.4.2 2.4.1 2.7a3.9 3.9 0 0 1 1 2.7c0 3.9-2.3 4.7-4.6 5 .4.3.7 1 .7 2v3c0 .3.2.6.7.5A10 10 0 0 0 12 2z"></path>
        </svg>
        GitHub로 로그인
      </button>
    </div>
  </section>

  <section class="admin-workspace" data-admin-workspace hidden>
    <form class="admin-editor" data-admin-form>
      <aside class="admin-panel admin-panel--meta">
        <div class="admin-panel__header">
          <h2>설정</h2>
          <button class="admin-icon-button" type="button" data-admin-new title="새 글">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 5v14"></path>
              <path d="M5 12h14"></path>
            </svg>
          </button>
        </div>

        <label class="admin-field">
          <span>게시판</span>
          <select name="category" data-admin-field="category">
            <option value="life">일상</option>
            <option value="coding">코딩</option>
          </select>
        </label>

        <label class="admin-field" data-admin-topic-field>
          <span>주제</span>
          <select name="topic" data-admin-field="topic">
            {% for topic in site.data.coding_topics %}
              <option value="{{ topic.slug }}">{{ topic.title }}</option>
            {% endfor %}
          </select>
        </label>

        <label class="admin-field">
          <span>날짜</span>
          <input name="date" type="datetime-local" data-admin-field="date">
        </label>

        <label class="admin-field">
          <span>슬러그</span>
          <input name="slug" type="text" inputmode="latin" autocomplete="off" data-admin-field="slug">
        </label>

        <label class="admin-field">
          <span>태그</span>
          <input name="tags" type="text" autocomplete="off" data-admin-field="tags">
        </label>

        <label class="admin-field">
          <span>대표 이미지</span>
          <input name="image" type="text" autocomplete="off" data-admin-field="image">
        </label>

        <div class="admin-actions">
          <button class="admin-button" type="button" data-admin-draft>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
              <path d="M17 21v-8H7v8"></path>
              <path d="M7 3v5h8"></path>
            </svg>
            임시저장
          </button>
          <button class="admin-button" type="button" data-admin-logout>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <path d="M16 17l5-5-5-5"></path>
              <path d="M21 12H9"></path>
            </svg>
            로그아웃
          </button>
        </div>
      </aside>

      <section class="admin-panel admin-panel--writer">
        <label class="admin-field admin-field--title">
          <span>제목</span>
          <input name="title" type="text" autocomplete="off" data-admin-field="title">
        </label>

        <label class="admin-field">
          <span>요약</span>
          <textarea name="description" rows="2" data-admin-field="description"></textarea>
        </label>

        <div class="admin-field admin-field--body">
          <div class="admin-editor-head">
            <span>본문</span>
            <div class="admin-toolbar" aria-label="글쓰기 도구">
              <select class="admin-format-select" aria-label="글자 크기" data-admin-format>
                <option value="paragraph">문단</option>
                <option value="h2">큰 제목</option>
                <option value="h3">중간 제목</option>
                <option value="h4">작은 제목</option>
              </select>
              <button class="admin-tool-button admin-tool-button--text" type="button" data-admin-command="bold" title="굵게" aria-label="굵게">B</button>
              <button class="admin-tool-button admin-tool-button--text" type="button" data-admin-command="italic" title="기울임" aria-label="기울임"><em>I</em></button>
              <button class="admin-tool-button" type="button" data-admin-command="quote" title="인용" aria-label="인용">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M8 10h-4a4 4 0 0 1 4-4v2a2 2 0 0 0-2 2h2v6H4v-6"></path>
                  <path d="M20 10h-4a4 4 0 0 1 4-4v2a2 2 0 0 0-2 2h2v6h-4v-6"></path>
                </svg>
              </button>
              <button class="admin-tool-button" type="button" data-admin-command="bullet" title="글머리 목록" aria-label="글머리 목록">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M8 6h13"></path>
                  <path d="M8 12h13"></path>
                  <path d="M8 18h13"></path>
                  <path d="M3 6h.01"></path>
                  <path d="M3 12h.01"></path>
                  <path d="M3 18h.01"></path>
                </svg>
              </button>
              <button class="admin-tool-button" type="button" data-admin-command="number" title="번호 목록" aria-label="번호 목록">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M10 6h11"></path>
                  <path d="M10 12h11"></path>
                  <path d="M10 18h11"></path>
                  <path d="M4 6h1v4"></path>
                  <path d="M4 10h2"></path>
                  <path d="M4 14h2l-2 4h2"></path>
                </svg>
              </button>
              <button class="admin-tool-button" type="button" data-admin-command="code" title="코드" aria-label="코드">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M16 18l6-6-6-6"></path>
                  <path d="M8 6l-6 6 6 6"></path>
                </svg>
              </button>
              <button class="admin-tool-button" type="button" data-admin-command="link" title="링크" aria-label="링크">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M10 13a5 5 0 0 0 7.1 0l2-2a5 5 0 0 0-7.1-7.1l-1.1 1.1"></path>
                  <path d="M14 11a5 5 0 0 0-7.1 0l-2 2A5 5 0 0 0 12 20.1l1.1-1.1"></path>
                </svg>
              </button>
              <button class="admin-tool-button" type="button" data-admin-command="image" title="이미지 첨부" aria-label="이미지 첨부">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <rect x="3" y="5" width="18" height="14" rx="2"></rect>
                  <circle cx="8.5" cy="10.5" r="1.5"></circle>
                  <path d="M21 15l-5-5L5 19"></path>
                </svg>
              </button>
              <input class="admin-file-input" type="file" accept="image/png,image/jpeg,image/webp,image/gif" data-admin-image-upload>
            </div>
          </div>
          <textarea name="body" rows="22" spellcheck="false" data-admin-field="body"></textarea>
        </div>
      </section>

      <aside class="admin-panel admin-panel--preview">
        <div class="admin-panel__header">
          <h2>미리보기</h2>
          <button class="admin-button admin-button--primary" type="submit" data-admin-publish>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 19V5"></path>
              <path d="M5 12l7-7 7 7"></path>
            </svg>
            발행
          </button>
        </div>
        <article class="admin-preview content" data-admin-preview></article>
        <p class="admin-status" data-admin-status></p>
      </aside>
    </form>
  </section>
</section>
