# POLA 정책자금 컨설팅 홈페이지

**프로젝트 타입**: 아임웹 → Next.js 자체 개발 전환
**개발 기간**: 2주 (14일)
**배포 환경**: Vercel (무료)

---

## 📚 프로젝트 문서

| 문서 | 내용 | 우선순위 |
|------|------|---------|
| **설계기획서.md** | 전체 프로젝트 개요, 기술 스택, SEO 전략 | 🔴 필수 |
| **아임웹-마이그레이션-가이드.md** | 아임웹 → Next.js 변환 가이드 | 🔴 필수 |
| **프로젝트-구조-기획서.md** | 폴더 구조, 컴포넌트, 코드 예시 | 🟡 참고 |
| **SEO-키워드-전략.md** | 60+ 키워드, 페이지별 전략 | 🟡 참고 |

---

## 🎯 핵심 방향

### ✅ 유지 (기존 아임웹과 동일)
- 메뉴 구조
- 섹션 순서 및 내용
- 텍스트 및 이미지

### ✅ 변경
- **브랜드 컬러만** 변경
- HTML 위젯 → Next.js 컴포넌트
- SEO 최적화 추가 (메타 태그, Structured Data)

### ✅ 기술 스택
```
Frontend: Next.js 15 + React 19 + TypeScript
Styling: Tailwind CSS + shadcn/ui
Database: Airtable (무료 1,200 레코드)
Email: Resend (무료 3,000통/월)
Hosting: Vercel (무료 100GB 대역폭)
```

---

## 🚀 빠른 시작 (5분)

### 1. 프로젝트 생성
```bash
npx create-next-app@latest pola-homepage --typescript --tailwind --app
cd pola-homepage
```

### 2. shadcn/ui 설치
```bash
npx shadcn@latest init
npx shadcn@latest add button input card accordion dialog toast
```

### 3. 추가 패키지
```bash
npm install airtable resend react-hook-form zod @hookform/resolvers
```

### 4. 환경변수 설정
```bash
# .env.local 생성
cp .env.example .env.local

# 환경변수 입력
AIRTABLE_TOKEN=your_token
AIRTABLE_BASE_ID=your_base_id
RESEND_API_KEY=your_key
TELEGRAM_BOT_TOKEN=your_token
TELEGRAM_CHAT_ID=your_chat_id
NEXT_PUBLIC_SITE_URL=https://pola.com
```

### 5. 개발 서버 실행
```bash
npm run dev
# http://localhost:3000
```

---

## 📁 프로젝트 구조

```
pola-homepage/
├── app/                      # Next.js 15 App Router
│   ├── page.tsx              # 홈페이지
│   ├── company/              # 회사소개
│   ├── process/              # 진행과정
│   ├── fund/                 # 자금상담
│   ├── service/              # 전문서비스
│   ├── success/              # 성공사례 (목록만)
│   ├── faq/                  # 자주묻는질문
│   ├── contact/              # 상담신청
│   ├── api/                  # API Routes
│   ├── sitemap.ts            # Sitemap
│   └── robots.ts             # Robots.txt
│
├── components/               # React 컴포넌트
│   ├── layout/               # Header, Footer
│   ├── home/                 # 홈페이지 섹션
│   ├── forms/                # ContactForm
│   ├── seo/                  # SEO 컴포넌트
│   └── ui/                   # shadcn/ui
│
├── lib/                      # 유틸리티
│   ├── airtable.ts           # Airtable SDK
│   ├── email.ts              # Resend SDK
│   └── telegram.ts           # Telegram API
│
├── data/                     # 정적 데이터
│   ├── success-cases.json    # 성공사례
│   └── faq-data.json         # FAQ
│
└── public/                   # 정적 파일
    └── images/               # 이미지
```

---

## 🎨 브랜드 컬러

### 신규 브랜드 컬러
```typescript
// tailwind.config.ts
colors: {
  primary: {
    DEFAULT: '#0066CC',    // 메인 브랜드 컬러
    dark: '#003D7A',       // 어두운 버전
    light: '#E6F2FF',      // 밝은 버전
  },
  accent: '#F59E0B',       // 강조 컬러 (CTA 버튼)
}
```

**사용 예시**:
```tsx
<div className="bg-primary text-white">
  <Button className="bg-accent">무료 상담</Button>
</div>
```

---

## 📄 페이지 목록

| 페이지 | URL | SEO Title |
|--------|-----|-----------|
| 홈 | `/` | 정책자금 컨설팅 \| 중소기업 소상공인 창업자금 전문 상담 |
| 회사소개 | `/company` | 회사소개 \| POLA |
| 진행과정 | `/process` | 정책자금 신청 절차 \| 사업계획서 작성부터 승인까지 |
| 자금상담 | `/fund` | 정책자금 종류 및 한도 \| 창업자금·운전자금·시설자금 |
| 전문서비스 | `/service` | 정책자금 컨설팅 서비스 \| 사업계획서·재무분석·심사대행 |
| 성공사례 | `/success` | 정책자금 성공사례 \| 승인 후기 및 고객 리뷰 |
| FAQ | `/faq` | 정책자금 자주묻는질문 \| 신청 조건·금리·한도 FAQ |
| 상담신청 | `/contact` | 무료 상담 신청 \| POLA |

---

## 🔧 주요 기능

### 1. 폼 제출 플로우
```
사용자 입력 (ContactForm)
    ↓
/api/submit-form (검증)
    ↓
├─ Airtable 저장
├─ 이메일 발송 (Resend)
└─ Telegram 알림
    ↓
성공 메시지 표시
```

### 2. SEO 최적화
- ✅ 모든 페이지 메타 태그
- ✅ Structured Data (JSON-LD)
- ✅ Sitemap 자동 생성
- ✅ Open Graph 이미지
- ✅ 60+ 타겟 키워드

### 3. 반응형 디자인
- ✅ Mobile First (320px~)
- ✅ Tablet (768px~)
- ✅ Desktop (1024px~)

---

## 📊 SEO 목표

### 3개월 후
- 검색 노출: 월 **10,000회**
- 클릭 수: 월 **500회**
- 핵심 키워드: **20위 이내**

### 6개월 후
- 검색 노출: 월 **30,000회**
- 클릭 수: 월 **1,500회**
- 핵심 키워드: **10위 이내**

---

## 🛠️ 개발 일정 (14일)

| 주차 | 작업 내용 | 산출물 |
|------|----------|--------|
| **Week 1** | 프로젝트 설정 & 레이아웃 | Header, Footer, 홈 섹션 |
| **Week 2** | 서브 페이지 & API | 전체 페이지, 폼 제출 API |

### 상세 일정
- **Day 1**: 프로젝트 설정, Tailwind 구성
- **Day 2**: Header, Footer 컴포넌트
- **Day 3-5**: 홈페이지 섹션 (Hero, Service, Process 등)
- **Day 6-8**: 서브 페이지 (Company, Fund, Service, FAQ)
- **Day 9-10**: ContactForm + API Routes
- **Day 11-12**: SEO 최적화 (메타 태그, Sitemap)
- **Day 13**: 테스트 & 버그 수정
- **Day 14**: Vercel 배포

---

## 💰 비용 (무료)

| 항목 | 무료 한도 | 월 비용 |
|------|----------|---------|
| Vercel | 100GB 대역폭 | **$0** |
| Airtable | 1,200 레코드 | **$0** |
| Resend | 3,000통/월 | **$0** |
| Telegram | 무제한 | **$0** |
| **총계** | - | **$0** |

**도메인**: $12/년 (선택)

---

## 📦 배포 (Vercel)

### 1. GitHub 연동
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/your-username/pola-homepage.git
git push -u origin main
```

### 2. Vercel 배포
```bash
# Vercel CLI 설치
npm install -g vercel

# 로그인
vercel login

# 배포
vercel --prod
```

### 3. 환경변수 설정
```bash
vercel env add AIRTABLE_TOKEN
vercel env add RESEND_API_KEY
vercel env add TELEGRAM_BOT_TOKEN
# ... 나머지 환경변수
```

---

## 🐛 트러블슈팅

### Q1. Tailwind 클래스가 적용 안 됨
```typescript
// tailwind.config.ts 확인
content: [
  './app/**/*.{ts,tsx}',
  './components/**/*.{ts,tsx}',
]
```

### Q2. 이미지 로딩 느림
```tsx
// priority 속성 추가
<Image src="..." alt="..." priority />
```

### Q3. 폼 제출 실패
```bash
# 환경변수 확인
echo $AIRTABLE_TOKEN
echo $RESEND_API_KEY
```

---

## 📚 추가 문서

### 개발 가이드
- **아임웹-마이그레이션-가이드.md**: 기존 HTML → Next.js 변환
- **프로젝트-구조-기획서.md**: 폴더 구조 및 코드 예시

### SEO 가이드
- **SEO-키워드-전략.md**: 60+ 키워드, 페이지별 전략

### 전체 기획
- **설계기획서.md**: 전체 프로젝트 개요 (1,500+ 줄)

---

## 🎯 다음 단계

### 즉시 실행
1. [x] 프로젝트 생성 (`npx create-next-app`)
2. [ ] 기존 아임웹 파일 분석
3. [ ] Header 컴포넌트 작성
4. [ ] 홈페이지 섹션 작성

### 이번 주
- [ ] 모든 페이지 구조 완성
- [ ] 브랜드 컬러 적용
- [ ] 폼 제출 API 구현

### 다음 주
- [ ] SEO 메타 태그 추가
- [ ] 테스트 완료
- [ ] Vercel 배포

---

## 📞 지원

**문서 작성**: Claude (AI Assistant)
**작성일**: 2025-11-24
**버전**: 1.0.0

---

**시작하기**: `npm run dev` 실행 후 `http://localhost:3000` 접속
