export const auth = {
  isAuthenticated: false,
  user: null,
  token: null,
  
  init () {
    this.token = localStorage.getItem('token');
    if (this.token) {
      this.isAuthenticated = true;
      this.loadUser();
    }
  },

  async register (name, email, password) {
    try {
      const res = await fetch('/api/users/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name, email, password })
      });
      const data = await res.json();
      if (res.ok) {
        this.setAuth(data.token, data.user);
        return { success: true, message: 'Registration successful!' };
      } else {
        return { success: false, message: data.msg || 'Registration failed.' };
      }
    } catch (err) {
      
      return { success: false, message: 'Network error during registration.' };
    }
  },

  async login (email, password) {
    try {
      const res = await fetch('/api/users/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (res.ok) {
        this.setAuth(data.token, data.user);
        return { success: true, message: 'Login successful!' };
      } else {
        return { success: false, message: data.msg || 'Login failed.' };
      }
    } catch (err) {
      
      return { success: false, message: 'Network error during login.' };
    }
  },

  logout () {
    this.isAuthenticated = false;
    this.user = null;
    this.token = null;
    localStorage.removeItem('token');
    // Consider also clearing saved properties data if needed
  },

  setAuth (token, user) {
    this.token = token;
    this.user = user;
    this.isAuthenticated = true;
    localStorage.setItem('token', token);
  },

  async loadUser () {
    if (!this.token) {
      this.logout();
      return;
    }
    try {
      const res = await fetch('/api/users/me', {
        headers: {
          'x-auth-token': this.token
        }
      });
      const data = await res.json();
      if (res.ok) {
        this.user = data; // Assign the full user object, which should include savedProperties
        this.isAuthenticated = true;
      } else {
        this.logout(); // Token might be expired or invalid
      }
    } catch (err) {
      
      this.logout();
    }
  },

  async saveProperty (propertyId) {
    if (!this.isAuthenticated || !this.user) return { success: false, message: 'Not authenticated.' };
    try {
      const res = await fetch('/api/users/me/saved-properties', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...this.getAuthHeaders()
        },
        body: JSON.stringify({ propertyId })
      });
      const data = await res.json();
      if (res.ok) {
        this.user.savedProperties = data; // Update local state
        return { success: true, message: 'Property saved.' };
      } else {
        return { success: false, message: data.msg || 'Failed to save property.' };
      }
    } catch (err) {
      
      return { success: false, message: 'Network error saving property.' };
    }
  },

  async removeProperty (propertyId) {
    if (!this.isAuthenticated || !this.user) return { success: false, message: 'Not authenticated.' };
    try {
      const res = await fetch(`/api/users/me/saved-properties/${propertyId}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders()
      });
      const data = await res.json();
      if (res.ok) {
        this.user.savedProperties = data; // Update local state
        return { success: true, message: 'Property removed.' };
      } else {
        return { success: false, message: data.msg || 'Failed to remove property.' };
      }
    } catch (err) {
      
      return { success: false, message: 'Network error removing property.' };
    }
  },

  isPropertySaved (propertyId) {
    return this.isAuthenticated && this.user && this.user.savedProperties && this.user.savedProperties.includes(propertyId);
  },

  getAuthHeaders () {
    if (this.token) {
      return { 'x-auth-token': this.token };
    }
    return {};
  }
};
