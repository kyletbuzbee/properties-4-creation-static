// ACCESSIBILITY ENHANCED FEATURES
// Enhanced accessibility features for Properties 4 Creations website
(function () {
  'use strict';

  // Enhanced Skip Link Management
  function initializeSkipLinks () {
    const skipLink = document.querySelector('.skip-link');
    const mainContent = document.getElementById('main');

    if (skipLink && mainContent) {
      // Ensure skip link points to correct element
      skipLink.href = '#main';

      // Enhanced focus management for skip link
      skipLink.addEventListener('click', (e) => {
        e.preventDefault();
        mainContent.focus();
        mainContent.setAttribute('tabindex', '-1');
      });
    }
  }

  // Enhanced Keyboard Navigation
  function enhanceKeyboardNavigation () {
    // Handle Enter/Space key for interactive elements
    document.addEventListener('keydown', (e) => {
      const target = e.target;

      // Handle card interactions (property cards, etc.)
      if (
        target.classList.contains('property-card') &&
        (e.key === 'Enter' || e.key === ' ')
      ) {
        e.preventDefault();
        const link = target.querySelector('a');
        if (link) {
          link.click();
        }
      }

      // Handle CTA buttons
      if (
        target.classList.contains('cta-link') &&
        (e.key === 'Enter' || e.key === ' ')
      ) {
        e.preventDefault();
        window.location.href = target.href;
      }
    });
  }

  // Mobile Menu Toggle
  function initializeMobileMenu () {
    const menuToggle = document.querySelector('.menu-toggle');
    const mainNav = document.querySelector('.main-navigation');

    if (menuToggle && mainNav) {
      menuToggle.addEventListener('click', () => {
        const expanded = menuToggle.getAttribute('aria-expanded') === 'true';
        menuToggle.setAttribute('aria-expanded', String(!expanded));
        mainNav.setAttribute('aria-hidden', String(expanded));
      });

      // Close menu when clicking outside
      document.addEventListener('click', (e) => {
        if (!mainNav.contains(e.target) && !menuToggle.contains(e.target)) {
          menuToggle.setAttribute('aria-expanded', 'false');
          mainNav.setAttribute('aria-hidden', 'true');
        }
      });

      // Close menu on escape key
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          menuToggle.setAttribute('aria-expanded', 'false');
          mainNav.setAttribute('aria-hidden', 'true');
          menuToggle.focus();
        }
      });
    }
  }

  // ARIA Live Regions for Dynamic Content
  function initializeAriaLiveRegions () {
    // Create live region for filter results
    if (!document.getElementById('filter-status')) {
      const liveRegion = document.createElement('div');
      liveRegion.id = 'filter-status';
      liveRegion.setAttribute('aria-live', 'polite');
      liveRegion.setAttribute('aria-atomic', 'true');
      liveRegion.className = 'sr-only';
      document.body.appendChild(liveRegion);
    }

    // Create live region for form submissions
    if (!document.getElementById('form-status')) {
      const formRegion = document.createElement('div');
      formRegion.id = 'form-status';
      formRegion.setAttribute('aria-live', 'assertive');
      formRegion.setAttribute('aria-atomic', 'true');
      formRegion.className = 'sr-only';
      document.body.appendChild(formRegion);
    }
  }

  // Screen Reader Only Text
  function initializeScreenReaderText () {
    // Create styles for screen reader only content
    if (!document.getElementById('sr-styles')) {
      const srStyles = document.createElement('style');
      srStyles.id = 'sr-styles';
      srStyles.textContent = `
                .sr-only {
                    position: absolute;
                    width: 1px;
                    height: 1px;
                    padding: 0;
                    margin: -1px;
                    overflow: hidden;
                    clip: rect(0, 0, 0, 0);
                    white-space: nowrap;
                    border: 0;
                }
            `;
      document.head.appendChild(srStyles);
    }
  }

  // Enhanced Focus Management
  function enhanceFocusManagement () {
    document.addEventListener('keydown', (e) => {
      // ESC key handling for overlays
      if (e.key === 'Escape') {
        const activeModal = document.querySelector('.modal.active');
        if (activeModal) {
          closeModal(activeModal);
        }
      }
    });

    function closeModal (modal) {
      modal.classList.remove('active');
      modal.setAttribute('aria-hidden', 'true');
      // Return focus to trigger element
      const trigger = document.querySelector(`[data-modal='${modal.id}']`);
      if (trigger) {
        trigger.focus();
      }
    }
  }

  // Image Alt Text Validation
  function validateAltText () {
    const images = document.querySelectorAll('img');
    let missingAltCount = 0;

    images.forEach((img) => {
      if (!img.alt || img.alt.trim() === '') {
        // Accessibility Warning: Image missing alt text
        missingAltCount++;

        // In development mode, highlight missing alt text
        if (
          window.location.hostname === 'localhost' ||
          window.location.hostname === '127.0.0.1'
        ) {
          img.style.outline = '3px solid #ff6b6b';
          img.style.outlineOffset = '2px';
        }
      }
    });

    if (missingAltCount > 0) {
      // Accessibility: Images missing alt text detected
    }
  }

  // Form Accessibility Enhancements
  function enhanceFormAccessibility () {
    const forms = document.querySelectorAll('form');

    forms.forEach((form) => {
      const inputs = form.querySelectorAll('input, select, textarea');

      inputs.forEach((input) => {
        // Ensure all inputs have proper labeling
        if (
          !input.getAttribute('aria-label') &&
          !input.getAttribute('aria-labelledby')
        ) {
          const label = form.querySelector(`label[for='${input.id}']`);
          if (!label && input.id) {
            // Form accessibility: Input may be missing label
          }
        }

        // Enhanced error messaging
        input.addEventListener('invalid', () => {
          const formGroup = input.closest('.form-group');
          if (formGroup) {
            formGroup.classList.add('error');

            // Update ARIA-describedby for screen readers
            const errorMsg = formGroup.querySelector('.error-message');
            if (errorMsg && input.id) {
              input.setAttribute(
                'aria-describedby',
                errorMsg.id || `error-${input.id}`
              );
              errorMsg.id = errorMsg.id || `error-${input.id}`;
            }
          }
        });

        // Clear errors on input
        input.addEventListener('input', () => {
          const formGroup = input.closest('.form-group');
          if (formGroup && formGroup.classList.contains('error')) {
            formGroup.classList.remove('error');
            input.removeAttribute('aria-describedby');
          }
        });
      });
    });
  }

  // Navigation Landmark Management
  function enhanceNavigationLandmarks () {
    // Ensure main navigation has proper ARIA
    const nav = document.querySelector('nav');
    if (nav && !nav.getAttribute('aria-label')) {
      nav.setAttribute('aria-label', 'Main navigation');
    }

    // Mark footer navigation
    const footerNav = document.querySelector('.footer-section ul');
    if (footerNav && !footerNav.getAttribute('aria-label')) {
      footerNav.setAttribute('aria-label', 'Footer links');
    }
  }

  // Initialize all accessibility features
  function initAccessibility () {
    initializeSkipLinks();
    enhanceKeyboardNavigation();
    initializeMobileMenu();
    initializeAriaLiveRegions();
    initializeScreenReaderText();
    enhanceFocusManagement();
    validateAltText();
    enhanceFormAccessibility();
    enhanceNavigationLandmarks();

    // Announce successful initialization for screen readers
    const statusRegion = document.getElementById('form-status');
    if (statusRegion) {
      statusRegion.textContent = 'Accessibility enhancements loaded';
      setTimeout(() => {
        statusRegion.textContent = '';
      }, 1000);
    }

    // Accessibility enhancements initialized
  }

  // Initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAccessibility);
  } else {
    initAccessibility();
  }
  
  // Export for potential external use
  window.AccessibilityEnhancer = {
    initAccessibility: initAccessibility,
    validateAltText: validateAltText,
    enhanceFormAccessibility: enhanceFormAccessibility
  };
})();
