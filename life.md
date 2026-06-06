---
layout: page
title: 일상
permalink: /life/
---

<div class="post-grid">
  {% assign posts = site.categories.life %}
  {% if posts.size > 0 %}
    {% for post in posts %}
      {% include post_card.html post=post %}
    {% endfor %}
  {% else %}
    <p class="empty">아직 일상 글이 없습니다.</p>
  {% endif %}
</div>
