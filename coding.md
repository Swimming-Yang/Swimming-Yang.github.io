---
layout: page
title: 코딩
permalink: /coding/
wide: true
---

{% assign posts = site.categories.coding %}

<section class="coding-board" aria-label="코딩 전체 글">
  <header class="coding-board__header">
    <div>
      <p class="coding-board__eyebrow">Coding Archive</p>
      <h2>전체글</h2>
    </div>
    <span>{{ posts.size | default: 0 }} posts</span>
  </header>

  <div class="post-grid post-grid--board">
    {% if posts.size > 0 %}
      {% for post in posts %}
        {% include post_card.html post=post %}
      {% endfor %}
    {% else %}
      <p class="empty">아직 코딩 글이 없습니다.</p>
    {% endif %}
  </div>
</section>
