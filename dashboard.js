/**
 * 대시보드 JavaScript
 * 
 * 목적:
 * - 사용자 정보 표시
 * - 사용자 메뉴 토글
 * - 로그아웃 처리
 * - 사용자 데이터 로드
 */

// 사용자 메뉴 토글
function toggleUserMenu() {
    const menu = document.getElementById('userMenu');
    const dropdown = document.getElementById('userDropdown');
    
    // 다른 메뉴가 열려있으면 닫기
    const isActive = menu.classList.contains('active');
    
    // 모든 메뉴 닫기
    document.querySelectorAll('.user-menu').forEach(m => {
        m.classList.remove('active');
        m.querySelector('.user-dropdown').style.display = 'none';
    });
    
    // 클릭한 메뉴 토글
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
        // TODO: 백엔드 API에서 사용자 정보 가져오기
        // const response = await fetch('/api/auth/me', {
        //     credentials: 'include'
        // });
        // const user = await response.json();
        
        // 임시 데이터 (실제로는 API에서 가져옴)
        const user = {
            id: 1,
            name: '남현우',
            email: '9078807@naver.com',
            avatar_url: null
        };
        
        // 사용자 이름 표시
        const userNameElements = document.querySelectorAll('#userName, #heroUserName');
        userNameElements.forEach(el => {
            el.textContent = user.name;
        });
        
        // 사용자 아바타 초기 표시 (이름의 첫 글자)
        const userInitial = document.getElementById('userInitial');
        if (userInitial) {
            userInitial.textContent = user.name.charAt(0).toUpperCase();
        }
        
        // 아바타 이미지가 있으면 표시
        const userAvatar = document.querySelector('.user-avatar');
        if (user.avatar_url && userAvatar) {
            userAvatar.innerHTML = `<img src="${user.avatar_url}" alt="${user.name}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">`;
        }
        
    } catch (error) {
        console.error('사용자 정보 로드 오류:', error);
        // 에러 발생 시 로그인 페이지로 리다이렉트
        window.location.href = '/index.html';
    }
}

// 로그아웃 처리
async function handleLogout() {
    try {
        // TODO: 백엔드 API로 로그아웃 요청
        // await fetch('/api/auth/logout', {
        //     method: 'POST',
        //     credentials: 'include'
        // });
        
        // 세션 스토리지/로컬 스토리지 정리 (안전하게 처리)
        // 현재는 쿠키 기반 세션을 사용하므로 storage는 선택사항
        // 각 Storage 접근을 개별적으로 처리하여 하나가 실패해도 다른 것이 실행되도록 함
        try {
            if (typeof localStorage !== 'undefined' && localStorage !== null) {
                localStorage.clear();
            }
        } catch (localStorageError) {
            // localStorage 접근이 차단된 경우 무시 (쿠키 기반 세션이므로 문제없음)
            console.warn('localStorage 접근 불가:', localStorageError);
        }
        
        try {
            if (typeof sessionStorage !== 'undefined' && sessionStorage !== null) {
                sessionStorage.clear();
            }
        } catch (sessionStorageError) {
            // sessionStorage 접근이 차단된 경우 무시 (쿠키 기반 세션이므로 문제없음)
            console.warn('sessionStorage 접근 불가:', sessionStorageError);
        }
        
        // 로그인 페이지로 리다이렉트
        window.location.href = '/index.html';
    } catch (error) {
        console.error('로그아웃 오류:', error);
        // 에러가 발생해도 로그인 페이지로 이동
        window.location.href = '/index.html';
    }
}

// 프로젝트 시작하기
function startProject() {
    alert('프로젝트 시작 기능은 준비 중입니다.');
    // TODO: 프로젝트 생성 페이지로 이동
    // window.location.href = '/project/create.html';
}

// 가이드 보기
function viewTutorial() {
    alert('가이드 기능은 준비 중입니다.');
    // TODO: 튜토리얼 페이지로 이동
    // window.location.href = '/tutorial.html';
}

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', function() {
    // 사용자 정보 로드
    loadUserInfo();
    
    // 세션 확인 (로그인되지 않았으면 로그인 페이지로 리다이렉트)
    // TODO: 실제 세션 확인 로직 구현
    // 쿠키 기반 세션을 사용하므로 API로 세션 확인
    // try {
    //     const response = await fetch('/api/auth/me', {
    //         credentials: 'include'
    //     });
    //     if (!response.ok) {
    //         window.location.href = '/index.html';
    //     }
    // } catch (error) {
    //     window.location.href = '/index.html';
    // }
});

