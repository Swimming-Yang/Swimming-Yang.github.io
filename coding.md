---
layout: page
title: 코딩
permalink: /coding/
---

<div class="topic-board">
  {% for topic in site.data.coding_topics %}
    {% assign topic_posts = site.categories.coding | where: "topic", topic.slug %}
    <a class="topic-card" href="{{ '/coding/' | append: topic.slug | append: '/' | relative_url }}">
      <span class="topic-card__title">{{ topic.title }}</span>
      <span class="topic-card__description">{{ topic.description }}</span>
      <span class="topic-card__count">{{ topic_posts.size }} posts</span>
    </a>
  {% endfor %}
</div>

<nav class="topic-tabs" aria-label="코딩 세부 게시판">
  <a class="is-active" href="{{ '/coding/' | relative_url }}">전체</a>
  {% for topic in site.data.coding_topics %}
    <a href="{{ '/coding/' | append: topic.slug | append: '/' | relative_url }}">{{ topic.title }}</a>
  {% endfor %}
</nav>

<div class="post-list">
  {% assign posts = site.categories.coding %}
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
