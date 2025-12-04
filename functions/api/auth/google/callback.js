/**
 * 구글 소셜 로그인 콜백 API 엔드포인트
 * 
 * 목적:
 * - 구글 OAuth 콜백 처리
 * - 구글에서 사용자 정보 가져오기
 * - 사용자 생성 또는 조회
 * - 세션 생성 및 쿠키 설정
 * 
 * 요청 형식:
 * GET /api/auth/google/callback?code=xxx&state=xxx
 * 
 * 응답:
 * - 성공: 메인 페이지로 리디렉션 (세션 쿠키 포함)
 * - 실패: 로그인 페이지로 리디렉션 (에러 메시지 포함)
 */

import { createOrGetSocialUser } from '../../../utils/db.js';
import { createSession } from '../../../utils/session.js';

export async function onRequestGet(context) {
  const { request, env } = context;
  
  try {
    const clientId = env.GOOGLE_CLIENT_ID;
    const clientSecret = env.GOOGLE_CLIENT_SECRET;
    
    if (!clientId || !clientSecret) {
      return Response.redirect(`${new URL(request.url).origin}/index.html?error=구글 로그인이 설정되지 않았습니다.`, 302);
    }
    
    // 1. 쿼리 파라미터에서 code와 state 가져오기
    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const error = url.searchParams.get('error');
    
    // 2. 사용자가 구글 로그인을 취소한 경우
    if (error) {
      return Response.redirect(`${new URL(request.url).origin}/index.html?error=구글 로그인이 취소되었습니다.`, 302);
    }
    
    // 3. code가 없으면 에러
    if (!code) {
      return Response.redirect(`${new URL(request.url).origin}/index.html?error=인증 코드를 받지 못했습니다.`, 302);
    }
    
    // 4. CSRF 보호: state 검증
    const cookies = request.headers.get('Cookie') || '';
    const stateMatch = cookies.match(/oauth_state=([^;]+)/);
    const savedState = stateMatch ? stateMatch[1] : null;
    
    if (!state || state !== savedState) {
      return Response.redirect(`${new URL(request.url).origin}/index.html?error=보안 검증에 실패했습니다.`, 302);
    }
    
    // 5. 구글에서 액세스 토큰 받기
    const redirectUri = `${new URL(request.url).origin}/api/auth/google/callback`;
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code: code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });
    
    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error('구글 토큰 요청 실패:', errorData);
      return Response.redirect(`${new URL(request.url).origin}/index.html?error=구글 인증에 실패했습니다.`, 302);
    }
    
    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;
    
    // 6. 구글에서 사용자 정보 가져오기
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });
    
    if (!userInfoResponse.ok) {
      return Response.redirect(`${new URL(request.url).origin}/index.html?error=사용자 정보를 가져오지 못했습니다.`, 302);
    }
    
    const googleUser = await userInfoResponse.json();
    
    // 7. 사용자 생성 또는 조회
    const user = await createOrGetSocialUser(env['nam-web-app-db'], {
      provider: 'google',
      providerId: googleUser.id,
      email: googleUser.email,
      name: googleUser.name || googleUser.email.split('@')[0],
      avatarUrl: googleUser.picture || null,
    });
    
    // 8. 세션 생성
    const sessionId = await createSession(env['nam-web-app-db'], user.id, 30); // 30일
    
    // 9. 성공 응답 생성 및 리디렉션
    const response = Response.redirect(`${new URL(request.url).origin}/main.html`, 302);
    
    // 세션 쿠키 설정
    const cookieOptions = [
      `session=${sessionId}`,
      'HttpOnly',
      'Secure',
      'SameSite=Lax',
      'Path=/',
      `Max-Age=${30 * 24 * 60 * 60}`, // 30일
    ].join('; ');
    
    response.headers.set('Set-Cookie', cookieOptions);
    
    // oauth_state 쿠키 제거
    response.headers.append('Set-Cookie', 'oauth_state=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0');
    
    return response;
    
  } catch (error) {
    console.error('구글 로그인 콜백 오류:', error);
    return Response.redirect(`${new URL(request.url).origin}/index.html?error=로그인 중 오류가 발생했습니다.`, 302);
  }
}

