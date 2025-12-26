/**
 * PropertyFilter - Advanced Property Filtering System
 * Properties 4 Creations
 *
 * Features:
 * - Debounced search input
 * - Bedroom/bathroom filters
 * - Tag-based filtering (Section 8, HUD-VASH, Pet Friendly)
 * - Live results count with aria-live announcements
 * - Accessible filter controls
 */

import { auth } from '../../js/auth.js';

export class PropertyFilter {
  constructor (properties, containerSelector) {
    this.allProperties = properties || [];
    this.filteredProperties = [...this.allProperties];
    this.container = document.querySelector(containerSelector);
    this.filterBar = null;
    this.filters = {
      bedrooms: null,
      bathrooms: null,
      tags: [],
      search: '',
      minPrice: null,
      maxPrice: null,
      propertyType: ''
    };
    this.debounceTimeout = null;
    this.debounceDelay = 300;
  }

  /**
   * Initialize the filter system
   */
  init () {
    if (!this.container) {
      // PropertyFilter: Container not found - silently ignore
      return;
    }

    this.createFilterUI();
    this.attachEventListeners();
    this.render();
    this.updateResultsCount();
  }

  /**
   * Create the filter UI elements
   */
  createFilterUI () {
    this.filterBar = document.createElement('div');
    this.filterBar.className = 'filter-bar';
    this.filterBar.setAttribute('role', 'search');
    this.filterBar.setAttribute('aria-label', 'Property filters');

    this.filterBar.innerHTML = `
      <div class="filter-controls">
        <div class="filter-group filter-group--search">
          <label for="property-search" class="filter-label">Search Properties</label>
          <input type="search" 
                 id="property-search" 
                 class="filter-input"
                 placeholder="Search by name or location..."
                 aria-label="Search properties by name or location"
                 autocomplete="off">
        </div>
        
        <div class="filter-group">
          <label for="filter-bedrooms" class="filter-label">Bedrooms</label>
          <select id="filter-bedrooms" class="filter-select" aria-label="Filter by number of bedrooms">
            <option value="">Any Bedrooms</option>
            <option value="1">1+ Bedroom</option>
            <option value="2">2+ Bedrooms</option>
            <option value="3">3+ Bedrooms</option>
            <option value="4">4+ Bedrooms</option>
          </select>
        </div>
        
        <div class="filter-group">
          <label for="filter-bathrooms" class="filter-label">Bathrooms</label>
          <select id="filter-bathrooms" class="filter-select" aria-label="Filter by number of bathrooms">
            <option value="">Any Bathrooms</option>
            <option value="1">1+ Bathroom</option>
            <option value="2">2+ Bathrooms</option>
            <option value="3">3+ Bathrooms</option>
          </select>
        </div>

        <div class="filter-group">
          <label for="filter-property-type" class="filter-label">Property Type</label>
          <select id="filter-property-type" class="filter-select" aria-label="Filter by property type">
            <option value="">All Types</option>
            <option value="Single Family">Single Family</option>
            <option value="Townhome">Townhome</option>
            <option value="Historic">Historic</option>
            <option value="Waterfront">Waterfront</option>
            <option value="Studio">Studio</option>
            <option value="Suburban">Suburban</option>
            <option value="Urban">Urban</option>
          </select>
        </div>

        <div class="filter-group filter-group--price">
          <label for="filter-price-range" class="filter-label">Price Range</label>
          <div class="price-range-inputs">
            <input type="number" id="filter-min-price" class="filter-input" placeholder="Min Price" aria-label="Minimum price">
            <span>-</span>
            <input type="number" id="filter-max-price" class="filter-input" placeholder="Max Price" aria-label="Maximum price">
          </div>
        </div>
        
        <div class="filter-group filter-group--tags">
          <span class="filter-label" id="tag-filter-label">Amenities & Programs</span>
          <div class="filter-tags" role="group" aria-labelledby="tag-filter-label">
            <button type="button" 
                    class="tag-filter" 
                    data-tag="Section 8"
                    aria-pressed="false">
              Section 8
            </button>
            <button type="button" 
                    class="tag-filter" 
                    data-tag="HUD-VASH"
                    aria-pressed="false">
              HUD-VASH
            </button>
            <button type="button" 
                    class="tag-filter" 
                    data-tag="Pet Friendly"
                    aria-pressed="false">
              Pet Friendly
            </button>
            <button type="button" 
                    class="tag-filter" 
                    data-tag="ADA Accessible"
                    aria-pressed="false">
              ADA Accessible
            </button>
            <button type="button" 
                    class="tag-filter" 
                    data-tag="Family Friendly"
                    aria-pressed="false">
              Family Friendly
            </button>
          </div>
        </div>
        
        <div class="filter-group filter-group--actions">
          <button type="button" id="reset-filters" class="btn btn-secondary btn-sm">
            <span aria-hidden="true">✕</span> Reset Filters
          </button>
        </div>
      </div>
      
      <div class="filter-results" aria-live="polite" aria-atomic="true">
        <span class="results-count">
          <strong id="results-count">${this.allProperties.length}</strong> 
          <span id="results-label">properties found</span>
        </span>
      </div>
    `;

    this.container.insertAdjacentElement('beforebegin', this.filterBar);
  }

  /**
   * Attach event listeners to filter controls
   */
  attachEventListeners () {
    // Debounced search input
    const searchInput = document.getElementById('property-search');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        clearTimeout(this.debounceTimeout);
        this.debounceTimeout = setTimeout(() => {
          this.filters.search = e.target.value.toLowerCase().trim();
          this.applyFilters();
        }, this.debounceDelay);
      });

      // Clear search on Escape
      searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          searchInput.value = '';
          this.filters.search = '';
          this.applyFilters();
        }
      });
    }

    // Bedroom filter
    const bedroomSelect = document.getElementById('filter-bedrooms');
    if (bedroomSelect) {
      bedroomSelect.addEventListener('change', (e) => {
        this.filters.bedrooms = e.target.value
          ? parseInt(e.target.value, 10)
          : null;
        this.applyFilters();
      });
    }

    // Bathroom filter
    const bathroomSelect = document.getElementById('filter-bathrooms');
    if (bathroomSelect) {
      bathroomSelect.addEventListener('change', (e) => {
        this.filters.bathrooms = e.target.value
          ? parseInt(e.target.value, 10)
          : null;
        this.applyFilters();
      });
    }

    // Property Type filter
    const propertyTypeSelect = document.getElementById('filter-property-type');
    if (propertyTypeSelect) {
      propertyTypeSelect.addEventListener('change', (e) => {
        this.filters.propertyType = e.target.value;
        this.applyFilters();
      });
    }

    // Price range filters
    const minPriceInput = document.getElementById('filter-min-price');
    const maxPriceInput = document.getElementById('filter-max-price');

    const handlePriceChange = () => {
      this.filters.minPrice = minPriceInput.value ? parseInt(minPriceInput.value, 10) : null;
      this.filters.maxPrice = maxPriceInput.value ? parseInt(maxPriceInput.value, 10) : null;
      this.applyFilters();
    };

    if (minPriceInput) {
      minPriceInput.addEventListener('input', () => {
        clearTimeout(this.debounceTimeout);
        this.debounceTimeout = setTimeout(handlePriceChange, this.debounceDelay);
      });
    }
    if (maxPriceInput) {
      maxPriceInput.addEventListener('input', () => {
        clearTimeout(this.debounceTimeout);
        this.debounceTimeout = setTimeout(handlePriceChange, this.debounceDelay);
      });
    }

    // Tag filters (event delegation)
    const tagContainer = this.filterBar.querySelector('.filter-tags');
    if (tagContainer) {
      tagContainer.addEventListener('click', (e) => {
        const tagButton = e.target.closest('.tag-filter');
        if (!tagButton) return;

        const tag = tagButton.dataset.tag;
        const index = this.filters.tags.indexOf(tag);

        if (index > -1) {
          this.filters.tags.splice(index, 1);
          tagButton.classList.remove('active');
          tagButton.setAttribute('aria-pressed', 'false');
        } else {
          this.filters.tags.push(tag);
          tagButton.classList.add('active');
          tagButton.setAttribute('aria-pressed', 'true');
        }

        this.applyFilters();
      });
    }

    // Reset button
    const resetButton = document.getElementById('reset-filters');
    if (resetButton) {
      resetButton.addEventListener('click', () => {
        this.resetFilters();
      });
    }
  }

  /**
   * Apply all active filters to the property list
   */
  applyFilters () {
    this.filteredProperties = this.allProperties.filter((prop) => {
      // Search filter
      if (this.filters.search) {
        const searchable =
          `${prop.name || ''} ${prop.address || ''} ${prop.city || ''} ${prop.description || ''}`.toLowerCase();
        if (!searchable.includes(this.filters.search)) {
          return false;
        }
      }

      // Bedroom filter
      if (
        this.filters.bedrooms !== null &&
        prop.bedrooms < this.filters.bedrooms
      ) {
        return false;
      }

      // Bathroom filter
      if (
        this.filters.bathrooms !== null &&
        prop.bathrooms < this.filters.bathrooms
      ) {
        return false;
      }

      // Property type filter
      if (
        this.filters.propertyType &&
        prop.type !== this.filters.propertyType
      ) {
        return false;
      }

      // Price range filter
      if (
        this.filters.minPrice !== null &&
        prop.price_amount < this.filters.minPrice
      ) {
        return false;
      }
      if (
        this.filters.maxPrice !== null &&
        prop.price_amount > this.filters.maxPrice
      ) {
        return false;
      }

      // Tag filter (must have ALL selected tags)
      if (this.filters.tags.length > 0) {
        const propTags = prop.tags || [];
        const hasAllTags = this.filters.tags.every((tag) =>
          propTags.includes(tag)
        );
        if (!hasAllTags) {
          return false;
        }
      }

      return true;
    });

    this.render();
    this.updateResultsCount();
  }

  /**
   * Reset all filters to default state
   */
  resetFilters () {
    // Reset filter state
    this.filters = {
      bedrooms: null,
      bathrooms: null,
      tags: [],
      search: '',
      minPrice: null,
      maxPrice: null,
      propertyType: ''
    };

    // Reset UI elements
    const searchInput = document.getElementById('property-search');
    if (searchInput) searchInput.value = '';

    const bedroomSelect = document.getElementById('filter-bedrooms');
    if (bedroomSelect) bedroomSelect.value = '';

    const bathroomSelect = document.getElementById('filter-bathrooms');
    if (bathroomSelect) bathroomSelect.value = '';

    const propertyTypeSelect = document.getElementById('filter-property-type');
    if (propertyTypeSelect) propertyTypeSelect.value = '';

    const minPriceInput = document.getElementById('filter-min-price');
    if (minPriceInput) minPriceInput.value = '';

    const maxPriceInput = document.getElementById('filter-max-price');
    if (maxPriceInput) maxPriceInput.value = '';

    // Reset tag buttons
    document.querySelectorAll('.tag-filter').forEach((btn) => {
      btn.classList.remove('active');
      btn.setAttribute('aria-pressed', 'false');
    });

    // Reset filtered properties
    this.filteredProperties = [...this.allProperties];
    this.render();
    this.updateResultsCount();

    // Announce reset to screen readers
    this.announceToScreenReader('Filters reset. Showing all properties.');
  }

  /**
   * Render the filtered property cards
   */
  render () {
    if (!this.container) return;

    this.container.innerHTML = '';

    if (this.filteredProperties.length === 0) {
      this.container.innerHTML = `
        <div class="no-results" role="status">
          <div class="no-results__icon" aria-hidden="true">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <circle cx="11" cy="11" r="8"/>
              <path d="m21 21-4.35-4.35"/>
              <path d="M8 11h6"/>
            </svg>
          </div>
          <h3 class="no-results__title">No Properties Found</h3>
          <p class="no-results__message">No properties match your current filters. Try adjusting your search criteria.</p>
          <button type="button" class="btn btn-primary" id="no-results-reset">
            Reset Filters
          </button>
        </div>
      `;

      // Add reset handler for no results button
      const noResultsReset = document.getElementById('no-results-reset');
      if (noResultsReset) {
        noResultsReset.addEventListener('click', () => this.resetFilters());
      }
      return;
    }

    // Render property cards
    this.filteredProperties.forEach((prop, index) => {
      const card = this.createPropertyCard(prop, index);
      this.container.appendChild(card);
    });
  }

  /**
   * Create a property card element
   * @param {Object} prop - Property data
   * @param {number} index - Card index for animation delay
   * @returns {HTMLElement} Property card element
   */
  createPropertyCard (prop, index) {
    const card = document.createElement('article');
    card.className = 'property-card';
    card.style.animationDelay = `${index * 50}ms`;
    card.setAttribute('data-property-id', prop.id || prop.slug);

    const tagsHtml = (prop.tags || [])
      .map(
        (tag) =>
          `<span class="property-card__tag">${this.escapeHtml(tag)}</span>`
      )
      .join('');

    card.innerHTML = `
      <div class="property-card__image-container">
        <img src="${this.escapeHtml(prop.image || '/images/properties/placeholder.webp')}" 
             alt="${this.escapeHtml(prop.name)}" 
             loading="lazy" 
             decoding="async"
             class="property-card__image">
        ${prop.featured ? '<span class="property-card__badge">Featured</span>' : ''}
      </div>
      <div class="property-card__content">
        <h3 class="property-card__title">${this.escapeHtml(prop.name)}</h3>
        <p class="property-card__address">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
          ${this.escapeHtml(prop.address || '')}${prop.city ? `, ${this.escapeHtml(prop.city)}` : ''}
        </p>
        <ul class="property-card__features" aria-label="Property features">
          <li>
            <strong>${prop.bedrooms || 0}</strong> 
            Bed${(prop.bedrooms || 0) !== 1 ? 's': ''}
          </li>
          <li>
            <strong>${prop.bathrooms || 0}</strong> 
            Bath${(prop.bathrooms || 0) !== 1 ? 's': ''}
          </li>
          <li>
            <strong>${(prop.sqft || 0).toLocaleString()}</strong> 
            sqft
          </li>
        </ul>
        ${tagsHtml ? `<div class="property-card__tags">${tagsHtml}</div>` : ''}
        <div class="property-card__actions">
          <a href="./${this.escapeHtml(prop.slug || prop.id)}.html" 
             class="btn btn-primary btn-sm">
            View Details
          </a>
          ${auth.isAuthenticated ? 
    `<button class="btn btn-secondary btn-sm save-property-btn" data-property-id="${prop.id}">
              ${auth.isPropertySaved(prop.id) ? 'Unsave' : 'Save'}
            </button>` : ''}
        </div>
      </div>
    `;

    // Attach event listener for save/unsave button
    if (auth.isAuthenticated) {
      const saveButton = card.querySelector('.save-property-btn');
      if (saveButton) {
        saveButton.addEventListener('click', async (e) => {
          const propertyId = e.target.dataset.propertyId;
          if (auth.isPropertySaved(propertyId)) {
            await auth.removeProperty(propertyId);
            e.target.textContent = 'Save';
          } else {
            await auth.saveProperty(propertyId);
            e.target.textContent = 'Unsave';
          }
          // Optionally, re-render the card or entire list to update state
          // this.render(); // This would re-render everything, might be too heavy
          // Just update the button text for now.
        });
      }
    }

    return card;
  }

  /**
   * Update the results count display
   */
  updateResultsCount () {
    const countElement = document.getElementById('results-count');
    const labelElement = document.getElementById('results-label');

    if (countElement) {
      countElement.textContent = this.filteredProperties.length;
    }

    if (labelElement) {
      labelElement.textContent =
        this.filteredProperties.length === 1
          ? 'property found'
          : 'properties found';
    }
  }

  /**
   * Announce message to screen readers
   * @param {string} message - Message to announce
   */
  announceToScreenReader (message) {
    const announcement = document.createElement('div');
    announcement.setAttribute('role', 'status');
    announcement.setAttribute('aria-live', 'polite');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    document.body.appendChild(announcement);

    setTimeout(() => {
      announcement.remove();
    }, 1000);
  }

  /**
   * Escape HTML to prevent XSS
   * @param {string} text - Text to escape
   * @returns {string} Escaped text
   */
  escapeHtml (text) {
    if (typeof text !== 'string') return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Update properties data (for dynamic loading)
   * @param {Array} properties - New properties array
   */
  updateProperties (properties) {
    this.allProperties = properties || [];
    this.applyFilters();
  }

  /**
   * Get current filter state
   * @returns {Object} Current filters
   */
  getFilters () {
    return { ...this.filters };
  }

  /**
   * Set filters programmatically
   * @param {Object} filters - Filters to apply
   */
  setFilters (filters) {
    this.filters = { ...this.filters, ...filters };
    this.applyFilters();
  }

  /**
   * Destroy the filter instance and clean up
   */
  destroy () {
    if (this.filterBar) {
      this.filterBar.remove();
    }
    clearTimeout(this.debounceTimeout);
  }
}

// Export for global access if needed
if (typeof window !== 'undefined') {
  window.PropertyFilter = PropertyFilter;
}

export default PropertyFilter;
