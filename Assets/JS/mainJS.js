// ====================
// Main Initialization
// ====================
document.addEventListener('DOMContentLoaded', function() {
    // Common functionality for all pages
    initNavbarEffects();
    initTooltips();
    initSmoothScroll();
    initAnimations();
    loadNavigation();
    displayWelcomeMessage(teacherName);

    // Page-specific initialization
    if (document.getElementById('quiz')) {
        initQuiz();
    } else if (document.getElementById('dashboard')) {
        initDashboard();
    } else if (document.getElementById('signupForm')) {
        initSignupForm();
    } else if (document.getElementById('loginForm')) {
        initLoginForm();
    }
});

// For consistent navigation
function loadNavigation() {
    if (!window.location.pathname.includes('auth/')) {
      const navHTML = `
        <nav class="navbar navbar-expand-lg fixed-top bg-white shadow-sm">
      <div class="container">
        <a class="navbar-brand gradient-text fw-bold" href="#">Quizzly</a>
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
          <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse" id="navbarNav">
          <ul class="navbar-nav me-auto">
            <li class="nav-item">
              <a class="nav-link" href="../../index.html">Home</a>
            </li>
            <li class="nav-item">
              <a class="nav-link" href="../../index.html">Features</a>
            </li>
            <li class="nav-item">
              <a class="nav-link" href="../../index.html">Get in Touch</a>
            </li>
          </ul>
          <div class="d-flex">
            <a href="../../Pages/auth/login.html" class="btn btn-link text-dark">Log in</a>
            <a href="../../Pages/auth/signup.html" class="btn gradient-button text-white ms-2">Sign up</a>
          </div>
        </div>
      </div>
    </nav>
      `;
      
      document.body.insertAdjacentHTML('afterbegin', navHTML);
      initNavbarEffects();
    }
  }

  
// =================
// Common Functions
// =================
function initNavbarEffects() {
    const navbar = document.querySelector('.navbar');
    if (!navbar) return;

    window.addEventListener('scroll', function() {
        navbar.classList.toggle('shadow', window.scrollY > 50);
    });
}

function initTooltips() {
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function(tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
}

function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;

            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                const navbarHeight = document.querySelector('.navbar')?.offsetHeight || 0;
                const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset - navbarHeight;

                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });

                // Closes mobile menu if open
                const navbarCollapse = document.querySelector('.navbar-collapse.show');
                if (navbarCollapse) {
                    document.querySelector('.navbar-toggler').click();
                }
            }
        });
    });
}

function initAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -100px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate__animated', 'animate__fadeInUp');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    document.querySelectorAll('.card, .feature-box').forEach(element => {
        observer.observe(element);
    });
}

// =========================
// Error Handling Functions
// =========================
function showError(input, message) {
    // Getting the form group parent
    const formGroup = input.closest('.mb-3') || input.closest('.mb-4');
    if (!formGroup) return;
    
    // Finding or creating error element
    let errorElement = formGroup.querySelector('.error-message');
    if (!errorElement) {
        errorElement = document.createElement('div');
        errorElement.className = 'error-message';
        formGroup.appendChild(errorElement);
    }
    
    // Set error message and display
    errorElement.textContent = message;
    errorElement.style.display = 'block';
    
    // Adding invalid class to input
    input.classList.add('is-invalid');
}

function clearError(input) {
    const formGroup = input.closest('.mb-3') || input.closest('.mb-4');
    if (!formGroup) return;
    
    const errorElement = formGroup.querySelector('.error-message');
    if (errorElement) {
        errorElement.style.display = 'none';
    }
    
    input.classList.remove('is-invalid');
}

// ==================
// Utility Functions
// ==================
function showError(input, message) {
    const errorElement = input.nextElementSibling?.classList.contains('error-message') 
        ? input.nextElementSibling 
        : document.createElement('small');
    
    errorElement.className = 'error-message text-danger';
    errorElement.textContent = message;
    errorElement.style.display = 'block';
    
    if (!input.nextElementSibling?.classList.contains('error-message')) {
        input.insertAdjacentElement('afterend', errorElement);
    }
    
    input.classList.add('is-invalid');
}

function clearError(input) {
    const errorElement = input.nextElementSibling;
    if (errorElement?.classList.contains('error-message')) {
        errorElement.style.display = 'none';
    }
    input.classList.remove('is-invalid');
}

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
    
    // Simulate API call
    setTimeout(() => {
        showLoading(false, submitButton.id);
        console.log(`Form would submit to ${endpoint}`);
        // In real app: form.submit() or fetch API call
    }, 1500);
}