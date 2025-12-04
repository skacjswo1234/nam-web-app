# NAM Web App

로그인/회원가입 기능을 갖춘 웹앱입니다.

## 기능

- 이메일/비밀번호 로그인
- 회원가입
- 소셜 로그인 (카카오톡, 네이버, 페이스북, 구글)
- 비밀번호 해싱 (PBKDF2)
- 이메일 중복 체크

## 프로젝트 구조

```
.
├── index.html              # 로그인 페이지
├── signup.html             # 회원가입 페이지
├── styles.css              # 공통 스타일시트
├── app.js                  # 클라이언트 사이드 JavaScript
├── schema.sql              # 데이터베이스 스키마
├── functions/              # Cloudflare Pages Functions
│   ├── api/
│   │   └── auth/
│   │       └── signup.js   # 회원가입 API 엔드포인트
│   └── utils/
│       ├── validation.js   # 유효성 검사 유틸리티
│       └── db.js           # 데이터베이스 유틸리티
└── wrangler.toml           # Cloudflare 설정
```

## 시작하기

### 1. D1 데이터베이스 생성

```bash
wrangler d1 create nam-db
```

생성된 `database_id`를 `wrangler.toml`에 입력하세요.

### 2. 데이터베이스 마이그레이션

```bash
# 로컬 개발용
npm run db:migrate:local

# 프로덕션용
npm run db:migrate
```

### 3. 개발 서버 실행

```bash
npm install
npm run dev
```

## API 엔드포인트

### POST /api/auth/signup

회원가입 API

**요청:**
```json
{
  "name": "홍길동",
  "email": "user@example.com",
  "password": "password123",
  "passwordConfirm": "password123",
  "agreeTerms": true,
  "agreeMarketing": false
}
```

**응답:**
```json
{
  "success": true,
  "message": "회원가입이 완료되었습니다.",
  "userId": 1
}
```

## 코드 리뷰

각 파일에는 상세한 주석이 포함되어 있습니다:
- 각 함수의 목적과 동작 방식 설명
- 매개변수와 반환값 설명
- 보안 고려사항 설명
- 에러 처리 방법 설명
