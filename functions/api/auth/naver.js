/**
 * 네이버 소셜 로그인 시작 API 엔드포인트
 * 
 * 목적:
 * - 네이버 OAuth 인증 URL 생성
 * - 사용자를 네이버 로그인 페이지로 리디렉션
 * 
 * 요청 형식:
 * GET /api/auth/naver
 * 
 * 응답:
 * - 네이버 OAuth 인증 페이지로 리디렉션
 */

export async function onRequestGet(context) {
  const { request, env } = context;
  
  try {
    const clientId = env.NAVER_CLIENT_ID;
    const redirectUri = `${new URL(request.url).origin}/api/auth/naver/callback`;
    
    if (!clientId) {
      console.error('NAVER_CLIENT_ID 환경 변수가 설정되지 않았습니다.');
      return Response.json(
        { 
          success: false, 
          error: '네이버 로그인이 설정되지 않았습니다. 환경 변수 NAVER_CLIENT_ID를 확인해주세요.' 
        },
        { status: 500 }
      );
    }
    
    // CSRF 보호를 위한 state 생성
    const state = crypto.randomUUID();
    
    // 네이버 OAuth 인증 URL 생성
    const naverAuthUrl = new URL('https://nid.naver.com/oauth2.0/authorize');
    naverAuthUrl.searchParams.set('response_type', 'code');
    naverAuthUrl.searchParams.set('client_id', clientId);
    naverAuthUrl.searchParams.set('redirect_uri', redirectUri);
    naverAuthUrl.searchParams.set('state', state);
    
    // state를 쿠키에 저장 (CSRF 보호)
    // Response.redirect()는 immutable이므로 헤더를 포함한 새 Response 생성
    const response = new Response(null, {
      status: 302,
      headers: {
        'Location': naverAuthUrl.toString(),
        'Set-Cookie': `oauth_state=${state}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=600`
      }
    });
    
    return response;
  } catch (error) {
    console.error('네이버 로그인 시작 오류:', error);
    console.error('에러 상세:', error.message);
    console.error('스택:', error.stack);
    return Response.json(
      { 
        success: false, 
        error: '네이버 로그인 중 오류가 발생했습니다.',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

