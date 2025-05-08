document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const forms = {
      login: document.getElementById('loginForm'),
      signup: document.getElementById('signupForm')
    };
  
    // Regular expressions for validation
    const validationPatterns = {
      email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      password: /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/,
      name: /^[a-zA-Z ]{2,30}$/
    };
  
    // Error messages
    const errorMessages = {
      required: 'This field is required',
      email: 'Please enter a valid email address',
      password: 'Password must be at least 8 characters with at least one letter and one number',
      name: 'Please enter a valid name (2-30 characters, letters only)',
      confirmPassword: 'Passwords do not match',
      terms: 'You must agree to the terms and conditions'
    };
  
    //////////////////////
    // Utility functions
    //////////////////////
  
    const showError = (element, message) => {
      element.classList.add('is-invalid');
      const errorElement = document.getElementById(`${element.id}Error`);
      if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
      }
    };
  
    const hideError = (element) => {
      element.classList.remove('is-invalid');
      const errorElement = document.getElementById(`${element.id}Error`);
      if (errorElement) {
        errorElement.textContent = '';
        errorElement.style.display = 'none';
      }
    };
  
    const validateField = (element, pattern) => {
      if (!element.value.trim()) {
        showError(element, errorMessages.required);
        return false;
      }
  
      if (pattern && !pattern.test(element.value)) {
        showError(element, errorMessages[pattern.name] || errorMessages.required);
        return false;
      }
  
      hideError(element);
      return true;
    };
  
    const setupFormValidation = (form, fields) => {
      if (!form) return;
  
      // Setup real-time validation for each field
      fields.forEach(field => {
        const element = document.getElementById(field.id);
        if (element) {
          element.addEventListener('input', () => {
            if (field.type === 'confirmPassword') {
              const password = document.getElementById('password') || 
                              document.getElementById('loginPassword');
              if (element.value !== password.value) {
                showError(element, errorMessages.confirmPassword);
              } else {
                hideError(element);
              }
            } else {
              validateField(element, validationPatterns[field.type]);
            }
          });
        }
      });
  
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        let isValid = true;
  
        // Validate all fields
        fields.forEach(field => {
          const element = document.getElementById(field.id);
          if (element) {
            if (field.type === 'confirmPassword') {
              const password = document.getElementById('password') || 
                              document.getElementById('loginPassword');
              if (element.value !== password.value) {
                showError(element, errorMessages.confirmPassword);
                isValid = false;
              }
            } else if (!validateField(element, validationPatterns[field.type])) {
              isValid = false;
            }
          }
        });
  
        // Special case for terms checkbox (signup only)
        if (form === forms.signup) {
          const termsCheckbox = document.getElementById('termsCheckbox');
          if (!termsCheckbox.checked) {
            const termsError = document.getElementById('termsError');
            termsError.textContent = errorMessages.terms;
            termsError.style.display = 'block';
            isValid = false;
          }
        }
  
        if (isValid) {
          handleFormSubmission(form);
        }
      });
    };
    async function attemptLogin(email, password, role) {
      try {
        const loginError = document.getElementById('loginError');
        const loginBtn = document.querySelector('#loginForm button[type="submit"]');

          const response = await fetch ('http://localhost:3000/auth/login' , {
              method: 'POST' , 
              headers: {
                  "Content-Type" : "application/json"
              },
              body: JSON.stringify({
                  email: email, 
                  password: password , 
                  type: role
              })
          });
          const data = await response.json();
          if(response.ok){
              localStorage.setItem('token' , data.token);
              localStorage.setItem('currentUser' , JSON.stringify({
                  id: data.user.id , 
                  name: data.user.name , 
                  email : data.user.email , 
                  role: data.user.role , 
                  isLoggedIn: true
              }));

              switch (role) {
                  case 'teacher':
                      window.location.href = 'teacher-veiw.html';
                      break;
                  case 'student':
                      window.location.href = 'dashboard.html';
                      break;
                  case 'admin':
                      window.location.href = 'dashboard.html'
                      break;

              }}else{
                  loginError.textContent = data.error || 'Login failed';
                  loginError.classList.remove('d-none');
                  loginBtn.disabled = false;
                  loginBtn.textContent = 'Login';
              }
          
      }catch (err) {
          console.error('Login request error:', err);
      loginError.textContent = 'Something went wrong. Please try again.';
      loginError.classList.remove('d-none');
      loginBtn.disabled = false;
      loginBtn.textContent = 'Login';
      }
  }
    const handleFormSubmission = (form) => {
      const submitButton = form.querySelector('button[type="submit"]');
      const defaultText = submitButton.dataset.defaultText || submitButton.textContent;
      
      // Show loading state
      submitButton.disabled = true;
      submitButton.innerHTML = `
        <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
        ${form === forms.login ? 'Logging in...' : 'Creating account...'}
      `;
  
      // Prepare form data
      const formData = {};
      const inputs = form.querySelectorAll('input');
      inputs.forEach(input => {
        if (input.type !== 'checkbox' && input.type !== 'radio') {
          formData[input.id] = input.value;
        } else if (input.checked) {
          formData[input.name || input.id] = input.value;
        }
      });
  
      console.log(`${form === forms.login ? 'Login' : 'Signup'} form data:`, formData);
      attemptLogin(formData.loginEmail , formData.loginPassword , 'teacher')
  
    };
  
    //////////////////////
    // Initialize forms
    //////////////////////
  
    // Login form configuration
    if (forms.login) {
      setupFormValidation(forms.login, [
        { id: 'loginEmail', type: 'email' },
        { id: 'loginPassword', type: 'password' }
      ]);
    }
  
    // Signup form configuration
    if (forms.signup) {
      setupFormValidation(forms.signup, [
        { id: 'name', type: 'name' },
        { id: 'email', type: 'email' },
        { id: 'password', type: 'password' },
        { id: 'confirmPassword', type: 'confirmPassword' }
      ]);
    }
  });