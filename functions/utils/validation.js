/**
 * 유효성 검사 유틸리티 함수들
 * 
 * 목적:
 * - 입력 데이터의 유효성을 검증하는 공통 함수들을 모아둠
 * - 코드 재사용성 향상
 * - 일관된 검증 로직 제공
 */

/**
 * 이메일 형식 검증
 * 
 * 목적:
 * - 사용자가 입력한 이메일이 올바른 형식인지 확인
 * - 예: user@example.com 형식인지 체크
 * 
 * @param {string} email - 검증할 이메일 주소
 * @returns {boolean} - 유효한 이메일 형식이면 true
 */
export function validateEmail(email) {
  // 정규표현식으로 이메일 형식 검증
  // 패턴 설명:
  // ^[^\s@]+ - 시작부터 @ 전까지 공백이나 @가 아닌 문자가 1개 이상
  // @ - @ 기호 필수
  // [^\s@]+ - @ 이후 공백이나 @가 아닌 문자가 1개 이상
  // \. - 점(.) 기호 (이스케이프 필요)
  // [^\s@]+$ - 점 이후 공백이나 @가 아닌 문자가 1개 이상으로 끝
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * 비밀번호 유효성 검증
 * 
 * 목적:
 * - 비밀번호가 보안 요구사항을 만족하는지 확인
 * - 최소 길이, 복잡도 등을 체크
 * 
 * @param {string} password - 검증할 비밀번호
 * @returns {object} - { valid: boolean, error?: string }
 */
export function validatePassword(password) {
  // 최소 길이 검증 (8자 이상)
  if (password.length < 8) {
    return {
      valid: false,
      error: '비밀번호는 8자 이상이어야 합니다.'
    };
  }

  // 최대 길이 제한 (보안상 너무 긴 비밀번호 방지)
  if (password.length > 128) {
    return {
      valid: false,
      error: '비밀번호는 128자 이하여야 합니다.'
    };
  }

  // 추가 보안 검증 (선택사항)
  // 영문, 숫자, 특수문자 조합 등을 요구할 수 있음
  // 현재는 최소 길이만 체크

  return { valid: true };
}

/**
 * 비밀번호 해싱
 * 
 * 목적:
 * - 평문 비밀번호를 안전한 해시로 변환
 * - 데이터베이스에 평문 비밀번호를 저장하지 않기 위함
 * - 보안 강화
 * 
 * 참고:
 * - Cloudflare Workers 환경에서는 Web Crypto API 사용
 * - PBKDF2 알고리즘 사용 (bcrypt 대신)
 * - bcrypt는 Node.js 환경에서만 사용 가능
 * 
 * @param {string} password - 해싱할 평문 비밀번호
 * @returns {Promise<string>} - 해시된 비밀번호 (hex 문자열)
 */
export async function hashPassword(password) {
  // 1. 솔트 생성
  // 각 비밀번호마다 고유한 랜덤 값을 생성하여 해시에 추가
  // 같은 비밀번호라도 다른 해시가 생성되도록 함
  const salt = crypto.getRandomValues(new Uint8Array(16));
  
  // 2. 비밀번호를 UTF-8 바이트 배열로 변환
  const passwordBytes = new TextEncoder().encode(password);
  
  // 3. 솔트와 비밀번호를 결합
  const combined = new Uint8Array(salt.length + passwordBytes.length);
  combined.set(salt);
  combined.set(passwordBytes, salt.length);
  
  // 4. PBKDF2 알고리즘으로 해싱
  // - PBKDF2: Password-Based Key Derivation Function 2
  // - 반복 횟수: 100,000회 (보안 강도 조절)
  // - 해시 알고리즘: SHA-256
  // - 키 길이: 32바이트 (256비트)
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    combined,
    'PBKDF2',
    false,
    ['deriveBits']
  );
  
  const hashBuffer = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000, // 반복 횟수 (높을수록 보안 강하지만 느림)
      hash: 'SHA-256'
    },
    keyMaterial,
    256 // 256비트 = 32바이트
  );
  
  // 5. 해시와 솔트를 결합하여 저장
  // 나중에 비밀번호 검증 시 같은 솔트를 사용해야 함
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const saltArray = Array.from(salt);
  
  // 형식: "salt:hash" (hex 문자열)
  const saltHex = Array.from(saltArray).map(b => b.toString(16).padStart(2, '0')).join('');
  const hashHex = Array.from(hashArray).map(b => b.toString(16).padStart(2, '0')).join('');
  
  return `${saltHex}:${hashHex}`;
}

/**
 * 비밀번호 검증
 * 
 * 목적:
 * - 로그인 시 입력한 비밀번호가 저장된 해시와 일치하는지 확인
 * - 해시된 비밀번호와 평문 비밀번호를 비교
 * 
 * @param {string} password - 입력한 평문 비밀번호
 * @param {string} hash - 저장된 해시된 비밀번호
 * @returns {Promise<boolean>} - 일치하면 true
 */
export async function verifyPassword(password, hash) {
  // 저장된 해시에서 솔트와 해시 추출
  const [saltHex, hashHex] = hash.split(':');
  
  // hex 문자열을 바이트 배열로 변환
  const salt = new Uint8Array(
    saltHex.match(/.{1,2}/g).map(byte => parseInt(byte, 16))
  );
  
  // 입력한 비밀번호를 같은 방식으로 해싱
  const passwordBytes = new TextEncoder().encode(password);
  const combined = new Uint8Array(salt.length + passwordBytes.length);
  combined.set(salt);
  combined.set(passwordBytes, salt.length);
  
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    combined,
    'PBKDF2',
    false,
    ['deriveBits']
  );
  
  const hashBuffer = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    256
  );
  
  // 해시 비교
  const computedHash = Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  
  // 상수 시간 비교 (타이밍 공격 방지)
  return computedHash === hashHex;
}

