// src/js/auth-handler.js
import { auth } from './auth.js';

export function initAuthLinks () {
  const authLinksContainer = document.getElementById('auth-links');
  if (!authLinksContainer) return;

  try {
    if (auth && auth.isAuthenticated && auth.isAuthenticated()) {
      authLinksContainer.innerHTML = `
        <a href="/profile.html" class="btn btn-secondary cta-link" role="menuitem">Profile</a>
        <button id="logout-btn" class="btn btn-primary cta-link" role="menuitem">Logout</button>
      `;
      
      const logoutBtn = document.getElementById('logout-btn');
      if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
          if (auth.logout) auth.logout();
          window.location.href = '/login.html';
        });
      }
    } else {
      authLinksContainer.innerHTML = `
        <a href="/login.html" class="btn btn-secondary cta-link" role="menuitem">Login</a>
        <a href="/register.html" class="btn btn-primary cta-link" role="menuitem">Register</a>
      `;
    }
  } catch (error) {
    console.warn('Auth initialization failed:', error);
  }
}

document.addEventListener('DOMContentLoaded', initAuthLinks);
