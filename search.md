---
layout: default
title: 검색
permalink: /search/
---

<section class="search-page" data-search-page>
  <header class="search-page__header">
    <p class="section-kicker">Search</p>
    <h1>게시글 검색</h1>
  </header>

  <form class="search-page__form" data-search-page-form role="search">
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="11" cy="11" r="7"></circle>
      <path d="m16.5 16.5 4 4"></path>
    </svg>
    <input type="search" data-search-page-input placeholder="검색어를 입력하세요" aria-label="게시글 검색">
    <button type="submit" aria-label="검색">
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M5 12h14"></path>
        <path d="m13 6 6 6-6 6"></path>
      </svg>
    </button>
  </form>

  <p class="search-page__summary" data-search-page-summary>전체 글</p>

  <div class="search-page__grid" data-search-page-results>
    {% for post in site.posts %}
      {% capture search_text %}
        {{ post.title }}
        {{ post.description }}
        {{ post.excerpt | strip_html }}
        {{ post.content | strip_html }}
        {{ post.tags | join: " " }}
        {{ post.categories | join: " " }}
        {{ post.topic }}
      {% endcapture %}
      <div class="search-page__item" data-search-card data-search-text="{{ search_text | normalize_whitespace | escape }}">
        {% include post_card.html post=post %}
      </div>
    {% endfor %}
  </div>

  <p class="search-page__empty" data-search-page-empty hidden>검색 결과가 없습니다.</p>
</section>
