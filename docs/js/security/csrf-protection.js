/**
 * CSRF Protection Module
 * Properties 4 Creations
 */

// CSRF Protection for Forms
export class CSRFProtection {
  constructor () {
    this.tokenName = 'csrf_token';
    this.token = null;
    this.init();
  }

  // Generate CSRF token
  generateToken () {
    if (window.crypto && window.crypto.randomUUID) {
      this.token = window.crypto.randomUUID();
    } else {
      // Fallback for older browsers
      this.token =
        'csrf_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
    }

    // Store in session storage
    sessionStorage.setItem(this.tokenName, this.token);
    return this.token;
  }

  // Get existing token or generate new one
  init () {
    this.token = sessionStorage.getItem(this.tokenName);
    if (!this.token) {
      this.generateToken();
    }
  }

  // Validate CSRF token
  validateToken (submittedToken) {
    const storedToken = sessionStorage.getItem(this.tokenName);
    return submittedToken === storedToken;
  }

  // Add CSRF token to form as hidden input
  attachToForm (formId) {
    const form = document.getElementById(formId);
    if (!form) {
      // Form with ID not found - silently ignore
      return;
    }

    // Check if CSRF token already exists
    const existingToken = form.querySelector('input[name="csrf_token"]');
    if (existingToken) {
      existingToken.value = this.getToken();
      return;
    }

    // Create hidden input for CSRF token
    const csrfInput = document.createElement('input');
    csrfInput.type = 'hidden';
    csrfInput.name = this.tokenName;
    csrfInput.value = this.getToken();

    form.appendChild(csrfInput);
  }

  // Get current token
  getToken () {
    return this.token || sessionStorage.getItem(this.tokenName);
  }

  // Refresh token (call after successful form submission)
  refreshToken () {
    this.generateToken();
  }
}

// Auto-initialize CSRF protection for forms
document.addEventListener('DOMContentLoaded', () => {
  // Initialize CSRF protection
  window.csrfProtection = new CSRFProtection();

  // Attach CSRF tokens to all forms
  const forms = document.querySelectorAll('form');
  forms.forEach((form) => {
    if (!form.id) {
      form.id = 'form_' + Math.random().toString(36).substr(2, 9);
    }

    window.csrfProtection.attachToForm(form.id);

    // Add CSRF validation on form submission
    form.addEventListener('submit', (e) => {
      const csrfToken = form.querySelector('input[name="csrf_token"]');
      if (!csrfToken || !window.csrfProtection.validateToken(csrfToken.value)) {
        e.preventDefault();
        // CSRF token validation failed
        alert('Security validation failed. Please try again.');
        return false;
      }
    });
  });
});
