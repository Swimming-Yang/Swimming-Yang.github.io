---
layout: page
title: 글
permalink: /blog/
---

<div class="post-list">
  {% for post in site.posts %}
    <article class="post-item">
      <a class="post-item__title" href="{{ post.url | relative_url }}">{{ post.title }}</a>
      <p class="post-item__meta">
        <time datetime="{{ post.date | date_to_xmlschema }}">{{ post.date | date: "%Y.%m.%d" }}</time>
        {% if post.categories.size > 0 %}
          <span>{{ post.categories | join: ", " }}</span>
        {% endif %}
      </p>
      {% if post.excerpt %}
        <p class="post-item__excerpt">{{ post.excerpt | strip_html | truncate: 140 }}</p>
      {% endif %}
    </article>
  {% endfor %}
</div>
