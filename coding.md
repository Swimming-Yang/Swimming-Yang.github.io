---
layout: page
title: 코딩
permalink: /coding/
wide: true
description: 공부하며 부딪힌 문제와 해결 과정을 개발 주제별로 정리합니다.
---

{% assign posts = site.categories.coding %}

<section class="coding-board" aria-label="코딩 전체 글">
  <div class="topic-strip" aria-label="코딩 주제">
    {% for topic in site.data.coding_topics %}
      {% assign topic_posts = site.categories.coding | where: "topic", topic.slug %}
      <a href="{{ '/coding/' | append: topic.slug | append: '/' | relative_url }}">
        <strong>{{ topic.title }}</strong>
        <span>{{ topic_posts.size }}</span>
      </a>
    {% endfor %}
  </div>

  {% include post_grid.html posts=posts board=true empty_message="아직 코딩 글이 없습니다." %}
</section>
