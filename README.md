# 🚀 AI 기반 맞춤형 뉴스 요약 SaaS 플랫폼 (News Summarizer SaaS)

> **수많은 뉴스 홍수 속에서 나만의 관심사를 분석하고, Google Gemini AI로 3줄 요약 및 이슈 클러스터링을 제공하는 풀스택 SaaS 서비스입니다.**

![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=flat-square&logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688?style=flat-square&logo=fastapi&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-14+-000000?style=flat-square&logo=next.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?style=flat-square&logo=typescript&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-3.4+-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=flat-square&logo=docker&logoColor=white)
![Gemini AI](https://img.shields.io/badge/Google_Gemini-API-4285F4?style=flat-square&logo=google&logoColor=white)
![CI/CD](https://img.shields.io/badge/GitHub_Actions-CI%2FCD-2088FF?style=flat-square&logo=github-actions&logoColor=white)

---

## 💡 1. 프로젝트 소개 및 기획 의도 (Overview)

현대 사회에서는 매일 수만 건의 뉴스가 쏟아지지만, 정작 개인에게 유익하고 깊이 있는 정보를 효율적으로 소비하기는 쉽지 않습니다. **News Summarizer SaaS**는 이러한 정보 과부하(Information Overload) 문제를 해결하기 위해 개발된 **AI 기반 뉴스 큐레이션 플랫폼**입니다.

### 웹 페이지 바로가기 [PulseFeed.cloud](https://pulsefeed.cloud/)
### 프론트엔드 아키텍쳐 바로가기 [FRONTEND_ARCHITECTURE](./frontend/FRONTEND_ARCHITECTURE.md)
### 벡엔드 아키텍쳐 바로가기 [BACKEND_ARCHITECTURE](BACKEND_ARCHITECTURE.md)

### 🎯 핵심 가치 (Value Proposition)
- **시간 절약 (Time Saving)**: Google Gemini AI의 구조화된 요약(3줄 요약, 한 줄 핵심)을 통해 긴 기사를 1분 안에 파악할 수 있습니다.
- **이슈 중심 파악 (Issue Clustering)**: 파편화된 기사들을 동일 사건/이슈별로 묶어주는 N-gram Jaccard 클러스터링을 제공합니다.
- **철저한 개인화 (Personalization)**: 사용자가 설정한 관심 카테고리 및 키워드(`UserPreference`)를 기반으로 맞춤형 피드를 제공합니다.

---

## ✨ 2. 핵심 기능 (Core Engineering Highlights)

본 프로젝트는 단순한 API 조작을 넘어, 프로덕션 환경을 고려한 아키텍처와 성능 최적화에 집중했습니다.

1. **🔍 견고한 ETL 파이프라인과 중복 방지 (Robust ETL & Deduplication)**
   - RSS 피드 수집 ➔ Trafilatura 본문 정제(광고/보일러플레이트 제거) ➔ URL 정규화 및 SHA-256 해시 검증을 통해 중복 수집을 원천 차단합니다.
2. **⚡ 비동기(Async) 처리와 성능 최적화**
   - FastAPI와 `httpx.AsyncClient`를 활용한 논블로킹(Non-blocking) I/O 설계로 대량의 외부 RSS 요청과 AI API 호출을 고속으로 처리합니다.
3. **🧩 LLM 한계 극복 및 구조화된 데이터 보장**
   - Gemini API 응답에서 발생할 수 있는 파싱 에러를 방지하기 위해 Pydantic v2 스키마 검증과 엄격한 JSON Schema 규격을 적용했습니다.
4. **🏛️ 계층형 아키텍처 (Layered Architecture)**
   - `api/` (라우터 및 요청 제어), `services/` (순수 비즈니스 로직 및 ETL), `models/` (ORM 및 스키마), `core/` (설정 및 보안)로 책임을 철저히 분리하여 유지보수성을 극대화했습니다.

---

## 🏛️ 3. 시스템 아키텍처 및 기술 스택 (Architecture)

```text
news-summarizer/
├── app/                      # 🐍 FastAPI 백엔드
│   ├── api/v1/               # REST API 라우터 (auth, articles, sources, users, ingestion)
│   ├── core/                 # 설정, 비동기 DB 세션, 보안(PBKDF2/토큰)
│   ├── models/               # SQLAlchemy ORM 엔티티 및 Pydantic v2 스키마
│   └── services/             # Scraper, Cleaner, Deduplicator, Clusterer, AI Summarizer, Pipeline
├── frontend/                 # ⚛️ Next.js 14+ (App Router) 프론트엔드
│   ├── app/                  # auth, dashboard (feed, clusters, bookmarks, settings, admin)
│   ├── components/           # Navbar, Sidebar, ArticleCard, ArticleModal
│   └── lib/                  # Axios API 인스턴스 및 Zustand 상태 관리
└── tests/                    # pytest 자동화 테스트
```

### 🔄 데이터 수집 및 처리 ETL 파이프라인
```text
[RSS Feeds] 
   ⬇️ (Scraper / httpx)
[Raw Articles] 
   ⬇️ (Cleaner / Trafilatura)
[Clean Text] 
   ⬇️ (Deduplicator / SHA-256)
[Unique Check] 
   ⬇️ (AI Summarizer / Gemini API)
[Structured Summary & Tags] 
   ⬇️ (Clusterer / Jaccard Similarity)
[Topic Clusters & DB Storage]
```

---

## 🤖 4. CI/CD 자동화 파이프라인

본 프로젝트는 코드 품질 유지와 무중단 배포를 위해 **GitHub Actions** 기반의 CI/CD 파이프라인을 구축하고 있습니다.

- **CI (Continuous Integration)**:
  - PR 또는 Push 발생 시 `pytest`를 통한 자동화 단위/통합 테스트 구동 (ETL, 인증, AI 서비스 검증).
  - 린터 및 타입 힌팅 검사.
- **CD (Continuous Deployment)**:
  - 빌드 검증 완료 후 Docker 이미지 빌드 및 클라우드 서버 자동 배포 파이프라인 연동.

```text
[Git Push / PR] ➔ [GitHub Actions: Pytest & Lint] ➔ [Docker Image Build] ➔ [Server Auto Deploy]
```

---

## 📅 5. 주간 패치 노트 및 개발 일지 (Changelog)

> 본 프로젝트는 지속적인 고도화(Semantic Versioning)를 거치며 발전하고 있습니다.

- **`v0.1.0` (Week 1): 프로젝트 셋업 및 코어 ETL 파이프라인 구축**
  - FastAPI 계층형 아키텍처 초기화 및 SQLite 비동기 세션(`aiosqlite`) 구성.
  - `httpx`와 `feedparser`를 이용한 기본 RSS 수집기 및 OpenGraph 파서 구현.
- **`v0.2.0` (Week 2): 중복 방지 및 Gemini AI 요약 엔진 도입**
  - URL 정규화 및 SHA-256 해시 생성 기반 중복 수집 필터링 추가.
  - Google Gemini API 연동 및 3줄 구조화 요약/태깅/한 핵심 추출 기능 구현.
- **`v0.3.0` (Week 3): 이슈 클러스터링 및 사용자 개인화 API 고도화**
  - N-gram Jaccard 유사도 알고리즘 기반 동일 이슈 기사 자동 군집화(`TopicCluster`) 엔진 구현.
  - 사용자 관심 카테고리/키워드 설정(`UserPreference`) 및 맞춤형 피드 조회 API 개발.
- **`v0.4.0` (Week 4): Next.js 14+ 프론트엔드 대시보드 및 인증 연동**
  - Tailwind CSS를 활용한 반응형 UI (`/feed`, `/clusters`, `/bookmarks`, `/settings`, `/admin/sources`) 구축.
  - Zustand 기반 전역 상태 관리 및 JWT 인증 Interceptor 연동.
- **`v0.5.0` (Week 5): Docker 컨테이너화 및 GitHub Actions CI/CD 구축**
  - 멀티스테이지 Dockerfile 작성 및 `docker-compose.yml` 통합 오케스트레이션 구성.
  - GitHub Actions 자동 테스트 및 배포 파이프라인 적용.

---

## 🛠️ 6. 설치 및 실행 방법 (Getting Started)

### 방법 1: Docker Compose로 한 번에 실행하기
1. 환경 변수 파일(`.env`) 생성(`.env.example`)활용:
   ```env
   ## App Settings
   #APP_ENV=
   #PORT=

   ## LLM / Gemini API Key
   # GEMINI_API_KEY=

   ## Frontend API URL (for Docker build & runtime, e.g., http://<AWS_PUBLIC_IP> or *Default localhost :8000/api/v1)
   # NEXT_PUBLIC_API_URL=서버 주소 입력

   ## ai 처리 개수
   # MAX_ITEMS_PER_FEED=

   ```
2. 도커 컴포즈 빌드 및 실행:
   ```bash
   docker compose up --build
   ```
3. 접속 주소:
   - 프론트엔드: `http://localhost:3000`
   - 백엔드 API Docs: `http://localhost:8000/docs`

### 방법 2: 로컬 수동 개발 모드 실행
- **백엔드 (FastAPI)**:
  ```bash
  python -m venv venv
  venv\Scripts\Activate
  pip install -r requirements.txt
  uvicorn app.main:app --reload --port 8000
  ```
- **프론트엔드 (Next.js)**:
  ```bash
  cd frontend
  npm install
  npm run dev
  ```

---

## 🛠️ 7. 트러블슈팅 및 엔지니어링 고민 (Challenges)

1. **LLM 응답 포맷 안정성 확보**:
   - *Issue*: LLM이 마크다운 코드블록이나 불필요한 텍스트를 섞어 반환하여 JSON 파싱 에러 발생.
   - *Solution*: Pydantic v2 모델과 Gemini API의 `response_mime_type="application/json"` 제약을 동시에 적용하여 정형화된 JSON 응답을 강제하고 예외 방어 로직 구현.
2. **대규모 뉴스 수집 시 I/O 병목 해결**:
   - *Issue*: 다수의 RSS 소스를 동기적으로 순회하며 수집할 때 발생하는 심각한 지연 현상.
   - *Solution*: `asyncio.gather`를 도입해 모든 RSS 소스 파싱과 본문 추출을 비동기 병렬 처리로 전환하여 수집 속도 5배 이상 향상.

---

## 📄 License
This project is licensed under the MIT License.
