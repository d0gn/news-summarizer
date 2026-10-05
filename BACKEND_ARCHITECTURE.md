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
│   │   │   ├── articles.py   # 기사 목록, 상세 및 토픽 클러스터 조회 API
│   │   │   ├── auth.py       # 회원가입, 로그인 및 인증 프로필 API
│   │   │   └── users.py      # 사용자 북마크, 선호도 및 개인화 피드 API
│   ├── core/                 # 공통 설정 및 유틸리티
│   │   ├── __init__.py
│   │   ├── config.py         # Pydantic 기반 환경 변수 및 설정 관리
│   │   ├── database.py       # SQLAlchemy 비동기 엔진 및 세션 팩토리
│   │   └── security.py       # 비밀번호 PBKDF2 해싱 및 서명 기반 토큰 인증 유틸리티
│   ├── models/               # 데이터베이스 ORM 모델 및 Pydantic 스키마
│   │   ├── __init__.py
│   │   ├── entities.py       # SQLAlchemy ORM 엔티티 (FeedSource, Article, TopicCluster, User, UserBookmark, UserPreference)
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
    ├── test_ai_summarizer.py # AI 요약 서비스 폴백 및 검증 테스트
    └── test_auth_and_users.py # 회원가입, 로그인, 북마크 및 개인화 피드 API 테스트
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
* **`app/core/security.py`**:
  - `hashlib.pbkdf2_hmac` 기반 안전한 비밀번호 해싱 및 HMAC 서명 기반 토큰 인증 시스템을 구현합니다.
  - OAuth2 Password Bearer 스키마를 통해 현재 인증된 사용자(`get_current_user`)를 검증하고 주입합니다.

### 📦 데이터 모델 및 스키마 (`app/models/`)
* **`app/models/entities.py`**:
  - **`FeedSource`**: RSS 소스 정보(언론사명, RSS URL, 카테고리, 활성화 여부, 마지막 수집 시간)를 관리하는 ORM 테이블.
  - **`TopicCluster`**: 동일 사건/이슈로 묶인 기사 그룹과 대표 기사(`primary_article_id`)를 관리하는 ORM 테이블.
  - **`Article`**: 수집된 개별 기사 데이터 및 AI 요약/태그/핵심 메시지 저장 ORM 테이블.
  - **`User`**: 회원 정보(이메일, 해시 비밀번호, 이름, 요금제 티어 `free`/`pro`/`team`, 활성화 여부) 관리 ORM 테이블.
  - **`UserBookmark`**: 사용자가 북마크(스크랩)한 기사 관계 매핑 ORM 테이블.
  - **`UserPreference`**: 사용자별 선호 카테고리 및 키워드 설정 관리 ORM 테이블.
* **`app/models/schemas.py`**:
  - API 요청 및 응답 데이터 검증을 위한 Pydantic v2 모델(`FeedSourceCreate`, `ArticleResponse`, `UserCreate`, `UserResponse`, `BookmarkResponse`, `UserPreferenceUpdate` 등)을 정의합니다.

### 🧠 비즈니스 로직 및 ETL 엔진 (`app/services/`)
* **`app/services/scraper.py`**:
  - `httpx.AsyncClient`와 `feedparser`를 활용하여 RSS XML 피드를 비동기 파싱하고 OpenGraph 썸네일을 수집합니다.
* **`app/services/cleaner.py`**:
  - Trafilatura를 이용한 본문 추출 및 광고/바이라인 보일러플레이트 정제기 (150자 미만 기사 제외).
* **`app/services/deduplicator.py`**:
  - URL 정규화(`normalize_url`) 및 SHA-256 해시 생성(`generate_url_hash`)을 통한 완벽한 중복 방지.
* **`app/services/clusterer.py`**:
  - N-gram Jaccard 유사도($\ge 0.85$) 기반 동일 이슈 기사 군집화 (`TopicCluster`) 및 대표 기사 선정.
* **`app/services/ai_summarizer.py`**:
  - Google Gemini API (`google-genai`) 기반 구조화된 3줄 요약, 태그 목록, 한 줄 핵심 추출 및 캐싱.
* **`app/services/pipeline.py`**:
  - 수집 ➔ 정규화 ➔ 중복방지 ➔ 본문추출 ➔ 정제 ➔ AI가공 ➔ DB저장 ➔ 군집화 전체 ETL 오케스트레이터.
* **`app/services/scheduler.py`**:
  - `APScheduler` 기반 주기적 백그라운드 수집 스케줄러.

### 🌐 API 라우터 (`app/api/v1/`)
* **`app/api/v1/sources.py`**: 피드 소스 CRUD REST API.
* **`app/api/v1/ingestion.py`**: 수집 파이프라인 수동 즉시 실행 트리거 API.
* **`app/api/v1/articles.py`**: 기사 목록, 상세, 검색 및 토픽 클러스터 조회 API.
* **`app/api/v1/auth.py`**: 회원가입 (`POST /api/v1/auth/register`), 로그인 (`POST /api/v1/auth/login`), 내 프로필 조회 (`GET /api/v1/auth/me`).
* **`app/api/v1/users.py`**: 북마크 추가/삭제/조회, 선호도 설정, 사용자 선호 기반 맞춤형 피드 조회 (`GET /api/v1/users/feed`).
* **`app/api/v1/__init__.py`**: 모든 v1 라우터를 `/api/v1` 프리픽스로 통합.

### 🚀 앱 진입점 및 설정 파일
* **`app/main.py`**:
  - FastAPI 앱 초기화, DB 테이블 자동 생성(`init_db()`), 기본 시드 소스 적재, 백그라운드 스케줄러 시작/종료 처리.
* **`requirements.txt`**: 프로젝트 패키지 의존성 목록.
* **`tests/`**:
  - `test_ingestion.py`: ETL 핵심 로직 단위 테스트.
  - `test_ai_summarizer.py`: AI 요약 서비스 검증 테스트.
  - `test_auth_and_users.py`: 회원가입, 로그인, 북마크, 선호도 및 맞춤형 피드 API 테스트.
