-- 마이그레이션: password_hash를 NULL 허용으로 변경
-- SQLite는 ALTER TABLE MODIFY를 지원하지 않으므로 테이블 재생성이 필요합니다.

-- 1. 새 테이블 생성 (password_hash를 NULL 허용)
CREATE TABLE IF NOT EXISTS users_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NULL,  -- NULL 허용으로 변경
    name TEXT NOT NULL,
    provider TEXT DEFAULT 'email',
    provider_id TEXT,
    avatar_url TEXT,
    marketing_agree BOOLEAN DEFAULT 0,
    email_verified BOOLEAN DEFAULT 0,
    status TEXT DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_login_at DATETIME
);

-- 2. 기존 데이터 복사
INSERT INTO users_new 
SELECT * FROM users;

-- 3. 기존 테이블 삭제
DROP TABLE users;

-- 4. 새 테이블 이름 변경
ALTER TABLE users_new RENAME TO users;

-- 5. 인덱스 재생성
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_provider ON users(provider, provider_id);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

