# Visitor Counter Worker

홈페이지 방문자 수를 Cloudflare KV에 저장·조회하는 Worker입니다.

제공 엔드포인트는 다음과 같습니다.

- `GET /visit`: 방문자를 기록하고 오늘/전체 방문자 수를 반환합니다.
- `GET /stats`: 오늘/전체 방문자 수를 반환합니다.
- `GET /health`: 상태 확인용 응답을 반환합니다.

## 설정

1. `workers/visitor-counter/wrangler.toml.example`을 `wrangler.toml`로 복사합니다.
2. KV namespace ID를 설정합니다.
3. 필요하다면 `VISITOR_SALT`를 Worker secret으로 등록합니다.

```sh
npx wrangler secret put VISITOR_SALT
npx wrangler deploy
```
