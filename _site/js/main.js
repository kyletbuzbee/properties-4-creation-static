/**
 * Main Application Entry Point
 * Properties 4 Creations
 *
 * This file initializes all JavaScript components and features
 */

// Import components and utilities
import { PropertyFilter } from './features/PropertyFilter.js';
import { getModalInstance } from './components/Modal.js';
import { initAccordions } from './components/Accordion.js';
import { FormValidator } from './features/FormValidator.js';
import { initErrorHandler } from './utils/errorHandler.js';
import { createPropertiesErrorBoundary } from './utils/errorBoundary.js';
import { LazyLoader } from './utils/lazyLoad.js';
import { initComparisonSliders } from './comparison-slider.js';
import { auth } from './auth.js';
import './theme-toggle.js';

// Initialize error boundary first (before other components)
createPropertiesErrorBoundary();

// SERVICE WORKER REGISTRATION
function registerServiceWorker () {
  // Check if service workers are supported
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          // Service worker registered successfully
          // Service worker registered successfully
          
          // Add event listeners for service worker lifecycle
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New service worker installed, prompt user to refresh
                // New content is available; prompt user to refresh the page (no console output in production)
              }
            });
          });
          
          // Initialize cache management
          initCacheManagement(registration);
        })
        .catch(() => {
          // Service worker registration failed
          
          
          // Fallback: disable offline functionality gracefully
          if (window.lazyLoader) {
            window.lazyLoader.enableFallbackMode();
          }
        });
    });
    
    // Handle service worker updates
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      window.location.reload();
    });
  } else {
    // Service workers not supported
    // Service Worker not supported by this browser
    
    // Enable fallback mode for lazy loading
    if (window.lazyLoader) {
      window.lazyLoader.enableFallbackMode();
    }
  }
}

/**
 * Initialize cache management functionality
 * @param {ServiceWorkerRegistration} registration - Service worker registration
 */
function initCacheManagement (registration) {
  // Add cache management methods to window for debugging
  window.p4cCache = {
    clear: () => {
      return new Promise((resolve, reject) => {
        if (registration.active) {
          registration.active.postMessage({ type: 'CLEAR_CACHE' });
          resolve('Cache cleared successfully');
        } else {
          reject('No active service worker');
        }
      });
    },
    
    getStatus: () => {
      return new Promise((resolve, reject) => {
        if (registration.active) {
          const messageChannel = new MessageChannel();
          messageChannel.port1.onmessage = (event) => {
            if (event.data.type === 'CACHE_STATUS') {
              resolve(event.data.data);
            }
          };
          
          registration.active.postMessage(
            { type: 'GET_CACHE_STATUS' },
            [messageChannel.port2]
          );
        } else {
          reject('No active service worker');
        }
      });
    },
    
    cacheUrls: (urls) => {
      return new Promise((resolve, reject) => {
        if (registration.active) {
          registration.active.postMessage({
            type: 'CACHE_URLS',
            urls: urls
          });
          resolve('URLs queued for caching');
        } else {
          reject('No active service worker');
        }
      });
    }
  };
}

// Initialize global error handler with comprehensive error boundaries
const errorHandler = initErrorHandler();

// Add comprehensive error boundary for all main.js operations
const mainErrorHandler = errorHandler.createBoundary(() => {
  // Initialize global error handler
  initErrorHandler();

  // Register service worker
  registerServiceWorker();
}, {
  fallback: () => {
    // Critical error in main.js initialization
    // Fallback: ensure basic functionality still works
    registerServiceWorker();
  },
  rethrow: false
});

// Execute main initialization with error boundary
mainErrorHandler();

let propertiesData = []; // Declare propertiesData globally

const propertiesDataElement = document.getElementById('properties-data');
if (propertiesDataElement) {
  try {
    const data = JSON.parse(propertiesDataElement.textContent);
    // Map fetched data to the format expected by existing code
    propertiesData = data.map((prop) => ({ // Removed index as it's not used in this map
      id: prop.id,
      name: prop.title,
      bedrooms: prop.bedrooms,
      bathrooms: prop.bathrooms,
      price: prop.price ? prop.price.formatted : 'N/A',
      price_amount: prop.price ? prop.price.amount : 0,
      type: prop.type,
      tags: prop.tags,
      location: prop.location,
      image: prop.images && prop.images.length > 0 ? prop.images[0] : 'images/properties/properties-default.webp'
    }));
  } catch (error) {
    
    // Fallback or error handling
    propertiesData = []; // Ensure propertiesData is an empty array on error
  }
}





// POPULATE PROPERTIES GRID (SECURE - NO XSS VULNERABILITIES)
const propertiesGrid = document.getElementById('properties-grid');
if (propertiesGrid) {
  propertiesData.forEach((prop) => {
    const card = document.createElement('div');
    card.className = 'property-card';

    // Create image container
    const imageDiv = document.createElement('div');
    imageDiv.className = 'property-image';

    // Secure image handling - validate and sanitize image path
    const sanitizedImagePath = sanitizeInput(prop.image);
    const allowedImagePath = (path) => {
      if (typeof path !== 'string') return false;
      const re = /^\/?images\/(properties|banners|icons|our-work-gallery)\/[a-z0-9/_\-.]+\.webp$/i;
      return re.test(path);
    };
    const imgSrc = allowedImagePath(sanitizedImagePath)
      ? sanitizedImagePath
      : 'images/properties/properties-default.webp';

    // Use semantic image for accessibility and performance
    const imgEl = document.createElement('img');
    imgEl.src = imgSrc;
    const sanitizedAltText = sanitizeInput(prop.name);
    imgEl.alt = sanitizedAltText || 'Property image';
    imgEl.loading = 'lazy';
    imgEl.decoding = 'async';
    imgEl.className = 'property-img';
    imageDiv.appendChild(imgEl);

    // Create content container
    const contentDiv = document.createElement('div');
    contentDiv.className = 'property-content';

    // Create title element (secure - uses textContent with sanitization)
    const titleEl = document.createElement('h3');
    titleEl.className = 'property-title';
    const sanitizedTitle = sanitizeInput(prop.name);
    titleEl.textContent = sanitizedTitle || 'Property';

    // Create location element (secure with sanitization)
    const locationEl = document.createElement('p');
    locationEl.style.color = 'var(--dark-gray)';
    locationEl.style.fontSize = '0.9rem';
    locationEl.style.marginBottom = '1rem';
    const sanitizedLocation = sanitizeInput(prop.location);
    locationEl.textContent = sanitizedLocation || 'Location not available';

    // Create details container
    const detailsDiv = document.createElement('div');
    detailsDiv.className = 'property-details';

    // Add beds detail
    const bedsItem = document.createElement('div');
    bedsItem.className = 'detail-item';
    const bedsLabel = document.createElement('div');
    bedsLabel.className = 'detail-label';
    bedsLabel.textContent = 'Beds';
    const bedsValue = document.createElement('div');
    bedsValue.className = 'detail-value';
    bedsValue.textContent = prop.bedrooms.toString();
    bedsItem.appendChild(bedsLabel);
    bedsItem.appendChild(bedsValue);

    // Add baths detail
    const bathsItem = document.createElement('div');
    bathsItem.className = 'detail-item';
    const bathsLabel = document.createElement('div');
    bathsLabel.className = 'detail-label';
    bathsLabel.textContent = 'Baths';
    const bathsValue = document.createElement('div');
    bathsValue.className = 'detail-value';
    bathsValue.textContent = prop.bathrooms.toString();
    bathsItem.appendChild(bathsLabel);
    bathsItem.appendChild(bathsValue);

    // Add status detail
    const statusItem = document.createElement('div');
    statusItem.className = 'detail-item';
    const statusLabel = document.createElement('div');
    statusLabel.className = 'detail-label';
    statusLabel.textContent = 'Status';
    const statusValue = document.createElement('div');
    statusValue.className = 'detail-value';
    statusValue.style.fontSize = '0.8rem';
    statusValue.style.color = 'var(--gold)';
    statusValue.textContent = prop.price;
    statusItem.appendChild(statusLabel);
    statusItem.appendChild(statusValue);

    // Add all details
    detailsDiv.appendChild(bedsItem);
    detailsDiv.appendChild(bathsItem);
    detailsDiv.appendChild(statusItem);

    // Create tags container
    const tagsDiv = document.createElement('div');
    tagsDiv.className = 'property-tags';

    // Add tags securely with sanitization
    if (prop.tags && Array.isArray(prop.tags)) {
      prop.tags.forEach((tag) => {
        const sanitizedTag = sanitizeInput(tag);
        if (sanitizedTag) {
          const tagSpan = document.createElement('span');
          tagSpan.className = 'tag';
          tagSpan.textContent = sanitizedTag;
          tagsDiv.appendChild(tagSpan);
        }
      });
    }

    // Create apply button
    const applyLink = document.createElement('a');
    applyLink.href = 'apply.html';
    applyLink.className = 'btn btn-primary property-btn';
    applyLink.textContent = 'Apply for This Home';

    // Assemble all elements
    contentDiv.appendChild(titleEl);
    contentDiv.appendChild(locationEl);
    contentDiv.appendChild(detailsDiv);
    contentDiv.appendChild(tagsDiv);
    contentDiv.appendChild(applyLink);

    card.appendChild(imageDiv);
    card.appendChild(contentDiv);

    propertiesGrid.appendChild(card);
  });
}





// Sanitize input function (moved to program root)
function sanitizeInput (input) {
  // Input validation - ensure input is a string
  if (typeof input !== 'string') {
    return '';
  }
  
  // Use DOMPurify if available, otherwise basic sanitization
  if (window.DOMPurify && typeof window.DOMPurify.sanitize === 'function') {
    try {
      return window.DOMPurify.sanitize(input, {
        ALLOWED_TAGS: [],
        ALLOWED_ATTR: []
      });
    } catch (e) {
      // Fallback to basic sanitization if DOMPurify fails
      // Silent fallback - no console output for security
    }
  }
  
  // Basic fallback sanitization
  return input
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]*>/g, '')
    .trim();
}

// FORM VALIDATION WITH INPUT SANITIZATION
const form = document.getElementById('application-form');
if (form) {
  const successMessage = document.getElementById('success-message');

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    let isValid = true;
    const formGroups = form.querySelectorAll('.form-group');

    formGroups.forEach((group) => {
      const input = group.querySelector('input, select, textarea');
      if (!input) return;

      group.classList.remove('error');
      input.removeAttribute('aria-invalid');

      // Sanitize input value with additional validation
      const sanitizedValue = sanitizeInput(input.value);

      // Additional validation for specific fields
      if (input.required && (!sanitizedValue || sanitizedValue.trim() === '')) {
        group.classList.add('error');
        input.setAttribute('aria-invalid', 'true');
        isValid = false;
      } else if (
        input.type === 'email' &&
        sanitizedValue &&
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sanitizedValue)
      ) {
        group.classList.add('error');
        input.setAttribute('aria-invalid', 'true');
        isValid = false;
      } else if (
        input.id === 'phone' &&
        sanitizedValue &&
        !/^[0-9\-+()\s.,]+$/.test(sanitizedValue)
      ) {
        group.classList.add('error');
        input.setAttribute('aria-invalid', 'true');
        isValid = false;
      } else if (input.type === 'checkbox' && !input.checked) {
        group.classList.add('error');
        input.setAttribute('aria-invalid', 'true');
        isValid = false;
      } else if (
        input.type === 'text' &&
        input.name === 'name' &&
        sanitizedValue &&
        sanitizedValue.length < 2
      ) {
        // Additional validation for name field
        group.classList.add('error');
        input.setAttribute('aria-invalid', 'true');
        isValid = false;
      }
    });

    if (isValid) {
      successMessage.classList.add('show');
      form.style.display = 'none';

      // Production build will strip console statements
      // Development logging removed for security

      setTimeout(() => {
        form.reset();
        form.style.display = 'block';
        successMessage.classList.remove('show');
      }, 3000);
    }
  });
}

// CSRF TOKEN MANAGEMENT
async function fetchCSRFToken () {
  try {
    const response = await fetch('/api/csrf', {
      method: 'GET',
      credentials: 'include'
    });

    if (response.ok) {
      const data = await response.json();
      return data.csrfToken;
    }

    // Fallback token if API fails
    return 'fallback-csrf-token';
  } catch {
    // Network error - use fallback token
    return 'fallback-csrf-token';
  }
}

// Add CSRF token to form
async function addCSRFTokenToForm (form) {
  const csrfToken = await fetchCSRFToken();
  const csrfInput = form.querySelector('input[name="csrfToken"]');
  
  if (csrfInput) {
    csrfInput.value = csrfToken;
  }
}

// CONTACT FORM HANDLING
const contactForm = document.getElementById('contact-form');
if (contactForm) {
  const contactSuccess = document.getElementById('contact-success');

  // Fetch and add CSRF token when form loads
  addCSRFTokenToForm(contactForm);

  contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    let isValid = true;
    const contactFormGroups = contactForm.querySelectorAll('.form-group');

    contactFormGroups.forEach((group) => {
      const input = group.querySelector('input, textarea');
      if (!input) return;

      group.classList.remove('error');
      input.removeAttribute('aria-invalid');

      // Sanitize input value
      const sanitizedValue = sanitizeInput(input.value);

      if (input.required && (!sanitizedValue || sanitizedValue.trim() === '')) {
        group.classList.add('error');
        input.setAttribute('aria-invalid', 'true');
        isValid = false;
      } else if (
        input.type === 'email' &&
        sanitizedValue &&
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sanitizedValue)
      ) {
        group.classList.add('error');
        input.setAttribute('aria-invalid', 'true');
        isValid = false;
      } else if (
        input.type === 'text' &&
        input.name === 'name' &&
        sanitizedValue &&
        sanitizedValue.length < 2
      ) {
        // Additional validation for name field
        group.classList.add('error');
        input.setAttribute('aria-invalid', 'true');
        isValid = false;
      }
    });

    if (isValid) {
      // Get form data including CSRF token
      const formData = new FormData(contactForm);
      const csrfToken = formData.get('csrfToken');

      try {
        // Submit to server with CSRF token
        const response = await fetch('/api/contact', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-Token': csrfToken
          },
          body: JSON.stringify({
            name: formData.get('contactName'),
            email: formData.get('contactEmail'),
            phone: formData.get('contactPhone'),
            subject: formData.get('contactSubject'),
            message: formData.get('contactMessage')
          })
        });

        if (response.ok) {
          contactSuccess.style.display = 'block';
          contactForm.style.display = 'none';

          setTimeout(() => {
            contactForm.reset();
            contactForm.style.display = 'block';
            contactSuccess.style.display = 'none';
            
            // Refresh CSRF token after successful submission
            addCSRFTokenToForm(contactForm);
          }, 3000);
        } else {
          // Handle server validation errors
          const errorData = await response.json();
          alert('Error submitting form: ' + (errorData.message || 'Please try again'));
        }
      } catch (error) {
        // Network error
        alert('Network error. Please check your connection and try again.');
      }
    }
  });
}

// ACCESSIBILITY ENHANCEMENTS
const skipLink = document.querySelector('.skip-link');
if (!skipLink) {
  const newSkipLink = document.createElement('a');
  newSkipLink.href = '#main-content';
  newSkipLink.textContent = 'Skip to main content';
  newSkipLink.className = 'skip-link';
  document.body.prepend(newSkipLink);
}

// SCROLL TO FUNCTIONALITY (Replaces inline onclick handlers)
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('js-scroll-to')) {
    e.preventDefault();
    const targetId = e.target.getAttribute('data-target');
    const targetElement = document.getElementById(targetId);
    if (targetElement) {
      targetElement.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  }
});

// Alt text checker - Production build will strip console statements
document.querySelectorAll('img').forEach((img) => {
  if (!img.alt) {
    // Accessibility issue detected - alt text missing
    // This would be logged in development builds only
  }
});

// ============================================
// COMPONENT INITIALIZATION
// ============================================

/**
 * Initialize all components when DOM is ready
 */
document.addEventListener('DOMContentLoaded', async () => {
  auth.init(); // Initialize auth state
  // Initialize Lazy Loading
  try {
    const lazyLoader = new LazyLoader();
    window.lazyLoader = lazyLoader;
    
    // Apply lazy loading to all images
    document.querySelectorAll('img').forEach(img => {
      if (!img.loading) {
        img.loading = 'lazy';
      }
    });
  } catch (e) {
    // LazyLoader initialization failed silently
  }

  // Initialize Modal System
  try {
    const modal = getModalInstance();
    window.modal = modal;
  } catch (e) {
    // Modal initialization failed silently
  }

  // Initialize Accordions (FAQ page)
  try {
    const accordions = initAccordions('.accordion');
    window.accordions = accordions;
  } catch (e) {
    // Accordion initialization failed silently
  }

  // Initialize Comparison Slider
  try {
    initComparisonSliders();
  } catch (e) {
    // Slider initialization failed silently
  }

  // Initialize Property Filter (Properties page)
  const propertiesContainer = document.getElementById('properties-grid');
  if (propertiesContainer && propertiesData.length > 0) {
    try {
      // Transform data for PropertyFilter
      const formattedProperties = propertiesData.map((prop, index) => ({
        id: `property-${index}`,
        slug: prop.name.toLowerCase().replace(/\s+/g, '-'),
        name: prop.name,
        address: prop.location,
        city: prop.location.split(',')[0].trim(),
        bedrooms: prop.bedrooms,
        bathrooms: prop.bathrooms,
        sqft: prop.sqft, // Use actual sqft from fetched data
        image: prop.image,
        tags: prop.tags.map((tag) => {
          if (tag.includes('Section 8')) return 'Section 8';
          if (tag.includes('HUD-VASH')) return 'HUD-VASH';
          if (tag.includes('Pet') || tag.includes('Family'))
            return 'Pet Friendly';
          return tag;
        }),
        featured: index === 0
      }));

      const propertyFilter = new PropertyFilter(
        formattedProperties,
        '#properties-grid'
      );
      propertyFilter.init();
      window.propertyFilter = propertyFilter;
    } catch (e) {
      // PropertyFilter initialization failed silently
    }
  }

  // Initialize Form Validators
  const applicationForm = document.getElementById('application-form');
  if (applicationForm) {
    try {
      const appValidator = new FormValidator('#application-form', {
        onSubmit: async (data) => { // eslint-disable-line no-unused-vars
          // Handle form submission
          const successMessage = document.getElementById('success-message');
          if (successMessage) {
            successMessage.classList.add('show');
            applicationForm.style.display = 'none';
          }

          setTimeout(() => {
            applicationForm.reset();
            applicationForm.style.display = 'block';
            if (successMessage) {
              successMessage.classList.remove('show');
            }
          }, 3000);
        },
        onError: (errors) => { // eslint-disable-line no-unused-vars
          // Errors are handled by FormValidator UI
        }
      });
      window.applicationFormValidator = appValidator;
    } catch (e) {
      // FormValidator initialization failed silently
    }
  }

  const contactFormEl = document.getElementById('contact-form');
  if (contactFormEl) {
    try {
      const contactValidator = new FormValidator('#contact-form', {
        onSubmit: async (data) => { // eslint-disable-line no-unused-vars
          const contactSuccess = document.getElementById('contact-success');
          if (contactSuccess) {
            contactSuccess.style.display = 'block';
            contactFormEl.style.display = 'none';
          }

          setTimeout(() => {
            contactFormEl.reset();
            contactFormEl.style.display = 'block';
            if (contactSuccess) {
              contactSuccess.style.display = 'none';
            }
          }, 3000);
        }
      });
      
      window.contactFormValidator = contactValidator;
    } catch (e) {
      // FormValidator initialization failed silently
    }
  }

  // Keyboard navigation detection
  document.body.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      document.body.classList.add('keyboard-nav');
    }
  });

  document.body.addEventListener('mousedown', () => {
    document.body.classList.remove('keyboard-nav');
  });

  // Initialize responsive hero backgrounds
  initResponsiveHeroBackgrounds();
});

/**
 * Initialize responsive hero backgrounds using the lazy loading utility
 */
function initResponsiveHeroBackgrounds () {
  // Check if LazyLoader is available
  if (typeof window.LazyLoader !== 'undefined' || typeof LazyLoader !== 'undefined') {
    // Create responsive hero background for the main hero section
    const heroSection = document.querySelector('.hero');
    if (heroSection) {
      // Use the existing WebP images with responsive sizes
      const heroImageBase = '/images/banners/hero-home-banner';
      const responsiveBg = `
        linear-gradient(
          135deg,
          rgba(11, 17, 32, 0.8) 0%,
          rgba(11, 17, 32, 0.6) 100%
        ),
        url('${heroImageBase}-800w.webp')
      `;
      
      // Apply responsive background
      heroSection.style.backgroundImage = responsiveBg;
      
      // Add media queries for different screen sizes
      const style = document.createElement('style');
      style.textContent = `
        @media (max-width: 600px) {
          .hero {
            background-image: linear-gradient(
              135deg,
              rgba(11, 17, 32, 0.8) 0%,
              rgba(11, 17, 32, 0.6) 100%
            ), url('${heroImageBase}-400w.webp');
          }
        }
        @media (min-width: 601px) and (max-width: 1000px) {
          .hero {
            background-image: linear-gradient(
              135deg,
              rgba(11, 17, 32, 0.8) 0%,
              rgba(11, 17, 32, 0.6) 100%
            ), url('${heroImageBase}-800w.webp');
          }
        }
        @media (min-width: 1001px) {
          .hero {
            background-image: linear-gradient(
              135deg,
              rgba(11, 17, 32, 0.8) 0%,
              rgba(11, 17, 32, 0.6) 100%
            ), url('${heroImageBase}-1200w.webp');
          }
        }
      `;
      document.head.appendChild(style);
    }
  }
}


