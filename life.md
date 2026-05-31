---
layout: page
title: 일상
permalink: /life/
---

<div class="post-list">
  {% assign posts = site.categories.life %}
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
    <p class="empty">아직 일상 글이 없습니다.</p>
  {% endif %}
</div>
