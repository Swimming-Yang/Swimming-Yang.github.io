---
layout: page
title: 글
permalink: /blog/
---

<div class="post-grid">
  {% for post in site.posts %}
    {% include post_card.html post=post %}
  {% endfor %}
</div>
