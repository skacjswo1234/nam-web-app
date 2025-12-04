/**
 * 프로필 페이지 JavaScript
 */

// 사용자 메뉴 토글
function toggleUserMenu() {
    const menu = document.getElementById('userMenu');
    const dropdown = document.getElementById('userDropdown');
    
    const isActive = menu.classList.contains('active');
    
    document.querySelectorAll('.user-menu').forEach(m => {
        m.classList.remove('active');
        m.querySelector('.user-dropdown').style.display = 'none';
    });
    
    if (!isActive) {
        menu.classList.add('active');
        dropdown.style.display = 'block';
    }
}

// 외부 클릭 시 메뉴 닫기
document.addEventListener('click', function(event) {
    const userMenu = document.getElementById('userMenu');
    if (!userMenu.contains(event.target)) {
        userMenu.classList.remove('active');
        document.getElementById('userDropdown').style.display = 'none';
    }
});

// 사용자 정보 로드
async function loadUserInfo() {
    try {
        const response = await fetch('/api/auth/me', {
            credentials: 'include'
        });
        
        let data;
        try {
            data = await response.json();
        } catch (jsonError) {
            console.error('응답 파싱 오류:', jsonError);
            showError('서버 응답을 처리하는 중 오류가 발생했습니다.');
            return;
        }
        
        if (!response.ok || !data.success) {
            window.location.href = '/index.html';
            return;
        }
        
        const user = data.user;
        
        // 폼에 사용자 정보 채우기
        document.getElementById('name').value = user.name || '';
        document.getElementById('email').value = user.email || '';
        
        // 헤더에 사용자 정보 표시
        const userNameElements = document.querySelectorAll('#userName');
        userNameElements.forEach(el => {
            el.textContent = user.name;
        });
        
        const userInitial = document.getElementById('userInitial');
        if (userInitial) {
            userInitial.textContent = user.name ? user.name.charAt(0).toUpperCase() : 'N';
        }
        
        // 가입일 및 마지막 로그인 표시 (추가 정보가 있다면)
        // 현재 API에서는 이 정보를 반환하지 않으므로 나중에 추가 가능
        
    } catch (error) {
        console.error('사용자 정보 로드 오류:', error);
        showError('사용자 정보를 불러오는 중 오류가 발생했습니다.');
    }
}

// 프로필 업데이트 처리
async function handleProfileUpdate(event) {
    event.preventDefault();
    
    const form = event.target;
    const name = form.querySelector('#name').value.trim();
    const saveBtn = form.querySelector('#saveBtn');
    
    // 유효성 검사
    if (!name || name.length < 2) {
        showError('이름은 2자 이상 입력해주세요.');
        return;
    }
    
    // 로딩 상태 표시
    saveBtn.disabled = true;
    saveBtn.textContent = '저장 중...';
    
    try {
        const response = await fetch('/api/auth/profile', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({
                name: name,
            }),
        });
        
        let data;
        try {
            data = await response.json();
        } catch (jsonError) {
            console.error('응답 파싱 오류:', jsonError);
            showError('서버 응답을 처리하는 중 오류가 발생했습니다.');
            saveBtn.disabled = false;
            saveBtn.textContent = '저장';
            return;
        }
        
        if (response.ok && data.success) {
            showSuccess('프로필이 성공적으로 업데이트되었습니다.');
            // 헤더의 사용자 이름도 업데이트
            const userNameElements = document.querySelectorAll('#userName');
            userNameElements.forEach(el => {
                el.textContent = name;
            });
            const userInitial = document.getElementById('userInitial');
            if (userInitial) {
                userInitial.textContent = name.charAt(0).toUpperCase();
            }
        } else {
            showError(data.error || '프로필 업데이트에 실패했습니다.');
        }
    } catch (error) {
        console.error('프로필 업데이트 오류:', error);
        showError('네트워크 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = '저장';
    }
}

// 로그아웃 처리
async function handleLogout() {
    try {
        await fetch('/api/auth/logout', {
            method: 'POST',
            credentials: 'include'
        });
        
        try {
            if (typeof localStorage !== 'undefined' && localStorage !== null) {
                localStorage.clear();
            }
        } catch (localStorageError) {
            console.warn('localStorage 접근 불가:', localStorageError);
        }
        
        try {
            if (typeof sessionStorage !== 'undefined' && sessionStorage !== null) {
                sessionStorage.clear();
            }
        } catch (sessionStorageError) {
            console.warn('sessionStorage 접근 불가:', sessionStorageError);
        }
        
        window.location.href = '/index.html';
    } catch (error) {
        console.error('로그아웃 오류:', error);
        window.location.href = '/index.html';
    }
}

// 에러 메시지 표시
function showError(message) {
    const errorEl = document.getElementById('error-message');
    const successEl = document.getElementById('success-message');
    
    if (errorEl) {
        errorEl.textContent = message;
        errorEl.style.display = 'block';
    }
    
    if (successEl) {
        successEl.style.display = 'none';
    }
    
    // 5초 후 자동으로 숨김
    setTimeout(() => {
        if (errorEl) {
            errorEl.style.display = 'none';
        }
    }, 5000);
}

// 성공 메시지 표시
function showSuccess(message) {
    const errorEl = document.getElementById('error-message');
    const successEl = document.getElementById('success-message');
    
    if (successEl) {
        successEl.textContent = message;
        successEl.style.display = 'block';
    }
    
    if (errorEl) {
        errorEl.style.display = 'none';
    }
    
    // 5초 후 자동으로 숨김
    setTimeout(() => {
        if (successEl) {
            successEl.style.display = 'none';
        }
    }, 5000);
}

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', function() {
    loadUserInfo();
});

