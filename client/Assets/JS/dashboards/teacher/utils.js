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