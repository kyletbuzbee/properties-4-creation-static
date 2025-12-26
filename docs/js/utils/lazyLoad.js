/**
 * Lazy Loading Utility
 * Properties 4 Creations - Performance Optimization
 *
 * Uses IntersectionObserver for efficient lazy loading of images
 * Falls back to immediate loading for browsers without support
 */

export class LazyLoader {
  /**
   * Create a LazyLoader instance
   * @param {Object} options - Configuration options
   * @param {string} options.selector - CSS selector for lazy images (default: 'img[data-src]')
   * @param {string} options.rootMargin - IntersectionObserver root margin (default: '50px 0px')
   * @param {number} options.threshold - IntersectionObserver threshold (default: 0.01)
   */
  constructor (options = {}) {
    this.selector = options.selector || 'img[data-src]';
    this.rootMargin = options.rootMargin || '50px 0px';
    this.threshold = options.threshold || 0.01;
    this.observer = null;
    this.loadedCount = 0;

    this.init();
  }

  /**
   * Initialize the lazy loader
   */
  init () {
    const images = document.querySelectorAll(this.selector);

    if (images.length === 0) {
      return;
    }

    if ('IntersectionObserver' in window) {
      this.createObserver();
      images.forEach((img) => this.observer.observe(img));
    } else {
      // Fallback: load all images immediately
      this.loadAllImages(images);
    }
  }

  /**
   * Create the IntersectionObserver
   */
  createObserver () {
    this.observer = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            this.loadImage(entry.target);
            observer.unobserve(entry.target);
          }
        });
      },
      {
        rootMargin: this.rootMargin,
        threshold: this.threshold
      }
    );
  }

  /**
   * Load a single image
   * @param {HTMLImageElement} img - The image element to load
   */
  loadImage (img) {
    // Get the actual source
    const src = img.dataset.src;
    const srcset = img.dataset.srcset;
    const sizes = img.dataset.sizes;

    if (!src) return;

    // Create a new image to preload
    const preloadImg = new Image();

    preloadImg.onload = () => {
      // Apply the source
      img.src = src;

      if (srcset) {
        img.srcset = srcset;
      }

      if (sizes) {
        img.sizes = sizes;
      }

      // Add loaded class for CSS transitions
      img.classList.remove('lazy');
      img.classList.add('lazy-loaded');

      // Remove data attributes
      delete img.dataset.src;
      delete img.dataset.srcset;
      delete img.dataset.sizes;

      this.loadedCount++;

      // Dispatch custom event
      img.dispatchEvent(
        new CustomEvent('lazyloaded', {
          bubbles: true,
          detail: { src, loadedCount: this.loadedCount }
        })
      );
    };

    preloadImg.onerror = () => {
      img.classList.add('lazy-error');
      // Failed to load image - silently handle error
    };

    // Start loading
    if (srcset) {
      preloadImg.srcset = srcset;
    }
    preloadImg.src = src;
  }

  /**
   * Load all images immediately (fallback for no IntersectionObserver)
   * @param {NodeList} images - List of image elements
   */
  loadAllImages (images) {
    images.forEach((img) => this.loadImage(img));
  }

  /**
   * Manually observe a new image
   * @param {HTMLImageElement} img - Image element to observe
   */
  observe (img) {
    if (this.observer) {
      this.observer.observe(img);
    } else {
      this.loadImage(img);
    }
  }

  /**
   * Disconnect the observer
   */
  disconnect () {
    if (this.observer) {
      this.observer.disconnect();
    }
  }

  /**
   * Get the count of loaded images
   * @returns {number} Number of images loaded
   */
  getLoadedCount () {
    return this.loadedCount;
  }
}

/**
 * Initialize lazy loading for native lazy loading support
 * Adds loading='lazy' support check and polyfill
 */
export function initNativeLazyLoading () {
  // Check for native lazy loading support
  if ('loading' in HTMLImageElement.prototype) {
    // Native lazy loading is supported
    const images = document.querySelectorAll('img[loading="lazy"]');
    images.forEach((img) => {
      // Ensure src is set for native lazy loading
      if (img.dataset.src && !img.src) {
        img.src = img.dataset.src;
      }
    });
  } else {
    // Fall back to IntersectionObserver
    const lazyLoader = new LazyLoader({
      selector: 'img[loading="lazy"]'
    });
    return lazyLoader;
  }
}

/**
 * Create responsive image HTML with lazy loading
 * @param {Object} options - Image options
 * @param {string} options.basePath - Base path to the image (without extension)
 * @param {string} options.alt - Alt text for the image
 * @param {number[]} options.sizes - Array of widths (default: [400, 800, 1200])
 * @param {string} options.defaultSize - Default size to use (default: '800')
 * @returns {string} HTML string for the picture element
 */
export function createResponsiveImage (options) {
  const {
    basePath,
    alt,
    sizes = [400, 800, 1200],
    defaultSize = '800',
    className = ''
  } = options;

  const srcset = sizes
    .map((size) => `${basePath}-${size}w.webp ${size}w`)
    .join(', ');
  const sizesAttr =
    '(max-width: 600px) 400px, (max-width: 1000px) 800px, 1200px';

  return `
    <picture>
      <source 
        srcset='${srcset}'
        sizes='${sizesAttr}'
        type='image/webp'>
      <img 
        src='${basePath}-${defaultSize}w.webp'
        data-src='${basePath}-${defaultSize}w.webp'
        data-srcset='${srcset}'
        data-sizes='${sizesAttr}'
        alt='${alt}'
        loading='lazy'
        decoding='async'
        class='lazy ${className}'>
    </picture>
  `.trim();
}


