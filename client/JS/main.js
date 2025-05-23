// Loading Indicator
const LoadingIndicator = {
    show: function() {
        document.getElementById('loadingIndicator').style.display = 'flex';
        document.body.style.overflow = 'hidden';
    },
    
    hide: function() {
        document.getElementById('loadingIndicator').style.display = 'none';
        document.body.style.overflow = '';
    },
};

// Making it globally available
window.LoadingIndicator = LoadingIndicator;

function showLoading(show, buttonId) {
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

function submitForm(form, endpoint) {
    const submitButton = form.querySelector('button[type="submit"]');
    const originalText = submitButton.textContent;
    
    showLoading(true, submitButton.id);
    
}

  
// Navbar Scroll Effect
document.addEventListener('DOMContentLoaded', function() {
    const navbar = document.querySelector('.navbar');
    window.addEventListener('scroll', function() {
        if (window.scrollY > 50) {
            navbar.classList.add('shadow');
        } else {
            navbar.classList.remove('shadow');
        }
    });

    // Team cards hover effect
    const teamCards = document.querySelectorAll('.team-card');
    if (teamCards.length > 0) {
        teamCards.forEach(card => {
            card.addEventListener('mousemove', function(e) {
                const cardRect = card.getBoundingClientRect();
                const x = e.clientX - cardRect.left; 
                const y = e.clientY - cardRect.top;
                
                const centerX = cardRect.width / 2;
                const centerY = cardRect.height / 2;
                
                const rotateY = (x - centerX) / 20;
                const rotateX = (centerY - y) / 20;
                
                const memberCard = card.querySelector('.team-member-card');
                memberCard.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
            });
            
            card.addEventListener('mouseleave', function() {
                const memberCard = card.querySelector('.team-member-card');
                memberCard.style.transform = 'perspective(1000px) rotateX(0) rotateY(0)';
            });
        });
    }
});