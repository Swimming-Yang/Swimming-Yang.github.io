# Swimming Notes

개인 코딩 + 일상 블로그를 위한 Jekyll 기반 GitHub Pages 프로젝트입니다.

## 로컬 실행

```sh
bundle install
bundle exec jekyll serve
```

브라우저에서 `http://127.0.0.1:4000`을 열어 확인합니다.

## GitHub Pages 설정

저장소가 `username.github.io` 형식이면 `_config.yml`의 `baseurl`은 빈 값으로 둡니다.

프로젝트 페이지로 배포한다면, 예를 들어 저장소 이름이 `GitHubPages`일 때는 다음처럼 바꿉니다.

```yaml
baseurl: "/GitHubPages"
```

## 글 쓰기

`_posts/` 아래에 카테고리별 폴더를 만들고, 날짜가 포함된 Markdown 파일을 추가합니다.

```text
_posts/life/2026-05-31-daily-note.md
_posts/coding/csharp/2026-06-01-csharp-note.md
_posts/coding/wpf/2026-06-01-wpf-note.md
```

글 상단에는 Front Matter를 넣습니다.

```yaml
---
layout: post
title: "글 제목"
date: 2026-05-31 10:00:00 +0900
categories: coding
tags: [jekyll, github-pages]
---
```

코딩 글은 `categories: coding`을 유지하고, 세부 게시판은 `topic`으로 지정합니다.

```yaml
---
layout: post
title: "C# 기록 예시"
date: 2026-06-01 10:00:00 +0900
categories: coding
topic: csharp
tags: [csharp, dotnet]
---
```

사용 가능한 코딩 세부 게시판은 `csharp`, `wpf`, `unity`, `cs`, `ps`입니다.
