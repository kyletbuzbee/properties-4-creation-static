/**
 * Sentry Error Monitoring Integration
 * Properties 4 Creations
 * 
 * This module integrates Sentry for production error monitoring
 */

// Only initialize Sentry in production or when explicitly enabled
const shouldInitializeSentry = () => {
  // Check if we're in production
  const isProduction = process.env.NODE_ENV === 'production';
  
  // Check if Sentry is explicitly enabled via environment variable or global flag
  const isSentryEnabled = process.env.ENABLE_SENTRY === 'true' || 
                         window.ENABLE_SENTRY === true ||
                         document.querySelector('meta[name="sentry-enabled"]')?.content === 'true';
  
  return isProduction || isSentryEnabled;
};



// Initialize Sentry if conditions are met
if (shouldInitializeSentry()) {
  // Load Sentry SDK dynamically to avoid build issues
  (function () {
    // Create script element for Sentry
    const script = document.createElement('script');
    script.src = 'https://browser.sentry-cdn.com/7.74.1/bundle.min.js';
    script.crossOrigin = 'anonymous';
    script.integrity = 'sha384-7a1dkAyUoJvJ4F7fBZZZVxO3j7ZOtCpF3n8YwRrYl12JkRr3sS0l3XGwGx1N9s';
    
    script.onload = function () {
      // Helper function to determine page type
      function getPageType () {
        const path = window.location.pathname;
        if (path === '/' || path === '/index.html') return 'homepage';
        if (path.includes('properties')) return 'properties';
        if (path.includes('apply')) return 'application';
        if (path.includes('contact')) return 'contact';
        if (path.includes('about')) return 'about';
        if (path.includes('faq')) return 'faq';
        if (path.includes('404')) return 'error_404';
        return 'other';
      }

      // Initialize Sentry after script loads
      if (window.Sentry) {
        window.Sentry.init({
          dsn: process.env.SENTRY_DSN || window.SENTRY_DSN,
          environment: process.env.NODE_ENV || 'production',
          
          // Configure what to capture
          tracesSampleRate: 0.1, // Capture 10% of transactions
          replaysSessionSampleRate: 0.1, // Capture 10% of sessions
          replaysOnErrorSampleRate: 1.0, // Capture 100% of sessions when there's an error
          
          // Filter out noise
          beforeSend (event) {
            // Don't send events in development
            if (process.env.NODE_ENV === 'development') {
              return null;
            }
            
            // Filter out common non-critical errors
            const ignoredErrors = [
              'ResizeObserver loop limit exceeded',
              'Non-Error promise rejection captured',
              'Loading CSS chunk',
              'Loading chunk',
              'Network Error',
              'fetch'
            ];
            
            const errorMessage = event.message || '';
            const errorType = event.exception?.values?.[0]?.type || '';
            
            for (const ignored of ignoredErrors) {
              if (errorMessage.includes(ignored) || errorType.includes(ignored)) {
                return null; // Don't send this event
              }
            }
            
            return event;
          },
          
          // Add context
          initialScope: {
            tags: {
              project: 'properties4creations',
              version: process.env.npm_package_version || '1.0.0'
            },
            extra: {
              userAgent: navigator.userAgent,
              viewport: `${window.innerWidth}x${window.innerHeight}`,
              url: window.location.href
            }
          }
        });
        
        // Add custom error tracking
        window.Sentry.setTag('page_type', getPageType());
        window.Sentry.setContext('user_session', {
          timestamp: new Date().toISOString(),
          referrer: document.referrer,
          language: navigator.language
        });
      }
    };
    
    document.head.appendChild(script);
  })();
  
  // Enhanced error handling for forms
  document.addEventListener('DOMContentLoaded', () => {
    // Track form submissions
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
      form.addEventListener('submit', () => {
        if (window.Sentry) {
          window.Sentry.addBreadcrumb({
            category: 'form',
            message: `Form submitted: ${form.id || 'anonymous'}`,
            level: 'info'
          });
        }
      });
    });
    
    // Track navigation
    window.addEventListener('popstate', () => {
      if (window.Sentry) {
        window.Sentry.addBreadcrumb({
          category: 'navigation',
          message: `Navigated to: ${window.location.pathname}`,
          level: 'info'
        });
      }
    });
  });
  
  // Global error handler
  window.addEventListener('error', (event) => {
    if (window.Sentry) {
      window.Sentry.captureException(event.error);
    }
  });
  
  // Unhandled promise rejection handler
  window.addEventListener('unhandledrejection', (event) => {
    if (window.Sentry) {
      window.Sentry.captureException(new Error(`Unhandled Promise Rejection: ${event.reason}`));
    }
  });
} else {
  // Create mock Sentry object for development
  window.Sentry = {
    init: () => {},
    captureException: () => {},
    captureMessage: () => {},
    addBreadcrumb: () => {},
    setTag: () => {},
    setContext: () => {},
    setUser: () => {}
  };
  
  
}

// Export for use in other modules
export default window.Sentry;