---
layout: home
title: 양수영 | Portfolio
---

<section class="home-hero" aria-labelledby="home-title">
  <div class="home-hero__fallback" aria-hidden="true"></div>
  <video class="home-hero__video" data-home-hero-video autoplay muted loop playsinline preload="auto" poster="{{ '/assets/images/home-hero-poster.jpg' | relative_url }}" aria-hidden="true">
    <source src="{{ '/assets/videos/home-hero.mp4' | relative_url }}" type="video/mp4">
  </video>
  <div class="home-hero__content">
    <div class="home-hero__stage">
      <div class="home-hero__typing" data-home-typing aria-label="Ysw1mst's Portfolio 인사말">
        <h1 id="home-title" class="home-hero__title">
          <span class="home-hero__title-line" data-home-title-text="Ysw1mst's Portfolio" data-home-title-accent="Portfolio"></span>
        </h1>
        <p class="home-hero__code-line" aria-live="polite" aria-atomic="true">
          <code data-home-code></code>
        </p>
      </div>
      <div class="home-hero__actions">
        <a class="home-action home-action--portfolio" href="{{ '/portfolio/' | relative_url }}" aria-label="포트폴리오" title="포트폴리오">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <rect x="3" y="7" width="18" height="13" rx="2"></rect>
            <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18M10 12v2h4v-2"></path>
          </svg>
        </a>
        <a class="home-action home-action--github" href="https://github.com/Swimming-Yang" target="_blank" rel="noopener noreferrer" aria-label="GitHub" title="GitHub">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 2a10 10 0 0 0-3.2 19.5c.5.1.7-.2.7-.5v-1.8c-2.8.6-3.4-1.2-3.4-1.2-.5-1.1-1.1-1.4-1.1-1.4-.9-.6.1-.6.1-.6 1 0 1.6 1.1 1.6 1.1.9 1.5 2.4 1.1 3 .8.1-.7.4-1.1.7-1.4-2.2-.3-4.6-1.1-4.6-5A3.9 3.9 0 0 1 6.8 6.8c-.1-.3-.5-1.3.1-2.7 0 0 .9-.3 2.8 1a9.7 9.7 0 0 1 5.1 0c1.9-1.3 2.8-1 2.8-1 .6 1.4.2 2.4.1 2.7a3.9 3.9 0 0 1 1 2.7c0 3.9-2.3 4.7-4.6 5 .4.3.7 1 .7 2v3c0 .3.2.6.7.5A10 10 0 0 0 12 2z"></path>
          </svg>
        </a>
        <a class="home-action home-action--naver" href="https://blog.naver.com/ysw1mst" target="_blank" rel="noopener noreferrer" aria-label="네이버 블로그" title="네이버 블로그">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M6 4h4.1l3.8 6.6V4H18v16h-4.1l-3.8-6.6V20H6z"></path>
          </svg>
        </a>
      </div>
      <div class="home-hero__stats" data-visitor-endpoint="{{ site.visitor_api_endpoint | default: '' }}">
        <span>총 방문자 <strong data-visitor-total>...</strong></span>
        <span>오늘 방문자 <strong data-visitor-today>...</strong></span>
      </div>
    </div>
  </div>
  <div class="home-hero__scroll-cue" aria-hidden="true">
    <span class="home-hero__scroll-circle"><span></span><span></span><span></span></span>
  </div>
</section>

<section class="home-intro" aria-labelledby="intro-title">
  <p class="section-kicker">About</p>
  <h2 id="intro-title">함께 성장하는 개발자를 지향합니다.</h2>
  <p>경험과 기술, 그리고 연락처는 포트폴리오 페이지에서 확인할 수 있습니다.</p>
  <a class="button" href="{{ '/portfolio/' | relative_url }}">자기소개 보기</a>
</section>
