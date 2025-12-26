/**
 * Properties 4 Creations - Main JavaScript
 * Consolidated functionality for the static website
 */

// Wait for DOM to be fully loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

function init() {
  // Initialize all components
  initMobileMenu();
  initThemeToggle();
  initAuthLinks();
  initMap();
  initAccessibility();
  initLazyLoading();
  initFormEnhancements();
  initPropertyFilters();
  initFAQAccordion();
  initComparisonSlider();
  initTestimonialCarousel();
  initScrollToTop();
  initVideoFallback();
}

/**
 * Mobile Menu Toggle
 */
function initMobileMenu() {
  const menuToggle = document.querySelector('.menu-toggle');
  const navMenu = document.querySelector('.nav-menu');
  
  if (!menuToggle || !navMenu) return;
  
  menuToggle.addEventListener('click', function() {
    const isExpanded = this.getAttribute('aria-expanded') === 'true';
    
    if (isExpanded) {
      this.setAttribute('aria-expanded', 'false');
      navMenu.classList.remove('active');
    } else {
      this.setAttribute('aria-expanded', 'true');
      navMenu.classList.add('active');
    }
  });
}

/**
 * Theme Toggle
 */
function initThemeToggle() {
  const themeToggle = document.getElementById('theme-toggle');
  const htmlElement = document.documentElement;
  
  if (!themeToggle) return;
  
  // Check for saved theme preference or use system preference
  const savedTheme = localStorage.getItem('theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  
  if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
    htmlElement.setAttribute('data-theme', 'dark');
    themeToggle.setAttribute('aria-pressed', 'true');
  }
  
  themeToggle.addEventListener('click', function() {
    const isPressed = this.getAttribute('aria-pressed') === 'true';
    
    if (isPressed) {
      htmlElement.setAttribute('data-theme', 'light');
      this.setAttribute('aria-pressed', 'false');
      localStorage.setItem('theme', 'light');
    } else {
      htmlElement.setAttribute('data-theme', 'dark');
      this.setAttribute('aria-pressed', 'true');
      localStorage.setItem('theme', 'dark');
    }
  });
}

/**
 * Auth Links
 */
function initAuthLinks() {
  const authLinksContainer = document.getElementById('auth-links');
  
  if (!authLinksContainer) return;
  
  const isAuthenticated = localStorage.getItem('authToken') || false;
  
  if (isAuthenticated) {
    authLinksContainer.innerHTML = `
      <a href="/profile/" class="btn btn-secondary cta-link" role="menuitem">Profile</a>
      <button id="logout-btn" class="btn btn-primary cta-link" role="menuitem">Logout</button>
    `;
    
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('authToken');
        window.location.href = '/login/';
      });
    }
  } else {
    authLinksContainer.innerHTML = `
      <a href="/login/" class="btn btn-secondary cta-link" role="menuitem">Login</a>
      <a href="/register/" class="btn btn-primary cta-link" role="menuitem">Register</a>
    `;
  }
}

/**
 * Map Initialization
 */
function initMap() {
  const mapElement = document.getElementById('map');
  
  if (!mapElement) return;
  
  try {
    const map = L.map('map').setView([32.35, -95.3], 10);
    
    // Fix for default icon path
    L.Icon.Default.prototype.options.iconUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png';
    L.Icon.Default.prototype.options.iconRetinaUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png';
    L.Icon.Default.prototype.options.shadowUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png';
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);
    
    // Add markers for key locations
    const locations = [
      { coords: [32.351, -95.301], title: 'Tyler Properties', popup: '<b>Tyler, TX</b><br>Multiple Properties Available' },
      { coords: [32.5, -94.74], title: 'Longview Properties', popup: '<b>Longview, TX</b><br>Multiple Properties Available' },
      { coords: [32.757, -94.344], title: 'Jefferson Properties', popup: '<b>Jefferson, TX</b><br>Waterfront Properties' },
      { coords: [32.442, -96.225], title: 'Kemp Properties', popup: '<b>Kemp, TX</b><br>Townhome Communities' }
    ];
    
    locations.forEach(location => {
      L.marker(location.coords, { title: location.title })
        .addTo(map)
        .bindPopup(location.popup);
    });
    
  } catch (error) {
    console.error('Map initialization failed:', error);
  }
}

/**
 * Accessibility Enhancements
 */
function initAccessibility() {
  // Skip link focus management
  const skipLink = document.querySelector('.skip-link');
  if (skipLink) {
    skipLink.addEventListener('focus', () => {
      document.body.classList.add('skip-link-focused');
    });
    
    skipLink.addEventListener('blur', () => {
      document.body.classList.remove('skip-link-focused');
    });
  }
  
  // Focus management for modal dialogs
  const focusableElements = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
  
  // Keyboard navigation enhancements
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      // Add visual focus indicators
      document.body.classList.add('keyboard-nav');
    }
  });
  
  // Mouse click removes keyboard focus indicators
  document.addEventListener('mousedown', () => {
    document.body.classList.remove('keyboard-nav');
  });
}

/**
 * Lazy Loading for Images
 */
function initLazyLoading() {
  if ('loading' in HTMLImageElement.prototype) {
    // Native lazy loading is supported
    const lazyImages = document.querySelectorAll('img[loading="lazy"]');
    lazyImages.forEach(img => {
      img.addEventListener('load', () => {
        img.classList.add('lazy-loaded');
      });
    });
  } else {
    // Fallback for browsers without native lazy loading
    const lazyImages = document.querySelectorAll('img[data-src]');
    
    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src;
          img.removeAttribute('data-src');
          img.classList.add('lazy-loaded');
          observer.unobserve(img);
        }
      });
    });
    
    lazyImages.forEach(img => {
      imageObserver.observe(img);
    });
  }
}

/**
 * Form Enhancements
 */
function initFormEnhancements() {
  const forms = document.querySelectorAll('form');
  
  forms.forEach(form => {
    // Add required field indicators
    const requiredFields = form.querySelectorAll('[required]');
    requiredFields.forEach(field => {
      const label = document.querySelector(`label[for="${field.id}"]`) || 
                   field.closest('.form-group')?.querySelector('label');
      if (label && !label.querySelector('.required-indicator')) {
        const indicator = document.createElement('span');
        indicator.className = 'required-indicator';
        indicator.textContent = ' *';
        indicator.setAttribute('aria-hidden', 'true');
        label.appendChild(indicator);
      }
    });
    
    // Add client-side validation
    form.addEventListener('submit', (e) => {
      let isValid = true;
      
      requiredFields.forEach(field => {
        if (!field.value.trim()) {
          isValid = false;
          field.classList.add('error');
          const errorId = `${field.id}-error`;
          let errorElement = document.getElementById(errorId);
          
          if (!errorElement) {
            errorElement = document.createElement('div');
            errorElement.id = errorId;
            errorElement.className = 'error-message';
            errorElement.setAttribute('role', 'alert');
            field.parentNode.insertBefore(errorElement, field.nextSibling);
          }
          
          errorElement.textContent = 'This field is required';
        } else {
          field.classList.remove('error');
          const errorElement = document.getElementById(`${field.id}-error`);
          if (errorElement) errorElement.remove();
        }
      });
      
      if (!isValid) {
        e.preventDefault();
        // Focus first error field
        const firstError = form.querySelector('.error');
        if (firstError) firstError.focus();
      }
    });
  });
}

/**
 * Property Filter Functionality
 */
function initPropertyFilters() {
  const filterBtn = document.getElementById('filter-btn');
  
  if (!filterBtn) return;
  
  filterBtn.addEventListener('click', () => {
    const bedroomFilter = document.getElementById('bedroom-filter')?.value || '';
    const locationFilter = document.getElementById('location-filter')?.value || '';
    const searchFilter = document.getElementById('search-filter')?.value.toLowerCase() || '';
    
    const propertyCards = document.querySelectorAll('.property-card');
    
    propertyCards.forEach(card => {
      const bedrooms = card.dataset.bedrooms || '';
      const location = card.dataset.location || '';
      const title = card.querySelector('.property-title')?.textContent.toLowerCase() || '';
      
      let matches = true;
      
      if (bedroomFilter && bedrooms !== bedroomFilter) matches = false;
      if (locationFilter && location !== locationFilter) matches = false;
      if (searchFilter && !title.includes(searchFilter)) matches = false;
      
      if (matches) {
        card.style.display = 'block';
      } else {
        card.style.display = 'none';
      }
    });
  });
}

/**
 * FAQ Accordion
 */
function initFAQAccordion() {
  const faqItems = document.querySelectorAll('.faq-item');
  
  faqItems.forEach(item => {
    const question = item.querySelector('.faq-question');
    
    if (question) {
      question.addEventListener('click', () => {
        const isActive = item.classList.contains('active');
        
        // Close all other items
        faqItems.forEach(otherItem => {
          if (otherItem !== item) {
            otherItem.classList.remove('active');
            otherItem.querySelector('.faq-question').setAttribute('aria-expanded', 'false');
          }
        });
        
        // Toggle current item
        if (isActive) {
          item.classList.remove('active');
          question.setAttribute('aria-expanded', 'false');
        } else {
          item.classList.add('active');
          question.setAttribute('aria-expanded', 'true');
        }
      });
      
      // Keyboard navigation
      question.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          question.click();
        }
      });
    }
  });
}

/**
 * Comparison Slider
 */
function initComparisonSlider() {
  const slider = document.querySelector('.slider-container');
  
  if (!slider) return;
  
  const handle = slider.querySelector('.slider-handle');
  const before = slider.querySelector('.slider-before');
  const after = slider.querySelector('.slider-after');
  
  if (!handle || !before || !after) return;
  
  let isDragging = false;
  
  handle.addEventListener('mousedown', startDrag);
  handle.addEventListener('touchstart', startDrag);
  
  function startDrag(e) {
    e.preventDefault();
    isDragging = true;
    
    document.addEventListener('mousemove', drag);
    document.addEventListener('touchmove', drag);
    document.addEventListener('mouseup', stopDrag);
    document.addEventListener('touchend', stopDrag);
  }
  
  function drag(e) {
    if (!isDragging) return;
    
    const clientX = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX;
    const rect = slider.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    
    handle.style.left = percentage + '%';
    after.style.clipPath = `inset(0 0 0 ${percentage}%)`;
  }
  
  function stopDrag() {
    isDragging = false;
    
    document.removeEventListener('mousemove', drag);
    document.removeEventListener('touchmove', drag);
    document.removeEventListener('mouseup', stopDrag);
    document.removeEventListener('touchend', stopDrag);
  }
}

/**
 * Testimonial Carousel
 */
function initTestimonialCarousel() {
  const carousel = document.querySelector('.testimonials-carousel');
  
  if (!carousel) return;
  
  const wrapper = carousel.querySelector('.testimonials-wrapper');
  const dotsContainer = carousel.querySelector('.carousel-dots');
  const slides = carousel.querySelectorAll('.testimonial-slide');
  
  if (!wrapper || !dotsContainer || slides.length === 0) return;
  
  let currentIndex = 0;
  const totalSlides = slides.length;
  
  // Create dots
  slides.forEach((_, index) => {
    const dot = document.createElement('button');
    dot.className = 'dot' + (index === 0 ? ' active' : '');
    dot.setAttribute('aria-label', `Go to testimonial ${index + 1}`);
    dot.addEventListener('click', () => goToSlide(index));
    dotsContainer.appendChild(dot);
  });
  
  const dots = dotsContainer.querySelectorAll('.dot');
  
  function goToSlide(index) {
    currentIndex = index;
    
    // Update slides
    wrapper.style.transform = `translateX(-${currentIndex * 100}%)`;
    
    // Update dots
    dots.forEach((dot, i) => {
      dot.classList.toggle('active', i === currentIndex);
    });
  }
  
  // Auto-advance
  setInterval(() => {
    const nextIndex = (currentIndex + 1) % totalSlides;
    goToSlide(nextIndex);
  }, 5000);
}

/**
 * Scroll to Top Button
 */
function initScrollToTop() {
  const scrollToTopBtn = document.createElement('button');
  scrollToTopBtn.className = 'scroll-to-top';
  scrollToTopBtn.setAttribute('aria-label', 'Scroll to top');
  scrollToTopBtn.innerHTML = '<i data-lucide="chevron-up"></i>';
  
  document.body.appendChild(scrollToTopBtn);
  
  window.addEventListener('scroll', () => {
    if (window.scrollY > 300) {
      scrollToTopBtn.classList.add('visible');
    } else {
      scrollToTopBtn.classList.remove('visible');
    }
  });
  
  scrollToTopBtn.addEventListener('click', () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  });
}

/**
 * Video Fallback Handling
 */
function initVideoFallback() {
  const videos = document.querySelectorAll('video');
  
  videos.forEach(video => {
    const fallback = video.nextElementSibling;
    
    if (fallback && fallback.classList.contains('video-fallback')) {
      video.addEventListener('loadeddata', () => {
        fallback.style.display = 'none';
      });
      
      video.addEventListener('error', () => {
        fallback.style.display = 'block';
      });
      
      // Handle video visibility for performance
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            video.play().catch(e => {
              console.warn('Video autoplay failed:', e);
              fallback.style.display = 'block';
            });
          } else {
            video.pause();
          }
        });
      });
      
      observer.observe(video);
    }
  });
}

// Export functions for testing
export {
  init,
  initMobileMenu,
  initThemeToggle,
  initAuthLinks,
  initMap,
  initAccessibility,
  initLazyLoading,
  initFormEnhancements,
  initPropertyFilters,
  initFAQAccordion,
  initComparisonSlider,
  initTestimonialCarousel,
  initScrollToTop,
  initVideoFallback
};