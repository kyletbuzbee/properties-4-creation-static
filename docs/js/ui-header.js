// UI HEADER FEATURES
// Navigation and header behavior for Properties 4 Creations website
(() => {
  'use strict';

  // Mobile Navigation Toggle
  function initializeMobileMenu () {
    const menuToggle = document.querySelector('.menu-toggle');
    const navMenu = document.getElementById('main-navigation');
    const navLinks = document.querySelectorAll('.nav-link');

    if (menuToggle && navMenu) {
      // Toggle menu on button click
      menuToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleMenu();
      });

      // Close menu when clicking on links
      navLinks.forEach((link) => {
        link.addEventListener('click', closeMenu);
      });

      // Close menu when clicking outside
      document.addEventListener('click', (e) => {
        if (!navMenu.contains(e.target) && !menuToggle.contains(e.target)) {
          closeMenu();
        }
      });

      // Close menu on escape key
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && navMenu.classList.contains('active')) {
          closeMenu();
        }
      });
    }

    function toggleMenu () {
      navMenu.classList.toggle('active');
      menuToggle.classList.toggle('active');

      // Update ARIA attributes
      const isExpanded = navMenu.classList.contains('active');
      menuToggle.setAttribute('aria-expanded', isExpanded);
      navMenu.setAttribute('aria-hidden', !isExpanded);

      // Announce to screen readers
      const announcement = isExpanded
        ? 'Navigation menu opened'
        : 'Navigation menu closed';
      announceToScreenReader(announcement);
    }

    function closeMenu () {
      navMenu.classList.remove('active');
      menuToggle.classList.remove('active');
      menuToggle.setAttribute('aria-expanded', 'false');
      navMenu.setAttribute('aria-hidden', 'true');
    }
  }

  // Sticky Header Behavior
  function initializeStickyHeader () {
    const header = document.querySelector('.header-glass');
    let lastScrollY = window.scrollY;

    if (header) {
      window.addEventListener(
        'scroll',
        () => {
          const currentScrollY = window.scrollY;

          // Add/remove scrolled class for styling adjustments
          if (currentScrollY > 50) {
            header.classList.add('scrolled');
          } else {
            header.classList.remove('scrolled');
          }

          // Hide/show header on scroll (optional enhancement)
          if (currentScrollY > lastScrollY && currentScrollY > 100) {
            header.style.transform = 'translateY(-100%)';
          } else {
            header.style.transform = 'translateY(0)';
          }

          lastScrollY = currentScrollY;
        },
        { passive: true }
      );
    }
  }

  // Active Navigation Highlighting
  function initializeActiveNavigation () {
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll('.nav-link');

    navLinks.forEach((link) => {
      const linkPath = link.getAttribute('href');

      // Handle exact matches and root path
      if (
        linkPath === currentPath ||
        (currentPath === '/' && linkPath === 'index.html') ||
        (currentPath === '/index.html' && linkPath === 'index.html')
      ) {
        link.classList.add('active');
        link.setAttribute('aria-current', 'page');
      } else {
        link.classList.remove('active');
        link.removeAttribute('aria-current');
      }
    });
  }

  // CTA Link Tracking and Enhancement
  function initializeCTALinks () {
    const ctaLinks = document.querySelectorAll('.cta-link');

    ctaLinks.forEach((link) => {
      // Enhance with smooth scrolling for anchor links
      if (link.getAttribute('href').startsWith('#')) {
        link.addEventListener('click', (event) => {
          event.preventDefault();
          const targetId = link.getAttribute('href').substring(1);
          const targetElement = document.getElementById(targetId);

          if (targetElement) {
            targetElement.scrollIntoView({
              behavior: 'smooth',
              block: 'start'
            });

            // Update URL without triggering scroll
            history.pushState(null, null, '#' + targetId);
          }
        });
      }
    });
  }

  // Header Search Toggle (for future expansion)
  function initializeSearchToggle () {
    // Placeholder for search functionality
    // Can be expanded when search feature is added
    const searchToggle = document.querySelector('.search-toggle');

    if (searchToggle) {
      searchToggle.addEventListener('click', (event) => {
        event.preventDefault();
        // Future search modal implementation
      });
    }
  }

  // Logo/Home Link Enhancement
  function initializeLogoLink () {
    const logoLink =
      document.querySelector('.nav-brand a') ||
      document.querySelector('.nav-brand h1');

    if (logoLink && logoLink.tagName !== 'A') {
      // If logo is not already a link, wrap it
      const link = document.createElement('a');
      link.href = 'index.html';
      link.setAttribute('aria-label', 'Properties 4 Creations homepage');
      logoLink.parentNode.insertBefore(link, logoLink);
      link.appendChild(logoLink);
    } else if (logoLink && logoLink.tagName === 'A') {
      // Ensure proper ARIA label
      logoLink.setAttribute('aria-label', 'Properties 4 Creations homepage');
    }
  }

  // Screen Reader Announcements Helper
  function announceToScreenReader (message) {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.style.position = 'absolute';
    announcement.style.left = '-10000px';
    announcement.style.width = '1px';
    announcement.style.height = '1px';
    announcement.style.overflow = 'hidden';

    document.body.appendChild(announcement);
    announcement.textContent = message;

    // Remove after announcement
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  }

  // Header Performance Optimization
  function optimizeHeaderPerformance () {
    // Lazy load header assets if needed
    // Defer non-critical header scripts

    // Add preload hints for critical navigation assets
    const criticalLinks = [
      'https://unpkg.com/lucide@latest/dist/umd/lucide.css',
      'public/css/style.css'
    ];

    criticalLinks.forEach((link) => {
      const linkElement = document.querySelector(`link[href='${link}']`);
      if (linkElement && !linkElement.hasAttribute('rel')) {
        linkElement.setAttribute('rel', 'preload');
        linkElement.setAttribute('as', 'style');
      }
    });
  }

  // Initialize all header features
  function initHeaderFeatures () {
    initializeMobileMenu();
    initializeStickyHeader();
    initializeActiveNavigation();
    initializeCTALinks();
    initializeSearchToggle();
    initializeLogoLink();
    optimizeHeaderPerformance();

    // Announce successful initialization
    announceToScreenReader('Navigation features loaded successfully');
  }

  // Initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initHeaderFeatures);
  } else {
    initHeaderFeatures();
  }

  // Export for potential external use
  window.HeaderUI = {
    toggleMobileMenu: function () {
      const menuToggle = document.querySelector('.menu-toggle');
      if (menuToggle) {
        menuToggle.click();
      }
    },
    scrollToSection: function (sectionId) {
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };
})();
