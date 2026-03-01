class LoadingAnimation {
  constructor() {
    this.loadingScreen = document.getElementById('loadingScreen');
    this.loadingIcon = document.getElementById('loadingIcon');
    this.loadingText = document.getElementById('loadingText');
    this.mainContent = document.getElementById('mainContent');
    this.headerIcon = document.querySelector('header .material-symbols-outlined');
    this.isAnimating = false;

    // Force light mode to prevent dark theme glitches
    document.documentElement.classList.remove('dark');
    document.documentElement.classList.add('light');
  }

  // Helper utility for delays
  wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async startLoading() {
    if (this.isAnimating) return;
    this.isAnimating = true;

    // Ensure header icon is hidden initially
    if (this.headerIcon) {
      this.headerIcon.style.opacity = '0';
    }

    // Step 1: Show icon (Size 9)
    this.loadingIcon.classList.add('icon-appear');
    await this.wait(500);

    // Step 2: Reduce icon to Size 7
    this.loadingIcon.classList.add('icon-reduce');
    await this.wait(300);

    // Step 3: Show MRC Text (Size 7)
    this.loadingText.classList.add('text-appear');
    await this.wait(800);

    // Step 4: Move to header + Login fade in (simultaneous)
    await this.animateToHeader();
    await this.showMainContent();
  }

  async animateToHeader() {
    if (!this.headerIcon) return;

    // --- First: Measure positions ---
    const startRect = this.loadingIcon.getBoundingClientRect();
    const endRect = this.headerIcon.getBoundingClientRect();

    // Create a precise clone for transition
    const clone = this.loadingIcon.cloneNode(true);

    // Style clone to match start position exactly
    clone.style.position = 'fixed';
    clone.style.top = `${startRect.top}px`;
    clone.style.left = `${startRect.left}px`;
    clone.style.width = `${startRect.width}px`;
    clone.style.height = `${startRect.height}px`;
    clone.style.margin = '0';
    clone.style.zIndex = '100';
    clone.style.transformOrigin = 'top left';
    clone.style.transition = 'transform 1s cubic-bezier(0.34, 1.56, 0.64, 1)';
    clone.style.fontSize = 'clamp(3rem, 8vw, 5rem)';

    // Reset any opacity classes from previous animations
    clone.classList.remove('icon-appear', 'opacity-0');
    clone.style.opacity = '1';
    clone.style.transform = 'translate(0, 0) scale(1)';

    document.body.appendChild(clone);

    // Hide original elements
    this.loadingIcon.style.opacity = '0';
    this.loadingText.style.transition = 'opacity 0.3s ease';
    this.loadingText.style.opacity = '0';

    // Force reflow
    clone.offsetHeight;

    // --- Last & Play: Apply Transform ---
    const translateX = endRect.left - startRect.left;
    const translateY = endRect.top - startRect.top;
    const scale = endRect.width > 0 ? (endRect.width / startRect.width) : 0.3;

    clone.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;

    // Fade out background concurrently
    this.loadingScreen.style.transition = 'opacity 0.5s ease';
    this.loadingScreen.style.opacity = '0';

    // Wait for transition to finish
    await this.wait(1000);

    // --- Cleanup ---
    this.headerIcon.style.transition = 'opacity 0.3s ease';
    this.headerIcon.style.opacity = '1';

    clone.remove();
  }

  async showMainContent() {
    this.loadingScreen.remove();
    this.mainContent.classList.remove('opacity-0');
    this.mainContent.classList.add('content-fade-in');
    this.isAnimating = false;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const loadingAnimation = new LoadingAnimation();
  loadingAnimation.startLoading();
});
