// 로그인 처리
function handleLogin(event) {
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
    
    // 로딩 상태
    loginBtn.classList.add('loading');
    loginBtn.disabled = true;
    
    // TODO: 백엔드 API 호출
    setTimeout(() => {
        console.log('로그인 시도:', { email, keepLogin });
        alert('로그인 기능은 백엔드 연동 후 구현됩니다.\n입력된 정보:\n이메일: ' + email);
        loginBtn.classList.remove('loading');
        loginBtn.disabled = false;
    }, 1000);
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

// 회원가입 처리
function handleSignup(event) {
    event.preventDefault();
    
    const form = event.target;
    const name = form.querySelector('#name').value.trim();
    const email = form.querySelector('#email').value.trim();
    const password = form.querySelector('#password').value;
    const passwordConfirm = form.querySelector('#passwordConfirm').value;
    const agreeTerms = form.querySelector('#agreeTerms').checked;
    const agreeMarketing = form.querySelector('#agreeMarketing').checked;
    const signupBtn = form.querySelector('.login-btn');
    
    // 유효성 검사
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
    
    // 로딩 상태
    signupBtn.classList.add('loading');
    signupBtn.disabled = true;
    
    // TODO: 백엔드 API 호출
    setTimeout(() => {
        console.log('회원가입 시도:', { name, email, agreeMarketing });
        alert('회원가입 기능은 백엔드 연동 후 구현됩니다.\n입력된 정보:\n이름: ' + name + '\n이메일: ' + email);
        signupBtn.classList.remove('loading');
        signupBtn.disabled = false;
    }, 1000);
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
});

