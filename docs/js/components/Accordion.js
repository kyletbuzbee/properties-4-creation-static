/**
 * Accordion - Accessible Accordion Component
 * Properties 4 Creations
 *
 * Features:
 * - ARIA expanded states
 * - Keyboard navigation (Enter/Space to toggle, Arrow keys)
 * - Single or multiple panels open
 * - Smooth height animations
 * - Screen reader announcements
 */

export class Accordion {
  constructor (containerSelector, options = {}) {
    this.container =
      typeof containerSelector === 'string'
        ? document.querySelector(containerSelector)
        : containerSelector;

    this.options = {
      allowMultiple: false,
      defaultOpen: [], // Array of indices to open by default
      animationDuration: 300,
      onToggle: null,
      ...options
    };

    this.items = [];
    this.init();
  }

  /**
   * Initialize the accordion
   */
  init () {
    if (!this.container) {
      // Accordion: Container not found - silently ignore
      return;
    }

    // Support both BEM naming and legacy FAQ naming
    const accordionItems = this.container.querySelectorAll(
      '.accordion__item, .faq-item'
    );

    accordionItems.forEach((item, index) => {
      const button = item.querySelector(
        '.accordion__button, .accordion__header, .faq-question'
      );
      const panel = item.querySelector(
        '.accordion__panel, .accordion__content, .faq-answer'
      );

      if (!button || !panel) return;

      // Generate unique IDs
      const buttonId = button.id || `accordion-button-${index}`;
      const panelId = panel.id || `accordion-panel-${index}`;

      button.id = buttonId;
      panel.id = panelId;

      // Set ARIA attributes
      button.setAttribute('aria-expanded', 'false');
      button.setAttribute('aria-controls', panelId);
      button.setAttribute('role', 'button');
      button.setAttribute('tabindex', '0');

      panel.setAttribute('aria-labelledby', buttonId);
      panel.setAttribute('role', 'region');
      panel.hidden = true;

      // Add icon if not present
      if (!button.querySelector('.accordion__icon')) {
        const icon = document.createElement('span');
        icon.className = 'accordion__icon';
        icon.setAttribute('aria-hidden', 'true');
        icon.innerHTML = `
          <svg width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2'>
            <polyline points='6 9 12 15 18 9'/>
          </svg>
        `;
        button.appendChild(icon);
      }

      // Event listeners
      button.addEventListener('click', () => this.toggle(index));
      button.addEventListener('keydown', (e) => this.handleKeydown(e, index));

      this.items.push({ item, button, panel, isOpen: false });
    });

    // Open default panels
    this.options.defaultOpen.forEach((index) => {
      if (index >= 0 && index < this.items.length) {
        this.open(index, false);
      }
    });
  }

  /**
   * Toggle an accordion panel
   * @param {number} index - Panel index
   */
  toggle (index) {
    if (index < 0 || index >= this.items.length) return;

    const { isOpen } = this.items[index];

    if (isOpen) {
      this.close(index);
    } else {
      this.open(index);
    }
  }

  /**
   * Open an accordion panel
   * @param {number} index - Panel index
   * @param {boolean} animate - Whether to animate
   */
  open (index, animate = true) {
    if (index < 0 || index >= this.items.length) return;

    const { button, panel, isOpen } = this.items[index];

    if (isOpen) return;

    // Close other panels if not allowing multiple
    if (!this.options.allowMultiple) {
      this.items.forEach((item, i) => {
        if (i !== index && item.isOpen) {
          this.close(i, animate);
        }
      });
    }

    // Update state
    this.items[index].isOpen = true;
    button.setAttribute('aria-expanded', 'true');
    button.classList.add('accordion__button--active');
    panel.hidden = false;

    // Animate opening
    if (animate) {
      this.animateOpen(panel);
    } else {
      panel.style.maxHeight = 'none';
      panel.classList.add('accordion__panel--active');
    }

    // Callback
    if (typeof this.options.onToggle === 'function') {
      this.options.onToggle(index, true);
    }
  }

  /**
   * Close an accordion panel
   * @param {number} index - Panel index
   * @param {boolean} animate - Whether to animate
   */
  close (index, animate = true) {
    if (index < 0 || index >= this.items.length) return;

    const { button, panel, isOpen } = this.items[index];

    if (!isOpen) return;

    // Update state
    this.items[index].isOpen = false;
    button.setAttribute('aria-expanded', 'false');
    button.classList.remove('accordion__button--active');

    // Animate closing
    if (animate) {
      this.animateClose(panel);
    } else {
      panel.hidden = true;
      panel.style.maxHeight = '';
      panel.classList.remove('accordion__panel--active');
    }

    // Callback
    if (typeof this.options.onToggle === 'function') {
      this.options.onToggle(index, false);
    }
  }

  /**
   * Animate panel opening
   * @param {HTMLElement} panel - Panel element
   */
  animateOpen (panel) {
    // Get the natural height
    panel.style.maxHeight = 'none';
    const height = panel.scrollHeight;
    panel.style.maxHeight = '0px';

    // Force reflow
    panel.offsetHeight;

    // Animate to natural height
    panel.style.transition = `max-height ${this.options.animationDuration}ms ease-out`;
    panel.style.maxHeight = `${height}px`;
    panel.classList.add('accordion__panel--active');

    // Clean up after animation
    setTimeout(() => {
      panel.style.maxHeight = 'none';
      panel.style.transition = '';
    }, this.options.animationDuration);
  }

  /**
   * Animate panel closing
   * @param {HTMLElement} panel - Panel element
   */
  animateClose (panel) {
    // Set current height explicitly
    const height = panel.scrollHeight;
    panel.style.maxHeight = `${height}px`;

    // Force reflow
    panel.offsetHeight;

    // Animate to 0
    panel.style.transition = `max-height ${this.options.animationDuration}ms ease-out`;
    panel.style.maxHeight = '0px';
    panel.classList.remove('accordion__panel--active');

    // Hide after animation
    setTimeout(() => {
      panel.hidden = true;
      panel.style.maxHeight = '';
      panel.style.transition = '';
    }, this.options.animationDuration);
  }

  /**
   * Handle keyboard navigation
   * @param {KeyboardEvent} e - Keyboard event
   * @param {number} index - Current panel index
   */
  handleKeydown (e, index) {
    const { key } = e;

    switch (key) {
    case 'Enter':
    case ' ':
      e.preventDefault();
      this.toggle(index);
      break;

    case 'ArrowDown':
      e.preventDefault();
      this.focusNext(index);
      break;

    case 'ArrowUp':
      e.preventDefault();
      this.focusPrevious(index);
      break;

    case 'Home':
      e.preventDefault();
      this.focusFirst();
      break;

    case 'End':
      e.preventDefault();
      this.focusLast();
      break;
    }
  }

  /**
   * Focus next accordion button
   * @param {number} currentIndex - Current index
   */
  focusNext (currentIndex) {
    const nextIndex = (currentIndex + 1) % this.items.length;
    this.items[nextIndex].button.focus();
  }

  /**
   * Focus previous accordion button
   * @param {number} currentIndex - Current index
   */
  focusPrevious (currentIndex) {
    const prevIndex =
      currentIndex === 0 ? this.items.length - 1 : currentIndex - 1;
    this.items[prevIndex].button.focus();
  }

  /**
   * Focus first accordion button
   */
  focusFirst () {
    if (this.items.length > 0) {
      this.items[0].button.focus();
    }
  }

  /**
   * Focus last accordion button
   */
  focusLast () {
    if (this.items.length > 0) {
      this.items[this.items.length - 1].button.focus();
    }
  }

  /**
   * Open all panels
   */
  openAll () {
    this.items.forEach((_, index) => this.open(index));
  }

  /**
   * Close all panels
   */
  closeAll () {
    this.items.forEach((_, index) => this.close(index));
  }

  /**
   * Get open panel indices
   * @returns {number[]} Array of open panel indices
   */
  getOpenPanels () {
    return this.items
      .map((item, index) => (item.isOpen ? index : -1))
      .filter((index) => index !== -1);
  }

  /**
   * Check if a panel is open
   * @param {number} index - Panel index
   * @returns {boolean} True if panel is open
   */
  isPanelOpen (index) {
    return this.items[index]?.isOpen || false;
  }

  /**
   * Destroy the accordion and clean up
   */
  destroy () {
    this.items.forEach(({ button, panel }) => {
      button.removeAttribute('aria-expanded');
      button.removeAttribute('aria-controls');
      button.removeAttribute('role');
      button.removeAttribute('tabindex');
      button.classList.remove('accordion__button--active');

      panel.removeAttribute('aria-labelledby');
      panel.removeAttribute('role');
      panel.hidden = false;
      panel.style.maxHeight = '';
      panel.classList.remove('accordion__panel--active');
    });

    this.items = [];
  }
}

/**
 * Initialize all accordions on the page
 * @param {string} selector - Accordion container selector
 * @param {Object} options - Accordion options
 * @returns {Accordion[]} Array of accordion instances
 */
export function initAccordions (selector = '.accordion', options = {}) {
  const containers = document.querySelectorAll(selector);
  return Array.from(containers).map(
    (container) => new Accordion(container, options)
  );
}

// Export for global access if needed
if (typeof window !== 'undefined') {
  window.Accordion = Accordion;
  window.initAccordions = initAccordions;
}

export default Accordion;
