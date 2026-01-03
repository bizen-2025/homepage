# PRD: GA4 Analytics 일별 데이터 누적 저장 시스템

## 개요

GA4 방문통계를 Cloudflare D1에 일별로 누적 저장하여, 장기간 데이터 조회 및 분석이 가능하도록 구현

---

## 현재 상태

| 항목 | 상태 | 비고 |
|------|------|------|
| D1 데이터베이스 생성 | ✅ 완료 | `bizen-analytics` |
| 테이블 스키마 설계 | ✅ 완료 | 코드 내 자동 생성 |
| Worker 코드 작성 | ✅ 완료 | `workers/ga4-analytics.js` |
| wrangler 설정 | ✅ 완료 | `wrangler-ga4.toml` |
| Worker 배포 | ⏳ 대기 | Cloudflare API 장애 |

---

## 아키텍처

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────┐
│   GA4 API       │────▶│  Cloudflare      │────▶│  D1 Database│
│ (Google)        │     │  Worker          │     │  (bizen-    │
│                 │     │  (bizen-ga4-     │     │   analytics)│
│                 │     │   analytics)     │     │             │
└─────────────────┘     └──────────────────┘     └─────────────┘
                               │
                               │ Cron: 매일 01:00 KST
                               ▼
                        ┌──────────────────┐
                        │  자동 데이터 수집 │
                        │  (어제 데이터)    │
                        └──────────────────┘
```

---

## D1 데이터베이스 정보

- **이름**: `bizen-analytics`
- **ID**: `2040faca-9b15-4f89-9591-9338bb4ea738`
- **리전**: APAC

### 테이블 구조

```sql
-- 1. 일별 통계
daily_stats (
  id, date, visitors, pageviews, avg_duration, bounce_rate, leads, created_at
)

-- 2. 트래픽 소스
traffic_sources (
  id, date, source, medium, sessions, created_at
)

-- 3. 인기 페이지
top_pages (
  id, date, page_path, pageviews, created_at
)

-- 4. 디바이스 통계
device_stats (
  id, date, device, users, created_at
)

-- 5. 지역 통계
geo_stats (
  id, date, city, users, created_at
)
```

---

## API 엔드포인트

### 실시간 데이터 (GA4 API 직접 호출)

| 엔드포인트 | 설명 |
|-----------|------|
| `GET /analytics/overview?period=daily` | 개요 통계 |
| `GET /analytics/traffic?period=daily` | 트래픽 소스 |
| `GET /analytics/pages?period=daily` | 인기 페이지 |
| `GET /analytics/devices?period=daily` | 디바이스 분포 |
| `GET /analytics/geography?period=daily` | 지역별 통계 |
| `GET /analytics/referrers?period=daily` | 유입 경로 |
| `GET /analytics/trend?period=daily` | 추이 데이터 |
| `GET /analytics/all?period=daily` | 전체 데이터 |

### 누적 데이터 (D1에서 조회)

| 엔드포인트 | 설명 |
|-----------|------|
| `GET /history/stats?days=30` | 일별 통계 (최근 N일) |
| `GET /history/traffic?days=30` | 트래픽 소스 누적 |
| `GET /history/pages?days=30` | 인기 페이지 누적 |
| `GET /history/collect` | 수동 데이터 수집 (어제) |

---

## Cron 스케줄

- **시간**: 매일 01:00 KST (16:00 UTC 전날)
- **설정**: `wrangler-ga4.toml`의 `[triggers]` 섹션

```toml
[triggers]
crons = ["0 16 * * *"]
```

### 수집 데이터

매일 자동으로 **어제** 날짜의 데이터를 GA4 API에서 가져와 D1에 저장:
- 방문자, 페이지뷰, 평균 체류시간, 이탈률
- 트래픽 소스별 세션
- 인기 페이지별 조회수
- 디바이스별 사용자
- 지역별 사용자

---

## 배포 절차

### 1단계: Worker 배포

```bash
cd F:\pola_homepage\1.14th_jeonyejin_bizen
npx wrangler deploy --config wrangler-ga4.toml
```

### 2단계: 배포 확인

```bash
# Worker 상태 확인
curl https://bizen-ga4-analytics.weandbiz.workers.dev/

# 실시간 데이터 테스트
curl https://bizen-ga4-analytics.weandbiz.workers.dev/analytics/overview

# 수동 데이터 수집 테스트
curl https://bizen-ga4-analytics.weandbiz.workers.dev/history/collect

# 누적 데이터 확인
curl https://bizen-ga4-analytics.weandbiz.workers.dev/history/stats?days=7
```

### 3단계: Cron 작동 확인

Cloudflare 대시보드에서 확인:
1. Workers & Pages → bizen-ga4-analytics
2. Triggers 탭 → Cron Triggers 확인
3. Logs 탭에서 매일 실행 로그 확인

---

## 파일 목록

| 파일 | 설명 |
|------|------|
| `workers/ga4-analytics.js` | Worker 메인 코드 |
| `workers/schema.sql` | 테이블 스키마 (참고용) |
| `wrangler-ga4.toml` | Wrangler 설정 파일 |

---

## 설정 파일 내용

### wrangler-ga4.toml

```toml
name = "bizen-ga4-analytics"
main = "workers/ga4-analytics.js"
compatibility_date = "2024-01-01"

[vars]
GA4_PROPERTY_ID = "514848999"
GA4_PRIVATE_KEY = "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"

[[d1_databases]]
binding = "DB"
database_name = "bizen-analytics"
database_id = "2040faca-9b15-4f89-9591-9338bb4ea738"

[triggers]
crons = ["0 16 * * *"]
```

---

## 대시보드 연동 (추후 작업)

### 관리자 대시보드 수정 필요

`dist/admin/analytics.html`에서 누적 데이터를 표시하려면:

```javascript
// 누적 데이터 조회
const historyResponse = await fetch(`${GA4_API_URL}/history/stats?days=30`);
const historyData = await historyResponse.json();

// 차트에 표시
renderHistoricalChart(historyData.data);
```

---

## 트러블슈팅

### D1 테이블이 없는 경우

Worker 코드 내에서 `initDatabase()` 함수가 자동으로 테이블을 생성합니다.
수동으로 생성하려면:

```bash
npx wrangler d1 execute bizen-analytics --remote --file=workers/schema.sql
```

### Cron이 실행되지 않는 경우

1. Cloudflare 대시보드에서 Cron Triggers 확인
2. 수동으로 데이터 수집 테스트: `GET /history/collect`

### 데이터가 없는 경우

처음 배포 후에는 데이터가 없습니다.
- 수동 수집: `/history/collect` 호출
- 또는 다음날 01:00 KST까지 대기

---

## 체크리스트

배포 전:
- [x] D1 데이터베이스 생성
- [x] Worker 코드 작성
- [x] wrangler-ga4.toml 설정
- [ ] Cloudflare API 정상화 확인

배포 후:
- [ ] `npx wrangler deploy --config wrangler-ga4.toml` 실행
- [ ] Worker 응답 확인
- [ ] `/history/collect`로 수동 수집 테스트
- [ ] Cron Trigger 설정 확인
- [ ] 다음날 자동 수집 로그 확인

---

## 연락처

문제 발생 시 Cloudflare 상태 확인:
- https://www.cloudflarestatus.com/

---

**문서 버전**: 1.0
**작성일**: 2024-12-05
**작성자**: Claude
