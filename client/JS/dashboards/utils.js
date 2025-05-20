export function switchToTab(tabId) {
    // Update active tab
    document.querySelectorAll('.dashboard-tab').forEach(tab => {
        tab.classList.toggle('active', tab.getAttribute('data-tab') === tabId);
    });

    // Show corresponding content
    document.querySelectorAll('.dashboard-content').forEach(content => {
        content.classList.toggle('d-none', content.getAttribute('data-content') !== tabId);
    });
}

export function generateClassCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    return Array.from({length: 6}, () => 
        chars[Math.floor(Math.random() * chars.length)]
    ).join('');
}

export function handleLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
    window.location.href = '../index.html';
}
export function showGlobalLoading(show) {
    const loader = document.getElementById('global-loading');
    if (!loader) return;
    loader.style.display = show ? 'flex' : 'none';
  }
export function showLoading(show, buttonId) {
    const button = document.getElementById(buttonId);
    if (!button) return;
    
    if (show) {
        button.disabled = true;
        button.innerHTML = `
            <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
            ${button.textContent}
        `;
    } else {
        button.disabled = false;
        button.textContent = button.dataset.originalText || button.textContent;
    }
}