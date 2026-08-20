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
      <div class="home-hero__typing" data-home-typing>
        <h1 id="home-title" class="home-hero__title">
          <span class="home-hero__greeting-viewport" data-home-greeting>
            <span class="home-hero__greeting is-active" data-home-greeting-item lang="ko">
              <span>안녕하세요, </span><span class="home-hero__title-accent">양수영</span><span>입니다.</span>
            </span>
            <span class="home-hero__greeting" data-home-greeting-item lang="en" hidden>
              <span>Hello, I'm </span><span class="home-hero__title-accent">Suyeong Yang</span><span>.</span>
            </span>
            <span class="home-hero__greeting" data-home-greeting-item lang="ja" hidden>
              <span>こんにちは、</span><span class="home-hero__title-accent">ヤン・スヨン</span><span>です。</span>
            </span>
          </span>
        </h1>
        <p class="home-hero__code-line" aria-live="polite" aria-atomic="true">
          <code data-home-code></code>
        </p>
      </div>
      <div class="home-hero__actions">
        <a class="home-action home-action--portfolio" href="{{ '/portfolio/' | relative_url }}" aria-label="포트폴리오" title="포트폴리오">
          <img src="https://api.iconify.design/lucide/briefcase-business.svg?color=white" alt="" width="27" height="27">
        </a>
        <a class="home-action home-action--github" href="https://github.com/Swimming-Yang" target="_blank" rel="noopener noreferrer" aria-label="GitHub" title="GitHub">
          <img src="https://api.iconify.design/mdi/github.svg?color=white" alt="" width="27" height="27">
        </a>
        <a class="home-action home-action--naver" href="https://blog.naver.com/ysw1mst" target="_blank" rel="noopener noreferrer" aria-label="네이버 블로그" title="네이버 블로그">
          <img src="https://api.iconify.design/simple-icons/naver.svg?color=white" alt="" width="27" height="27">
        </a>
      </div>
      <div class="home-hero__stats" data-visitor-endpoint="{{ site.visitor_api_endpoint | default: '' }}">
        <span>총 방문자 <strong data-visitor-total>...</strong></span>
        <span>오늘 방문자 <strong data-visitor-today>...</strong></span>
      </div>
    </div>
  </div>
  <div class="home-hero__scroll-cue" aria-hidden="true">
    <span class="home-hero__scroll-arrows"><span></span><span></span><span></span></span>
  </div>
</section>

<section class="home-intro home-console" aria-labelledby="intro-title">
  <div class="home-console__toolbar" aria-hidden="true">
    <strong class="home-console__toolbar-title">터미널</strong>
    <span class="home-console__tab"><span class="home-console__tool-icon">&gt;_</span> 로컬 <span class="home-console__tab-close">×</span></span>
    <span class="home-console__toolbar-button">＋</span>
    <span class="home-console__toolbar-button">⌄</span>
    <span class="home-console__toolbar-spacer"></span>
    <span class="home-console__toolbar-meta">ABOUT</span>
    <span class="home-console__toolbar-button">⋮</span>
    <span class="home-console__toolbar-button">—</span>
  </div>
  <div class="home-console__body">
    <p class="home-console__banner">Portfolio PowerShell</p>
    <p class="home-console__copyright">Copyright (c) YangSuYeong. All rights reserved.</p>
    <div class="home-console__rule" aria-hidden="true"></div>
    <p class="home-console__command"><span>PS</span> C:\Portfolio\About&gt; profile --summary</p>
    <h2 id="intro-title">함께 성장하는 개발자를 지향합니다.</h2>
    <p class="home-console__copy">경험과 기술, 그리고 연락처는 포트폴리오 페이지에서 확인할 수 있습니다.</p>
    <a class="home-console__action" href="{{ '/portfolio/' | relative_url }}"><span aria-hidden="true">PS C:\Portfolio\About&gt;</span> open /portfolio</a>
  </div>
</section>
