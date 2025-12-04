/**
 * 카카오 소셜 로그인 콜백 API 엔드포인트
 * 
 * 목적:
 * - 카카오 OAuth 콜백 처리
 * - 카카오에서 사용자 정보 가져오기
 * - 사용자 생성 또는 조회
 * - 세션 생성 및 쿠키 설정
 * 
 * 요청 형식:
 * GET /api/auth/kakao/callback?code=xxx&state=xxx
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
    const clientId = env.KAKAO_CLIENT_ID;
    const clientSecret = env.KAKAO_CLIENT_SECRET;
    
    if (!clientId || !clientSecret) {
      return Response.redirect(`${new URL(request.url).origin}/index.html?error=카카오 로그인이 설정되지 않았습니다.`, 302);
    }
    
    // 1. 쿼리 파라미터에서 code와 state 가져오기
    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const error = url.searchParams.get('error');
    const errorDescription = url.searchParams.get('error_description');
    
    // 2. 사용자가 카카오 로그인을 취소한 경우
    if (error) {
      return Response.redirect(`${new URL(request.url).origin}/index.html?error=카카오 로그인이 취소되었습니다.`, 302);
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
    
    // 5. 카카오에서 액세스 토큰 받기
    const redirectUri = `${new URL(request.url).origin}/api/auth/kakao/callback`;
    const tokenResponse = await fetch('https://kauth.kakao.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        code: code,
      }),
    });
    
    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error('카카오 토큰 요청 실패:', errorData);
      return Response.redirect(`${new URL(request.url).origin}/index.html?error=카카오 인증에 실패했습니다.`, 302);
    }
    
    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;
    
    if (!accessToken) {
      return Response.redirect(`${new URL(request.url).origin}/index.html?error=액세스 토큰을 받지 못했습니다.`, 302);
    }
    
    // 6. 카카오에서 사용자 정보 가져오기
    const userInfoResponse = await fetch('https://kapi.kakao.com/v2/user/me', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    
    if (!userInfoResponse.ok) {
      const errorData = await userInfoResponse.text();
      console.error('카카오 사용자 정보 요청 실패:', errorData);
      return Response.redirect(`${new URL(request.url).origin}/index.html?error=사용자 정보를 가져오지 못했습니다.`, 302);
    }
    
    const kakaoUserData = await userInfoResponse.json();
    
    // 카카오 응답 형식: { id: ..., kakao_account: { email: ..., profile: { nickname: ..., profile_image_url: ... } } }
    if (!kakaoUserData.id) {
      return Response.redirect(`${new URL(request.url).origin}/index.html?error=사용자 정보를 가져오지 못했습니다.`, 302);
    }
    
    // 카카오 사용자 정보 추출
    const kakaoId = String(kakaoUserData.id); // provider_id는 문자열로 저장
    const kakaoAccount = kakaoUserData.kakao_account || {};
    const profile = kakaoAccount.profile || {};
    
    // 이메일은 동의 여부에 따라 없을 수 있음
    const email = kakaoAccount.email || `${kakaoId}@kakao.temp`;
    const name = profile.nickname || kakaoAccount.name || `카카오사용자${kakaoId.slice(-4)}`;
    const avatarUrl = profile.profile_image_url || null;
    
    // 7. 사용자 생성 또는 조회
    const user = await createOrGetSocialUser(env['nam-web-app-db'], {
      provider: 'kakao',
      providerId: kakaoId,
      email: email,
      name: name,
      avatarUrl: avatarUrl,
    });
    
    // 8. 세션 생성
    const sessionId = await createSession(env['nam-web-app-db'], user.id, 30); // 30일
    
    // 9. 성공 응답 생성 및 리디렉션
    const redirectUrl = `${new URL(request.url).origin}/main.html`;
    const cookieOptions = [
      `session=${sessionId}`,
      'HttpOnly',
      'Secure',
      'SameSite=Lax',
      'Path=/',
      `Max-Age=${30 * 24 * 60 * 60}`, // 30일
    ].join('; ');
    
    // Headers 객체를 먼저 생성하여 여러 Set-Cookie 헤더 설정
    const headers = new Headers();
    headers.set('Location', redirectUrl);
    headers.set('Set-Cookie', cookieOptions);
    headers.append('Set-Cookie', 'oauth_state=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0');
    
    const response = new Response(null, {
      status: 302,
      headers: headers
    });
    
    return response;
    
  } catch (error) {
    console.error('카카오 로그인 콜백 오류:', error);
    return Response.redirect(`${new URL(request.url).origin}/index.html?error=로그인 중 오류가 발생했습니다.`, 302);
  }
}

