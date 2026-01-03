# PRD: BIZEN 관리자 페이지 구조 개선

## 1. 현황 분석

### 1.1 프로젝트 구조

```
프로젝트 루트/
├── src/                    # 메인 페이지 소스
│   ├── components/         # HTML 컴포넌트
│   └── *.html              # 페이지 템플릿
├── dashboard/              # 관리자 페이지 소스 (로컬 원본)
│   ├── index.html
│   ├── leads.html
│   ├── board.html
│   ├── settings.html
│   ├── analytics.html
│   └── images.html
├── js/                     # JS 파일 소스 (로컬 원본)
│   ├── analytics.js
│   ├── components.js
│   ├── dashboard.js
│   ├── leads.js
│   └── settings.js
├── dist/                   # 프로덕션 배포 폴더
│   ├── admin/              # 관리자 페이지 (프로덕션)
│   └── js/                 # JS 파일 (프로덕션)
└── build.js                # 빌드 스크립트
```

### 1.2 빌드 프로세스 현황

**build.js가 처리하는 것:**
- src/*.html → dist/*.html (컴포넌트 인클루드)
- 루트/css/ → dist/css/ (복사)
- 루트/js/ → dist/js/ (복사)
- 루트/*.png, *.jpg 등 → dist/ (복사)

**build.js가 처리하지 않는 것:**
- dashboard/ → dist/admin/ ❌ 누락
- admin-auth.js ❌ 별도 관리

---

## 2. 발견된 문제점

### 2.1 소스-프로덕션 분기 (Critical)

**HTML 파일 불일치:**

| 파일 | dashboard/ (로컬) | dist/admin/ (프로덕션) | 상태 |
|------|------------------|----------------------|------|
| index.html | 11,888 bytes | 16,210 bytes | ⚠️ 다름 |
| leads.html | 17,958 bytes | 11,312 bytes | ⚠️ 로컬이 더 큼 |
| board.html | 21,397 bytes | 34,338 bytes | ⚠️ 다름 |
| settings.html | 25,027 bytes | 28,994 bytes | ⚠️ 다름 |
| analytics.html | 9,090 bytes | 12,443 bytes | ⚠️ 다름 |
| images.html | 15,060 bytes | **없음** | ❌ 삭제됨 |

**JS 파일 불일치:**

| 파일 | js/ (로컬) | dist/js/ (프로덕션) | 상태 |
|------|-----------|-------------------|------|
| admin-auth.js | **없음** | 5,500 bytes | ❌ 프로덕션에만 존재 |
| components.js | 7,089 bytes | 7,082 bytes | ⚠️ 다름 |
| leads.js | 11,794 bytes | 12,237 bytes | ⚠️ 다름 |
| analytics.js | 29,179 bytes | 29,179 bytes | ✅ 동일 |
| dashboard.js | 6,896 bytes | 6,896 bytes | ✅ 동일 |
| settings.js | 5,013 bytes | 5,013 bytes | ✅ 동일 |

### 2.2 admin-auth.js 의존성 문제 (Critical)

**로컬 원본 (dashboard/):**
- 모든 HTML 파일에 admin-auth.js 로드 **없음**
- 인증 없이 바로 접근 가능한 구조

**프로덕션 (dist/admin/):**
- 모든 HTML 파일에 admin-auth.js 로드 **있음**
- 인증 로직 적용됨

**WORKER_URL 선언 현황:**

| 파일 | const WORKER_URL 선언 | WORKER_URL 사용 |
|------|---------------------|----------------|
| admin-auth.js | ✅ 선언 | ✅ 사용 |
| leads.js | ❌ 없음 (주석만) | ✅ 사용 |
| components.js | ❌ 없음 | ❌ 미사용 |
| settings.js | ❌ 없음 | 확인필요 |
| analytics.js | ❌ 없음 | ❌ 미사용 |

**문제:** leads.js가 WORKER_URL을 사용하지만 자체 선언이 없음
- admin-auth.js가 먼저 로드되어야 함
- 로드 순서가 변경되면 에러 발생

### 2.3 빌드 프로세스 누락 (High)

build.js가 admin 관련 파일을 처리하지 않아서:
1. dashboard/ 폴더 변경사항이 dist/admin/에 반영 안 됨
2. 수동으로 dist/admin/을 직접 수정해왔음
3. 시간이 지나면서 소스와 프로덕션이 완전히 분기됨

---

## 3. 해결 방안

### 3.1 Option A: 프로덕션 기준 역동기화 (권장)

현재 프로덕션(dist/admin)이 실제 작동하는 최신 버전이므로:

1. dist/admin/ → dashboard/로 복사하여 로컬 소스 업데이트
2. dist/js/admin-auth.js → js/admin-auth.js 복사
3. dist/js/leads.js → js/leads.js 복사
4. dist/js/components.js → js/components.js 복사
5. build.js 수정하여 admin 폴더 처리 추가

**장점:** 현재 작동하는 코드 보존
**단점:** 로컬 원본의 의도된 변경사항이 있다면 손실 가능

### 3.2 Option B: 로컬 기준 정방향 동기화

로컬(dashboard/)을 기준으로 프로덕션 재구성:

1. dashboard/ 파일에 admin-auth.js 로드 추가
2. js/에 admin-auth.js 파일 추가
3. build.js 수정
4. 전체 재빌드

**장점:** 깨끗한 소스 관리
**단점:** 프로덕션에서 추가된 기능/수정사항 손실 위험

### 3.3 build.js 수정 (공통)

```javascript
// 추가할 내용
const DASHBOARD_DIR = path.join(__dirname, 'dashboard');
const ADMIN_DIST_DIR = path.join(DIST_DIR, 'admin');

// dashboard → dist/admin 복사
if (fs.existsSync(DASHBOARD_DIR)) {
    copyFolderSync(DASHBOARD_DIR, ADMIN_DIST_DIR);
    console.log('✓ 폴더 복사됨: dashboard/ → admin/');
}
```

---

## 4. 실행 계획

### Phase 1: 백업 (필수)

```bash
# 현재 상태 백업
cp -r dist/admin backup/dist-admin-$(date +%Y%m%d)
cp -r dashboard backup/dashboard-$(date +%Y%m%d)
cp -r js backup/js-$(date +%Y%m%d)
```

### Phase 2: 소스 동기화 (Option A 기준)

```bash
# 프로덕션 → 로컬 동기화
cp -r dist/admin/* dashboard/
cp dist/js/admin-auth.js js/
cp dist/js/leads.js js/
cp dist/js/components.js js/
```

### Phase 3: build.js 수정

dashboard/ 폴더를 dist/admin/으로 복사하는 로직 추가

### Phase 4: 검증

```bash
# 빌드 실행
node build.js

# 파일 비교
diff -r dashboard dist/admin
diff -r js dist/js
```

### Phase 5: 배포

```bash
vercel --token XtLYjw4mLsr866eQTdgxIwP3 --prod --yes
```

---

## 5. WORKER_URL 구조 개선 (추가 권장)

### 현재 문제
- WORKER_URL이 여러 파일에 분산 선언
- 의존성이 암시적 (로드 순서에 의존)

### 개선안

**Option 1: 공통 config.js 생성**
```javascript
// js/config.js
const BIZEN_CONFIG = {
    WORKER_URL: 'https://bizen-homepage.weandbiz.workers.dev'
};
```

**Option 2: admin-auth.js를 필수 선행 로드로 명시**
```html
<!-- 모든 admin 페이지에 동일하게 -->
<head>
    <script src="../js/admin-auth.js"></script> <!-- 필수: WORKER_URL 선언 -->
</head>
<body>
    <!-- 페이지 내용 -->
    <script src="../js/components.js"></script>
    <script src="../js/leads.js"></script> <!-- admin-auth.js 필요 -->
</body>
```

---

## 6. 결정 필요 사항

작업 진행 전 다음 사항 결정 필요:

1. **동기화 방향**: Option A (프로덕션→로컬) vs Option B (로컬→프로덕션)
2. **images.html 복구 여부**: 프로덕션에서 삭제된 images.html 복구할지
3. **WORKER_URL 구조 개선**: 별도 config.js 생성 vs 현재 구조 유지

---

## 7. 체크리스트

- [x] 백업 완료
- [x] 동기화 방향 결정 → Option A (프로덕션 → 로컬)
- [ ] 소스 파일 동기화
- [ ] build.js 수정
- [ ] 빌드 테스트
- [ ] 로컬 테스트
- [ ] 프로덕션 배포
- [ ] 최종 검증

---

## 8. 운영 가이드 (Quick Reference)

### 8.1 배포 방법

```bash
# dist 폴더에서 직접 배포
cd dist && vercel --prod
```

또는 전체 명령어:
```bash
vercel --token XtLYjw4mLsr866eQTdgxIwP3 --prod --yes
```

### 8.2 관리자 페이지 수정 시 주의사항

**필수 규칙:**
- 링크는 반드시 `/admin/파일명.html` 형식 (절대경로 + .html 포함)
- 관리자 페이지 수정 후 dist 폴더에서 배포

**예시:**
```html
<!-- 올바른 링크 -->
<a href="/admin/leads.html">리드 관리</a>
<a href="/admin/analytics.html">방문 통계</a>

<!-- 잘못된 링크 -->
<a href="leads">리드 관리</a>
<a href="/admin/leads">방문 통계</a>
```

### 8.3 빌드 시스템 정리 (예정)

build.js 수정 사항:
1. dashboard 폴더를 dist/admin으로 복사
2. js 폴더의 admin-auth.js도 dist/js로 복사

### 8.4 GA4 방문통계 연동

- Worker: `workers/ga4-analytics.js`
- 방문통계 페이지에 실제 GA4 데이터 표시

### 8.5 404 에러 발생 시 대응

1. **브라우저 캐시 확인**: 시크릿 창 + 강력새로고침(Ctrl+Shift+R)
2. **실제 상태 테스트**: Playwright로 프로덕션 URL 테스트
   ```bash
   python test_deploy.py
   ```

---

## 9. 진행 상황

### Phase 1: 백업 생성 ✅ 완료

백업 위치: `backup/` 폴더

### Phase 2: 프로덕션 → 로컬 동기화 ⏳ 대기

```bash
# 실행 예정 명령어
cp -r dist/admin/* dashboard/
cp dist/js/admin-auth.js js/
cp dist/js/leads.js js/
cp dist/js/components.js js/
```

### Phase 3: build.js 수정 ⏳ 대기

dashboard/ → dist/admin/ 복사 로직 추가 예정

### Phase 4: 빌드 테스트 및 검증 ⏳ 대기

### Phase 5: 배포 ⏳ 대기

---

**문서 버전:** 1.1
**작성일:** 2024-12-04
**최종 수정:** 2024-12-05
**작성:** Claude Code
