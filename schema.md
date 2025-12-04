# 데이터베이스 스키마

## users 테이블

사용자 기본 정보를 저장하는 테이블입니다.

| 컬럼명 | 타입 | 설명 | 제약조건 |
|--------|------|------|----------|
| id | INTEGER | 사용자 고유 ID | PRIMARY KEY, AUTOINCREMENT |
| email | TEXT | 이메일 주소 | UNIQUE, NOT NULL |
| password_hash | TEXT | 비밀번호 해시 (bcrypt/argon2) | NOT NULL |
| name | TEXT | 사용자 이름 | NOT NULL |
| provider | TEXT | 로그인 제공자 | DEFAULT 'email' |
| provider_id | TEXT | 소셜 로그인 제공자의 사용자 ID | NULL |
| avatar_url | TEXT | 프로필 이미지 URL | NULL |
| marketing_agree | BOOLEAN | 마케팅 정보 수신 동의 | DEFAULT 0 |
| email_verified | BOOLEAN | 이메일 인증 여부 | DEFAULT 0 |
| status | TEXT | 계정 상태 | DEFAULT 'active' |
| created_at | DATETIME | 생성일시 | DEFAULT CURRENT_TIMESTAMP |
| updated_at | DATETIME | 수정일시 | DEFAULT CURRENT_TIMESTAMP |
| last_login_at | DATETIME | 마지막 로그인 일시 | NULL |

**인덱스:**
- `idx_email`: 이메일 검색 최적화
- `idx_provider`: 소셜 로그인 조회 최적화
- `idx_status`: 계정 상태 필터링 최적화
- `idx_created_at`: 생성일시 정렬 최적화

## sessions 테이블

사용자 세션 정보를 저장하는 테이블입니다.

| 컬럼명 | 타입 | 설명 | 제약조건 |
|--------|------|------|----------|
| id | TEXT | 세션 고유 ID (UUID) | PRIMARY KEY |
| user_id | INTEGER | 사용자 ID | FOREIGN KEY, NOT NULL |
| token | TEXT | 세션 토큰 (JWT 등) | UNIQUE, NOT NULL |
| expires_at | DATETIME | 만료 일시 | NOT NULL |
| ip_address | TEXT | 로그인 IP 주소 | NULL |
| user_agent | TEXT | 사용자 에이전트 | NULL |
| created_at | DATETIME | 생성일시 | DEFAULT CURRENT_TIMESTAMP |

**인덱스:**
- `idx_user_id`: 사용자별 세션 조회
- `idx_token`: 토큰 검증 최적화
- `idx_expires_at`: 만료된 세션 정리 최적화

## email_verifications 테이블

이메일 인증 토큰을 저장하는 테이블입니다.

| 컬럼명 | 타입 | 설명 | 제약조건 |
|--------|------|------|----------|
| id | INTEGER | 고유 ID | PRIMARY KEY, AUTOINCREMENT |
| user_id | INTEGER | 사용자 ID | FOREIGN KEY, NOT NULL |
| token | TEXT | 인증 토큰 | UNIQUE, NOT NULL |
| email | TEXT | 인증할 이메일 | NOT NULL |
| expires_at | DATETIME | 만료 일시 | NOT NULL |
| verified_at | DATETIME | 인증 완료 일시 | NULL |
| created_at | DATETIME | 생성일시 | DEFAULT CURRENT_TIMESTAMP |

## password_resets 테이블

비밀번호 재설정 토큰을 저장하는 테이블입니다.

| 컬럼명 | 타입 | 설명 | 제약조건 |
|--------|------|------|----------|
| id | INTEGER | 고유 ID | PRIMARY KEY, AUTOINCREMENT |
| user_id | INTEGER | 사용자 ID | FOREIGN KEY, NOT NULL |
| token | TEXT | 재설정 토큰 | UNIQUE, NOT NULL |
| expires_at | DATETIME | 만료 일시 | NOT NULL |
| used_at | DATETIME | 사용 일시 | NULL |
| created_at | DATETIME | 생성일시 | DEFAULT CURRENT_TIMESTAMP |

## login_history 테이블

로그인 이력을 저장하는 테이블입니다 (보안 및 분석용).

| 컬럼명 | 타입 | 설명 | 제약조건 |
|--------|------|------|----------|
| id | INTEGER | 고유 ID | PRIMARY KEY, AUTOINCREMENT |
| user_id | INTEGER | 사용자 ID | FOREIGN KEY, NOT NULL |
| ip_address | TEXT | 로그인 IP 주소 | NULL |
| user_agent | TEXT | 사용자 에이전트 | NULL |
| success | BOOLEAN | 로그인 성공 여부 | DEFAULT 1 |
| failure_reason | TEXT | 실패 사유 | NULL |
| created_at | DATETIME | 생성일시 | DEFAULT CURRENT_TIMESTAMP |

## 사용 예시

### 일반 회원가입
```sql
INSERT INTO users (email, password_hash, name, marketing_agree)
VALUES ('user@example.com', '$2b$10$...', '홍길동', 1);
```

### 소셜 로그인 회원가입
```sql
INSERT INTO users (email, name, provider, provider_id, avatar_url, email_verified)
VALUES ('user@gmail.com', '홍길동', 'google', '123456789', 'https://...', 1);
```

### 세션 생성
```sql
INSERT INTO sessions (id, user_id, token, expires_at, ip_address)
VALUES ('uuid-here', 1, 'jwt-token-here', datetime('now', '+7 days'), '192.168.1.1');
```

