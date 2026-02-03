/**
 * PlayThings® — Main JavaScript
 * Built on trust. Hosting without pressure.
 */

// ══════════════════════════════════════════════════════════════
// CONFIGURATION
// ══════════════════════════════════════════════════════════════

const CONFIG = {
  // Supabase configuration - replace with your actual credentials
  supabase: {
    url: 'YOUR_SUPABASE_URL',
    anonKey: 'YOUR_SUPABASE_ANON_KEY',
    table: 'subscribers'
  },
  // Video URL (YouTube or Vimeo embed URL)
  videoUrl: 'https://www.youtube.com/embed/VIDEO_ID?autoplay=1',
  // Animation settings
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
  if (CONFIG.supabase.url !== 'YOUR_SUPABASE_URL' && window.supabase) {
    supabase = window.supabase.createClient(
      CONFIG.supabase.url,
      CONFIG.supabase.anonKey
    );
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
    const scrollPercent = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    progress.style.width = scrollPercent + '%';
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
    videoIframe.src = CONFIG.videoUrl;
    document.body.style.overflow = 'hidden';
    videoModalClose.focus();

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

function initEmailForm() {
  const form = document.getElementById('emailForm');
  const emailInput = document.getElementById('emailInput');
  const submitButton = document.getElementById('emailSubmit');
  const formMessage = document.getElementById('formMessage');

  if (!form) return;

  function showMessage(message, type) {
    formMessage.textContent = message;
    formMessage.className = `form-message visible ${type}`;

    // Auto-hide after 5 seconds
    setTimeout(() => {
      formMessage.classList.remove('visible');
    }, 5000);
  }

  function setLoading(loading) {
    submitButton.disabled = loading;
    submitButton.classList.toggle('loading', loading);
  }

  async function handleSubmit(e) {
    e.preventDefault();

    const email = emailInput.value.trim();

    if (!email) {
      showMessage('Please enter your email address.', 'error');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showMessage('Please enter a valid email address.', 'error');
      return;
    }

    setLoading(true);

    try {
      // If Supabase is configured, save to database
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
          // Check for duplicate email
          if (error.code === '23505') {
            showMessage('You\'re already on the list! We\'ll be in touch.', 'success');
            emailInput.value = '';
            setLoading(false);
            return;
          }
          throw error;
        }
      } else {
        // Fallback: simulate API call for demo
        await new Promise(resolve => setTimeout(resolve, 1000));
        console.log('Email submitted (demo mode):', email);
      }

      showMessage('Welcome to PlayThings. We\'ll be in touch.', 'success');
      emailInput.value = '';

      // Track conversion (if analytics is available)
      if (typeof gtag === 'function') {
        gtag('event', 'sign_up', {
          method: 'email',
          event_category: 'engagement'
        });
      }

    } catch (error) {
      console.error('Subscription error:', error);
      showMessage('Something went wrong. Please try again.', 'error');
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
      if (href === '#') return;

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
