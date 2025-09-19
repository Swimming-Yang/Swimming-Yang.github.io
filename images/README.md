# Images 폴더 구조

이 폴더는 포트폴리오 사이트에서 사용되는 모든 이미지 파일들을 저장합니다.

## 폴더 구조

### 📁 profile/

- 프로필 사진, 아바타 이미지
- about 섹션에서 사용할 개인 사진들
- 권장 크기: 200x200px ~ 400x400px (정사각형)

### 📁 projects/

- 프로젝트 스크린샷, 썸네일 이미지
- 각 프로젝트의 대표 이미지들
- 권장 크기: 600x400px (3:2 비율) 또는 800x600px (4:3 비율)

### 📁 icons/

- 기술 스택 아이콘, 로고 이미지
- 소셜 미디어 아이콘 (커스텀 사용 시)
- 기타 UI에서 사용할 작은 아이콘들
- 권장 포맷: SVG, PNG (투명 배경)

### 📁 background/

- 배경 이미지, 패턴 이미지
- 히어로 섹션 배경 등
- 권장 크기: 1920x1080px 이상 (고해상도)

## 이미지 최적화 권장사항

1. **파일 포맷**

   - 사진: JPG (압축률 80-90%)
   - 투명배경 필요: PNG
   - 벡터 이미지: SVG

2. **파일명 규칙**

   - 소문자, 하이픈(-) 또는 언더스코어(\_) 사용
   - 예: `profile-main.jpg`, `project_ecommerce.png`

3. **최적화 도구**
   - TinyPNG (온라인 압축)
   - ImageOptim (macOS)
   - Squoosh (Google 웹 도구)

## 사용 예시

```html
<!-- 프로필 이미지 -->
<img src="images/profile/profile-main.jpg" alt="양수영 프로필" />

<!-- 프로젝트 이미지 -->
<img src="images/projects/ecommerce-thumbnail.jpg" alt="이커머스 프로젝트" />

<!-- 아이콘 -->
<img src="images/icons/react-icon.svg" alt="React" />
```
