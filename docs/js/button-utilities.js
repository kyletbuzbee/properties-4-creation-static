/**
 * Enhanced Button Utilities for Properties 4 Creations
 * Provides loading states, ripple effects, and interactive features
 */

class ButtonUtils {
  constructor () {
    this.init();
  }

  init () {
    this.setupRippleEffects();
    this.setupLoadingStates();
    this.setupConfirmationDialogs();
    this.setupCopyToClipboard();
  }

  /**
   * Setup ripple effects for buttons
   */
  setupRippleEffects () {
    document.addEventListener('click', (e) => {
      const button = e.target.closest('.btn');
      if (!button || button.classList.contains('btn-ripple-disabled')) return;

      // Skip if button is disabled or loading
      if (button.disabled || button.classList.contains('loading')) return;

      this.createRipple(button, e);
    });
  }

  /**
   * Create ripple effect
   */
  createRipple (button, event) {
    const ripple = document.createElement('span');
    ripple.className = 'btn-ripple';

    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;

    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = x + 'px';
    ripple.style.top = y + 'px';

    button.appendChild(ripple);

    setTimeout(() => {
      ripple.remove();
    }, 600);
  }

  /**
   * Set loading state on button
   */
  static setLoading (selector, loadingText = 'Loading...') {
    const button =
      typeof selector === 'string'
        ? document.querySelector(selector)
        : selector;
    if (!button) return;

    button.classList.add('loading');
    button.disabled = true;

    // Store original text
    if (!button.dataset.originalText) {
      button.dataset.originalText = button.innerHTML;
    }

    button.innerHTML = loadingText;
  }

  /**
   * Remove loading state from button
   */
  static removeLoading (selector, newText = null) {
    const button =
      typeof selector === 'string'
        ? document.querySelector(selector)
        : selector;
    if (!button) return;

    button.classList.remove('loading');
    button.disabled = false;

    // Restore original text or set new text
    if (newText) {
      button.innerHTML = newText;
    } else if (button.dataset.originalText) {
      button.innerHTML = button.dataset.originalText;
      delete button.dataset.originalText;
    }
  }

  /**
   * Setup loading states for forms
   */
  setupLoadingStates () {
    document.addEventListener('submit', (e) => {
      const form = e.target;
      const submitBtn = form.querySelector('button[type="submit"]');

      if (submitBtn && !submitBtn.classList.contains('no-loading')) {
        ButtonUtils.setLoading(submitBtn, 'Submitting...');
      }
    });
  }

  /**
   * Add confirmation dialog to button
   */
  static addConfirmation (selector, message, callback) {
    const button =
      typeof selector === 'string'
        ? document.querySelector(selector)
        : selector;
    if (!button) return;

    button.addEventListener('click', (e) => {
      if (!confirm(message)) {
        e.preventDefault();
        return false;
      }

      if (callback) {
        callback(e);
      }
    });
  }

  /**
   * Setup confirmation dialogs
   */
  setupConfirmationDialogs () {
    // Auto-setup for buttons with data-confirm attribute
    document.querySelectorAll('[data-confirm]').forEach((button) => {
      const message = button.dataset.confirm;
      ButtonUtils.addConfirmation(button, message);
    });
  }

  /**
   * Copy text to clipboard
   */
  static copyToClipboard (text, button = null) {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        if (button) {
          const originalText = button.innerHTML;
          button.innerHTML = '<i data-lucide="check" class="icon"></i> Copied!';
          button.classList.add('btn-success');

          setTimeout(() => {
            button.innerHTML = originalText;
            button.classList.remove('btn-success');
          }, 2000);
        }
      })
      .catch(() => {
        // Failed to copy text - silently handle error
      });
  }

  /**
   * Setup copy to clipboard functionality
   */
  setupCopyToClipboard () {
    document.addEventListener('click', (e) => {
      const button = e.target.closest('[data-copy]');
      if (!button) return;

      const text = button.dataset.copy;
      ButtonUtils.copyToClipboard(text, button);
    });
  }

  /**
   * Toggle button group active state
   */
  static toggleButtonGroup (button) {
    const group = button.closest('.btn-group');
    if (!group) return;

    // Remove active state from all buttons in group
    group.querySelectorAll('.btn').forEach((btn) => {
      btn.classList.remove('active');
      btn.setAttribute('aria-pressed', 'false');
    });

    // Add active state to clicked button
    button.classList.add('active');
    button.setAttribute('aria-pressed', 'true');
  }

  /**
   * Setup button groups
   */
  setupButtonGroups () {
    document.addEventListener('click', (e) => {
      const button = e.target.closest('.btn-group .btn');
      if (!button) return;

      ButtonUtils.toggleButtonGroup(button);
    });
  }

  /**
   * Initialize button groups on page load
   */
  initializeButtonGroups () {
    document.querySelectorAll('.btn-group .active').forEach((button) => {
      button.setAttribute('aria-pressed', 'true');
    });
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new ButtonUtils();
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ButtonUtils;
}
