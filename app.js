/**
 * 로그인 처리 함수
 * 
 * 목적:
 * - 로그인 폼 제출 시 클라이언트 측 유효성 검사 수행
 * - 백엔드 API로 로그인 요청 전송
 * - 성공 시 대시보드로 리다이렉트
 * - 실패 시 에러 메시지 표시
 */
async function handleLogin(event) {
    event.preventDefault();
    
    const form = event.target;
    const email = form.querySelector('#email').value;
    const password = form.querySelector('#password').value;
    const keepLogin = form.querySelector('#keepLogin').checked;
    const loginBtn = form.querySelector('.login-btn');
    
    // 유효성 검사
    if (!email || !password) {
        showError('이메일과 비밀번호를 입력해주세요.');
        return;
    }
    
    // 이메일 형식 검사
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showError('올바른 이메일 형식을 입력해주세요.');
        return;
    }
    
    // 로딩 상태 표시
    loginBtn.classList.add('loading');
    loginBtn.disabled = true;
    
    try {
        // 백엔드 API로 로그인 요청 전송
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({
                email,
                password,
                keepLogin,
            }),
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
            // 로그인 성공 시 대시보드로 리다이렉트
            window.location.href = '/dashboard.html';
        } else {
            // 로그인 실패 시 에러 메시지 표시
            showError(data.error || '로그인에 실패했습니다.');
            loginBtn.classList.remove('loading');
            loginBtn.disabled = false;
        }
    } catch (error) {
        console.error('로그인 오류:', error);
        showError('네트워크 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
        loginBtn.classList.remove('loading');
        loginBtn.disabled = false;
    }
}

// 소셜 로그인
function loginWithKakao() {
    console.log('카카오톡 로그인');
    alert('카카오톡 로그인 기능은 백엔드 연동 후 구현됩니다.');
}

function loginWithNaver() {
    console.log('네이버 로그인');
    alert('네이버 로그인 기능은 백엔드 연동 후 구현됩니다.');
}

function loginWithFacebook() {
    console.log('페이스북 로그인');
    alert('페이스북 로그인 기능은 백엔드 연동 후 구현됩니다.');
}

function loginWithGoogle() {
    console.log('구글 로그인');
    alert('구글 로그인 기능은 백엔드 연동 후 구현됩니다.');
}

// 에러 메시지 표시
function showError(message) {
    const errorEl = document.getElementById('error-message');
    if (errorEl) {
        errorEl.textContent = message;
        errorEl.style.display = 'block';
        errorEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        setTimeout(() => {
            errorEl.style.display = 'none';
        }, 5000);
    }
}

/**
 * 회원가입 처리 함수
 * 
 * 목적:
 * - 회원가입 폼 제출 시 클라이언트 측 유효성 검사 수행
 * - 백엔드 API로 회원가입 요청 전송
 * - 성공/실패 처리 및 사용자 피드백 제공
 */
async function handleSignup(event) {
    event.preventDefault();
    
    const form = event.target;
    const name = form.querySelector('#name').value.trim();
    const email = form.querySelector('#email').value.trim();
    const password = form.querySelector('#password').value;
    const passwordConfirm = form.querySelector('#passwordConfirm').value;
    const agreeTerms = form.querySelector('#agreeTerms').checked;
    const agreeMarketing = form.querySelector('#agreeMarketing').checked;
    const signupBtn = form.querySelector('.login-btn');
    
    // 1. 클라이언트 측 유효성 검사
    // 서버로 요청을 보내기 전에 기본적인 검증을 수행하여
    // 불필요한 네트워크 요청을 줄이고 사용자 경험 개선
    
    if (!name || !email || !password || !passwordConfirm) {
        showError('모든 필드를 입력해주세요.');
        return;
    }
    
    if (name.length < 2) {
        showError('이름은 2자 이상 입력해주세요.');
        return;
    }
    
    // 이메일 형식 검사
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showError('올바른 이메일 형식을 입력해주세요.');
        return;
    }
    
    // 비밀번호 길이 검사
    if (password.length < 8) {
        showError('비밀번호는 8자 이상 입력해주세요.');
        return;
    }
    
    // 비밀번호 일치 검사
    if (password !== passwordConfirm) {
        showError('비밀번호가 일치하지 않습니다.');
        return;
    }
    
    // 약관 동의 검사
    if (!agreeTerms) {
        showError('서비스 이용약관에 동의해주세요.');
        return;
    }
    
    // 2. 로딩 상태 표시
    // 버튼을 비활성화하고 로딩 애니메이션 표시
    signupBtn.classList.add('loading');
    signupBtn.disabled = true;
    
    try {
        // 3. 백엔드 API로 회원가입 요청 전송
        // POST 요청으로 사용자 정보를 서버에 전달
        const response = await fetch('/api/auth/signup', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name,
                email,
                password,
                passwordConfirm,
                agreeTerms,
                agreeMarketing,
            }),
        });
        
        // 4. 응답 처리
        const data = await response.json();
        
        if (response.ok && data.success) {
            // 5. 성공 처리
            // 회원가입 성공 시 로그인 페이지로 리다이렉트
            // 성공 메시지를 URL 파라미터로 전달하여 로그인 페이지에서 표시 가능
            window.location.href = '/index.html?signup=success';
        } else {
            // 6. 실패 처리
            // 서버에서 반환한 에러 메시지를 사용자에게 표시
            showError(data.error || '회원가입에 실패했습니다.');
            signupBtn.classList.remove('loading');
            signupBtn.disabled = false;
        }
    } catch (error) {
        // 7. 네트워크 오류 처리
        // 서버와 통신 중 오류 발생 시 처리
        console.error('회원가입 오류:', error);
        showError('네트워크 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
        signupBtn.classList.remove('loading');
        signupBtn.disabled = false;
    }
}

// 소셜 회원가입
function signupWithKakao() {
    console.log('카카오톡 회원가입');
    alert('카카오톡 회원가입 기능은 백엔드 연동 후 구현됩니다.');
}

function signupWithNaver() {
    console.log('네이버 회원가입');
    alert('네이버 회원가입 기능은 백엔드 연동 후 구현됩니다.');
}

function signupWithFacebook() {
    console.log('페이스북 회원가입');
    alert('페이스북 회원가입 기능은 백엔드 연동 후 구현됩니다.');
}

function signupWithGoogle() {
    console.log('구글 회원가입');
    alert('구글 회원가입 기능은 백엔드 연동 후 구현됩니다.');
}

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', function() {
    // 로그인 폼 자동완성 방지 (선택사항)
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.setAttribute('autocomplete', 'off');
    }
    
    // 회원가입 폼 자동완성 방지 (선택사항)
    const signupForm = document.getElementById('signupForm');
    if (signupForm) {
        signupForm.setAttribute('autocomplete', 'off');
    }
    
    // 비밀번호 확인 실시간 검증
    const passwordConfirm = document.getElementById('passwordConfirm');
    if (passwordConfirm) {
        passwordConfirm.addEventListener('input', function() {
            const password = document.getElementById('password').value;
            if (this.value && password !== this.value) {
                this.setCustomValidity('비밀번호가 일치하지 않습니다.');
            } else {
                this.setCustomValidity('');
            }
        });
    }
    
    // 회원가입 성공 메시지 표시
    // URL 파라미터에서 signup=success가 있으면 성공 메시지 표시
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('signup') === 'success') {
        // 성공 메시지를 에러 메시지 영역에 표시 (스타일 재사용)
        const errorEl = document.getElementById('error-message');
        if (errorEl) {
            errorEl.style.display = 'block';
            errorEl.style.background = '#f0fdf4';
            errorEl.style.borderColor = '#86efac';
            errorEl.style.color = '#166534';
            errorEl.textContent = '회원가입이 완료되었습니다. 로그인해주세요.';
            
            // 5초 후 자동으로 숨김
            setTimeout(() => {
                errorEl.style.display = 'none';
                // URL에서 파라미터 제거 (새로고침 시 메시지가 다시 나타나지 않도록)
                window.history.replaceState({}, document.title, window.location.pathname);
            }, 5000);
        }
    }
});

