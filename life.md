---
layout: page
title: 일상
permalink: /life/
---

{% assign posts = site.categories.life %}
{% include post_grid.html posts=posts empty_message="아직 일상 글이 없습니다." %}
