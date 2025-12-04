/**
 * 회원가입 API 엔드포인트
 * 
 * 목적:
 * - 사용자가 이메일과 비밀번호로 회원가입을 할 수 있도록 함
 * - 이메일 중복 체크
 * - 비밀번호 해싱 처리
 * - 마케팅 동의 여부 저장
 * - 데이터베이스에 사용자 정보 저장
 * 
 * 요청 형식:
 * POST /api/auth/signup
 * Body: {
 *   name: string (사용자 이름),
 *   email: string (이메일 주소),
 *   password: string (비밀번호, 8자 이상),
 *   passwordConfirm: string (비밀번호 확인),
 *   agreeTerms: boolean (필수 약관 동의),
 *   agreeMarketing: boolean (선택 마케팅 동의)
 * }
 * 
 * 응답 형식:
 * 성공: { success: true, message: string, userId: number }
 * 실패: { success: false, error: string }
 */

import { hashPassword, validateEmail, validatePassword } from '../../utils/validation.js';
import { checkEmailExists, createUser } from '../../utils/db.js';

export async function onRequestPost(context) {
  const { request, env } = context;
  
  try {
    // 1. 요청 본문 파싱
    // 클라이언트에서 보낸 JSON 데이터를 JavaScript 객체로 변환
    const body = await request.json();
    const { name, email, password, passwordConfirm, agreeTerms, agreeMarketing } = body;

    // 2. 필수 필드 검증
    // 모든 필수 정보가 제대로 전달되었는지 확인
    if (!name || !email || !password || !passwordConfirm) {
      return Response.json(
        { success: false, error: '모든 필드를 입력해주세요.' },
        { status: 400 }
      );
    }

    // 3. 약관 동의 확인
    // 서비스 이용약관 동의는 필수이므로 체크
    if (!agreeTerms) {
      return Response.json(
        { success: false, error: '서비스 이용약관에 동의해주세요.' },
        { status: 400 }
      );
    }

    // 4. 이름 길이 검증
    // 이름은 최소 2자 이상이어야 함
    if (name.trim().length < 2) {
      return Response.json(
        { success: false, error: '이름은 2자 이상 입력해주세요.' },
        { status: 400 }
      );
    }

    // 5. 이메일 형식 검증
    // 올바른 이메일 형식인지 확인 (예: user@example.com)
    if (!validateEmail(email)) {
      return Response.json(
        { success: false, error: '올바른 이메일 형식을 입력해주세요.' },
        { status: 400 }
      );
    }

    // 6. 비밀번호 유효성 검증
    // 비밀번호가 8자 이상이고, 강도 요구사항을 만족하는지 확인
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return Response.json(
        { success: false, error: passwordValidation.error },
        { status: 400 }
      );
    }

    // 7. 비밀번호 일치 확인
    // 비밀번호와 비밀번호 확인이 일치하는지 확인
    if (password !== passwordConfirm) {
      return Response.json(
        { success: false, error: '비밀번호가 일치하지 않습니다.' },
        { status: 400 }
      );
    }

    // 8. 이메일 중복 체크
    // 이미 가입된 이메일인지 데이터베이스에서 확인
    // 중복이면 회원가입을 막아야 함
    const emailExists = await checkEmailExists(env.DB, email);
    if (emailExists) {
      return Response.json(
        { success: false, error: '이미 가입된 이메일입니다.' },
        { status: 409 } // 409 Conflict: 리소스 충돌
      );
    }

    // 9. 비밀번호 해싱
    // 평문 비밀번호를 해시로 변환하여 저장
    // 보안상 비밀번호는 절대 평문으로 저장하면 안 됨
    const passwordHash = await hashPassword(password);

    // 10. 사용자 생성
    // 검증이 모두 통과하면 데이터베이스에 사용자 정보 저장
    const userId = await createUser(env.DB, {
      name: name.trim(),
      email: email.trim().toLowerCase(), // 이메일은 소문자로 통일
      passwordHash,
      marketingAgree: agreeMarketing || false,
    });

    // 11. 성공 응답 반환
    // 회원가입이 성공적으로 완료되었음을 클라이언트에 알림
    return Response.json(
      {
        success: true,
        message: '회원가입이 완료되었습니다.',
        userId: userId,
      },
      { status: 201 } // 201 Created: 리소스 생성 성공
    );

  } catch (error) {
    // 12. 에러 처리
    // 예상치 못한 오류 발생 시 로그를 남기고 안전한 에러 메시지 반환
    console.error('회원가입 오류:', error);
    return Response.json(
      { success: false, error: '회원가입 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.' },
      { status: 500 } // 500 Internal Server Error: 서버 오류
    );
  }
}

