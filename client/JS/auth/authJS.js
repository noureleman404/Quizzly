document.addEventListener('DOMContentLoaded', () => {
  const forms = {
    login: document.getElementById('loginForm'),
    signup: document.getElementById('signupForm')
  };

  const patterns = {
    email: { regex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, error: 'email' },
    password: { regex: /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/, error: 'password' },
    name: { regex: /^[a-zA-Z ]{2,30}$/, error: 'name' }
  };

  const errorMessages = {
    required: 'This field is required',
    email: 'Please enter a valid email address',
    password: 'Password must be at least 8 characters with at least one letter and one number',
    name: 'Please enter a valid name (2-30 characters, letters only)',
    confirmPassword: 'Passwords do not match',
    terms: 'You must agree to the terms and conditions'
  };

  const showError = (el, message) => {
    el.classList.add('is-invalid');
    const err = document.getElementById(`${el.id}Error`);
    if (err) {
      err.textContent = message;
      err.style.display = 'block';
    }
  };

  const hideError = (el) => {
    el.classList.remove('is-invalid');
    const err = document.getElementById(`${el.id}Error`);
    if (err) {
      err.textContent = '';
      err.style.display = 'none';
    }
  };

  const isValidField = (el, type) => {
    const { regex, error } = patterns[type] || {};
    if (!el.value.trim()) {
      showError(el, errorMessages.required);
      return false;
    }
    if (regex && !regex.test(el.value)) {
      showError(el, errorMessages[error]);
      return false;
    }
    hideError(el);
    return true;
  };

  const collectFormData = (form) => {
    const data = {};
    form.querySelectorAll('input').forEach(input => {
      if ((input.type === 'checkbox' || input.type === 'radio') && !input.checked) return;
      data[input.name || input.id] = input.value;
    });
    return data;
  };

  const handleFormValidation = (form, fields) => {
    if (!form) return;

    fields.forEach(({ id, type }) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('input', () => {
        if (type === 'confirmPassword') {
          const pw = document.getElementById('password');
          el.value === pw.value ? hideError(el) : showError(el, errorMessages.confirmPassword);
        } else {
          isValidField(el, type);
        }
      });
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      let valid = true;

      fields.forEach(({ id, type }) => {
        const el = document.getElementById(id);
        if (!el) return;
        if (type === 'confirmPassword') {
          const pw = document.getElementById('password');
          if (el.value !== pw.value) {
            showError(el, errorMessages.confirmPassword);
            valid = false;
          } else {
            hideError(el);
          }
        } else {
          if (!isValidField(el, type)) valid = false;
        }
      });

      if (form === forms.signup) {
        const terms = document.getElementById('termsCheckbox');
        const err = document.getElementById('termsError');
        if (!terms.checked) {
          err.textContent = errorMessages.terms;
          err.style.display = 'block';
          valid = false;
        } else {
          err.textContent = '';
          err.style.display = 'none';
        }
      }

      if (valid) {
        await handleFormSubmission(form);
      }
    });
  };

  const handleFormSubmission = async (form) => {
    const submitBtn = form.querySelector('button[type="submit"]');
    const defaultText = submitBtn.dataset.defaultText || submitBtn.textContent;

    submitBtn.disabled = true;
    submitBtn.innerHTML = `
      <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
      ${form === forms.login ? 'Logging in...' : 'Creating account...'}
    `;

    const data = collectFormData(form);
    console.log(`${form === forms.login ? 'Login' : 'Signup'} data:`, data);

    if (form === forms.login) {
      await attemptLogin(data.loginEmail, data.loginPassword);
    }

    submitBtn.disabled = false;
    submitBtn.innerHTML = defaultText;
  };

  const attemptLogin = async (email, password) => {
    const errorEl = document.getElementById('loginError');
    const btn = document.querySelector('#loginForm button[type="submit"]');

    try {
      const res = await fetch('http://localhost:3000/auth/login', {
        method: 'POST',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      const result = await res.json();

      if (res.ok) {
        localStorage.setItem('token', result.token);
        localStorage.setItem('currentUser', JSON.stringify({
          id: result.user.id,
          name: result.user.name,
          email: result.user.email,
          role: result.user.type,
          isLoggedIn: true
        }));

        const redirectMap = {
          teacher: '../../Pages/teacher/teacherView.html',
          student: '../../Pages/student/studentView.html',
          admin: 'dashboard.html'
        };

        window.location.href = redirectMap[result.user.type] || '/';
      } else {
        errorEl.textContent = result.error || 'Login failed';
        errorEl.classList.remove('d-none');
        btn.disabled = false;
      }
    } catch (err) {
      console.error('Login error:', err);
      errorEl.textContent = 'Something went wrong. Please try again.';
      errorEl.classList.remove('d-none');
      btn.disabled = false;
    }
  };

  handleFormValidation(forms.login, [
    { id: 'loginEmail', type: 'email' },
    { id: 'loginPassword', type: 'password' }
  ]);

  handleFormValidation(forms.signup, [
    { id: 'name', type: 'name' },
    { id: 'email', type: 'email' },
    { id: 'password', type: 'password' },
    { id: 'confirmPassword', type: 'confirmPassword' }
  ]);
});
