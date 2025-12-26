/**
 * FormValidator - Enhanced Form Validation System
 * Properties 4 Creations
 *
 * Features:
 * - Real-time validation with debouncing
 * - Multiple validation types (email, phone, zip, required, etc.)
 * - ARIA-compliant error messages
 * - Custom validation rules
 * - Form submission handling
 * - Visual feedback with animations
 * - Rate limiting for DDoS protection
 */

import { RateLimiter, createFormRateLimiter } from '../utils/rateLimiter.js';

export class FormValidator {
  constructor (formSelector, options = {}) {
    this.form =
      typeof formSelector === 'string'
        ? document.querySelector(formSelector)
        : formSelector;

    this.options = {
      validateOnBlur: true,
      validateOnInput: true,
      debounceDelay: 300,
      showSuccessState: true,
      scrollToError: true,
      onSubmit: null,
      onError: null,
      onFieldValid: null,
      onFieldInvalid: null,
      // Rate limiting options
      enableRateLimit: true,
      rateLimitConfig: null,
      ...options
    };

    // Initialize rate limiter
    if (this.options.enableRateLimit) {
      this.rateLimiter = this.options.rateLimitConfig
        ? new RateLimiter(
          this.rateLimitConfig.maxAttempts,
          this.rateLimitConfig.windowMs
        )
        : createFormRateLimiter();
    }

    // Built-in validators
    this.validators = {
      required: (value) => ({
        valid: value.trim().length > 0,
        message: 'This field is required'
      }),

      email: (value) => ({
        valid: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
        message: 'Please enter a valid email address'
      }),

      phone: (value) => ({
        valid: /^\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})$/.test(
          value
        ),
        message: 'Please enter a valid phone number (e.g., 903-555-1234)'
      }),

      zip: (value) => ({
        valid: /^\d{5}(-\d{4})?$/.test(value),
        message: 'Please enter a valid ZIP code (e.g., 75701 or 75701-1234)'
      }),

      minLength: (value, length) => ({
        valid: value.length >= parseInt(length, 10),
        message: `Must be at least ${length} characters`
      }),

      maxLength: (value, length) => ({
        valid: value.length <= parseInt(length, 10),
        message: `Must be no more than ${length} characters`
      }),

      pattern: (value, pattern) => ({
        valid: new RegExp(pattern).test(value),
        message: 'Please match the requested format'
      }),

      match: (value, fieldName) => {
        const matchField = this.form.querySelector(`[name='${fieldName}']`);
        return {
          valid: matchField && value === matchField.value,
          message: `Must match ${fieldName}`
        };
      },

      number: (value) => ({
        valid: !isNaN(parseFloat(value)) && isFinite(value),
        message: 'Please enter a valid number'
      }),

      url: (value) => ({
        valid:
          /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/.test(
            value
          ),
        message: 'Please enter a valid URL'
      }),

      date: (value) => ({
        valid: !isNaN(Date.parse(value)),
        message: 'Please enter a valid date'
      }),

      ssn: (value) => ({
        valid: /^\d{3}-?\d{2}-?\d{4}$/.test(value),
        message: 'Please enter a valid SSN (XXX-XX-XXXX)'
      })
    };

    this.debounceTimers = new Map();
    this.fieldStates = new Map();

    this.init();
  }

  /**
   * Initialize the form validator
   */
  init () {
    if (!this.form) {
      // FormValidator: Form not found - silently ignore
      return;
    }

    // Prevent native validation
    this.form.setAttribute('novalidate', 'true');

    // Find all validatable fields
    const fields = this.form.querySelectorAll('[data-validate], [required]');

    fields.forEach((field) => {
      this.setupField(field);
    });

    // Form submission handler
    this.form.addEventListener('submit', (e) => this.handleSubmit(e));
  }

  /**
   * Setup validation for a single field
   * @param {HTMLElement} field - Form field element
   */
  setupField (field) {
    const fieldId =
      field.id ||
      field.name ||
      `field-${Math.random().toString(36).substr(2, 9)}`;

    // Ensure field has an ID
    if (!field.id) {
      field.id = fieldId;
    }

    // Create error container if not exists
    let errorContainer = this.getErrorContainer(field);
    if (!errorContainer) {
      errorContainer = document.createElement('span');
      errorContainer.className = 'form-error';
      errorContainer.id = `${fieldId}-error`;
      errorContainer.setAttribute('role', 'alert');
      errorContainer.setAttribute('aria-live', 'polite');

      const group = field.closest('.form-group') || field.parentElement;
      group.appendChild(errorContainer);
    }

    // Link field to error container
    field.setAttribute('aria-describedby', errorContainer.id);

    // Blur validation
    if (this.options.validateOnBlur) {
      field.addEventListener('blur', () => {
        this.validateField(field);
      });
    }

    // Input validation (debounced)
    if (this.options.validateOnInput) {
      field.addEventListener('input', () => {
        // Clear existing timer
        if (this.debounceTimers.has(fieldId)) {
          clearTimeout(this.debounceTimers.get(fieldId));
        }

        // Only validate on input if field has been touched (has error)
        if (this.fieldStates.get(fieldId)?.touched) {
          const timer = setTimeout(() => {
            this.validateField(field);
          }, this.options.debounceDelay);

          this.debounceTimers.set(fieldId, timer);
        }
      });
    }

    // Initialize field state
    this.fieldStates.set(fieldId, {
      touched: false,
      valid: true,
      errors: []
    });
  }

  /**
   * Validate a single field
   * @param {HTMLElement} field - Form field element
   * @returns {boolean} True if field is valid
   */
  validateField (field) {
    const value = field.value;
    const fieldId = field.id;
    const errors = [];

    // Mark as touched
    const state = this.fieldStates.get(fieldId) || {};
    state.touched = true;

    // Check required
    if (
      field.hasAttribute('required') ||
      field.dataset.validate?.includes('required')
    ) {
      const result = this.validators.required(value);
      if (!result.valid) {
        errors.push(result.message);
      }
    }

    // Skip other validations if empty and not required
    if (value.trim().length > 0) {
      // Get validation types from data attribute
      const validateTypes = (field.dataset.validate || '')
        .split(' ')
        .filter(Boolean);

      validateTypes.forEach((type) => {
        // Handle validators with parameters (e.g., minLength:5)
        const [validatorName, param] = type.split(':');

        if (this.validators[validatorName] && validatorName !== 'required') {
          const result = this.validators[validatorName](value, param);
          if (!result.valid) {
            errors.push(result.message);
          }
        }
      });

      // Check HTML5 validation attributes
      if (field.minLength > 0 && value.length < field.minLength) {
        errors.push(`Must be at least ${field.minLength} characters`);
      }

      if (field.maxLength > 0 && value.length > field.maxLength) {
        errors.push(`Must be no more than ${field.maxLength} characters`);
      }

      if (field.pattern && !new RegExp(field.pattern).test(value)) {
        errors.push(field.title || 'Please match the requested format');
      }
    }

    // Update state
    state.valid = errors.length === 0;
    state.errors = errors;
    this.fieldStates.set(fieldId, state);

    // Update UI
    this.updateFieldUI(field, state);

    // Callbacks
    if (state.valid && typeof this.options.onFieldValid === 'function') {
      this.options.onFieldValid(field);
    } else if (
      !state.valid &&
      typeof this.options.onFieldInvalid === 'function'
    ) {
      this.options.onFieldInvalid(field, errors);
    }

    return state.valid;
  }

  /**
   * Update field UI based on validation state
   * @param {HTMLElement} field - Form field element
   * @param {Object} state - Field validation state
   */
  updateFieldUI (field, state) {
    const group = field.closest('.form-group') || field.parentElement;
    const errorContainer = this.getErrorContainer(field);

    // Remove existing states
    group.classList.remove('form-group--error', 'form-group--success');
    field.classList.remove('form-control--error', 'form-control--success');
    field.removeAttribute('aria-invalid');

    if (!state.valid) {
      // Error state
      group.classList.add('form-group--error');
      field.classList.add('form-control--error');
      field.setAttribute('aria-invalid', 'true');

      if (errorContainer) {
        errorContainer.textContent = state.errors[0] || '';
        errorContainer.style.display = 'block';
      }

      // Add shake animation
      field.classList.add('shake');
      setTimeout(() => field.classList.remove('shake'), 300);
    } else if (state.touched && this.options.showSuccessState) {
      // Success state
      group.classList.add('form-group--success');
      field.classList.add('form-control--success');
      field.setAttribute('aria-invalid', 'false');

      if (errorContainer) {
        errorContainer.textContent = '';
        errorContainer.style.display = 'none';
      }
    }
  }

  /**
   * Get error container for a field
   * @param {HTMLElement} field - Form field element
   * @returns {HTMLElement|null} Error container element
   */
  getErrorContainer (field) {
    const describedBy = field.getAttribute('aria-describedby');
    if (describedBy) {
      return document.getElementById(describedBy);
    }

    const group = field.closest('.form-group') || field.parentElement;
    return group.querySelector('.form-error');
  }

  /**
   * Validate entire form
   * @returns {boolean} True if form is valid
   */
  validateForm () {
    const fields = this.form.querySelectorAll('[data-validate], [required]');
    let isValid = true;
    let firstInvalidField = null;

    fields.forEach((field) => {
      const fieldValid = this.validateField(field);
      if (!fieldValid && isValid) {
        isValid = false;
        firstInvalidField = field;
      }
    });

    // Scroll to first error
    if (!isValid && firstInvalidField && this.options.scrollToError) {
      firstInvalidField.scrollIntoView({ behavior: 'smooth', block: 'center' });
      firstInvalidField.focus();
    }

    return isValid;
  }

  /**
   * Handle form submission
   * @param {Event} e - Submit event
   */
  async handleSubmit (e) {
    e.preventDefault();

    // Check rate limiting first
    if (this.options.enableRateLimit && this.rateLimiter) {
      const userKey = this.getUserIdentifier();
      const rateLimitResult = this.rateLimiter.isAllowed(userKey);

      if (!rateLimitResult.allowed) {
        this.showRateLimitError(rateLimitResult);
        return;
      }
    }

    const isValid = this.validateForm();

    if (!isValid) {
      if (typeof this.options.onError === 'function') {
        this.options.onError(this.getErrors());
      }
      return;
    }

    // Get form data
    const formData = new FormData(this.form);
    const data = Object.fromEntries(formData.entries());

    // Call submit handler
    if (typeof this.options.onSubmit === 'function') {
      try {
        // Show loading state
        this.setLoadingState(true);

        await this.options.onSubmit(data, formData);
      } catch (error) {
        // Form submission error logged for debugging
        if (typeof this.options.onError === 'function') {
          this.options.onError([{ field: 'form', message: error.message }]);
        }
      } finally {
        this.setLoadingState(false);
      }
    }
  }

  /**
   * Get user identifier for rate limiting
   * @returns {string} User identifier key
   */
  getUserIdentifier () {
    if (this.rateLimiter) {
      return this.rateLimiter.getUserIdentifier();
    }
    return 'anonymous';
  }

  /**
   * Show rate limiting error message
   * @param {Object} rateLimitResult - Rate limit check result
   */
  showRateLimitError (rateLimitResult) {
    const errorMessage = rateLimitResult.retryAfter
      ? `Too many attempts. Please wait ${rateLimitResult.retryAfter} seconds before trying again.`
      : 'Too many attempts. Please try again later.';

    // Show error in form-level error container
    let formErrorContainer = this.form.querySelector('.form-error--global');
    if (!formErrorContainer) {
      formErrorContainer = document.createElement('div');
      formErrorContainer.className = 'form-error form-error--global';
      formErrorContainer.setAttribute('role', 'alert');
      formErrorContainer.setAttribute('aria-live', 'assertive');

      const submitButton = this.form.querySelector('[type="submit"]');
      if (submitButton) {
        submitButton.parentNode.insertBefore(formErrorContainer, submitButton);
      } else {
        this.form.appendChild(formErrorContainer);
      }
    }

    formErrorContainer.textContent = errorMessage;
    formErrorContainer.style.display = 'block';

    // Add rate limit class for styling
    this.form.classList.add('form--rate-limited');

    // Disable submit button during rate limit
    const submitButton = this.form.querySelector('[type="submit"]');
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.classList.add('btn--rate-limited');
    }

    // Auto-hide error after rate limit expires
    if (rateLimitResult.retryAfter) {
      setTimeout(() => {
        formErrorContainer.style.display = 'none';
        this.form.classList.remove('form--rate-limited');
        if (submitButton) {
          submitButton.disabled = false;
          submitButton.classList.remove('btn--rate-limited');
        }
      }, rateLimitResult.retryAfter * 1000);
    }

    // Call error callback
    if (typeof this.options.onError === 'function') {
      this.options.onError([
        {
          field: 'form',
          message: errorMessage,
          type: 'rate_limit'
        }
      ]);
    }
  }

  /**
   * Set form loading state
   * @param {boolean} loading - Loading state
   */
  setLoadingState (loading) {
    const submitButton = this.form.querySelector('[type="submit"]');

    if (loading) {
      this.form.classList.add('form--loading');
      if (submitButton) {
        submitButton.disabled = true;
        submitButton.classList.add('btn--loading');
        submitButton.dataset.originalText = submitButton.textContent;
        submitButton.textContent = 'Submitting...';
      }
    } else {
      this.form.classList.remove('form--loading');
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.classList.remove('btn--loading');
        if (submitButton.dataset.originalText) {
          submitButton.textContent = submitButton.dataset.originalText;
        }
      }
    }
  }

  /**
   * Get all validation errors
   * @returns {Array} Array of error objects
   */
  getErrors () {
    const errors = [];

    this.fieldStates.forEach((state, fieldId) => {
      if (!state.valid) {
        errors.push({
          field: fieldId,
          errors: state.errors
        });
      }
    });

    return errors;
  }

  /**
   * Get rate limiting statistics
   * @returns {Object|null} Rate limit stats or null if disabled
   */
  getRateLimitStats () {
    if (!this.rateLimiter) return null;

    const userKey = this.getUserIdentifier();
    return {
      attempts: this.rateLimiter.getAttemptCount(userKey),
      remaining: this.rateLimiter.getRemainingAttempts(userKey),
      timeUntilReset: this.rateLimiter.getTimeUntilReset(userKey),
      ...this.rateLimiter.getStats()
    };
  }

  /**
   * Reset rate limiting for user (admin/testing function)
   */
  resetRateLimit () {
    if (this.rateLimiter) {
      const userKey = this.getUserIdentifier();
      this.rateLimiter.resetUserAttempts(userKey);

      // Clear any rate limit error display
      const formErrorContainer = this.form.querySelector('.form-error--global');
      if (formErrorContainer) {
        formErrorContainer.style.display = 'none';
      }

      this.form.classList.remove('form--rate-limited');
      const submitButton = this.form.querySelector('[type="submit"]');
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.classList.remove('btn--rate-limited');
      }
    }
  }

  /**
   * Add custom validator
   * @param {string} name - Validator name
   * @param {Function} validator - Validator function
   */
  addValidator (name, validator) {
    this.validators[name] = validator;
  }

  /**
   * Reset form and validation states
   */
  reset () {
    this.form.reset();

    this.fieldStates.forEach((state, fieldId) => {
      state.touched = false;
      state.valid = true;
      state.errors = [];

      const field = document.getElementById(fieldId);
      if (field) {
        const group = field.closest('.form-group') || field.parentElement;
        group.classList.remove('form-group--error', 'form-group--success');
        field.classList.remove('form-control--error', 'form-control--success');
        field.removeAttribute('aria-invalid');

        const errorContainer = this.getErrorContainer(field);
        if (errorContainer) {
          errorContainer.textContent = '';
          errorContainer.style.display = 'none';
        }
      }
    });

    // Clear rate limit errors
    this.resetRateLimit();
  }

  /**
   * Destroy validator and clean up
   */
  destroy () {
    this.debounceTimers.forEach((timer) => clearTimeout(timer));
    this.debounceTimers.clear();
    this.fieldStates.clear();
    this.form.removeAttribute('novalidate');

    // Clean up rate limiter
    if (this.rateLimiter) {
      this.rateLimiter.destroy();
    }
  }
}

/**
 * Initialize form validators on all forms with data-validate-form attribute
 * @returns {FormValidator[]} Array of validator instances
 */
export function initFormValidators () {
  const forms = document.querySelectorAll('[data-validate-form]');
  return Array.from(forms).map((form) => new FormValidator(form));
}

// Export for global access
if (typeof window !== 'undefined') {
  window.FormValidator = FormValidator;
  window.initFormValidators = initFormValidators;
}

export default FormValidator;
