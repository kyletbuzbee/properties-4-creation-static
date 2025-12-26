/**
 * RateLimiter - Form Rate Limiting Utility
 * Properties 4 Creations
 *
 * Features:
 * - Configurable attempts and time window
 * - Memory-based attempt tracking
 * - User identification via multiple methods
 * - Graceful error handling and cleanup
 */

export class RateLimiter {
  constructor (maxAttempts = 5, windowMs = 60000) {
    this.maxAttempts = maxAttempts;
    this.windowMs = windowMs;
    this.attempts = new Map();
    this.cleanupInterval = null;

    // Start cleanup interval to prevent memory leaks
    this.startCleanupInterval();
  }

  /**
   * Check if user is allowed to proceed
   * @param {string} key - User identifier
   * @returns {Object} Result with allowed status and retry information
   */
  isAllowed (key) {
    const now = Date.now();
    const userAttempts = this.attempts.get(key) || [];

    // Remove expired attempts (older than windowMs)
    const validAttempts = userAttempts.filter(
      (timestamp) => now - timestamp < this.windowMs
    );

    // Check if user has exceeded limit
    if (validAttempts.length >= this.maxAttempts) {
      const oldestAttempt = validAttempts[0];
      const retryAfter = Math.ceil(
        (oldestAttempt + this.windowMs - now) / 1000
      );

      return {
        allowed: false,
        retryAfter: Math.max(1, retryAfter), // Ensure positive value
        attempts: validAttempts.length,
        maxAttempts: this.maxAttempts
      };
    }

    // Add current attempt
    validAttempts.push(now);
    this.attempts.set(key, validAttempts);

    return {
      allowed: true,
      attempts: validAttempts.length,
      maxAttempts: this.maxAttempts,
      remainingAttempts: this.maxAttempts - validAttempts.length
    };
  }

  /**
   * Get user identifier using multiple methods
   * @returns {string} User identifier key
   */
  getUserIdentifier () {
    // Try multiple identification methods for better accuracy
    const identifiers = [
      () => this.getClientIP(),
      () => this.getFingerprint(),
      () => this.getSessionId(),
      () => this.getUserAgent()
    ];

    for (const identifier of identifiers) {
      try {
        const id = identifier();
        if (id && typeof id === 'string' && id.length > 0) {
          return id;
        }
      } catch (error) {
        // Failed to get identifier - silently continue
      }
    }

    // Fallback to a random but consistent identifier
    return this.getFallbackIdentifier();
  }

  /**
   * Get client IP address (best effort)
   * @returns {string|null} IP address or null if unavailable
   */
  getClientIP () {
    // This is a simplified version - in production, you'd get this from server headers
    // For client-side implementation, we use other methods
    return localStorage.getItem('client_ip') || null;
  }

  /**
   * Generate browser fingerprint
   * @returns {string} Browser fingerprint
   */
  getFingerprint () {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillText('Properties 4 Creations', 2, 2);

    const fingerprint = [
      navigator.userAgent,
      navigator.language,
      screen.width + 'x' + screen.height,
      new Date().getTimezoneOffset(),
      canvas.toDataURL()
    ].join('|');

    // Store fingerprint in localStorage for consistency
    let stored = localStorage.getItem('browser_fingerprint');
    if (!stored) {
      stored = this.hashString(fingerprint);
      localStorage.setItem('browser_fingerprint', stored);
    }

    return stored;
  }

  /**
   * Get or generate session ID
   * @returns {string} Session identifier
   */
  getSessionId () {
    let sessionId = sessionStorage.getItem('form_session_id');
    if (!sessionId) {
      sessionId =
        'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      sessionStorage.setItem('form_session_id', sessionId);
    }
    return sessionId;
  }

  /**
   * Get user agent string
   * @returns {string} User agent
   */
  getUserAgent () {
    return navigator.userAgent || 'unknown';
  }

  /**
   * Get fallback identifier when others fail
   * @returns {string} Random identifier
   */
  getFallbackIdentifier () {
    let fallbackId = localStorage.getItem('fallback_fingerprint');
    if (!fallbackId) {
      fallbackId = 'fallback_' + this.hashString(Date.now() + Math.random());
      localStorage.setItem('fallback_fingerprint', fallbackId);
    }
    return fallbackId;
  }

  /**
   * Simple hash function for string
   * @param {string} str - String to hash
   * @returns {string} Hash string
   */
  hashString (str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Get remaining attempts for user
   * @param {string} key - User identifier
   * @returns {number} Remaining attempts
   */
  getRemainingAttempts (key) {
    const userAttempts = this.attempts.get(key) || [];
    const now = Date.now();
    const validAttempts = userAttempts.filter(
      (timestamp) => now - timestamp < this.windowMs
    );

    return Math.max(0, this.maxAttempts - validAttempts.length);
  }

  /**
   * Get time until reset for user
   * @param {string} key - User identifier
   * @returns {number} Seconds until reset (0 if not rate limited)
   */
  getTimeUntilReset (key) {
    const userAttempts = this.attempts.get(key) || [];
    if (userAttempts.length === 0) return 0;

    const now = Date.now();
    const oldestAttempt = Math.min(...userAttempts);
    const timeUntilReset = Math.ceil(
      (oldestAttempt + this.windowMs - now) / 1000
    );

    return Math.max(0, timeUntilReset);
  }

  /**
   * Reset attempts for user (for testing or admin purposes)
   * @param {string} key - User identifier
   */
  resetUserAttempts (key) {
    this.attempts.delete(key);
  }

  /**
   * Get current attempt count for user
   * @param {string} key - User identifier
   * @returns {number} Current attempt count
   */
  getAttemptCount (key) {
    const userAttempts = this.attempts.get(key) || [];
    const now = Date.now();
    return userAttempts.filter((timestamp) => now - timestamp < this.windowMs)
      .length;
  }

  /**
   * Start cleanup interval to prevent memory leaks
   */
  startCleanupInterval () {
    // Clean up expired entries every 5 minutes
    this.cleanupInterval = setInterval(
      () => {
        this.cleanup();
      },
      5 * 60 * 1000
    );
  }

  /**
   * Clean up expired attempts to prevent memory leaks
   */
  cleanup () {
    const now = Date.now();
    const expiredKeys = [];

    for (const [key, attempts] of this.attempts.entries()) {
      const validAttempts = attempts.filter(
        (timestamp) => now - timestamp < this.windowMs
      );

      if (validAttempts.length === 0) {
        expiredKeys.push(key);
      } else if (validAttempts.length !== attempts.length) {
        this.attempts.set(key, validAttempts);
      }
    }

    // Remove keys with no valid attempts
    expiredKeys.forEach((key) => {
      this.attempts.delete(key);
    });

    // Cleaned up expired entries
  }

  /**
   * Get statistics about current rate limiting state
   * @returns {Object} Statistics object
   */
  getStats () {
    const now = Date.now();
    let totalActiveUsers = 0;
    let totalAttempts = 0;

    for (const attempts of this.attempts.values()) {
      const validAttempts = attempts.filter(
        (timestamp) => now - timestamp < this.windowMs
      );
      if (validAttempts.length > 0) {
        totalActiveUsers++;
        totalAttempts += validAttempts.length;
      }
    }

    return {
      totalActiveUsers,
      totalAttempts,
      maxAttempts: this.maxAttempts,
      windowMs: this.windowMs,
      mapSize: this.attempts.size
    };
  }

  /**
   * Destroy rate limiter and clean up resources
   */
  destroy () {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }

    this.attempts.clear();
  }
}

/**
 * Create rate limiter instance with defaults for Properties 4 Creations
 * @returns {RateLimiter} Configured rate limiter instance
 */
export function createFormRateLimiter () {
  return new RateLimiter(3, 60000); // 3 attempts per minute
}

/**
 * Rate limiter for contact forms (more restrictive)
 * @returns {RateLimiter} Contact form rate limiter
 */
export function createContactFormRateLimiter () {
  return new RateLimiter(2, 300000); // 2 attempts per 5 minutes
}

/**
 * Rate limiter for application forms (moderate)
 * @returns {RateLimiter} Application form rate limiter
 */
export function createApplicationRateLimiter () {
  return new RateLimiter(5, 600000); // 5 attempts per 10 minutes
}

// Export for global access
if (typeof window !== 'undefined') {
  window.RateLimiter = RateLimiter;
  window.createFormRateLimiter = createFormRateLimiter;
  window.createContactFormRateLimiter = createContactFormRateLimiter;
  window.createApplicationRateLimiter = createApplicationRateLimiter;
}

export default RateLimiter;
