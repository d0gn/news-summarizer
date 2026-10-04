# 🏛️ News Summarizer SaaS - 백엔드 아키텍처 및 파일 구조 가이드

본 문서는 AI 기반 맞춤형 뉴스 요약 SaaS 플랫폼 백엔드 프로젝트에 구현된 모든 파일과 디렉토리의 구조, 역할, 그리고 핵심 아키텍처를 체계적으로 설명합니다.

---

## 📂 1. 전체 디렉토리 구조

```text
news-summarizer/
├── .env.example              # 환경 변수 예시 파일
├── .gitignore                # Git 제외 파일 설정
├── GEMINI.md                 # 프로젝트 규칙 및 코딩 컨벤션
├── BACKEND_ARCHITECTURE.md   # 본 아키텍처 및 파일 설명 문서
├── news_summarizer_saas_functional_specification.md # 상세 기능 명세서
├── requirements.txt          # 파이썬 패키지 의존성 목록
├── news_summarizer.db        # 로컬 SQLite 영구 저장 데이터베이스 파일
├── app/                      # 애플리케이션 소스 코드
│   ├── __init__.py
│   ├── main.py               # FastAPI 앱 진입점 및 생명주기(Lifespan) 관리
│   ├── api/                  # API 라우터 (요청/응답 제어)
│   │   ├── __init__.py
│   │   ├── v1/
│   │   │   ├── __init__.py   # API v1 라우터 통합
│   │   │   ├── sources.py    # 피드 소스 CRUD 관리 API
│   │   │   ├── ingestion.py  # 수동 수집 파이프라인 트리거 API
│   │   │   └── articles.py   # 기사 목록, 상세 및 토픽 클러스터 조회 API
│   ├── core/                 # 공통 설정 및 유틸리티
│   │   ├── __init__.py
│   │   ├── config.py         # Pydantic 기반 환경 변수 및 설정 관리
│   │   └── database.py       # SQLAlchemy 비동기 엔진 및 세션 팩토리
│   ├── models/               # 데이터베이스 ORM 모델 및 Pydantic 스키마
│   │   ├── __init__.py
│   │   ├── entities.py       # SQLAlchemy ORM 엔티티 (FeedSource, Article, TopicCluster)
│   │   └── schemas.py        # Pydantic v2 데이터 입출력 검증 스키마
│   └── services/             # 비즈니스 로직 및 ETL 엔진
│       ├── __init__.py
│       ├── scraper.py        # RSS 피드 수집, OpenGraph 썸네일 파서 및 RSS 요약 추출
│       ├── cleaner.py        # Trafilatura 본문 추출 및 보일러플레이트 정제기
│       ├── deduplicator.py   # URL 정규화 및 SHA-256 해시 중복 방지기
│       ├── clusterer.py      # N-gram Jaccard 유사도 기반 기사 군집화 엔진
│       ├── ai_summarizer.py  # Google Gemini API 기반 구조화된 3줄 요약 및 태깅 엔진
│       ├── pipeline.py       # 수집-정제-중복방지-AI가공-군집화 전체 ETL 오케스트레이터
│       └── scheduler.py      # APScheduler 기반 주기적 백그라운드 수집 스케줄러
└── tests/                    # 자동화 테스트
    ├── test_ingestion.py     # ETL 핵심 로직 단위 테스트
    └── test_ai_summarizer.py # AI 요약 서비스 폴백 및 검증 테스트
```

---

## 📄 2. 파일별 상세 역할 설명

### ⚙️ 공통 설정 및 코어 (`app/core/`)
* **`app/core/config.py`**:
  - `Pydantic-Settings` 기반의 `Settings` 클래스를 정의합니다.
  - 데이터베이스 URL, 수집 주기(15분), HTTP 타임아웃, 본문 최소 길이(150자), 군집화 유사도 임계치(0.85) 등의 시스템 설정을 관리합니다.
* **`app/core/database.py`**:
  - SQLAlchemy 2.0 비동기 엔진(`create_async_engine`)과 `aiosqlite` 드라이버를 통해 로컬 파일인 `news_summarizer.db`와 비동기 연동합니다.
  - 비동기 세션 제너레이터(`get_db`)와 테이블 자동 생성 함수(`init_db`)를 제공합니다.

### 📦 데이터 모델 및 스키마 (`app/models/`)
* **`app/models/entities.py`**:
  - **`FeedSource`**: RSS 소스 정보(언론사명, RSS URL, 카테고리, 활성화 여부, 마지막 수집 시간)를 관리하는 ORM 테이블.
  - **`TopicCluster`**: 동일 사건/이슈로 묶인 기사 그룹과 대표 기사(`primary_article_id`)를 관리하는 ORM 테이블.
  - **`Article`**: 수집된 개별 기사 데이터(원문 URL, 정규화 URL, SHA-256 해시, 제목, 언론사, 본문 텍스트/HTML, 썸네일, 발행일, AI 요약/태그/핵심 메시지)를 저장하는 ORM 테이블.
* **`app/models/schemas.py`**:
  - API 요청 및 응답 데이터 검증을 위한 Pydantic v2 모델(`FeedSourceCreate`, `ArticleResponse`, `ArticleDetailResponse`, `TopicClusterResponse`, `IngestionResultResponse` 등)을 정의합니다.

### 🧠 비즈니스 로직 및 ETL 엔진 (`app/services/`)
* **`app/services/scraper.py`**:
  - `httpx.AsyncClient`와 `feedparser`를 활용하여 RSS XML 피드를 비동기 파싱하고, `BeautifulSoup`을 통해 기사 웹페이지의 OpenGraph(`og:image`) 썸네일을 수집합니다.
* **`app/services/cleaner.py`**:
  - `trafilatura` 라이브러리를 이용해 광고, 댓글, 사이드바를 제외한 순수 본문 텍스트를 추출합니다.
  - 정규식을 활용해 기자 이메일, 바이라인(`[홍길동 기자]`), 저작권 문구(`무단 전재 및 재배포 금지`) 등의 보일러플레이트를 정제합니다.
  - 순수 텍스트 기준 150자 미만 기사는 단순 이미지/영상 기사로 간주하여 수집에서 제외합니다.
* **`app/services/deduplicator.py`**:
  - URL 내 마케팅/추적 파라미터(`utm_source`, `fbclid`, `gclid` 등)를 제거하고 대소문자 및 쿼리 정렬을 통해 표준화된 URL(`normalize_url`)을 생성합니다.
  - 64자리 SHA-256 해시(`generate_url_hash`)를 생성하여 DB 유니크 제약 조건과 대조, 중복 기사를 완벽히 차단합니다.
* **`app/services/clusterer.py`**:
  - 제목 및 본문 앞단을 토큰화하여 N-gram Jaccard 유사도($\ge 0.85$)를 계산합니다.
  - 최근 24시간 내 기사들과 비교하여 동일 이슈일 경우 기존 `TopicCluster`에 편입하고, 가장 정보량이 많은 기사를 대표 기사(`Primary Article`)로 선정합니다.
* **`app/services/ai_summarizer.py`**:
  - Google Gemini API (`google-genai`)를 활용하여 기사 본문과 제목으로부터 3줄 요약, 태그 목록, 한 줄 핵심을 엄격한 JSON Schema 규격으로 추출 및 캐싱합니다.
* **`app/services/pipeline.py`**:
  - 수집 ➔ 정규화 ➔ 해시 중복방지 ➔ 웹페이지 수집(또는 RSS 요약 Fallback) ➔ 본문추출 ➔ 정제 ➔ 길이검증 ➔ AI 요약/태깅 ➔ DB저장 ➔ 군집화 단계를 순차적으로 실행하는 전체 ETL 오케스트레이터입니다.
* **`app/services/scheduler.py`**:
  - `APScheduler`를 활용해 설정된 주기(기본 15분)마다 백그라운드에서 모든 활성 피드 소스의 수집 파이프라인을 자동 실행합니다.

### 🌐 API 라우터 (`app/api/v1/`)
* **`app/api/v1/sources.py`**: 피드 소스 등록, 조회, 수정, 삭제(CRUD) REST API.
* **`app/api/v1/ingestion.py`**: 수집 파이프라인 수동 즉시 실행 트리거(`POST /api/v1/ingestion/trigger`) API.
* **`app/api/v1/articles.py`**: 
  - 기사 목록 페이지네이션 및 카테고리/검색 필터 조회 (`GET /api/v1/articles`)
  - 토픽 클러스터 및 그룹 기사 목록 조회 (`GET /api/v1/articles/clusters`)
  - 기사 상세 내용 및 동일 클러스터 연관 기사 조회 (`GET /api/v1/articles/{article_id}`)
* **`app/api/v1/__init__.py`**: 모든 v1 라우터를 `/api/v1` 프리픽스로 통합.

### 🚀 앱 진입점 및 설정 파일
* **`app/main.py`**:
  - FastAPI 애플리케이션 초기화 및 `lifespan` 컨텍스트 매니저 관리.
  - 앱 시작 시 DB 테이블 자동 생성(`init_db()`), 기본 시드 소스(GeekNews, HackerNews) 자동 적재, 백그라운드 스케줄러 시작/종료 처리.
* **`requirements.txt`**: FastAPI, SQLAlchemy, Trafilatura, APScheduler, Pytest 등 프로젝트 구동에 필요한 전체 패키지 의존성.
* **`tests/test_ingestion.py`**: URL 정규화, 해시 생성, 보일러플레이트 정제, 본문 길이 검증, N-gram 유사도 계산 로직에 대한 단위 테스트 스위트.
