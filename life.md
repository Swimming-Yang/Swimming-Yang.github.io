---
layout: page
title: 일상
permalink: /life/
wide: true
description: 개발 밖에서 오래 기억하고 싶은 장면을 남기는 공간입니다.
---

{% assign posts = site.categories.life %}

<section class="coding-board" aria-label="일상 전체 글">
  <div class="topic-strip" aria-label="일상 주제">
    {% for topic in site.data.life_topics %}
      {% assign topic_posts = site.categories.life | where: "topic", topic.slug %}
      <a href="{{ '/life/' | append: topic.slug | append: '/' | relative_url }}">
        <strong>{{ topic.title }}</strong>
        <span>{{ topic_posts.size }}</span>
      </a>
    {% endfor %}
  </div>

  {% include post_grid.html posts=posts board=true empty_message="아직 일상 글이 없습니다." %}
</section>
