/**
 * ARIA Live Regions - Dynamic Content Accessibility Utility
 * Properties 4 Creations
 *
 * Features:
 * - Manages aria-live regions for dynamic content updates
 * - Supports polite and assertive live regions
 * - WCAG 2.2 AA compliance for screen readers
 * - Queue management for multiple announcements
 */

export class AriaLiveRegions {
  constructor (options = {}) {
    this.options = {
      containerId: 'aria-live-container',
      politeRegionId: 'aria-live-polite',
      assertiveRegionId: 'aria-live-assertive',
      maxQueueSize: 10,
      announcementDelay: 100,
      ...options
    };

    this.announcementQueue = [];
    this.isProcessing = false;
    this.regionContainer = null;

    this.init();
  }

  /**
   * Initialize ARIA live regions
   */
  init () {
    this.createRegionContainer();
    this.createLiveRegions();
  }

  /**
   * Create container for live regions
   */
  createRegionContainer () {
    let container = document.getElementById(this.options.containerId);

    if (!container) {
      container = document.createElement('div');
      container.id = this.options.containerId;
      container.style.cssText = `
        position: absolute;
        left: -10000px;
        width: 1px;
        height: 1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
      `;

      // Add screen reader only class for better styling control
      container.className = 'sr-only';

      document.body.appendChild(container);
    }

    this.regionContainer = container;
  }

  /**
   * Create polite and assertive live regions
   */
  createLiveRegions () {
    // Polite region for non-critical updates
    this.politeRegion = document.createElement('div');
    this.politeRegion.id = this.options.politeRegionId;
    this.politeRegion.setAttribute('aria-live', 'polite');
    this.politeRegion.setAttribute('aria-atomic', 'true');
    this.politeRegion.setAttribute('aria-relevant', 'additions text');
    this.politeRegion.className = 'aria-live-region aria-live-polite';

    // Assertive region for critical updates (errors, alerts)
    this.assertiveRegion = document.createElement('div');
    this.assertiveRegion.id = this.options.assertiveRegionId;
    this.assertiveRegion.setAttribute('aria-live', 'assertive');
    this.assertiveRegion.setAttribute('aria-atomic', 'true');
    this.assertiveRegion.setAttribute('aria-relevant', 'additions text');
    this.assertiveRegion.className = 'aria-live-region aria-live-assertive';

    // Append to container
    this.regionContainer.appendChild(this.politeRegion);
    this.regionContainer.appendChild(this.assertiveRegion);
  }

  /**
   * Announce message using appropriate live region
   * @param {string} message - Message to announce
   * @param {string} priority - 'polite' or 'assertive'
   * @param {Object} options - Additional options
   */
  announce (message, priority = 'polite', options = {}) {
    const { queue = true } = options;

    const announcement = {
      message: this.sanitizeMessage(message),
      priority,
      timestamp: Date.now(),
      id: this.generateId()
    };

    if (queue && this.announcementQueue.length >= this.options.maxQueueSize) {
      // Remove oldest announcement if queue is full
      this.announcementQueue.shift();
    }

    this.announcementQueue.push(announcement);

    if (!this.isProcessing) {
      this.processQueue();
    }
  }

  /**
   * Process announcement queue
   */
  async processQueue () {
    if (this.isProcessing || this.announcementQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    while (this.announcementQueue.length > 0) {
      const announcement = this.announcementQueue.shift();
      await this.deliverAnnouncement(announcement);

      // Small delay between announcements for better screen reader experience
      if (this.announcementQueue.length > 0) {
        await this.delay(200);
      }
    }

    this.isProcessing = false;
  }

  /**
   * Deliver announcement to appropriate live region
   * @param {Object} announcement - Announcement object
   */
  async deliverAnnouncement (announcement) {
    const { message, priority } = announcement;
    const region =
      priority === 'assertive' ? this.assertiveRegion : this.politeRegion;

    // Clear region if requested
    region.textContent = '';

    // Wait a brief moment before setting content for better screen reader detection
    await this.delay(50);

    // Set the announcement message
    region.textContent = message;

    // Log announcement for debugging (disabled in production)
    // console.log(`[ARIA Live] ${priority.toUpperCase()}: ${message}`);
  }

  /**
   * Announce form validation error
   * @param {string} fieldName - Name of the field with error
   * @param {string} message - Error message
   */
  announceValidationError (fieldName, message) {
    const announcement = `Error in ${fieldName}: ${message}`;
    this.announce(announcement, 'assertive');
  }

  /**
   * Announce form validation success
   * @param {string} fieldName - Name of the field that's now valid
   */
  announceValidationSuccess (fieldName) {
    const announcement = `${fieldName} is now valid`;
    this.announce(announcement, 'polite');
  }

  /**
   * Announce form submission status
   * @param {string} status - 'success', 'error', 'loading'
   * @param {string} message - Status message
   */
  announceFormStatus (status, message) {
    const priority = status === 'error' ? 'assertive': 'polite';
    this.announce(message, priority);
  }

  /**
   * Announce filter/search results
   * @param {number} count - Number of results
   * @param {string} filterType - Type of filter applied
   */
  announceFilterResults (count, filterType) {
    let message;
    if (count === 0) {
      message = `No results found for ${filterType}`;
    } else if (count === 1) {
      message = `1 result found for ${filterType}`;
    } else {
      message = `${count} results found for ${filterType}`;
    }

    this.announce(message, 'polite');
  }

  /**
   * Announce page navigation
   * @param {string} pageName - Name of the page navigated to
   */
  announcePageNavigation (pageName) {
    const message = `Navigated to ${pageName} page`;
    this.announce(message, 'polite');
  }

  /**
   * Announce modal state changes
   * @param {string} action - 'opened', 'closed'
   * @param {string} modalName - Name of the modal
   */
  announceModalState (action, modalName) {
    const message =
      action === 'opened'
        ? `${modalName} modal opened`
        : `${modalName} modal closed`;
    this.announce(message, 'polite');
  }

  /**
   * Announce dynamic content updates
   * @param {string} contentType - Type of content updated
   * @param {string} updateMessage - Description of the update
   */
  announceContentUpdate (contentType, updateMessage) {
    const message = `${contentType} updated: ${updateMessage}`;
    this.announce(message, 'polite');
  }

  /**
   * Clear all pending announcements
   */
  clearQueue () {
    this.announcementQueue = [];
    this.isProcessing = false;
  }

  /**
   * Clear specific live region
   * @param {string} priority - 'polite' or 'assertive'
   */
  clearRegion (priority = 'polite') {
    const region =
      priority === 'assertive' ? this.assertiveRegion : this.politeRegion;
    region.textContent = '';
  }

  /**
   * Clear both live regions
   */
  clearAllRegions () {
    this.clearRegion('polite');
    this.clearRegion('assertive');
  }

  /**
   * Sanitize message to prevent XSS
   * @param {string} message - Message to sanitize
   * @returns {string} Sanitized message
   */
  sanitizeMessage (message) {
    if (typeof message !== 'string') {
      return '';
    }

    // Basic sanitization - remove potential script tags
    return message
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<[^>]*>/g, '')
      .trim();
  }

  /**
   * Generate unique ID for announcements
   * @returns {string} Unique ID
   */
  generateId () {
    return `announcement_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Delay helper function
   * @param {number} ms - Milliseconds to delay
   * @returns {Promise} Promise that resolves after delay
   */
  delay (ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Get current queue status
   * @returns {Object} Queue status information
   */
  getQueueStatus () {
    return {
      queueLength: this.announcementQueue.length,
      isProcessing: this.isProcessing,
      maxQueueSize: this.options.maxQueueSize,
      regionsReady: {
        polite: !!this.politeRegion,
        assertive: !!this.assertiveRegion
      }
    };
  }

  /**
   * Destroy live regions and clean up
   */
  destroy () {
    this.clearQueue();

    if (this.regionContainer && this.regionContainer.parentNode) {
      this.regionContainer.parentNode.removeChild(this.regionContainer);
    }

    this.regionContainer = null;
    this.politeRegion = null;
    this.assertiveRegion = null;

    // AriaLiveRegions: Destroyed and cleaned up
  }
}

/**
 * Create global ARIA live regions instance
 * @param {Object} options - Configuration options
 * @returns {AriaLiveRegions} Live regions instance
 */
export function createAriaLiveRegions (options = {}) {
  return new AriaLiveRegions(options);
}

/**
 * Get or create global ARIA live regions instance
 * @param {Object} options - Configuration options
 * @returns {AriaLiveRegions} Live regions instance
 */
export function getGlobalAriaLiveRegions (options = {}) {
  if (!window._ariaLiveRegions) {
    window._ariaLiveRegions = createAriaLiveRegions(options);
  }
  return window._ariaLiveRegions;
}

/**
 * Convenience functions for common announcements
 */
export const announce = {
  /**
   * Announce validation error
   * @param {string} fieldName - Field name
   * @param {string} message - Error message
   */
  validationError: (fieldName, message) => {
    const regions = getGlobalAriaLiveRegions();
    regions.announceValidationError(fieldName, message);
  },

  /**
   * Announce validation success
   * @param {string} fieldName - Field name
   */
  validationSuccess: (fieldName) => {
    const regions = getGlobalAriaLiveRegions();
    regions.announceValidationSuccess(fieldName);
  },

  /**
   * Announce form status
   * @param {string} status - Status type
   * @param {string} message - Status message
   */
  formStatus: (status, message) => {
    const regions = getGlobalAriaLiveRegions();
    regions.announceFormStatus(status, message);
  },

  /**
   * Announce filter results
   * @param {number} count - Result count
   * @param {string} filterType - Filter type
   */
  filterResults: (count, filterType) => {
    const regions = getGlobalAriaLiveRegions();
    regions.announceFilterResults(count, filterType);
  },

  /**
   * General announcement
   * @param {string} message - Message to announce
   * @param {string} priority - Priority level
   */
  general: (message, priority = 'polite') => {
    const regions = getGlobalAriaLiveRegions();
    regions.announce(message, priority);
  }
};

// Export for global access
if (typeof window !== 'undefined') {
  window.AriaLiveRegions = AriaLiveRegions;
  window.createAriaLiveRegions = createAriaLiveRegions;
  window.getGlobalAriaLiveRegions = getGlobalAriaLiveRegions;
  window.announce = announce;
}

export default AriaLiveRegions;
