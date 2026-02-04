/**
 * PlayThings® — Main JavaScript
 * Built on trust. Hosting without pressure.
 */

import { createClient } from '@supabase/supabase-js';

// ══════════════════════════════════════════════════════════════
// CONFIGURATION (from environment variables)
// ══════════════════════════════════════════════════════════════

const CONFIG = {
  supabase: {
    url: import.meta.env.VITE_SUPABASE_URL || '',
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
    table: 'subscribers'
  },
  videoUrl: import.meta.env.VITE_VIDEO_EMBED_URL || 'https://www.youtube.com/embed/VIDEO_ID?autoplay=1',
  animation: {
    revealThreshold: 0.15,
    revealRootMargin: '-30px'
  }
};

// ══════════════════════════════════════════════════════════════
// SUPABASE CLIENT
// ══════════════════════════════════════════════════════════════

let supabase = null;

function initSupabase() {
  if (CONFIG.supabase.url && CONFIG.supabase.anonKey) {
    supabase = createClient(CONFIG.supabase.url, CONFIG.supabase.anonKey);
    console.log('Supabase initialized');
  } else {
    console.warn('Supabase credentials not configured - running in demo mode');
  }
}

// ══════════════════════════════════════════════════════════════
// SCROLL PROGRESS
// ══════════════════════════════════════════════════════════════

function initScrollProgress() {
  const progress = document.getElementById('scrollProgress');
  if (!progress) return;

  function updateProgress() {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const scrollPercent = docHeight > 0 ? Math.min(100, (scrollTop / docHeight) * 100) : 0;
    progress.style.width = scrollPercent + '%';
    progress.setAttribute('aria-valuenow', Math.round(scrollPercent));
  }

  window.addEventListener('scroll', updateProgress, { passive: true });
  updateProgress();
}

// ══════════════════════════════════════════════════════════════
// NAVIGATION
// ══════════════════════════════════════════════════════════════

function initNavigation() {
  const nav = document.getElementById('mainNav');
  if (!nav) return;

  const wordmark = nav.querySelector('.nav-wordmark');
  if (wordmark) {
    // Keep wordmark visible (override any script or style that hides it)
    function keepWordmarkVisible() {
      wordmark.style.setProperty('opacity', '1', 'important');
      wordmark.style.setProperty('visibility', 'visible', 'important');
      wordmark.style.setProperty('display', 'inline-block', 'important');
    }
    keepWordmarkVisible();
    document.addEventListener('DOMContentLoaded', keepWordmarkVisible);
    window.addEventListener('load', keepWordmarkVisible);
    // Re-apply for a few seconds in case something hides it after load
    const interval = setInterval(keepWordmarkVisible, 200);
    setTimeout(() => clearInterval(interval), 3000);
  }

  let ticking = false;

  function updateNav() {
    nav.classList.toggle('scrolled', window.scrollY > 60);
    ticking = false;
  }

  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(updateNav);
      ticking = true;
    }
  }, { passive: true });

  updateNav();
}

// ══════════════════════════════════════════════════════════════
// CURSOR GLOW
// ══════════════════════════════════════════════════════════════

function initCursorGlow() {
  const glow = document.getElementById('cursorGlow');
  if (!glow) return;

  // Disable on touch devices
  if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
    glow.style.display = 'none';
    return;
  }

  let glowX = 0;
  let glowY = 0;
  let currentX = 0;
  let currentY = 0;
  let animationId = null;

  document.addEventListener('mousemove', (e) => {
    glowX = e.clientX;
    glowY = e.clientY;
  }, { passive: true });

  function animateGlow() {
    currentX += (glowX - currentX) * 0.08;
    currentY += (glowY - currentY) * 0.08;
    glow.style.left = currentX + 'px';
    glow.style.top = currentY + 'px';
    animationId = requestAnimationFrame(animateGlow);
  }

  animateGlow();

  // Cleanup on page hide
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && animationId) {
      cancelAnimationFrame(animationId);
    } else if (!document.hidden) {
      animateGlow();
    }
  });
}

// ══════════════════════════════════════════════════════════════
// REVEAL ANIMATIONS
// ══════════════════════════════════════════════════════════════

function initRevealAnimations() {
  const revealElements = document.querySelectorAll('.reveal');
  if (!revealElements.length) return;

  // Check for reduced motion preference
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (prefersReducedMotion) {
    revealElements.forEach(el => el.classList.add('visible'));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: CONFIG.animation.revealThreshold,
      rootMargin: CONFIG.animation.revealRootMargin
    }
  );

  revealElements.forEach(el => observer.observe(el));
}

// ══════════════════════════════════════════════════════════════
// HERO PARALLAX
// ══════════════════════════════════════════════════════════════

function initHeroParallax() {
  const heroContent = document.querySelector('.hero-content');
  if (!heroContent) return;

  // Check for reduced motion preference
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return;
  }

  let ticking = false;

  function updateParallax() {
    const scrollY = window.scrollY;

    if (scrollY < window.innerHeight) {
      const opacity = 1 - (scrollY / (window.innerHeight * 0.7));
      const translateY = scrollY * 0.3;

      heroContent.style.opacity = Math.max(0, opacity);
      heroContent.style.transform = `translateY(${translateY}px)`;
    }

    ticking = false;
  }

  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(updateParallax);
      ticking = true;
    }
  }, { passive: true });
}

// ══════════════════════════════════════════════════════════════
// VIDEO MODAL
// ══════════════════════════════════════════════════════════════

function initVideoModal() {
  const videoPlayer = document.getElementById('videoPlayer');
  const videoTrigger = document.getElementById('videoTrigger');
  const videoModal = document.getElementById('videoModal');
  const videoModalBackdrop = document.getElementById('videoModalBackdrop');
  const videoModalClose = document.getElementById('videoModalClose');
  const videoIframe = document.getElementById('videoIframe');

  if (!videoModal) return;

  let lastFocusedElement = null;

  function openModal() {
    lastFocusedElement = document.activeElement;
    videoModal.classList.add('active');
    videoModal.setAttribute('aria-hidden', 'false');
    if (videoIframe) videoIframe.src = CONFIG.videoUrl;
    document.body.style.overflow = 'hidden';
    if (videoModalClose) videoModalClose.focus();

    // Trap focus in modal
    document.addEventListener('keydown', trapFocus);
  }

  function closeModal() {
    videoModal.classList.remove('active');
    videoModal.setAttribute('aria-hidden', 'true');
    videoIframe.src = '';
    document.body.style.overflow = '';

    document.removeEventListener('keydown', trapFocus);

    if (lastFocusedElement) {
      lastFocusedElement.focus();
    }
  }

  function trapFocus(e) {
    if (e.key === 'Escape') {
      closeModal();
      return;
    }

    if (e.key !== 'Tab') return;

    const focusableElements = videoModal.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (e.shiftKey && document.activeElement === firstElement) {
      lastElement.focus();
      e.preventDefault();
    } else if (!e.shiftKey && document.activeElement === lastElement) {
      firstElement.focus();
      e.preventDefault();
    }
  }

  // Event listeners
  if (videoPlayer) {
    videoPlayer.addEventListener('click', openModal);
    videoPlayer.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openModal();
      }
    });
  }

  if (videoTrigger) {
    videoTrigger.addEventListener('click', openModal);
  }

  if (videoModalBackdrop) {
    videoModalBackdrop.addEventListener('click', closeModal);
  }

  if (videoModalClose) {
    videoModalClose.addEventListener('click', closeModal);
  }
}

// ══════════════════════════════════════════════════════════════
// EMAIL FORM
// ══════════════════════════════════════════════════════════════

const DEMO_STORAGE_KEY = 'playthings_subscribers';

function getStoredSubscribers() {
  try {
    const raw = localStorage.getItem(DEMO_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function storeSubscriber(email) {
  const list = getStoredSubscribers();
  if (!list.includes(email.toLowerCase())) {
    list.push(email.toLowerCase());
    localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(list));
  }
}

function initEmailForm() {
  const form = document.getElementById('emailForm');
  const emailInput = document.getElementById('emailInput');
  const submitButton = document.getElementById('emailSubmit');
  const formMessage = document.getElementById('formMessage');

  if (!form) return;

  function showMessage(message, type, assertive = false) {
    formMessage.textContent = message;
    formMessage.className = `form-message visible ${type}`;
    formMessage.setAttribute('role', type === 'error' ? 'alert' : 'status');
    formMessage.setAttribute('aria-live', assertive ? 'assertive' : 'polite');

    if (type === 'success') {
      formMessage.setAttribute('tabindex', '-1');
      formMessage.focus({ preventScroll: true });
    }
    emailInput.removeAttribute('aria-invalid');
    if (type === 'error') {
      emailInput.setAttribute('aria-invalid', 'true');
    }

    setTimeout(() => {
      formMessage.classList.remove('visible');
    }, 6000);
  }

  function setLoading(loading) {
    submitButton.disabled = loading;
    submitButton.setAttribute('aria-busy', loading ? 'true' : 'false');
    submitButton.classList.toggle('loading', loading);
  }

  async function handleSubmit(e) {
    e.preventDefault();

    const email = emailInput.value.trim();

    if (!email) {
      showMessage('Please enter your email address.', 'error', true);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showMessage('Please enter a valid email address.', 'error', true);
      return;
    }

    setLoading(true);
    emailInput.removeAttribute('aria-invalid');

    try {
      if (supabase) {
        const { error } = await supabase
          .from(CONFIG.supabase.table)
          .insert([
            {
              email: email,
              source: 'landing_page',
              subscribed_at: new Date().toISOString()
            }
          ]);

        if (error) {
          if (error.code === '23505') {
            showMessage("You're already on the list. We'll be in touch.", 'success');
            emailInput.value = '';
            setLoading(false);
            return;
          }
          throw error;
        }
      } else {
        // Demo mode: persist to localStorage so signup "goes somewhere"
        storeSubscriber(email);
        await new Promise(resolve => setTimeout(resolve, 600));
      }

      showMessage("You're on the list. We'll be in touch.", 'success');
      emailInput.value = '';

      if (typeof gtag === 'function') {
        gtag('event', 'sign_up', { method: 'email', event_category: 'engagement' });
      }
    } catch (error) {
      console.error('Subscription error:', error);
      showMessage('Something went wrong. Please try again.', 'error', true);
    } finally {
      setLoading(false);
    }
  }

  form.addEventListener('submit', handleSubmit);
}

// ══════════════════════════════════════════════════════════════
// SMOOTH SCROLL
// ══════════════════════════════════════════════════════════════

function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const href = this.getAttribute('href');
      if (href === '#') {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
        history.replaceState(null, null, window.location.pathname || '/');
        return;
      }

      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });

        // Update URL without jumping
        history.pushState(null, null, href);
      }
    });
  });
}

// ══════════════════════════════════════════════════════════════
// INITIALIZATION
// ══════════════════════════════════════════════════════════════

function init() {
  initSupabase();
  initScrollProgress();
  initNavigation();
  initCursorGlow();
  initRevealAnimations();
  initHeroParallax();
  initVideoModal();
  initEmailForm();
  initSmoothScroll();
}

// Run when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
