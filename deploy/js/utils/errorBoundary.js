/**
 * ErrorBoundary - Comprehensive Error Handling System
 * Properties 4 Creations
 *
 * Features:
 * - Global error catching for unhandled exceptions
 * - Promise rejection handling
 * - User-friendly fallback UI
 * - Error logging and monitoring integration
 * - Graceful degradation and recovery
 */

export class ErrorBoundary {
  constructor (options = {}) {
    this.options = {
      fallbackUI: null,
      enableLogging: true,
      enableMonitoring: true,
      enableRetry: true,
      maxRetries: 3,
      ...options
    };

    this.errorCount = 0;
    this.lastError = null;
    this.retryCount = 0;
    this.errorHistory = [];
    this.isReportingError = false;

    // Initialize error boundary
    this.setupGlobalHandlers();
  }

  /**
   * Set up global error and unhandled rejection handlers
   */
  setupGlobalHandlers () {
    // Handle JavaScript runtime errors
    this.originalErrorHandler = window.onerror;
    window.onerror = (message, source, lineno, colno, error) => {
      this.handleError(error || new Error(message), {
        type: 'runtime',
        source,
        lineno,
        colno
      });

      // Call original handler if it exists
      if (this.originalErrorHandler) {
        return this.originalErrorHandler(message, source, lineno, colno, error);
      }

      return false; // Don't prevent default
    };

    // Handle unhandled promise rejections
    this.originalUnhandledRejection = window.onunhandledrejection;
    window.onunhandledrejection = (event) => {
      this.handleError(event.reason, {
        type: 'unhandledRejection',
        promise: event.promise
      });

      // Prevent default browser behavior
      event.preventDefault();
    };

    // ErrorBoundary: Global error handlers initialized
  }

  /**
   * Handle and process errors
   * @param {Error} error - The error object
   * @param {Object} context - Additional error context
   */
  handleError (error, context = {}) {
    if (this.isReportingError) {
      // Prevent infinite recursion
      return;
    }

    this.isReportingError = true;

    try {
      // Create enhanced error object
      const enhancedError = this.enhanceError(error, context);

      // Update internal state
      this.lastError = enhancedError;
      this.errorCount++;
      this.errorHistory.push({
        error: enhancedError,
        timestamp: new Date().toISOString(),
        context
      });

      // Keep only last 10 errors in history
      if (this.errorHistory.length > 10) {
        this.errorHistory = this.errorHistory.slice(-10);
      }

      // Log error if enabled
      if (this.options.enableLogging) {
        this.logError(enhancedError, context);
      }

      // Report to monitoring service if enabled
      if (this.options.enableMonitoring) {
        this.reportToMonitoring(enhancedError, context);
      }

      // Display user-friendly fallback UI
      this.displayFallbackUI(enhancedError);

      // Attempt recovery if enabled
      if (this.options.enableRetry) {
        this.attemptRecovery(enhancedError);
      }
    } catch (reportingError) {
      // Fallback error handling if reporting itself fails
      // eslint-disable-next-line no-console
      console.error('ErrorBoundary: Failed to handle error:', reportingError);
      // eslint-disable-next-line no-console
      console.error('Original error:', error);
    } finally {
      this.isReportingError = false;
    }
  }

  /**
   * Enhance error object with additional information
   * @param {Error} error - Original error
   * @param {Object} context - Error context
   * @returns {Object} Enhanced error object
   */
  enhanceError (error, context) {
    const enhanced = {
      message: error?.message || 'Unknown error',
      stack: error?.stack || 'No stack trace available',
      name: error?.name || 'Error',
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      context,
      errorId: this.generateErrorId()
    };

    // Add additional context for different error types
    switch (context.type) {
    case 'unhandledRejection':
      enhanced.promise = context.promise;
      break;
    case 'runtime':
      enhanced.source = context.source;
      enhanced.lineno = context.lineno;
      enhanced.colno = context.colno;
      break;
    }

    return enhanced;
  }

  /**
   * Generate unique error ID
   * @returns {string} Unique error identifier
   */
  generateErrorId () {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Log error to console with enhanced formatting
   * @param {Object} error - Enhanced error object
   * @param {Object} context - Error context
   */
  logError (error, context) {
    const logMessage = `
🚨 Error Boundary Caught Error
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Error ID: ${error.errorId}
Message: ${error.message}
Type: ${context.type || 'unknown'}
URL: ${error.url}
Time: ${error.timestamp}
User Agent: ${error.userAgent}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    `.trim();

    // eslint-disable-next-line no-console
    console.groupCollapsed(logMessage);
    // eslint-disable-next-line no-console
    console.error('Stack Trace:', error.stack);
    // eslint-disable-next-line no-console
    console.error('Full Error Object:', error);
    // eslint-disable-next-line no-console
    console.error('Context:', context);
    // eslint-disable-next-line no-console
    console.groupEnd();
  }

  /**
   * Report error to monitoring service (Sentry, Rollbar, etc.)
   * @param {Object} error - Enhanced error object
   * @param {Object} context - Error context
   */
  async reportToMonitoring (error, context) {
    try {
      // Check if monitoring service is available
      if (typeof window.Sentry !== 'undefined') {
        // Sentry integration
        window.Sentry.withScope((scope) => {
          scope.setTag('errorBoundary', 'true');
          scope.setContext('errorBoundary', {
            errorId: error.errorId,
            errorCount: this.errorCount,
            context
          });
          scope.captureException(error);
        });
      } else if (typeof window.Rollbar !== 'undefined') {
        // Rollbar integration
        window.Rollbar.error(error, {
          custom: {
            errorId: error.errorId,
            errorCount: this.errorCount,
            context
          }
        });
      } else {
        // Fallback to custom error reporting endpoint
        await this.reportToCustomEndpoint(error, context);
      }
    } catch (reportingError) {
      // eslint-disable-next-line no-console
      console.warn(
        'ErrorBoundary: Failed to report to monitoring service:',
        reportingError
      );
    }
  }

  /**
   * Report to custom error endpoint
   * @param {Object} error - Enhanced error object
   * @param {Object} context - Error context
   */
  async reportToCustomEndpoint (error, context) {
    try {
      await fetch('/api/error-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          error,
          context,
          metadata: {
            errorCount: this.errorCount,
            userSession: this.getSessionId(),
            timestamp: new Date().toISOString()
          }
        })
      });
    } catch (fetchError) {
      // Silent fail for custom endpoint
      // eslint-disable-next-line no-console
      console.warn(
        'ErrorBoundary: Failed to report to custom endpoint:',
        fetchError
      );
    }
  }

  /**
   * Get current session ID for error tracking
   * @returns {string} Session identifier
   */
  getSessionId () {
    let sessionId = sessionStorage.getItem('error_boundary_session');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('error_boundary_session', sessionId);
    }
    return sessionId;
  }

  /**
   * Display user-friendly fallback UI
   * @param {Object} error - Enhanced error object
   */
  displayFallbackUI (error) {
    // Check if we have a custom fallback UI
    if (
      this.options.fallbackUI &&
      typeof this.options.fallbackUI === 'function'
    ) {
      const fallbackContent = this.options.fallbackUI(
        error,
        this.getRetryOptions()
      );
      this.renderFallbackUI(fallbackContent);
      return;
    }

    // Default fallback UI
    const defaultFallback = this.createDefaultFallbackUI(error);
    this.renderFallbackUI(defaultFallback);
  }

  /**
   * Create default fallback UI content
   * @param {Object} error - Enhanced error object
   * @returns {string} HTML content for fallback UI
   */
  createDefaultFallbackUI (error) {
    const isCritical = this.errorCount > 3;
    const canRetry = this.retryCount < this.options.maxRetries && !isCritical;

    return `
      <div class="error-boundary" role="alert" aria-live="assertive">
        <div class="error-boundary__content">
          <div class="error-boundary__icon" aria-hidden="true">
            ${isCritical ? '⚠️' : '🔧'}
          </div>
          
          <h2 class="error-boundary__title">
            ${isCritical ? 'System Error' : 'Something went wrong'}
          </h2>
          
          <p class="error-boundary__message">
            ${
  isCritical
    ? 'We\'re experiencing technical difficulties. Please try refreshing the page.'
    : 'We encountered an unexpected error. You can try again or refresh the page.'
}
          </p>
          
          <div class="error-boundary__actions">
            ${
  canRetry
    ? `
              <button 
                type="button" 
                class="btn btn-primary error-boundary__retry"
                onclick="window.ErrorBoundaryInstance?.retry()"
              >
                Try Again
              </button>
            `
    : ''
}
            
            <button 
              type="button" 
              class="btn btn-secondary error-boundary__refresh"
              onclick="location.reload()"
            >
              Refresh Page
            </button>
            
            <button 
              type="button" 
              class="btn btn-link error-boundary__details"
              onclick="window.ErrorBoundaryInstance?.showDetails()"
            >
              Show Details
            </button>
          </div>
          
          <div class="error-boundary__details-content" style="display: none;" id="error-details">
            <p><strong>Error ID:</strong> ${error.errorId}</p>
            <p><strong>Time:</strong> ${error.timestamp}</p>
            <p><strong>Error Count:</strong> ${this.errorCount}</p>
            <details>
              <summary>Technical Details</summary>
              <pre>${error.stack}</pre>
            </details>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Render fallback UI to the page
   * @param {string} content - HTML content to render
   */
  renderFallbackUI (content) {
    // Find appropriate container
    const container = document.getElementById('app') || document.body;

    // Clear existing content
    container.innerHTML = content;

    // Add CSS if not already present
    this.injectErrorBoundaryStyles();

    // Make error boundary instance globally accessible for callbacks
    window.ErrorBoundaryInstance = this;

    // Focus management for accessibility
    const firstFocusable = container.querySelector(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (firstFocusable) {
      firstFocusable.focus();
    }
  }

  /**
   * Inject CSS styles for error boundary UI
   */
  injectErrorBoundaryStyles () {
    if (document.getElementById('error-boundary-styles')) {
      return; // Styles already injected
    }

    const styles = `
      .error-boundary {
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 2rem;
        background-color: #f8f9fa;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }
      
      .error-boundary__content {
        max-width: 500px;
        text-align: center;
        background: white;
        padding: 3rem 2rem;
        border-radius: 12px;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
      }
      
      .error-boundary__icon {
        font-size: 3rem;
        margin-bottom: 1rem;
      }
      
      .error-boundary__title {
        font-size: 1.5rem;
        font-weight: 600;
        color: #212529;
        margin-bottom: 1rem;
      }
      
      .error-boundary__message {
        color: #6c757d;
        margin-bottom: 2rem;
        line-height: 1.6;
      }
      
      .error-boundary__actions {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
        align-items: center;
      }
      
      .error-boundary__actions .btn {
        width: 100%;
        max-width: 200px;
      }
      
      .error-boundary__details-content {
        margin-top: 2rem;
        padding-top: 2rem;
        border-top: 1px solid #e9ecef;
        text-align: left;
        font-size: 0.875rem;
        color: #6c757d;
      }
      
      .error-boundary__details-content pre {
        background: #f8f9fa;
        padding: 1rem;
        border-radius: 6px;
        overflow-x: auto;
        font-size: 0.75rem;
        margin-top: 1rem;
      }
      
      @media (max-width: 576px) {
        .error-boundary {
          padding: 1rem;
        }
        
        .error-boundary__content {
          padding: 2rem 1.5rem;
        }
      }
    `;

    const styleSheet = document.createElement('style');
    styleSheet.id = 'error-boundary-styles';
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);
  }

  /**
   * Get retry options for fallback UI
   * @returns {Object} Retry configuration
   */
  getRetryOptions () {
    return {
      canRetry: this.retryCount < this.options.maxRetries,
      retryCount: this.retryCount,
      maxRetries: this.options.maxRetries,
      errorCount: this.errorCount
    };
  }

  /**
   * Attempt to recover from error
   * @param {Object} error - Enhanced error object
   */
  attemptRecovery () {
    // Simple recovery strategy: clear error state after a delay
    setTimeout(() => {
      this.retryCount = 0;
    }, 30000); // Reset retry count after 30 seconds
  }

  /**
   * Retry operation (called from fallback UI)
   */
  retry () {
    if (this.retryCount < this.options.maxRetries) {
      this.retryCount++;

      // Hide error UI and try to restore normal state
      const container = document.getElementById('app') || document.body;
      container.innerHTML = '';

      // Trigger a page reload to reset state
      window.location.reload();
    }
  }

  /**
   * Show detailed error information (called from fallback UI)
   */
  showDetails () {
    const detailsElement = document.getElementById('error-details');
    if (detailsElement) {
      detailsElement.style.display =
        detailsElement.style.display === 'none' ? 'block' : 'none';
    }
  }

  /**
   * Get error statistics
   * @returns {Object} Error statistics
   */
  getStats () {
    return {
      errorCount: this.errorCount,
      lastError: this.lastError,
      retryCount: this.retryCount,
      errorHistory: this.errorHistory,
      isActive: true
    };
  }

  /**
   * Reset error boundary state (for testing)
   */
  reset () {
    this.errorCount = 0;
    this.lastError = null;
    this.retryCount = 0;
    this.errorHistory = [];
    this.isReportingError = false;
  }

  /**
   * Destroy error boundary and restore original handlers
   */
  destroy () {
    // Restore original error handlers
    window.onerror = this.originalErrorHandler;
    window.onunhandledrejection = this.originalUnhandledRejection;

    // Clear state
    this.reset();

    // Remove global reference
    if (window.ErrorBoundaryInstance === this) {
      delete window.ErrorBoundaryInstance;
    }

    // ErrorBoundary: Destroyed and handlers restored
  }
}

/**
 * Create and initialize global error boundary
 * @param {Object} options - Error boundary options
 * @returns {ErrorBoundary} Error boundary instance
 */
export function createGlobalErrorBoundary (options = {}) {
  const errorBoundary = new ErrorBoundary(options);

  // Store globally for fallback UI callbacks
  window.ErrorBoundaryInstance = errorBoundary;

  return errorBoundary;
}

/**
 * Create error boundary with Properties 4 Creations defaults
 * @returns {ErrorBoundary} Configured error boundary instance
 */
export function createPropertiesErrorBoundary () {
  return new ErrorBoundary({
    fallbackUI: () => {
      return `
        <div class="error-boundary" role="alert">
          <div class="error-boundary__content">
            <div class="error-boundary__icon" aria-hidden="true">🏠</div>
            <h2 class="error-boundary__title">Properties 4 Creations</h2>
            <p class="error-boundary__message">
              We're experiencing technical difficulties with our housing services.
              Please try refreshing the page or contact support if the problem persists.
            </p>
            <div class="error-boundary__actions">
              <button
                type="button"
                class="btn btn-secondary error-boundary__refresh"
                onclick="location.reload()"
              >
                Refresh Page
              </button>
            </div>
          </div>
        </div>
      `;
    }
  });
}
