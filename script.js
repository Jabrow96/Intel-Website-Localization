// Automatically detect RTL languages and apply correct direction
document.addEventListener('DOMContentLoaded', () => {
  const htmlElement = document.getElementById('html-element');
  
  // List of RTL language codes
  const rtlLanguages = ['ar', 'he', 'fa', 'ur', 'yi', 'ji', 'iw', 'ku'];
  
  // Function to detect RTL characters in text
  // Returns true if the text contains significant RTL characters
  function hasRTLCharacters(text) {
    // RTL character ranges:
    // Arabic: \u0600-\u06FF
    // Hebrew: \u0590-\u05FF
    // Farsi/Persian: included in Arabic range
    // Urdu: mostly overlaps with Arabic
    const rtlCharPattern = /[\u0590-\u08FF]/g;
    const matches = text.match(rtlCharPattern) || [];
    // If more than 10% of characters are RTL, consider it RTL content
    return matches.length > text.length * 0.1;
  }
  
  // Function to set the correct direction
  function setPageDirection() {
    // First check lang attribute
    const currentLang = htmlElement.getAttribute('lang') || 'en';
    const langCode = currentLang.split('-')[0].toLowerCase();
    
    if (rtlLanguages.includes(langCode)) {
      htmlElement.setAttribute('dir', 'rtl');
      return;
    }
    
    // If lang attribute doesn't indicate RTL, check actual page content
    const pageText = document.body.innerText || '';
    if (hasRTLCharacters(pageText)) {
      htmlElement.setAttribute('dir', 'rtl');
    } else {
      htmlElement.setAttribute('dir', 'ltr');
    }
  }
  
  // Set initial direction
  setPageDirection();
  
  // Watch for changes (e.g., when Google Translate modifies the page)
  const observer = new MutationObserver((mutations) => {
    // Debounce to avoid checking too frequently
    clearTimeout(observer.checkTimeout);
    observer.checkTimeout = setTimeout(setPageDirection, 100);
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true
  });
});

// Map vertical wheel to horizontal scroll for the timeline
// More robust: normalize deltaMode, check if horizontal scrolling is available, and use scrollBy for smoother control

document.addEventListener('DOMContentLoaded', () => {
  const timeline = document.querySelector('.timeline');
  if (!timeline) return;

  // Only enable if content overflows horizontally
  const canScrollHorizontally = () => timeline.scrollWidth > timeline.clientWidth + 1;

  // Normalize delta to pixels for consistent behavior across devices
  const normalizeDeltaY = (e) => {
    let delta = e.deltaY;
    if (e.deltaMode === 1) delta *= 16; // lines to px
    else if (e.deltaMode === 2) delta *= 800; // pages to px
    return delta;
  };

  // Wheel handler with non-passive option so we can preventDefault
  const onWheel = (e) => {
    if (!canScrollHorizontally()) return; // nothing to do

    // prefer vertical movement to drive horizontal scroll
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      e.preventDefault();
      const delta = normalizeDeltaY(e);
      const speed = 1.2; // tweakable multiplier

      // Use scrollBy for smoother, hardware-accelerated scrolling
      timeline.scrollBy({ left: delta * speed, behavior: 'auto' });
    }
  };

  // Attach listener with passive: false so preventDefault works reliably
  try {
    timeline.addEventListener('wheel', onWheel, { passive: false });
  } catch (err) {
    // Fallback for older browsers
    timeline.addEventListener('wheel', onWheel);
  }

  // Keyboard support: left/right arrows and page up/down for larger jumps
  timeline.addEventListener('keydown', (e) => {
    const small = 260; // approximate card width
    const big = timeline.clientWidth * 0.8;

    if (e.key === 'ArrowRight') {
      e.preventDefault();
      timeline.scrollBy({ left: small, behavior: 'smooth' });
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      timeline.scrollBy({ left: -small, behavior: 'smooth' });
    } else if (e.key === 'PageDown') {
      e.preventDefault();
      timeline.scrollBy({ left: big, behavior: 'smooth' });
    } else if (e.key === 'PageUp') {
      e.preventDefault();
      timeline.scrollBy({ left: -big, behavior: 'smooth' });
    }
  });

  // Improve discoverability: let wheel events on the container element itself be captured even when not focused
  timeline.setAttribute('tabindex', '0');

  // Tap/click toggle for small screens / touch devices
  const isTouchOrSmall = () => ('ontouchstart' in window) || window.matchMedia('(max-width:480px)').matches;
  const milestoneCards = document.querySelectorAll('.milestone-card');

  const toggleCard = (e) => {
    if (!isTouchOrSmall()) return;
    const card = e.currentTarget;
    // ignore clicks on links or buttons inside the card
    if (e.target && e.target.closest && e.target.closest('a, button')) return;

    const wasOpen = card.classList.contains('open');
    // close all then open the clicked one (only one open at a time)
    milestoneCards.forEach(c => c.classList.remove('open'));
    if (!wasOpen) card.classList.add('open');
  };

  milestoneCards.forEach(card => {
    card.addEventListener('click', toggleCard);
    // allow Enter / Space to toggle when focused
    card.addEventListener('keydown', (e) => {
      if ((e.key === 'Enter' || e.key === ' ') && isTouchOrSmall()) {
        e.preventDefault();
        toggleCard({ currentTarget: card, target: e.target });
      }
    });
  });

  // Close open card when tapping outside
  document.addEventListener('click', (e) => {
    if (!isTouchOrSmall()) return;
    if (!e.target.closest('.milestone-card')) {
      milestoneCards.forEach(c => c.classList.remove('open'));
    }
  });
});
