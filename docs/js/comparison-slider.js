/**
 * Before/After Comparison Slider Component
 * Interactive slider for showcasing property transformations
 */

export class ComparisonSlider {
  constructor (container, options = {}) {
    this.container = container;
    this.options = {
      initialPosition: 50, // Percentage
      sensitivity: 1,
      animationDuration: 300,
      ...options
    };
    
    this.beforeImage = container.querySelector('.slider-before');
    this.afterImage = container.querySelector('.slider-after');
    this.handle = container.querySelector('.slider-handle');
    this.beforeLabel = container.querySelector('.slider-label.before');
    this.afterLabel = container.querySelector('.slider-label.after');
    
    this.isDragging = false;
    this.containerWidth = 0;
    
    this.init();
  }
  
  init () {
    if (!this.beforeImage || !this.afterImage || !this.handle) {
      
      return;
    }
    
    // Set initial position
    this.setPosition(this.options.initialPosition);
    
    // Add event listeners
    this.handle.addEventListener('mousedown', this.startDrag.bind(this));
    this.handle.addEventListener('touchstart', this.startDrag.bind(this), { passive: false });
    
    document.addEventListener('mousemove', this.drag.bind(this));
    document.addEventListener('touchmove', this.drag.bind(this), { passive: false });
    
    document.addEventListener('mouseup', this.endDrag.bind(this));
    document.addEventListener('touchend', this.endDrag.bind(this));
    
    // Keyboard navigation
    this.handle.addEventListener('keydown', this.handleKeydown.bind(this));
    
    // Resize handling
    window.addEventListener('resize', this.handleResize.bind(this));
    
    // Accessibility
    this.handle.setAttribute('role', 'slider');
    this.handle.setAttribute('aria-valuemin', '0');
    this.handle.setAttribute('aria-valuemax', '100');
    this.handle.setAttribute('aria-valuenow', this.options.initialPosition);
    this.handle.setAttribute('aria-label', 'Adjust comparison slider');
    this.handle.setAttribute('tabindex', '0');
    
    // Add labels if they don't exist
    this.addLabels();
  }
  
  addLabels () {
    if (!this.beforeLabel) {
      const beforeLabel = document.createElement('div');
      beforeLabel.className = 'slider-label before';
      beforeLabel.textContent = 'Before';
      this.container.appendChild(beforeLabel);
      this.beforeLabel = beforeLabel;
    }
    
    if (!this.afterLabel) {
      const afterLabel = document.createElement('div');
      afterLabel.className = 'slider-label after';
      afterLabel.textContent = 'After';
      this.container.appendChild(afterLabel);
      this.afterLabel = afterLabel;
    }
  }
  
  startDrag (e) {
    e.preventDefault();
    this.isDragging = true;
    this.container.classList.add('dragging');
    this.handle.focus();
  }
  
  drag (e) {
    if (!this.isDragging) return;
    
    const clientX = e.clientX || e.touches[0].clientX;
    const rect = this.container.getBoundingClientRect();
    const x = clientX - rect.left;
    
    const percentage = (x / rect.width) * 100;
    this.setPosition(Math.max(0, Math.min(100, percentage)));
  }
  
  endDrag () {
    if (!this.isDragging) return;
    
    this.isDragging = false;
    this.container.classList.remove('dragging');
  }
  
  setPosition (percentage) {
    this.options.initialPosition = percentage;
    
    // Update clip path
    this.beforeImage.style.clipPath = `inset(0 ${100 - percentage}% 0 0)`;
    
    // Update handle position
    this.handle.style.left = `${percentage}%`;
    
    // Update accessibility attributes
    this.handle.setAttribute('aria-valuenow', Math.round(percentage));
    
    // Update labels position
    if (this.beforeLabel) {
      this.beforeLabel.style.left = `${Math.max(10, percentage - 25)}px`;
    }
    if (this.afterLabel) {
      this.afterLabel.style.right = `${Math.max(10, 100 - percentage - 25)}px`;
    }
  }
  
  handleKeydown (e) {
    const step = 1;
    
    switch (e.key) {
    case 'ArrowLeft':
    case 'ArrowDown':
      e.preventDefault();
      this.setPosition(this.options.initialPosition - step);
      break;
    case 'ArrowRight':
    case 'ArrowUp':
      e.preventDefault();
      this.setPosition(this.options.initialPosition + step);
      break;
    case 'Home':
      e.preventDefault();
      this.setPosition(0);
      break;
    case 'End':
      e.preventDefault();
      this.setPosition(100);
      break;
    }
  }
  
  handleResize () {
    // Recalculate position on resize to maintain correct visual alignment
    this.setPosition(this.options.initialPosition);
  }
  
  // Public methods
  reset () {
    this.setPosition(50);
  }
  
  setBeforeImage (src, alt) {
    this.beforeImage.src = src;
    this.beforeImage.alt = alt;
  }
  
  setAfterImage (src, alt) {
    this.afterImage.src = src;
    this.afterImage.alt = alt;
  }
  
  destroy () {
    document.removeEventListener('mousemove', this.drag.bind(this));
    document.removeEventListener('touchmove', this.drag.bind(this));
    document.removeEventListener('mouseup', this.endDrag.bind(this));
    document.removeEventListener('touchend', this.endDrag.bind(this));
    window.removeEventListener('resize', this.handleResize.bind(this));
  }
}

// Initialize all comparison sliders on the page
export function initComparisonSliders () {
  const sliders = document.querySelectorAll('.comparison-slider .slider-container');
  
  sliders.forEach(container => {
    new ComparisonSlider(container, {
      initialPosition: 50,
      sensitivity: 1
    });
  });
}
