/**
 * ErrorHandler - Global Error Handling Utility
 * Properties 4 Creations
 *
 * Features:
 * - Global error catching (JavaScript errors, unhandled rejections)
 * - User-friendly error messages
 * - Error logging and reporting
 * - Error boundary for async operations
 * - Toast notifications for errors
 */

export class ErrorHandler {
  constructor (options = {}) {
    this.options = {
      logToConsole: true,
      showUserNotification: true,
      reportToServer: true,
      serverEndpoint: '/api/error-report',
      maxErrors: 100,
      deduplicateErrors: true,
      deduplicateWindow: 5000, // ms
      onError: null,
      ...options
    };

    this.errorLog = [];
    this.recentErrors = new Map();
    this.isInitialized = false;

    this.init();
  }

  /**
   * Initialize global error handlers
   */
  init () {
    if (this.isInitialized) return;

    // Global JavaScript error handler
    window.addEventListener('error', (event) => {
      this.handleError({
        type: 'JavaScript Error',
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack,
        timestamp: new Date().toISOString()
      });
    });

    // Unhandled promise rejection handler
    window.addEventListener('unhandledrejection', (event) => {
      this.handleError({
        type: 'Unhandled Promise Rejection',
        message: event.reason?.message || String(event.reason),
        stack: event.reason?.stack,
        timestamp: new Date().toISOString()
      });
    });

    // Network error handler (fetch)
    this.wrapFetch();

    this.isInitialized = true;
  }

  /**
   * Wrap global fetch to catch network errors
   */
  wrapFetch () {
    const originalFetch = window.fetch;
    const self = this;

    window.fetch = async function (...args) {
      try {
        const response = await originalFetch.apply(this, args);

        if (!response.ok) {
          self.handleError({
            type: 'Network Error',
            message: `HTTP ${response.status}: ${response.statusText}`,
            url: args[0],
            status: response.status,
            timestamp: new Date().toISOString()
          });
        }

        return response;
      } catch (error) {
        self.handleError({
          type: 'Fetch Error',
          message: error.message,
          url: args[0],
          stack: error.stack,
          timestamp: new Date().toISOString()
        });
        throw error;
      }
    };
  }

  /**
   * Handle an error
   * @param {Object} error - Error object
   */
  handleError (error) {
    // Deduplicate errors
    if (this.options.deduplicateErrors) {
      const errorKey = `${error.type}:${error.message}`;
      const lastOccurrence = this.recentErrors.get(errorKey);

      if (
        lastOccurrence &&
        Date.now() - lastOccurrence < this.options.deduplicateWindow
      ) {
        return; // Skip duplicate error
      }

      this.recentErrors.set(errorKey, Date.now());
    }

    // Add context
    error.url = error.url || window.location.href;
    error.userAgent = navigator.userAgent;
    error.timestamp = error.timestamp || new Date().toISOString();

    // Log to console
    if (this.options.logToConsole) {
      // Error logged silently
    }

    // Store in error log
    this.logError(error);

    // Show user notification
    if (this.options.showUserNotification) {
      this.showNotification(error);
    }

    // Report to server
    if (this.options.reportToServer) {
      this.reportError(error);
    }

    // Custom callback
    if (typeof this.options.onError === 'function') {
      this.options.onError(error);
    }
  }

  /**
   * Log error to internal storage
   * @param {Object} error - Error object
   */
  logError (error) {
    this.errorLog.push(error);

    // Limit error log size
    if (this.errorLog.length > this.options.maxErrors) {
      this.errorLog.shift();
    }

    // Store in sessionStorage for persistence
    try {
      sessionStorage.setItem(
        'p4c_error_log',
        JSON.stringify(this.errorLog.slice(-20))
      );
    } catch (e) {
      // Storage might be full or disabled
    }
  }

  /**
   * Show user-friendly notification
   * @param {Object} error - Error object
   */
  showNotification (error) {
    const message = this.getUserFriendlyMessage(error);

    // Create or get toast container
    let toastContainer = document.getElementById('error-toast-container');
    if (!toastContainer) {
      toastContainer = document.createElement('div');
      toastContainer.id = 'error-toast-container';
      toastContainer.className = 'toast-container';
      toastContainer.setAttribute('role', 'alert');
      toastContainer.setAttribute('aria-live', 'polite');
      document.body.appendChild(toastContainer);
    }

    // Create toast
    const toast = document.createElement('div');
    toast.className = 'toast toast--error';
    toast.innerHTML = `
      <div class="toast__icon" aria-hidden="true">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
      </div>
      <div class="toast__content">
        <p class="toast__message">${this.escapeHtml(message)}</p>
      </div>
      <button class="toast__close" aria-label="Dismiss notification">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M18 6L6 18M6 6l12 12"/>
        </svg>
      </button>
    `;

    // Close button handler
    const closeBtn = toast.querySelector('.toast__close');
    closeBtn.addEventListener('click', () => {
      toast.classList.add('toast--hiding');
      setTimeout(() => toast.remove(), 300);
    });

    // Add to container
    toastContainer.appendChild(toast);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (toast.parentElement) {
        toast.classList.add('toast--hiding');
        setTimeout(() => toast.remove(), 300);
      }
    }, 5000);
  }

  /**
   * Get user-friendly error message
   * @param {Object} error - Error object
   * @returns {string} User-friendly message
   */
  getUserFriendlyMessage (error) {
    const messages = {
      'Network Error':
        'Unable to connect to the server. Please check your internet connection.',
      'Fetch Error': 'Failed to load data. Please try again later.',
      'JavaScript Error': 'Something went wrong. Please refresh the page.',
      'Unhandled Promise Rejection':
        'An unexpected error occurred. Please try again.',
      default: 'An error occurred. Please try again or contact support.'
    };

    // Check for specific HTTP status codes
    if (error.status) {
      switch (error.status) {
      case 400:
        return 'Invalid request. Please check your input and try again.';
      case 401:
        return 'Please log in to continue.';
      case 403:
        return 'You don\'t have permission to access this resource.';
      case 404:
        return 'The requested resource was not found.';
      case 429:
        return 'Too many requests. Please wait a moment and try again.';
      case 500:
        return 'Server error. Our team has been notified.';
      case 503:
        return 'Service temporarily unavailable. Please try again later.';
      }
    }

    return messages[error.type] || messages.default;
  }

  /**
   * Report error to server
   * @param {Object} error - Error object
   */
  async reportError (error) {
    // Don't report in development
    if (
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1'
    ) {
      return;
    }

    try {
      await fetch(this.options.serverEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...error,
          sessionId: this.getSessionId(),
          pageUrl: window.location.href,
          referrer: document.referrer
        })
      });
    } catch (e) {
      // Silently fail - don't create infinite error loop
      // Failed to report error to server - silently continue
    }
  }

  /**
   * Get or create session ID
   * @returns {string} Session ID
   */
  getSessionId () {
    let sessionId = sessionStorage.getItem('p4c_session_id');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('p4c_session_id', sessionId);
    }
    return sessionId;
  }

  /**
   * Escape HTML to prevent XSS
   * @param {string} text - Text to escape
   * @returns {string} Escaped text
   */
  escapeHtml (text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Create an error boundary for async operations
   * @param {Function} fn - Async function to wrap
   * @param {Object} options - Options
   * @returns {Function} Wrapped function
   */
  createBoundary (fn, options = {}) {
    const self = this;
    const { fallback, rethrow = false } = options;

    return async function (...args) {
      try {
        return await fn.apply(this, args);
      } catch (error) {
        self.handleError({
          type: 'Async Error',
          message: error.message,
          stack: error.stack,
          functionName: fn.name || 'anonymous',
          timestamp: new Date().toISOString()
        });

        if (typeof fallback === 'function') {
          return fallback(error);
        }

        if (rethrow) {
          throw error;
        }

        return null;
      }
    };
  }

  /**
   * Manually log an error
   * @param {string} message - Error message
   * @param {Object} context - Additional context
   */
  log (message, context = {}) {
    this.handleError({
      type: 'Manual Log',
      message,
      ...context,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Get error log
   * @returns {Array} Error log
   */
  getErrorLog () {
    return [...this.errorLog];
  }

  /**
   * Clear error log
   */
  clearErrorLog () {
    this.errorLog = [];
    this.recentErrors.clear();
    sessionStorage.removeItem('p4c_error_log');
  }

  /**
   * Get error statistics
   * @returns {Object} Error statistics
   */
  getStats () {
    const stats = {
      total: this.errorLog.length,
      byType: {},
      recent: this.errorLog.slice(-5)
    };

    this.errorLog.forEach((error) => {
      stats.byType[error.type] = (stats.byType[error.type] || 0) + 1;
    });

    return stats;
  }
}

// Singleton instance
let errorHandlerInstance = null;

/**
 * Get or create the global error handler instance
 * @param {Object} options - Error handler options
 * @returns {ErrorHandler} Error handler instance
 */
export function getErrorHandler (options = {}) {
  if (!errorHandlerInstance) {
    errorHandlerInstance = new ErrorHandler(options);
  }
  return errorHandlerInstance;
}

/**
 * Initialize error handler with default options
 */
export function initErrorHandler () {
  return getErrorHandler({
    logToConsole: true,
    showUserNotification: true,
    reportToServer: false
  });
}

// Export for global access
if (typeof window !== 'undefined') {
  window.ErrorHandler = ErrorHandler;
  window.getErrorHandler = getErrorHandler;
  window.initErrorHandler = initErrorHandler;
}

export default ErrorHandler;
