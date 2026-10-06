# 🏛️ News Summarizer SaaS - 프론트엔드 아키텍처 및 상세 개발 로드맵

본 문서는 AI 기반 맞춤형 뉴스 요약 SaaS 플랫폼의 프론트엔드 프로젝트(Next.js App Router) 구축, 컴포넌트 설계, 백엔드 API 연동, 그리고 **페이즈별 상세 개발 프로세스**를 정의합니다.

---

## 📂 1. 전체 디렉토리 구조 (Monorepo `frontend/`)

```text
news-summarizer/
├── app/                      # 🐍 FastAPI 백엔드
├── requirements.txt
├── BACKEND_ARCHITECTURE.md
├── FRONTEND_ARCHITECTURE.md  # 👈 본 프론트엔드 아키텍처 문서
├── docker-compose.yml        # 백엔드 + 프론트엔드 통합 도커 오케스트레이션
└── frontend/                 # ⚛️ Next.js 14+ (App Router) 프론트엔드
    ├── .env.local            # 환경 변수 (NEXT_PUBLIC_API_URL 등)
    ├── package.json          # 프론트엔드 의존성 목록
    ├── tailwind.config.js    # Tailwind CSS 및 브랜드 컬러 설정
    ├── tsconfig.json         # TypeScript 설정
    ├── app/                  # 앱 라우터 (App Router)
    │   ├── layout.tsx        # 루트 레이아웃 (Pretendard 폰트, 테마 프로바이더)
    │   ├── page.tsx          # 루트 진입점 (로그인 여부 분기)
    │   ├── (auth)/           # 인증 관련 라우트 그룹
    │   │   ├── login/
    │   │   │   └── page.tsx  # 로그인 페이지 (sample/LOGIN.html 기반)
    │   │   └── signup/
    │   │       └── page.tsx  # 회원가입 페이지 (sample/SIGNUP.html 기반)
    │   ├── (dashboard)/      # 메인 서비스 대시보드 그룹 (사이드바 & 헤더 공유)
    │   │   ├── layout.tsx    # 대시보드 공통 레이아웃 (Navbar, Sidebar, 프로필 드롭다운)
    │   │   ├── feed/
    │   │   │   └── page.tsx  # 맞춤 뉴스 피드 대시보드 (sample/MAIN.html 피드)
    │   │   ├── clusters/
    │   │   │   └── page.tsx  # 주요 이슈 클러스터 트렌딩 뷰
    │   │   ├── bookmarks/
    │   │   │   └── page.tsx  # 북마크 보관함 뷰
    │   │   ├── settings/
    │   │   │   └── page.tsx  # 사용자 선호도(카테고리/키워드) 설정
    │   │   └── admin/
    │   │       └── sources/
    │   │           page.tsx  # RSS 소스 및 수집 관리 (관리자용)
    │   └── articles/
    │       └── [id]/
    │           └── page.tsx  # 독립형 기사 상세 페이지 (sample/ARTICLE.html 기반)
    ├── components/           # 재사용 가능한 UI 컴포넌트
    │   ├── Navbar.tsx        # 상단 네비게이션 & 프로필 드롭다운 메뉴
    │   ├── Sidebar.tsx       # 좌측 메뉴 & 카테고리 필터
    │   ├── ArticleCard.tsx   # 피드용 뉴스 카드 컴포넌트
    │   ├── ArticleModal.tsx  # 요약 빠른보기 모달
    │   └── Toast.tsx         # 알림 토스트 컴포넌트
    └── lib/
        ├── api.ts            # FastAPI 백엔드 통신용 Axios 인스턴스
        └── store.ts          # Zustand 전역 상태 관리 (Auth 및 선호도)
```

---

## 🗺️ 2. 페이지 라우트 및 API 매핑 명세

| 경로 (Path) | 컴포넌트 소스 | 주요 역할 및 기능 | 연동 FastAPI 엔드포인트 |
| :--- | :--- | :--- | :--- |
| `/` | `app/page.tsx` | 랜딩 및 로그인 상태 분기 | - |
| `/auth/login` | `app/(auth)/login/page.tsx` | 로그인 (이메일/비밀번호) | `POST /api/v1/auth/login` |
| `/auth/signup` | `app/(auth)/signup/page.tsx` | 회원가입 (비밀번호 확인 검증 포함) | `POST /api/v1/auth/register` |
| `/feed` | `app/(dashboard)/feed/page.tsx` | 맞춤형 AI 요약 뉴스 피드 및 실시간 검색 | `GET /api/v1/users/feed`, `GET /api/v1/articles` |
| `/clusters` | `app/(dashboard)/clusters/page.tsx` | Jaccard 유사도 기반 이슈 클러스터 탐색 | `GET /api/v1/articles/clusters` |
| `/bookmarks` | `app/(dashboard)/bookmarks/page.tsx` | 스크랩한 기사 보관함 관리 | `GET /api/v1/users/bookmarks` |
| `/settings` | `app/(dashboard)/settings/page.tsx` | 관심 카테고리 및 키워드 설정 | `GET/PUT /api/v1/users/preferences` |
| `/admin/sources` | `app/(dashboard)/admin/sources/page.tsx` | RSS 소스 CRUD 및 수동 수집 트리거 | `GET/POST/PUT/DELETE /api/v1/sources`, `POST /api/v1/ingestion/trigger` |
| `/articles/[id]` | `app/articles/[id]/page.tsx` | 독립형 기사 심층 독서 및 공유 페이지 | `GET /api/v1/articles/{article_id}` |

---

## 🚀 3. 상세 개발 로드맵 (Phase-by-Phase Implementation Guide)

### Phase 1: 프로젝트 초기화 및 디자인 시스템 세팅
- **목표:** Next.js 14+ (App Router) 기본 환경 구축 및 스타일/폰트 설정.
- **주요 작업:**
  1. `npx create-next-app@latest frontend --typescript --tailwind --app --no-src-dir` 실행.
  2. `tailwind.config.js`에 브랜드 색상(`brand-500`, `violet`, `indigo`) 및 다크모드 설정(`darkMode: 'class'`) 반영.
  3. 전역 폰트(Pretendard CDN 및 CSS) 적용 및 커스텀 스크롤바 스타일링 추가.

### Phase 2: API 클라이언트 및 전역 상태 관리 구현 (`lib/`)
- **목표:** FastAPI 백엔드 통신을 위한 Axios 인스턴스 및 Zustand 인증 스토어 구축.
- **주요 작업:**
  1. `lib/api.ts`: `axios.create({ baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1' })` 설정. Request Interceptor를 통해 `localStorage`의 `access_token` 자동 첨부.
  2. `lib/store.ts`: Zustand를 이용한 사용자 로그인 상태(`user`, `token`, `login()`, `logout()`) 관리 스토어 구현.

### Phase 3: 인증 페이지 구현 (`(auth)`)
- **목표:** 회원가입 및 로그인 화면 구현 및 백엔드 연동.
- **주요 작업:**
  1. `app/(auth)/signup/page.tsx`: sample/SIGNUP.html 코드를 기반으로 이메일 정규식 검증, 비밀번호 6자 이상 체크, 비밀번호 확인 일치 여부 검증 후 `POST /api/v1/auth/register` 연동.
  2. `app/(auth)/login/page.tsx`: sample/LOGIN.html 코드를 기반으로 OAuth2 Form 또는 JSON 로그인(`POST /api/v1/auth/login`) 연동 및 JWT 토큰 저장.

### Phase 4: 대시보드 레이아웃 및 네비게이션 구축 (`(dashboard)`)
- **목표:** 공통 레이아웃(사이드바, 헤더, 프로필 드롭다운) 구현.
- **주요 작업:**
  1. `components/Sidebar.tsx`: 피드, 이슈 클러스터, 북마크, 설정, 관리자 소스 관리 탭 전환 구현.
  2. `components/Navbar.tsx`: 실시간 검색바, 다크모드 토글, 아바타 프로필 드롭다운 메뉴(관심사 설정, 계정 전환, 로그아웃) 구현.

### Phase 5: 맞춤 뉴스 피드 & 빠른보기 모달 구현 (`/feed`)
- **목표:** AI 3줄 요약 기사 카드 그리드 및 모달 상세 보기 연동.
- **주요 작업:**
  1. `app/(dashboard)/feed/page.tsx`: `GET /api/v1/users/feed` 또는 `GET /api/v1/articles` 데이터를 받아와 카테고리 필터링 및 실시간 검색 구현.
  2. `components/ArticleCard.tsx`: AI 한 줄 핵심(`core_message`), 썸네일, 태그 칩, 북마크 토글 버튼 구현.
  3. `components/ArticleModal.tsx`: 카드 클릭 시 열리는 모달 내에서 Gemini 3줄 요약(`summary`) 및 모달 하단의 **[상세 페이지 보기 (`/articles/[id]`)]** 버튼 연동.

### Phase 6: 이슈 클러스터, 북마크, 설정 페이지 구현
- **목표:** 트렌딩 이슈, 스크랩 보관함, 사용자 선호도 설정 기능 완성.
- **주요 작업:**
  1. `app/(dashboard)/clusters/page.tsx`: Jaccard 유사도 클러스터(`GET /api/v1/articles/clusters`) 아코디언 뷰 구현.
  2. `app/(dashboard)/bookmarks/page.tsx`: 북마크된 기사 리스트 조회 및 해제 기능 구현.
  3. `app/(dashboard)/settings/page.tsx`: 카테고리 다중 선택 및 선호 키워드 추가/삭제 후 `PUT /api/v1/users/preferences` 연동.

### Phase 7: 독립형 기사 상세 페이지 구현 (`/articles/[id]`)
- **목표:** 공유 및 SEO 대응을 위한 독립형 상세 페이지 완성.
- **주요 작업:**
  1. `app/articles/[id]/page.tsx`: `sample/ARTICLE.html` 기반으로 `GET /api/v1/articles/{id}` 데이터를 호출하여 전체 본문(`content_html`), AI 요약, 관련 기사(`related_articles`) 렌더링.

### Phase 8: Docker Compose 통합 및 배포 검증
- **목표:** 프론트엔드 Dockerfile 작성 및 백엔드와의 통합 도커 구동 테스트.
- **주요 작업:**
  1. `frontend/Dockerfile` 작성 (Next.js Multi-stage build 적용).
  2. 루트 `docker-compose.yml`을 통해 `docker compose up --build` 실행 후 전체 서비스 정상 작동 확인.

---

## 🐳 4. Docker Compose 통합 배포 구성

```yaml
version: '3.8'

services:
  backend:
    build: .
    container_name: news_backend
    restart: always
    ports:
      - "8000:8000"
    volumes:
      - ./news_summarizer.db:/app/news_summarizer.db
    env_file:
      - .env

  frontend:
    build: ./frontend
    container_name: news_frontend
    restart: always
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://localhost:8000
    depends_on:
      - backend
```
