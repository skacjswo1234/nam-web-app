/**
 * 데이터베이스 유틸리티 함수들
 * 
 * 목적:
 * - D1 데이터베이스와의 상호작용을 캡슐화
 * - 데이터베이스 쿼리 로직을 재사용 가능한 함수로 분리
 * - 에러 처리 및 데이터 변환 로직 통합
 */

/**
 * 이메일 중복 체크
 * 
 * 목적:
 * - 회원가입 시 이미 가입된 이메일인지 확인
 * - 중복 가입 방지
 * 
 * @param {D1Database} db - D1 데이터베이스 인스턴스
 * @param {string} email - 확인할 이메일 주소
 * @returns {Promise<boolean>} - 이미 존재하면 true, 없으면 false
 */
export async function checkEmailExists(db, email) {
  try {
    // 이메일을 소문자로 변환하여 검색 (대소문자 구분 없이)
    const normalizedEmail = email.trim().toLowerCase();
    
    // users 테이블에서 해당 이메일을 가진 사용자 검색
    // LIMIT 1로 최적화 (하나만 찾으면 충분)
    const result = await db
      .prepare('SELECT id FROM users WHERE email = ? LIMIT 1')
      .bind(normalizedEmail)
      .first();
    
    // 결과가 있으면 true (이메일 존재), 없으면 false
    return !!result;
  } catch (error) {
    // 데이터베이스 오류 발생 시 로그 남기고 true 반환
    // (안전하게 처리하기 위해 존재한다고 가정)
    console.error('이메일 중복 체크 오류:', error);
    throw error;
  }
}

/**
 * 새 사용자 생성
 * 
 * 목적:
 * - 회원가입 시 사용자 정보를 데이터베이스에 저장
 * - 일반 회원가입 (이메일/비밀번호) 처리
 * 
 * @param {D1Database} db - D1 데이터베이스 인스턴스
 * @param {object} userData - 사용자 데이터
 * @param {string} userData.name - 사용자 이름
 * @param {string} userData.email - 이메일 주소
 * @param {string} userData.passwordHash - 해시된 비밀번호
 * @param {boolean} userData.marketingAgree - 마케팅 동의 여부
 * @returns {Promise<number>} - 생성된 사용자의 ID
 */
export async function createUser(db, userData) {
  try {
    const { name, email, passwordHash, marketingAgree } = userData;
    
    // 이메일을 소문자로 정규화
    const normalizedEmail = email.trim().toLowerCase();
    
    // users 테이블에 새 사용자 삽입
    // provider는 기본값 'email' (일반 회원가입)
    // email_verified는 기본값 0 (이메일 인증 전)
    // status는 기본값 'active' (활성 상태)
    const result = await db
      .prepare(`
        INSERT INTO users (
          email,
          password_hash,
          name,
          provider,
          marketing_agree,
          created_at,
          updated_at
        ) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `)
      .bind(
        normalizedEmail,
        passwordHash,
        name.trim(),
        'email', // 일반 회원가입
        marketingAgree ? 1 : 0 // SQLite는 BOOLEAN을 INTEGER로 저장
      )
      .run();
    
    // 생성된 사용자의 ID 반환
    // result.meta.last_row_id는 마지막으로 삽입된 행의 ID
    return result.meta.last_row_id;
  } catch (error) {
    // 데이터베이스 오류 처리
    console.error('사용자 생성 오류:', error);
    
    // UNIQUE 제약조건 위반 (이메일 중복) 체크
    if (error.message && error.message.includes('UNIQUE constraint failed')) {
      throw new Error('이미 가입된 이메일입니다.');
    }
    
    throw error;
  }
}

/**
 * 이메일로 사용자 조회
 * 
 * 목적:
 * - 로그인 시 이메일로 사용자 정보 조회
 * - 비밀번호 검증을 위한 사용자 데이터 가져오기
 * 
 * @param {D1Database} db - D1 데이터베이스 인스턴스
 * @param {string} email - 조회할 이메일 주소
 * @returns {Promise<object|null>} - 사용자 정보 또는 null
 */
export async function getUserByEmail(db, email) {
  try {
    const normalizedEmail = email.trim().toLowerCase();
    
    // 이메일로 사용자 검색
    // 비밀번호 해시도 함께 가져옴 (로그인 시 검증용)
    const user = await db
      .prepare(`
        SELECT 
          id,
          email,
          password_hash,
          name,
          provider,
          avatar_url,
          email_verified,
          status,
          created_at
        FROM users 
        WHERE email = ? 
        LIMIT 1
      `)
      .bind(normalizedEmail)
      .first();
    
    return user || null;
  } catch (error) {
    console.error('사용자 조회 오류:', error);
    throw error;
  }
}

/**
 * 사용자 ID로 사용자 조회
 * 
 * 목적:
 * - 세션에서 사용자 정보를 가져올 때 사용
 * - 프로필 조회 등에 활용
 * 
 * @param {D1Database} db - D1 데이터베이스 인스턴스
 * @param {number} userId - 사용자 ID
 * @returns {Promise<object|null>} - 사용자 정보 또는 null
 */
export async function getUserById(db, userId) {
  try {
    const user = await db
      .prepare(`
        SELECT 
          id,
          email,
          name,
          provider,
          avatar_url,
          email_verified,
          status,
          created_at,
          last_login_at
        FROM users 
        WHERE id = ? 
        LIMIT 1
      `)
      .bind(userId)
      .first();
    
    return user || null;
  } catch (error) {
    console.error('사용자 조회 오류:', error);
    throw error;
  }
}

/**
 * 마지막 로그인 시간 업데이트
 * 
 * 목적:
 * - 로그인 성공 시 마지막 로그인 시간 기록
 * - 사용자 활동 추적
 * 
 * @param {D1Database} db - D1 데이터베이스 인스턴스
 * @param {number} userId - 사용자 ID
 * @returns {Promise<void>}
 */
export async function updateLastLogin(db, userId) {
  try {
    await db
      .prepare('UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = ?')
      .bind(userId)
      .run();
  } catch (error) {
    console.error('마지막 로그인 시간 업데이트 오류:', error);
    // 로그인 시간 업데이트 실패는 치명적이지 않으므로 에러를 던지지 않음
  }
}

/**
 * 사용자 정보 업데이트
 * 
 * 목적:
 * - 프로필 수정 시 사용자 정보 업데이트
 * - 이름 등 개인정보 수정
 * 
 * @param {D1Database} db - D1 데이터베이스 인스턴스
 * @param {number} userId - 사용자 ID
 * @param {object} userData - 업데이트할 사용자 데이터
 * @param {string} userData.name - 사용자 이름 (선택사항)
 * @returns {Promise<void>}
 */
export async function updateUser(db, userId, userData) {
  try {
    const { name } = userData;
    const updates = [];
    const values = [];
    
    if (name !== undefined) {
      updates.push('name = ?');
      values.push(name.trim());
    }
    
    if (updates.length === 0) {
      throw new Error('업데이트할 데이터가 없습니다.');
    }
    
    // updated_at도 함께 업데이트
    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(userId);
    
    await db
      .prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`)
      .bind(...values)
      .run();
  } catch (error) {
    console.error('사용자 정보 업데이트 오류:', error);
    throw error;
  }
}

