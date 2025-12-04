/**
 * 구글 소셜 로그인 시작 API 엔드포인트
 * 
 * 목적:
 * - 구글 OAuth 인증 URL 생성
 * - 사용자를 구글 로그인 페이지로 리디렉션
 * 
 * 요청 형식:
 * GET /api/auth/google
 * 
 * 응답:
 * - 구글 OAuth 인증 페이지로 리디렉션
 */

export async function onRequestGet(context) {
  const { request, env } = context;
  
  try {
    const clientId = env.GOOGLE_CLIENT_ID;
    const redirectUri = `${new URL(request.url).origin}/api/auth/google/callback`;
    
    if (!clientId) {
      return Response.json(
        { success: false, error: '구글 로그인이 설정되지 않았습니다.' },
        { status: 500 }
      );
    }
    
    // CSRF 보호를 위한 state 생성
    const state = crypto.randomUUID();
    
    // 구글 OAuth 인증 URL 생성
    const googleAuthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    googleAuthUrl.searchParams.set('client_id', clientId);
    googleAuthUrl.searchParams.set('redirect_uri', redirectUri);
    googleAuthUrl.searchParams.set('response_type', 'code');
    googleAuthUrl.searchParams.set('scope', 'openid email profile');
    googleAuthUrl.searchParams.set('access_type', 'offline');
    googleAuthUrl.searchParams.set('prompt', 'select_account');
    googleAuthUrl.searchParams.set('state', state);
    
    // state를 쿠키에 저장 (CSRF 보호)
    const response = Response.redirect(googleAuthUrl.toString(), 302);
    response.headers.set('Set-Cookie', `oauth_state=${state}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=600`);
    
    return response;
  } catch (error) {
    console.error('구글 로그인 시작 오류:', error);
    return Response.json(
      { success: false, error: '구글 로그인 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

