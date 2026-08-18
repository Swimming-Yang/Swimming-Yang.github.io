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
        <a class="button button--primary" href="{{ '/portfolio/' | relative_url }}">포트폴리오 보기</a>
        <a class="button" href="https://github.com/Swimming-Yang" target="_blank" rel="noopener noreferrer">GitHub</a>
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
