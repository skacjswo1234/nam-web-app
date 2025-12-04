/**
 * 프로필 업데이트 API 엔드포인트
 * 
 * 목적:
 * - 사용자 프로필 정보 업데이트
 * - 이름 등 개인정보 수정
 * - 비밀번호 변경/설정
 * 
 * 요청 형식:
 * PUT /api/auth/profile
 * Cookie: session=<sessionId>
 * Body: {
 *   name: string (사용자 이름, 선택사항)
 *   currentPassword: string (비밀번호 변경 시 기존 비밀번호, 일반 회원가입 사용자만)
 *   newPassword: string (새 비밀번호, 선택사항)
 *   newPasswordConfirm: string (새 비밀번호 확인, 선택사항)
 * }
 * 
 * 응답 형식:
 * 성공: { success: true, message: string, user: object }
 * 실패: { success: false, error: string }
 */

import { verifySession } from '../../utils/session.js';
import { updateUser } from '../../utils/db.js';
import { hashPassword, verifyPassword, validatePassword } from '../../utils/validation.js';

export async function onRequestPut(context) {
  const { request, env } = context;
  
  try {
    // 1. 쿠키에서 세션 ID 가져오기
    const cookies = request.headers.get('Cookie') || '';
    const sessionMatch = cookies.match(/session=([^;]+)/);
    const sessionId = sessionMatch ? sessionMatch[1] : null;

    // 2. 세션이 없으면 인증 실패
    if (!sessionId) {
      return Response.json(
        { success: false, error: '로그인이 필요합니다.' },
        { status: 401 }
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

    // 5. 비밀번호 검증을 위해 전체 사용자 정보 조회 (password_hash 포함)
    const fullUser = await env['nam-web-app-db']
      .prepare('SELECT password_hash, provider FROM users WHERE id = ?')
      .bind(user.id)
      .first();

    // 6. 요청 본문 파싱
    const body = await request.json();
    const { name, currentPassword, newPassword, newPasswordConfirm } = body;

    // 7. 이름 유효성 검사
    if (name !== undefined) {
      if (!name || name.trim().length < 2) {
        return Response.json(
          { success: false, error: '이름은 2자 이상 입력해주세요.' },
          { status: 400 }
        );
      }
    }

    // 8. 비밀번호 변경/설정 처리
    let passwordHash = undefined;
    if (newPassword) {
      // 새 비밀번호와 확인이 일치하는지 확인
      if (newPassword !== newPasswordConfirm) {
        return Response.json(
          { success: false, error: '새 비밀번호가 일치하지 않습니다.' },
          { status: 400 }
        );
      }

      // 비밀번호 유효성 검사
      const passwordValidation = validatePassword(newPassword);
      if (!passwordValidation.valid) {
        return Response.json(
          { success: false, error: passwordValidation.error },
          { status: 400 }
        );
      }

      // 일반 회원가입 사용자(비밀번호가 있는 경우)는 기존 비밀번호 확인 필요
      if (fullUser.password_hash) {
        if (!currentPassword) {
          return Response.json(
            { success: false, error: '기존 비밀번호를 입력해주세요.' },
            { status: 400 }
          );
        }

        // 기존 비밀번호 검증
        const isPasswordValid = await verifyPassword(currentPassword, fullUser.password_hash);
        if (!isPasswordValid) {
          return Response.json(
            { success: false, error: '기존 비밀번호가 올바르지 않습니다.' },
            { status: 400 }
          );
        }
      }

      // 새 비밀번호 해싱
      passwordHash = await hashPassword(newPassword);
    }

    // 8. 사용자 정보 업데이트
    const updateData = {};
    if (name !== undefined) {
      updateData.name = name;
    }
    if (passwordHash !== undefined) {
      updateData.passwordHash = passwordHash;
    }

    if (Object.keys(updateData).length > 0) {
      await updateUser(env['nam-web-app-db'], user.id, updateData);
    }

    // 8. 업데이트된 사용자 정보 조회
    const updatedUser = await verifySession(env['nam-web-app-db'], sessionId);

    // 9. 성공 응답 반환
    return Response.json(
      {
        success: true,
        message: '프로필이 성공적으로 업데이트되었습니다.',
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          name: updatedUser.name,
          avatar_url: updatedUser.avatar_url,
          provider: updatedUser.provider,
          email_verified: updatedUser.email_verified,
        },
      },
      { status: 200 }
    );

  } catch (error) {
    // 10. 에러 처리
    console.error('프로필 업데이트 오류:', error);
    return Response.json(
      { success: false, error: '프로필 업데이트 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

