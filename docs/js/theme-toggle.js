/**
 * Dark Mode Theme Toggle Functionality
 * Handles theme switching and persistence
 */

document.addEventListener('DOMContentLoaded', () => {
  // Initialize theme toggle
  const themeToggle = document.getElementById('theme-toggle');
  const htmlElement = document.documentElement;

  if (themeToggle) {
    // Check for saved theme preference or use system preference
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    // Apply saved theme or default to system preference
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      htmlElement.setAttribute('data-theme', 'dark');
      themeToggle.setAttribute('aria-pressed', 'true');
      updateThemeIcon(themeToggle, true);
    }

    // Add event listener for theme toggle
    themeToggle.addEventListener('click', () => {
      const isDarkMode = htmlElement.getAttribute('data-theme') === 'dark';

      if (isDarkMode) {
        // Switch to light mode
        htmlElement.removeAttribute('data-theme');
        themeToggle.setAttribute('aria-pressed', 'false');
        localStorage.setItem('theme', 'light');
        updateThemeIcon(themeToggle, false);
      } else {
        // Switch to dark mode
        htmlElement.setAttribute('data-theme', 'dark');
        themeToggle.setAttribute('aria-pressed', 'true');
        localStorage.setItem('theme', 'dark');
        updateThemeIcon(themeToggle, true);
      }

      // Dispatch theme change event for other components
      const event = new CustomEvent('themeChanged', {
        detail: { isDarkMode: !isDarkMode }
      });
      document.dispatchEvent(event);
    });

    // Listen for system theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      const savedTheme = localStorage.getItem('theme');
      
      // Only apply system preference if no theme is explicitly saved
      if (!savedTheme) {
        if (e.matches) {
          htmlElement.setAttribute('data-theme', 'dark');
          themeToggle.setAttribute('aria-pressed', 'true');
          updateThemeIcon(themeToggle, true);
        } else {
          htmlElement.removeAttribute('data-theme');
          themeToggle.setAttribute('aria-pressed', 'false');
          updateThemeIcon(themeToggle, false);
        }
      }
    });
  }

  // Update theme icon based on current mode
  function updateThemeIcon (button, isDarkMode) {
    const icon = button.querySelector('.theme-icon');
    const text = button.querySelector('.theme-text');
    
    if (icon) {
      icon.textContent = isDarkMode ? '☀️' : '🌙';
    }
    
    if (text) {
      text.textContent = isDarkMode ? 'Light Mode' : 'Dark Mode';
    }
  }

  // Initialize theme for all pages
  function initializeTheme () {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  }

  // Initialize theme on all pages
  initializeTheme();

  // Expose theme functions to global scope for testing
  window.themeToggle = {
    toggleTheme () {
      const htmlElement = document.documentElement;
      const isDarkMode = htmlElement.getAttribute('data-theme') === 'dark';
      
      if (isDarkMode) {
        htmlElement.removeAttribute('data-theme');
        localStorage.setItem('theme', 'light');
      } else {
        htmlElement.setAttribute('data-theme', 'dark');
        localStorage.setItem('theme', 'dark');
      }
    },
    getCurrentTheme () {
      return document.documentElement.getAttribute('data-theme') || 'light';
    }
  };
});