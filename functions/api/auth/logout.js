/**
 * 로그아웃 API 엔드포인트
 * 
 * 목적:
 * - 현재 세션을 데이터베이스에서 삭제
 * - 쿠키에서 세션 제거
 * - 로그아웃 처리
 * 
 * 요청 형식:
 * POST /api/auth/logout
 * Cookie: session=<sessionId>
 * 
 * 응답 형식:
 * 성공: { success: true, message: string }
 * 실패: { success: false, error: string }
 */

import { deleteSession } from '../../utils/session.js';

export async function onRequestPost(context) {
  const { request, env } = context;
  
  try {
    // 1. 쿠키에서 세션 ID 가져오기
    const cookies = request.headers.get('Cookie') || '';
    const sessionMatch = cookies.match(/session=([^;]+)/);
    const sessionId = sessionMatch ? sessionMatch[1] : null;

    // 2. 세션이 있으면 삭제
    if (sessionId) {
      await deleteSession(env['nam-web-app-db'], sessionId);
    }

    // 3. 성공 응답 생성
    const response = Response.json(
      {
        success: true,
        message: '로그아웃되었습니다.',
      },
      { status: 200 }
    );

    // 4. 세션 쿠키 제거
    // Max-Age=0으로 설정하여 브라우저에서 쿠키 삭제
    response.headers.set('Set-Cookie', 'session=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0');

    return response;

  } catch (error) {
    // 5. 에러 처리
    console.error('로그아웃 오류:', error);
    return Response.json(
      { success: false, error: '로그아웃 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

