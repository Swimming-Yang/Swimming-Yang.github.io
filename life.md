---
layout: page
title: 일상
permalink: /life/
wide: true
description: 개발 밖에서 오래 기억하고 싶은 장면을 남기는 공간입니다.
---

{% assign posts = site.categories.life %}
{% include post_grid.html posts=posts empty_message="아직 일상 글이 없습니다." %}
