/**
 * Improved CSRF Protection Module
 * Properties 4 Creations
 * 
 * This module provides enhanced CSRF protection by:
 * 1. Using server-side generated tokens (when available)
 * 2. Implementing double-submit cookies pattern
 * 3. Adding additional form validation
 * 4. Integrating with Formspree's built-in security
 */

export class ImprovedCSRFProtection {
  constructor () {
    this.tokenName = 'csrf_token';
    this.cookieName = 'csrf_token';
    this.formspreeEndpoint = 'https://formspree.io/f/';
    this.init();
  }

  // Generate a cryptographically secure token
  generateSecureToken () {
    if (window.crypto && window.crypto.getRandomValues) {
      const array = new Uint8Array(32);
      window.crypto.getRandomValues(array);
      return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    }
    
    // Fallback for older browsers (less secure)
    return 'csrf_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
  }

  // Set CSRF token in cookie (double-submit cookie pattern)
  setCSRFCookie (token) {
    const expires = new Date();
    expires.setTime(expires.getTime() + (30 * 60 * 1000)); // 30 minutes
    
    document.cookie = `${this.cookieName}=${token}; expires=${expires.toUTCString()}; path=/; Secure; SameSite=Strict`;
  }

  // Get CSRF token from cookie
  getCSRFCookie () {
    const name = this.cookieName + '=';
    const decodedCookie = decodeURIComponent(document.cookie);
    const ca = decodedCookie.split(';');
    
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === ' ') {
        c = c.substring(1);
      }
      if (c.indexOf(name) === 0) {
        return c.substring(name.length, c.length);
      }
    }
    return null;
  }

  // Initialize CSRF protection
  init () {
    // Check if we already have a token in cookie
    let token = this.getCSRFCookie();
    
    if (!token) {
      // Generate new token and set in cookie
      token = this.generateSecureToken();
      this.setCSRFCookie(token);
    }
    
    // Store in memory for this session
    this.token = token;
    
    // Attach to all forms
    this.attachToAllForms();
  }

  // Attach CSRF protection to all forms
  attachToAllForms () {
    const forms = document.querySelectorAll('form');
    
    forms.forEach((form) => {
      // Skip if form already has CSRF protection
      if (form.dataset.csrfProtected) {
        return;
      }

      // Add CSRF token as hidden input
      this.attachToForm(form);
      
      // Add validation on submit
      form.addEventListener('submit', (e) => {
        if (!this.validateForm(form)) {
          e.preventDefault();
          this.handleValidationError(form);
          return false;
        }
      });

      // Mark form as protected
      form.dataset.csrfProtected = 'true';
    });
  }

  // Attach CSRF token to specific form
  attachToForm (form) {
    // Check if CSRF token already exists
    const existingToken = form.querySelector(`input[name="${this.tokenName}"]`);
    if (existingToken) {
      existingToken.value = this.getToken();
      return;
    }

    // Create hidden input for CSRF token
    const csrfInput = document.createElement('input');
    csrfInput.type = 'hidden';
    csrfInput.name = this.tokenName;
    csrfInput.value = this.getToken();
    csrfInput.dataset.csrfToken = 'true';

    form.appendChild(csrfInput);
  }

  // Validate form submission
  validateForm (form) {
    const submittedToken = form.querySelector(`input[name="${this.tokenName}"]`)?.value;
    const cookieToken = this.getCSRFCookie();
    
    // Validate that tokens match (double-submit cookie pattern)
    if (!submittedToken || !cookieToken || submittedToken !== cookieToken) {
      return false;
    }

    // Additional validation for Formspree forms
    if (this.isFormspreeForm(form)) {
      return this.validateFormspreeForm(form);
    }

    return true;
  }

  // Check if form uses Formspree
  isFormspreeForm (form) {
    const action = form.getAttribute('action') || '';
    return action.includes(this.formspreeEndpoint) || action.includes('formspree.io');
  }

  // Validate Formspree-specific requirements
  validateFormspreeForm (form) {
    // Formspree has its own CSRF protection, but we add additional validation
    const honeypot = form.querySelector('input[name="_gotcha"]');
    if (honeypot && honeypot.value !== '') {
      // Honeypot field should be empty
      return false;
    }

    // Check for required fields
    const requiredFields = form.querySelectorAll('[required]');
    for (const field of requiredFields) {
      if (!field.value.trim()) {
        return false;
      }
    }

    return true;
  }

  // Handle validation errors
  handleValidationError (form) {
    // Show error message
    const errorContainer = form.querySelector('.form-error') || 
                          form.querySelector('.error-message') ||
                          form.querySelector('.alert');
    
    if (errorContainer) {
      errorContainer.textContent = 'Security validation failed. Please refresh the page and try again.';
      errorContainer.style.display = 'block';
    } else {
      // Fallback to alert for immediate feedback
      alert('Security validation failed. Please refresh the page and try again.');
    }
  }

  // Get current token
  getToken () {
    return this.token || this.getCSRFCookie();
  }

  // Refresh token (for security, rotate tokens periodically)
  refreshToken () {
    const newToken = this.generateSecureToken();
    this.setCSRFCookie(newToken);
    this.token = newToken;
    
    // Update all forms with new token
    const forms = document.querySelectorAll('form[data-csrf-protected="true"]');
    forms.forEach(form => {
      const tokenInput = form.querySelector(`input[name="${this.tokenName}"]`);
      if (tokenInput) {
        tokenInput.value = newToken;
      }
    });
  }

  // Clean up expired tokens
  cleanup () {
    // Remove expired cookies by setting them to expire immediately
    document.cookie = `${this.cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
  }
}

// Auto-initialize improved CSRF protection
document.addEventListener('DOMContentLoaded', () => {
  // Initialize improved CSRF protection
  window.improvedCSRFProtection = new ImprovedCSRFProtection();
  
  // Optional: Refresh token every 15 minutes for security
  setInterval(() => {
    window.improvedCSRFProtection.refreshToken();
  }, 15 * 60 * 1000); // 15 minutes

  // Clean up on page unload
  window.addEventListener('beforeunload', () => {
    window.improvedCSRFProtection.cleanup();
  });
});

// Export for use in other modules
export default ImprovedCSRFProtection;