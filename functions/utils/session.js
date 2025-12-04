/**
 * 세션 관리 유틸리티 함수들
 * 
 * 목적:
 * - 사용자 세션 생성 및 관리
 * - 세션 검증
 * - 세션 삭제
 */

/**
 * 세션 생성
 * 
 * 목적:
 * - 로그인 성공 시 새로운 세션을 데이터베이스에 저장
 * - 세션 ID는 UUID로 생성하여 고유성 보장
 * - 만료 시간 설정
 * 
 * @param {D1Database} db - D1 데이터베이스 인스턴스
 * @param {number} userId - 사용자 ID
 * @param {number} expiresInDays - 만료 일수 (기본값: 7일)
 * @returns {Promise<string>} - 생성된 세션 ID (UUID)
 */
export async function createSession(db, userId, expiresInDays = 7) {
  try {
    // UUID 생성 (세션 ID 및 토큰)
    // crypto.randomUUID()는 Cloudflare Workers 환경에서 사용 가능
    const sessionId = crypto.randomUUID();
    const token = crypto.randomUUID(); // token 컬럼용 별도 UUID
    
    // 만료 시간 계산
    // 현재 시간에서 지정된 일수만큼 더한 시간
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);
    
    // 세션을 데이터베이스에 저장
    // 스키마에 token 컬럼이 필수이므로 함께 저장
    await db
      .prepare(
        'INSERT INTO sessions (id, user_id, token, expires_at, created_at) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)'
      )
      .bind(sessionId, userId, token, expiresAt.toISOString())
      .run();
    
    return sessionId;
  } catch (error) {
    console.error('세션 생성 오류:', error);
    throw error;
  }
}

/**
 * 세션 검증 및 사용자 정보 조회
 * 
 * 목적:
 * - 쿠키에서 세션 ID를 가져와 검증
 * - 세션이 유효한지 확인 (만료되지 않았는지)
 * - 세션에 연결된 사용자 정보 반환
 * 
 * @param {D1Database} db - D1 데이터베이스 인스턴스
 * @param {string} sessionId - 검증할 세션 ID
 * @returns {Promise<object|null>} - 사용자 정보 또는 null (세션이 유효하지 않으면)
 */
export async function verifySession(db, sessionId) {
  try {
    if (!sessionId) {
      return null;
    }
    
    // 세션 조회 및 만료 시간 확인
    // expires_at이 현재 시간보다 미래인 세션만 유효
    const session = await db
      .prepare(
        'SELECT * FROM sessions WHERE id = ? AND expires_at > datetime("now")'
      )
      .bind(sessionId)
      .first();
    
    if (!session) {
      return null;
    }
    
    // 세션에 연결된 사용자 정보 조회
    const user = await db
      .prepare(
        'SELECT id, email, name, provider, avatar_url, email_verified, status FROM users WHERE id = ?'
      )
      .bind(session.user_id)
      .first();
    
    if (!user || user.status !== 'active') {
      return null;
    }
    
    return user;
  } catch (error) {
    console.error('세션 검증 오류:', error);
    return null;
  }
}

/**
 * 세션 삭제
 * 
 * 목적:
 * - 로그아웃 시 세션을 데이터베이스에서 삭제
 * - 보안상 사용하지 않는 세션은 제거해야 함
 * 
 * @param {D1Database} db - D1 데이터베이스 인스턴스
 * @param {string} sessionId - 삭제할 세션 ID
 * @returns {Promise<void>}
 */
export async function deleteSession(db, sessionId) {
  try {
    await db
      .prepare('DELETE FROM sessions WHERE id = ?')
      .bind(sessionId)
      .run();
  } catch (error) {
    console.error('세션 삭제 오류:', error);
    // 세션 삭제 실패는 치명적이지 않으므로 에러를 던지지 않음
  }
}

/**
 * 사용자의 모든 세션 삭제
 * 
 * 목적:
 * - 비밀번호 변경 등 보안 이벤트 시 모든 기기에서 로그아웃
 * - 특정 사용자의 모든 세션을 한 번에 삭제
 * 
 * @param {D1Database} db - D1 데이터베이스 인스턴스
 * @param {number} userId - 사용자 ID
 * @returns {Promise<void>}
 */
export async function deleteAllUserSessions(db, userId) {
  try {
    await db
      .prepare('DELETE FROM sessions WHERE user_id = ?')
      .bind(userId)
      .run();
  } catch (error) {
    console.error('사용자 세션 삭제 오류:', error);
    throw error;
  }
}

