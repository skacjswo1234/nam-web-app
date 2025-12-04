/**
 * 현재 로그인한 사용자 정보 조회 API 엔드포인트
 * 
 * 목적:
 * - 쿠키에서 세션 ID를 가져와 검증
 * - 세션이 유효한지 확인
 * - 현재 로그인한 사용자 정보 반환
 * 
 * 요청 형식:
 * GET /api/auth/me
 * Cookie: session=<sessionId>
 * 
 * 응답 형식:
 * 성공: { success: true, user: object }
 * 실패: { success: false, error: string }
 */

import { verifySession } from '../../utils/session.js';

export async function onRequestGet(context) {
  const { request, env } = context;
  
  try {
    // 1. 쿠키에서 세션 ID 가져오기
    // 쿠키 문자열을 파싱하여 session 쿠키 값 추출
    const cookies = request.headers.get('Cookie') || '';
    const sessionMatch = cookies.match(/session=([^;]+)/);
    const sessionId = sessionMatch ? sessionMatch[1] : null;

    // 2. 세션이 없으면 인증 실패
    if (!sessionId) {
      return Response.json(
        { success: false, error: '로그인이 필요합니다.' },
        { status: 401 } // 401 Unauthorized: 인증 필요
      );
    }

    // 3. 세션 검증 및 사용자 정보 조회
    const user = await verifySession(env['nam-web-app-db'], sessionId);

    // 4. 세션이 유효하지 않으면 인증 실패
    if (!user) {
      return Response.json(
        { success: false, error: '세션이 만료되었거나 유효하지 않습니다.' },
        { status: 401 }
      );
    }

    // 5. 성공 응답 반환
    // 비밀번호 해시 등 민감한 정보는 제외하고 반환
    return Response.json(
      {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          avatar_url: user.avatar_url,
          provider: user.provider,
          email_verified: user.email_verified,
        },
      },
      { status: 200 }
    );

  } catch (error) {
    // 6. 에러 처리
    console.error('사용자 정보 조회 오류:', error);
    return Response.json(
      { success: false, error: '사용자 정보를 가져오는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

