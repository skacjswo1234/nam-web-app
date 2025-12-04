/**
 * 로그인 API 엔드포인트
 * 
 * 목적:
 * - 사용자가 이메일과 비밀번호로 로그인할 수 있도록 함
 * - 비밀번호 검증
 * - 세션 생성 및 쿠키 설정
 * - 마지막 로그인 시간 업데이트
 * 
 * 요청 형식:
 * POST /api/auth/login
 * Body: {
 *   email: string (이메일 주소),
 *   password: string (비밀번호),
 *   keepLogin: boolean (로그인 유지 여부, 선택사항)
 * }
 * 
 * 응답 형식:
 * 성공: { success: true, message: string, user: object }
 * 실패: { success: false, error: string }
 */

import { verifyPassword } from '../../utils/validation.js';
import { getUserByEmail, updateLastLogin } from '../../utils/db.js';
import { createSession } from '../../utils/session.js';

export async function onRequestPost(context) {
  const { request, env } = context;
  
  try {
    // 1. 요청 본문 파싱
    // 클라이언트에서 보낸 JSON 데이터를 JavaScript 객체로 변환
    const body = await request.json();
    const { email, password, keepLogin } = body;

    // 2. 필수 필드 검증
    // 이메일과 비밀번호가 모두 제공되었는지 확인
    if (!email || !password) {
      return Response.json(
        { success: false, error: '이메일과 비밀번호를 입력해주세요.' },
        { status: 400 }
      );
    }

    // 3. 이메일로 사용자 조회
    // 데이터베이스에서 해당 이메일을 가진 사용자 찾기
    const user = await getUserByEmail(env['nam-web-app-db'], email);

    // 4. 사용자 존재 여부 확인
    // 가입이 안 된 사용자는 로그인 불가
    if (!user) {
      // 가입되지 않은 사용자 - 회원가입/소셜 로그인 유도
      return Response.json(
        { 
          success: false, 
          error: '가입되지 않은 이메일입니다.',
          suggestSignup: true // 회원가입/소셜 로그인 유도 플래그
        },
        { status: 401 } // 401 Unauthorized: 인증 실패
      );
    }

    // 5. 소셜 로그인 사용자 확인
    // 비밀번호 해시가 없으면 소셜 로그인으로 가입한 사용자
    if (!user.password_hash) {
      // 소셜 로그인 사용자는 일반 로그인 불가
      const providerName = user.provider === 'google' ? '구글' : 
                           user.provider === 'kakao' ? '카카오' :
                           user.provider === 'naver' ? '네이버' :
                           user.provider === 'facebook' ? '페이스북' : '소셜';
      return Response.json(
        { 
          success: false, 
          error: `${providerName} 로그인으로 가입한 계정입니다. 소셜 로그인을 이용해주세요.`,
          isSocialLogin: true, // 소셜 로그인 사용자 플래그
          provider: user.provider // 소셜 로그인 제공자
        },
        { status: 403 } // 403 Forbidden: 접근 금지
      );
    }

    // 6. 계정 상태 확인
    // 비활성화되거나 정지된 계정은 로그인 불가
    if (user.status !== 'active') {
      return Response.json(
        { success: false, error: '로그인할 수 없는 계정입니다.' },
        { status: 403 } // 403 Forbidden: 접근 금지
      );
    }

    // 7. 비밀번호 검증
    // 입력한 평문 비밀번호와 저장된 해시 비교
    const isPasswordValid = await verifyPassword(password, user.password_hash);
    
    if (!isPasswordValid) {
      // 비밀번호가 틀렸을 때도 구체적인 메시지 대신 일반적인 메시지 반환
      return Response.json(
        { success: false, error: '이메일 또는 비밀번호가 올바르지 않습니다.' },
        { status: 401 }
      );
    }

    // 8. 세션 생성
    // 로그인 성공 시 세션 생성 (쿠키에 저장)
    // keepLogin이 true면 30일, false면 7일로 만료 시간 설정
    const expiresInDays = keepLogin ? 30 : 7;
    const sessionId = await createSession(env['nam-web-app-db'], user.id, expiresInDays);

    // 9. 마지막 로그인 시간 업데이트
    // 사용자의 마지막 로그인 시간을 현재 시간으로 업데이트
    await updateLastLogin(env['nam-web-app-db'], user.id);

    // 10. 성공 응답 생성
    // 세션 쿠키를 포함한 응답 생성
    const response = Response.json(
      {
        success: true,
        message: '로그인되었습니다.',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          avatar_url: user.avatar_url,
        },
      },
      { status: 200 }
    );

    // 11. 세션 쿠키 설정
    // HttpOnly: JavaScript에서 접근 불가 (XSS 공격 방지)
    // Secure: HTTPS에서만 전송 (프로덕션 환경)
    // SameSite=Lax: CSRF 공격 방지
    // Path=/: 모든 경로에서 쿠키 사용 가능
    const cookieOptions = [
      `session=${sessionId}`,
      'HttpOnly',
      'Secure',
      'SameSite=Lax',
      'Path=/',
      `Max-Age=${expiresInDays * 24 * 60 * 60}`, // 초 단위
    ].join('; ');

    response.headers.set('Set-Cookie', cookieOptions);

    return response;

  } catch (error) {
    // 12. 에러 처리
    // 예상치 못한 오류 발생 시 로그를 남기고 안전한 에러 메시지 반환
    console.error('로그인 오류:', error);
    return Response.json(
      { success: false, error: '로그인 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.' },
      { status: 500 }
    );
  }
}

