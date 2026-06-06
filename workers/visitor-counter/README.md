# Swimming-Yang Blog Worker

Cloudflare Worker + KV로 블로그 방문자 카운터와 관리자 글쓰기 API를 함께 처리합니다.

## 기능

- `GET /visit`: 오늘/전체 방문자 수를 집계합니다.
- `GET /stats`: 방문자 수를 조회합니다.
- `GET /admin/auth/start`: GitHub OAuth 로그인을 시작합니다.
- `GET /admin/auth/callback`: GitHub OAuth 콜백을 처리하고 관리자 세션을 발급합니다.
- `GET /admin/me`: 현재 관리자 세션을 확인합니다.
- `POST /admin/posts`: `_posts` 아래에 새 Markdown 글을 commit합니다.
- `POST /admin/auth/logout`: 관리자 세션을 만료합니다.

## 배포 순서

1. Worker 폴더로 이동합니다.

   ```bash
   cd workers/visitor-counter
   ```

2. Wrangler 설정 파일을 만듭니다.

   ```bash
   cp wrangler.toml.example wrangler.toml
   ```

3. Cloudflare에 로그인합니다.

   ```bash
   npx wrangler login
   ```

4. KV namespace를 만듭니다.

   ```bash
   npx wrangler kv namespace create VISITOR_STATS
   ```

5. 출력된 `id`를 `wrangler.toml`의 `REPLACE_WITH_KV_NAMESPACE_ID` 자리에 넣습니다.

6. GitHub OAuth App을 만듭니다.

   - Homepage URL: `https://xn--9p4bn7dwj.com/admin/`
   - Authorization callback URL: `https://ysw-blog-visitor-counter.<subdomain>.workers.dev/admin/auth/callback`

7. GitHub fine-grained personal access token을 만듭니다.

   - Repository access: `Swimming-Yang/Swimming-Yang.github.io` 하나만 선택
   - Repository permissions: `Contents`를 `Read and write`

8. `wrangler.toml`의 `GITHUB_CLIENT_ID`에 OAuth App의 Client ID를 넣습니다.

9. Worker secret을 등록합니다.

   ```bash
   npx wrangler secret put GITHUB_CLIENT_SECRET
   npx wrangler secret put GITHUB_CONTENT_TOKEN
   npx wrangler secret put SESSION_SIGNING_SECRET
   npx wrangler secret put VISITOR_SALT
   ```

   `SESSION_SIGNING_SECRET`와 `VISITOR_SALT`는 긴 랜덤 문자열이면 됩니다.

10. Worker를 배포합니다.

   ```bash
   npx wrangler deploy
   ```

11. `_config.yml`의 API 주소가 배포된 Worker 주소와 맞는지 확인합니다.

   ```yaml
   visitor_api_endpoint: "https://ysw-blog-visitor-counter.<subdomain>.workers.dev/visit"
   admin_api_endpoint: "https://ysw-blog-visitor-counter.<subdomain>.workers.dev"
   ```

## 관리자 화면

블로그에서 `/admin/`으로 접속하면 GitHub 로그인 후 글쓰기 에디터를 사용할 수 있습니다.

발행 시 Worker가 다음 경로에 Markdown 파일을 생성합니다.

- 일상: `_posts/life/YYYY-MM-DD-slug.md`
- 코딩: `_posts/coding/<topic>/YYYY-MM-DD-slug.md`

토큰은 브라우저 코드에 넣지 않습니다. GitHub OAuth client secret과 repo write token은 Cloudflare Worker secret으로만 보관합니다.

## 확인

```bash
curl https://ysw-blog-visitor-counter.<subdomain>.workers.dev/health
curl https://ysw-blog-visitor-counter.<subdomain>.workers.dev/stats
```
