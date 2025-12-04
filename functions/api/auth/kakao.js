/**
 * 카카오 소셜 로그인 시작 API 엔드포인트
 * 
 * 목적:
 * - 카카오 OAuth 인증 URL 생성
 * - 사용자를 카카오 로그인 페이지로 리디렉션
 * 
 * 요청 형식:
 * GET /api/auth/kakao
 * 
 * 응답:
 * - 카카오 OAuth 인증 페이지로 리디렉션
 */

export async function onRequestGet(context) {
  const { request, env } = context;
  
  try {
    const clientId = env.KAKAO_CLIENT_ID;
    const redirectUri = `${new URL(request.url).origin}/api/auth/kakao/callback`;
    
    if (!clientId) {
      console.error('KAKAO_CLIENT_ID 환경 변수가 설정되지 않았습니다.');
      return Response.json(
        { 
          success: false, 
          error: '카카오 로그인이 설정되지 않았습니다. 환경 변수 KAKAO_CLIENT_ID를 확인해주세요.' 
        },
        { status: 500 }
      );
    }
    
    // CSRF 보호를 위한 state 생성
    const state = crypto.randomUUID();
    
    // 카카오 OAuth 인증 URL 생성
    const kakaoAuthUrl = new URL('https://kauth.kakao.com/oauth/authorize');
    kakaoAuthUrl.searchParams.set('client_id', clientId);
    kakaoAuthUrl.searchParams.set('redirect_uri', redirectUri);
    kakaoAuthUrl.searchParams.set('response_type', 'code');
    // 카카오 scope는 공백으로 구분 (URL 인코딩 시 자동으로 처리됨)
    kakaoAuthUrl.searchParams.set('scope', 'profile_nickname profile_image account_email');
    kakaoAuthUrl.searchParams.set('state', state);
    
    // 디버깅용 로그 (프로덕션에서는 제거 가능)
    console.log('카카오 로그인 URL:', kakaoAuthUrl.toString());
    console.log('Redirect URI:', redirectUri);
    
    // state를 쿠키에 저장 (CSRF 보호)
    // Response.redirect()는 immutable이므로 헤더를 포함한 새 Response 생성
    const response = new Response(null, {
      status: 302,
      headers: {
        'Location': kakaoAuthUrl.toString(),
        'Set-Cookie': `oauth_state=${state}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=600`
      }
    });
    
    return response;
  } catch (error) {
    console.error('카카오 로그인 시작 오류:', error);
    console.error('에러 상세:', error.message);
    console.error('스택:', error.stack);
    return Response.json(
      { 
        success: false, 
        error: '카카오 로그인 중 오류가 발생했습니다.',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

