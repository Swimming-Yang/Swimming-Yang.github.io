# Visitor Counter Worker

Cloudflare Worker + KV로 블로그 메인 방문자 수를 저장하는 작은 API입니다.

## 동작 방식

- `GET /visit`: 현재 방문자를 집계하고 `{ today, total }`을 반환합니다.
- `GET /stats`: 집계하지 않고 현재 숫자만 반환합니다.
- 오늘 방문자는 한국 시간 기준 하루에 한 번만 증가합니다.
- 전체 방문자는 같은 브라우저/IP 조합을 한 번만 증가시키는 방식입니다.
- IP 원문은 저장하지 않고 Worker 안에서 해시한 값만 KV에 저장합니다.

## 배포 순서

1. 이 폴더로 이동합니다.

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

5. 출력된 `id`를 `wrangler.toml`의 `REPLACE_WITH_KV_NAMESPACE_ID`에 넣습니다.

6. 방문자 해시에 사용할 salt를 secret으로 저장합니다.

   ```bash
   npx wrangler secret put VISITOR_SALT
   ```

   아무 긴 문자열을 입력하면 됩니다. 예: `ysw1mst-visitor-2026-private`

7. Worker를 배포합니다.

   ```bash
   npx wrangler deploy
   ```

8. 배포 후 출력되는 주소 뒤에 `/visit`을 붙여 `_config.yml`에 넣습니다.

   ```yaml
   visitor_api_endpoint: "https://ysw-blog-visitor-counter.<내-subdomain>.workers.dev/visit"
   ```

9. Jekyll 사이트를 다시 커밋/푸시하면 메인 페이지의 방문자 수가 채워집니다.

## 확인

```bash
curl https://ysw-blog-visitor-counter.<내-subdomain>.workers.dev/visit
curl https://ysw-blog-visitor-counter.<내-subdomain>.workers.dev/stats
```
