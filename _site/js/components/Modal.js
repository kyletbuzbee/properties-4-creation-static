/**
 * Modal - Accessible Modal Dialog Component
 * Properties 4 Creations
 *
 * Features:
 * - Focus trapping within modal
 * - Keyboard navigation (Escape to close, Tab cycling)
 * - ARIA attributes for screen readers
 * - Backdrop click to close
 * - Smooth animations
 * - Restores focus on close
 */

export class Modal {
  constructor (options = {}) {
    this.options = {
      closeOnBackdrop: true,
      closeOnEscape: true,
      trapFocus: true,
      onOpen: null,
      onClose: null,
      ...options
    };

    this.activeModal = null;
    this.focusedElementBeforeModal = null;
    this.boundHandleKeydown = this.handleKeydown.bind(this);
    this.boundHandleBackdropClick = this.handleBackdropClick.bind(this);

    this.init();
  }

  /**
   * Initialize modal triggers
   */
  init () {
    // Find all modal triggers
    const triggers = document.querySelectorAll('[data-modal-trigger]');

    triggers.forEach((trigger) => {
      trigger.addEventListener('click', (e) => {
        e.preventDefault();
        const modalId = trigger.dataset.modalTrigger || trigger.dataset.modal;
        this.open(modalId);
      });
    });

    // Find all close buttons within modals
    const closeButtons = document.querySelectorAll('[data-modal-close]');
    closeButtons.forEach((btn) => {
      btn.addEventListener('click', () => this.close());
    });
  }

  /**
   * Open a modal by ID
   * @param {string} modalId - The ID of the modal to open
   */
  open (modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) {
      // Modal: Element with ID not found - silently ignore
      return;
    }

    // Store currently focused element
    this.focusedElementBeforeModal = document.activeElement;
    this.activeModal = modal;

    // Show modal
    modal.classList.add('modal--active');
    modal.setAttribute('aria-hidden', 'false');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('role', 'dialog');

    // Prevent body scroll
    document.body.style.overflow = 'hidden';
    document.body.classList.add('modal-open');

    // Add event listeners
    if (this.options.closeOnEscape) {
      document.addEventListener('keydown', this.boundHandleKeydown);
    }

    if (this.options.closeOnBackdrop) {
      modal.addEventListener('click', this.boundHandleBackdropClick);
    }

    // Focus first focusable element or modal itself
    requestAnimationFrame(() => {
      const firstFocusable = this.getFirstFocusableElement(modal);
      if (firstFocusable) {
        firstFocusable.focus();
      } else {
        modal.focus();
      }
    });

    // Setup focus trap
    if (this.options.trapFocus) {
      this.setupFocusTrap(modal);
    }

    // Callback
    if (typeof this.options.onOpen === 'function') {
      this.options.onOpen(modal);
    }

    // Announce to screen readers
    this.announceToScreenReader('Dialog opened');
  }

  /**
   * Close the active modal
   */
  close () {
    if (!this.activeModal) return;

    const modal = this.activeModal;

    // Hide modal
    modal.classList.remove('modal--active');
    modal.setAttribute('aria-hidden', 'true');
    modal.removeAttribute('aria-modal');

    // Restore body scroll
    document.body.style.overflow = '';
    document.body.classList.remove('modal-open');

    // Remove event listeners
    document.removeEventListener('keydown', this.boundHandleKeydown);
    modal.removeEventListener('click', this.boundHandleBackdropClick);

    // Restore focus
    if (this.focusedElementBeforeModal) {
      this.focusedElementBeforeModal.focus();
    }

    // Callback
    if (typeof this.options.onClose === 'function') {
      this.options.onClose(modal);
    }

    // Announce to screen readers
    this.announceToScreenReader('Dialog closed');

    this.activeModal = null;
    this.focusedElementBeforeModal = null;
  }

  /**
   * Toggle modal open/close
   * @param {string} modalId - The ID of the modal to toggle
   */
  toggle (modalId) {
    if (this.activeModal && this.activeModal.id === modalId) {
      this.close();
    } else {
      this.open(modalId);
    }
  }

  /**
   * Handle keydown events
   * @param {KeyboardEvent} e - Keyboard event
   */
  handleKeydown (e) {
    if (e.key === 'Escape' && this.options.closeOnEscape) {
      e.preventDefault();
      this.close();
    }
  }

  /**
   * Handle backdrop click
   * @param {MouseEvent} e - Mouse event
   */
  handleBackdropClick (e) {
    // Only close if clicking the backdrop (modal element itself), not content
    if (e.target === this.activeModal) {
      this.close();
    }
  }

  /**
   * Setup focus trap within modal
   * @param {HTMLElement} modal - Modal element
   */
  setupFocusTrap (modal) {
    const focusableElements = this.getFocusableElements(modal);

    if (focusableElements.length === 0) return;

    const firstFocusable = focusableElements[0];
    const lastFocusable = focusableElements[focusableElements.length - 1];

    const handleTabKey = (e) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstFocusable) {
          e.preventDefault();
          lastFocusable.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastFocusable) {
          e.preventDefault();
          firstFocusable.focus();
        }
      }
    };

    modal.addEventListener('keydown', handleTabKey);

    // Store handler for cleanup
    modal._focusTrapHandler = handleTabKey;
  }

  /**
   * Get all focusable elements within a container
   * @param {HTMLElement} container - Container element
   * @returns {NodeList} Focusable elements
   */
  getFocusableElements (container) {
    const focusableSelectors = [
      'button:not([disabled])',
      'a[href]',
      'input:not([disabled]):not([type="hidden"])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]'
    ].join(', ');

    return container.querySelectorAll(focusableSelectors);
  }

  /**
   * Get first focusable element within a container
   * @param {HTMLElement} container - Container element
   * @returns {HTMLElement|null} First focusable element
   */
  getFirstFocusableElement (container) {
    const focusableElements = this.getFocusableElements(container);
    return focusableElements.length > 0 ? focusableElements[0] : null;
  }

  /**
   * Announce message to screen readers
   * @param {string} message - Message to announce
   */
  announceToScreenReader (message) {
    const announcement = document.createElement('div');
    announcement.setAttribute('role', 'status');
    announcement.setAttribute('aria-live', 'polite');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    document.body.appendChild(announcement);

    setTimeout(() => {
      announcement.remove();
    }, 1000);
  }

  /**
   * Create a modal dynamically
   * @param {Object} config - Modal configuration
   * @returns {HTMLElement} Created modal element
   */
  static create (config = {}) {
    const {
      id = `modal-${Date.now()}`,
      title = '',
      content = '',
      footer = '',
      size = 'medium', // small, medium, large, full
      closable = true
    } = config;

    const modal = document.createElement('div');
    modal.id = id;
    modal.className = `modal modal--${size}`;
    modal.setAttribute('aria-hidden', 'true');
    modal.setAttribute('aria-labelledby', `${id}-title`);
    modal.tabIndex = -1;

    modal.innerHTML = `
      <div class="modal__backdrop"></div>
      <div class="modal__dialog" role="document">
        <div class="modal__content">
          ${
  title
    ? `
            <header class="modal__header">
              <h2 class="modal__title" id="${id}-title">${title}</h2>
              ${
  closable
    ? `
                <button type="button" 
                        class="modal__close" 
                        data-modal-close
                        aria-label="Close dialog">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                    <path d="M18 6L6 18M6 6l12 12"/>
                  </svg>
                </button>
              `
    : ''
}
            </header>
          `
    : ''
}
          <div class="modal__body">
            ${content}
          </div>
          ${
  footer
    ? `
            <footer class="modal__footer">
              ${footer}
            </footer>
          `
    : ''
}
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    return modal;
  }

  /**
   * Destroy modal and clean up
   * @param {string} modalId - ID of modal to destroy
   */
  static destroy (modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      // Remove focus trap handler if exists
      if (modal._focusTrapHandler) {
        modal.removeEventListener('keydown', modal._focusTrapHandler);
      }
      modal.remove();
    }
  }

  /**
   * Check if any modal is currently open
   * @returns {boolean} True if a modal is open
   */
  isOpen () {
    return this.activeModal !== null;
  }

  /**
   * Get the currently active modal
   * @returns {HTMLElement|null} Active modal element
   */
  getActiveModal () {
    return this.activeModal;
  }
}

// Singleton instance for global use
let modalInstance = null;

/**
 * Get or create the global modal instance
 * @param {Object} options - Modal options
 * @returns {Modal} Modal instance
 */
export function getModalInstance (options = {}) {
  if (!modalInstance) {
    modalInstance = new Modal(options);
  }
  return modalInstance;
}

// Export for global access if needed
if (typeof window !== 'undefined') {
  window.Modal = Modal;
  window.getModalInstance = getModalInstance;
}

export default Modal;
