/**
 * Security Sanitization Utilities
 * Properties 4 Creations - XSS Protection Module
 */

import DOMPurify from 'dompurify';

/**
 * Sanitize HTML content using DOMPurify
 * Prevents XSS attacks by removing malicious scripts and attributes
 * @param {string} dirty - Unsanitized HTML string
 * @param {Object} config - DOMPurify configuration options
 * @returns {string} Sanitized HTML string
 */
export function sanitizeHtml (dirty, config = {}) {
  const defaultConfig = {
    ALLOWED_TAGS: [
      'p',
      'br',
      'strong',
      'em',
      'u',
      'h1',
      'h2',
      'h3',
      'h4',
      'h5',
      'h6',
      'ul',
      'ol',
      'li',
      'a',
      'span',
      'div',
      'blockquote',
      'code',
      'pre'
    ],
    ALLOWED_ATTR: ['href', 'title', 'class', 'id'],
    ALLOW_DATA_ATTR: false,
    FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed'],
    FORBID_ATTR: ['onload', 'onclick', 'onerror', 'onmouseover', 'onfocus'],
    KEEP_CONTENT: false
  };

  const mergedConfig = { ...defaultConfig, ...config };
  return DOMPurify.sanitize(dirty, mergedConfig);
}

/**
 * Sanitize plain text for safe HTML insertion
 * Converts text to escaped HTML entities
 * @param {string} text - Input text
 * @returns {string} Escaped HTML string
 */
export function escapeHtml (text) {
  if (typeof text !== 'string') {
    return String(text);
  }

  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Sanitize form data for safe storage and transmission
 * @param {FormData} formData - FormData object from form submission
 * @returns {Object} Sanitized form data object
 */
export function sanitizeFormData (formData) {
  const sanitized = {};

  for (const [key, value] of formData.entries()) {
    if (typeof value === 'string') {
      // Basic HTML entity encoding for form inputs
      sanitized[key] = escapeHtml(value).trim();
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Sanitize URL for safe linking
 * @param {string} url - Input URL
 * @returns {string} Sanitized URL or '#' if invalid
 */
export function sanitizeUrl (url) {
  if (typeof url !== 'string') return '#';

  // Remove potentially dangerous protocols
  const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:'];
  const lowerUrl = url.toLowerCase();

  for (const protocol of dangerousProtocols) {
    if (lowerUrl.startsWith(protocol)) {
      return '#';
    }
  }

  // Basic URL validation
  try {
    new URL(url, window.location.origin);
    return url;
  } catch {
    return '#';
  }
}

/**
 * Create safe element with sanitized content
 * @param {string} tag - HTML tag name
 * @param {string} content - Content to insert
 * @param {Object} attributes - Element attributes
 * @returns {HTMLElement} Safe DOM element
 */
export function createSafeElement (tag, content = '', attributes = {}) {
  const element = document.createElement(tag);

  // Add attributes safely
  for (const [key, value] of Object.entries(attributes)) {
    if (key === 'className') {
      element.className = value;
    } else if (key === 'textContent') {
      element.textContent = value;
    } else if (key === 'innerHTML') {
      element.innerHTML = sanitizeHtml(value);
    } else {
      element.setAttribute(key, String(value));
    }
  }

  // Add content safely
  if (content) {
    element.textContent = content;
  }

  return element;
}

/**
 * Validate and sanitize email address
 * @param {string} email - Email address
 * @returns {string} Valid email or empty string
 */
export function sanitizeEmail (email) {
  if (typeof email !== 'string') return '';

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const sanitized = email.trim().toLowerCase();

  return emailRegex.test(sanitized) ? sanitized : '';
}

/**
 * Sanitize phone number
 * @param {string} phone - Phone number
 * @returns {string} Clean phone number or empty string
 */
export function sanitizePhone (phone) {
  if (typeof phone !== 'string') return '';

  // Remove all non-digit characters except + and ()
  const cleaned = phone.replace(/[^\d+()]/g, '');

  // Basic validation: should have 10-15 digits
  const digitsOnly = cleaned.replace(/\D/g, '');
  return digitsOnly.length >= 10 && digitsOnly.length <= 15 ? cleaned : '';
}

/**
 * Remove potentially dangerous content from user input
 * @param {string} input - User input
 * @returns {string} Cleaned input
 */
export function cleanUserInput (input) {
  if (typeof input !== 'string') return '';

  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+='[^']*"/gi, '')
    .trim();
}
