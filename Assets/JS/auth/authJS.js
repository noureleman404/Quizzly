// =========================
// Authentication Functions
// =========================
function initSignupForm() {
    const signupForm = document.getElementById('signupForm');
    if (!signupForm) return;

    const elements = {
        name: document.getElementById('name'),
        email: document.getElementById('email'),
        password: document.getElementById('password'),
        confirmPassword: document.getElementById('confirmPassword'),
        role: document.querySelectorAll('input[name="role"]'),
        terms: document.getElementById('termsCheckbox')
    };

    // Real-time validation
    elements.name?.addEventListener('input', () => validateName(elements.name));
    elements.email?.addEventListener('input', () => validateEmail(elements.email));

    elements.password?.addEventListener('input', () => {
        validatePassword(elements.password);
        updatePasswordStrength(elements.password.value);
    });
    elements.confirmPassword?.addEventListener('input', () => 
        validateConfirmPassword(elements.password, elements.confirmPassword)
    );

    signupForm.addEventListener('submit', function(e) {
        e.preventDefault();

        const isNameValid = validateName(elements.name);
        const isEmailValid = validateEmail(elements.email);
        const isPasswordValid = validatePassword(elements.password);
        const isConfirmValid = validateConfirmPassword(elements.password, elements.confirmPassword);
        const isRoleValid = validateRole(elements.role);
        const isTermsValid = validateTerms(elements.terms);

        if (isNameValid && isEmailValid && isPasswordValid && isConfirmValid && isRoleValid && isTermsValid) {
            // Prepare data for submission
            const formData = {
                name: elements.name.value.trim(),
                email: elements.email.value.trim(),
                password: elements.password.value,
                role: document.querySelector('input[name="role"]:checked').value,
                terms: elements.terms.checked
            };
            
            console.log('Form data ready for API:', formData);
            // submitForm(signupForm, '/api/signup', formData);
        }
    });
}


function initLoginForm() {
    const loginForm = document.getElementById('loginForm');
    if (!loginForm) return;

    const elements = {
        email: document.getElementById('loginEmail'),
        password: document.getElementById('loginPassword'),
        remember: document.getElementById('rememberMe'),
        button: document.getElementById('loginButtonText'),
        spinner: document.getElementById('loginSpinner')
    };

    // Real-time validation
    elements.email?.addEventListener('input', function() {
        validateEmail(this);
    });

    elements.password?.addEventListener('input', function() {
        validateLoginPassword(this);
    });

    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();

        const isEmailValid = validateEmail(elements.email);
        const isPasswordValid = validateLoginPassword(elements.password);

        if (isEmailValid && isPasswordValid) {
            // Shows loading state
            elements.button.textContent = 'Logging in...';
            elements.spinner.classList.remove('d-none');
            
            // Preparing data for submission
            const formData = {
                email: elements.email.value.trim(),
                password: elements.password.value,
                remember: elements.remember.checked
            };
            
            console.log('Login data ready for API:', formData);
            // submitForm(loginForm, '/api/login', formData);
            
        }
    });
}

function showGeneralError(message) {
    const errorElement = document.createElement('div');
    errorElement.className = 'alert alert-danger mt-3';
    errorElement.textContent = message;
    
    const form = document.getElementById('loginForm');
    const submitButton = form.querySelector('button[type="submit"]');
    form.insertBefore(errorElement, submitButton.nextSibling);
    
    // Removing errors after 5 seconds
    setTimeout(() => {
        errorElement.remove();
    }, 5000);
}

// ======================
// Validation Functions
// ======================

function validateName(input) {
    const value = input.value.trim();
    const regex = /^[a-zA-Z\s'-]+$/;
    
    if (!value) {
        showError(input, 'Full name is required');
        return false;
    } else if (!regex.test(value)) {
        showError(input, 'Please enter a valid name');
        return false;
    } else {
        clearError(input);
        return true;
    }
}


function validateEmail(input) {
    const value = input.value.trim();
    const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    
    if (!value) {
        showError(input, 'Email is required');
        return false;
    } else if (!regex.test(value)) {
        showError(input, 'Please enter a valid email');
        return false;
    } else {
        clearError(input);
        return true;
    }
}

function validatePassword(input) {
    const value = input.value;
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    
    if (!value) {
        showError(input, 'Password is required');
        return false;
    } else if (value.length < 8) {
        showError(input, 'Minimum 8 characters');
        return false;
    } else if (!regex.test(value)) {
        showError(input, 'Requires uppercase, lowercase, number, and special character');
        return false;
    } else {
        clearError(input);
        updatePasswordStrength(value);
        return true;
    }
}

function validateLoginPassword(input) {
    const value = input.value;
    
    if (!value) {
        showError(input, 'Password is required');
        return false;
    } else {
        clearError(input);
        return true;
    }
}

function validateConfirmPassword(passwordInput, confirmInput) {
    const password = passwordInput.value;
    const confirm = confirmInput.value;
    
    if (!confirm) {
        showError(confirmInput, 'Please confirm your password');
        return false;
    } else if (password !== confirm) {
        showError(confirmInput, 'Passwords do not match');
        return false;
    } else {
        clearError(confirmInput);
        return true;
    }
}

function validateRole(inputs) {
    const selected = Array.from(inputs).some(radio => radio.checked);
    const errorElement = document.getElementById('roleError');
    
    if (!selected) {
        if (errorElement) {
            errorElement.textContent = 'Please select your role';
            errorElement.style.display = 'block';
        }
        return false;
    } else {
        if (errorElement) errorElement.style.display = 'none';
        return true;
    }
}

function validateTerms(checkbox) {
    const errorElement = document.getElementById('termsError');
    
    if (!checkbox.checked) {
        if (errorElement) {
            errorElement.textContent = 'You must accept the terms';
            errorElement.style.display = 'block';
        }
        return false;
    } else {
        if (errorElement) errorElement.style.display = 'none';
        return true;
    }
}
