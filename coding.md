---
layout: page
title: 코딩
permalink: /coding/
wide: true
---

{% assign posts = site.categories.coding %}

<div class="coding-layout">
  {% include coding_sidebar.html active="all" %}

  <section class="coding-board" aria-label="코딩 전체 글">
    <header class="coding-board__header">
      <div>
        <p class="coding-board__eyebrow">Coding Archive</p>
        <h2>전체글</h2>
      </div>
      <span>{{ posts.size | default: 0 }} posts</span>
    </header>

    <div class="post-list post-list--naver">
      {% if posts.size > 0 %}
        {% for post in posts %}
          <article class="post-item">
            <a class="post-item__title" href="{{ post.url | relative_url }}">{{ post.title }}</a>
            <p class="post-item__meta">
              <time datetime="{{ post.date | date_to_xmlschema }}">{{ post.date | date: "%Y.%m.%d" }}</time>
            </p>
            <p class="post-item__excerpt">{{ post.excerpt | strip_html | truncate: 140 }}</p>
          </article>
        {% endfor %}
      {% else %}
        <p class="empty">아직 코딩 글이 없습니다.</p>
      {% endif %}
    </div>
  </section>
</div>
