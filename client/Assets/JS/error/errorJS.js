
    document.addEventListener('DOMContentLoaded', () => {
        // Extract error details from URL if available
        const urlParams = new URLSearchParams(window.location.search);
        const errorParam = urlParams.get('error');
        
        if (errorParam) {
            const errorDiv = document.getElementById('errorDetails');
            const errorText = errorDiv.querySelector('p');
            errorDiv.classList.remove('d-none');
            errorText.textContent = decodeURIComponent(errorParam);
        }
        
        // Setup countdown timer
        let countdown = 10;
        const countdownEl = document.getElementById('countdown');
        
        const timer = setInterval(() => {
            countdown--;
            countdownEl.textContent = countdown.toString();
            
            if (countdown <= 0) {
                clearInterval(timer);
                window.location.href = '../../index.html';
            }
        }, 1000);
    });
