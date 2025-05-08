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
    
    // Page-specific initialization
    // if (document.getElementById('quiz')) {
    //     initQuiz();
    // } else if (document.getElementById('dashboard')) {
    //     initDashboard();
    // } else if (document.getElementById('signupForm')) {
    //     initSignupForm();
    // } else if (document.getElementById('loginForm')) {
    //     initLoginForm();
    // }
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


// ==================
// Utility Functions
// ==================


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

// Utility Functions
function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
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
  
    // Initialize tooltips
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
      return new bootstrap.Tooltip(tooltipTriggerEl);
    });
  
    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const targetId = this.getAttribute('href');
        if (targetId === '#') return;
        
        const targetElement = document.querySelector(targetId);
        if (targetElement) {
          const navbarHeight = document.querySelector('.navbar').offsetHeight;
          const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset - navbarHeight;
          
          window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
          });
        }
      });
    });
  });
  
  // Quiz Functions
  let currentQuestion = 0;
  let timeLeft = 3600; // 60 minutes in seconds
  let selectedAnswers = {};
  let quizTimer;
  
  function initializeQuiz() {
    const quizElement = document.getElementById('quiz');
    if (!quizElement) return;
  
    updateQuestionDisplay();
    startTimer();
  
    // Add event listeners for navigation buttons
    document.getElementById('prevButton')?.addEventListener('click', previousQuestion);
    document.getElementById('nextButton')?.addEventListener('click', nextQuestion);
    document.getElementById('submitQuiz')?.addEventListener('click', submitQuiz);
  }
  
  function updateQuestionDisplay() {
    const questionElement = document.getElementById('currentQuestion');
    if (!questionElement) return;
  
    // Update question number and progress bar
    const progressBar = document.querySelector('.progress-bar');
    if (progressBar) {
      progressBar.style.width = `${((currentQuestion + 1) / totalQuestions) * 100}%`;
    }
  
    // Update question navigation bubbles
    updateQuestionBubbles();
  }
  
  function startTimer() {
    quizTimer = setInterval(() => {
      timeLeft--;
      const timerDisplay = document.getElementById('timer');
      if (timerDisplay) {
        timerDisplay.textContent = formatTime(timeLeft);
        if (timeLeft < 300) { // Less than 5 minutes
          timerDisplay.classList.add('text-danger');
        }
      }
      if (timeLeft <= 0) {
        clearInterval(quizTimer);
        submitQuiz();
      }
    }, 1000);
  }
  
  function selectAnswer(questionIndex, answerIndex) {
    selectedAnswers[questionIndex] = answerIndex;
    
    // Update UI to show selected answer
    document.querySelectorAll(`.question-${questionIndex} .quiz-option`).forEach((option, index) => {
      if (index === answerIndex) {
        option.classList.add('selected');
      } else {
        option.classList.remove('selected');
      }
    });
  }
  
  function submitQuiz() {
    clearInterval(quizTimer);
    // In a real app, this would submit to a server
    alert('Quiz submitted successfully!');
  }
  
  // Dashboard Functions
  function initializeDashboard() {
    const dashboardElement = document.getElementById('dashboard');
    if (!dashboardElement) return;
  
    // Add event listeners for dashboard tabs
    document.querySelectorAll('.dashboard-tab').forEach(tab => {
      tab.addEventListener('click', function() {
        const tabId = this.getAttribute('data-tab');
        switchDashboardTab(tabId);
      });
    });
  }
  
  function switchDashboardTab(tabId) {
    // Update active tab
    document.querySelectorAll('.dashboard-tab').forEach(tab => {
      if (tab.getAttribute('data-tab') === tabId) {
        tab.classList.add('active');
      } else {
        tab.classList.remove('active');
      }
    });
  
    // Show corresponding content
    document.querySelectorAll('.dashboard-content').forEach(content => {
      if (content.getAttribute('data-content') === tabId) {
        content.classList.remove('d-none');
      } else {
        content.classList.add('d-none');
      }
    });
  }
  
  // Initialize appropriate functionality based on page
  document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('quiz')) {
      initializeQuiz();
    } else if (document.getElementById('dashboard')) {
      initializeDashboard();
    }
  });