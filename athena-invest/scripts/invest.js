/**
 * Athena Enterprises — Investor Pitch Site
 * Scroll-driven animations, counters, and reveal effects.
 */

// ══════════════════════════════════════════════════════════════
// SCROLL PROGRESS BAR
// ══════════════════════════════════════════════════════════════

function initScrollProgress() {
  const bar = document.getElementById('scrollProgress');
  if (!bar) return;

  function update() {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const pct = docHeight > 0 ? Math.min(100, (scrollTop / docHeight) * 100) : 0;
    bar.style.width = pct + '%';
  }

  window.addEventListener('scroll', update, { passive: true });
  update();
}

// ══════════════════════════════════════════════════════════════
// NAVIGATION — SCROLL STATE
// ══════════════════════════════════════════════════════════════

function initNav() {
  const nav = document.getElementById('invNav');
  if (!nav) return;

  let ticking = false;

  function update() {
    nav.classList.toggle('scrolled', window.scrollY > 80);
    ticking = false;
  }

  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(update);
      ticking = true;
    }
  }, { passive: true });

  update();
}

// ══════════════════════════════════════════════════════════════
// REVEAL ANIMATIONS (IntersectionObserver)
// ══════════════════════════════════════════════════════════════

function initReveal() {
  const elements = document.querySelectorAll('.reveal');
  if (!elements.length) return;

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    elements.forEach(el => el.classList.add('visible'));
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
    { threshold: 0.12, rootMargin: '-30px' }
  );

  elements.forEach(el => observer.observe(el));
}

// ══════════════════════════════════════════════════════════════
// ANIMATED COUNTERS
// ══════════════════════════════════════════════════════════════

function animateCounter(el, target, prefix, suffix, decimals, duration) {
  const start = performance.now();

  function step(now) {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    // Ease out cubic
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = eased * target;

    let display = decimals > 0
      ? current.toFixed(decimals)
      : Math.round(current).toLocaleString();

    el.textContent = prefix + display + suffix;

    if (progress < 1) {
      requestAnimationFrame(step);
    }
  }

  requestAnimationFrame(step);
}

function initCounters() {
  const counters = document.querySelectorAll('[data-target]');
  if (!counters.length) return;

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    counters.forEach(el => {
      const target = parseFloat(el.dataset.target);
      const prefix = el.dataset.prefix || '';
      const suffix = el.dataset.suffix || '';
      const decimals = parseInt(el.dataset.decimals || '0', 10);
      el.textContent = prefix + (decimals > 0 ? target.toFixed(decimals) : target.toLocaleString()) + suffix;
    });
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const target = parseFloat(el.dataset.target);
          const prefix = el.dataset.prefix || '';
          const suffix = el.dataset.suffix || '';
          const decimals = parseInt(el.dataset.decimals || '0', 10);
          animateCounter(el, target, prefix, suffix, decimals, 1800);
          observer.unobserve(el);
        }
      });
    },
    { threshold: 0.3 }
  );

  counters.forEach(el => observer.observe(el));
}

// ══════════════════════════════════════════════════════════════
// HERO PARALLAX
// ══════════════════════════════════════════════════════════════

function initHeroParallax() {
  const hero = document.querySelector('.inv-hero-content');
  if (!hero) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  let ticking = false;

  function update() {
    const scrollY = window.scrollY;
    if (scrollY < window.innerHeight) {
      const opacity = 1 - (scrollY / (window.innerHeight * 0.65));
      const translateY = scrollY * 0.25;
      hero.style.opacity = Math.max(0, opacity);
      hero.style.transform = `translateY(${translateY}px)`;
    }
    ticking = false;
  }

  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(update);
      ticking = true;
    }
  }, { passive: true });
}

// ══════════════════════════════════════════════════════════════
// MOUSE-TRACKING SPOTLIGHT
// ══════════════════════════════════════════════════════════════

function initHeroSpotlight() {
  const heroSection = document.querySelector('.inv-hero');
  const spotlight = document.getElementById('heroSpotlight');
  if (!heroSection || !spotlight) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  // Only track mouse on desktop
  if (window.matchMedia('(hover: none)').matches) return;

  let rafId = null;
  let mouseX = 0;
  let mouseY = 0;
  let currentX = 0;
  let currentY = 0;

  heroSection.addEventListener('mouseenter', () => {
    spotlight.classList.add('active');
  });

  heroSection.addEventListener('mouseleave', () => {
    spotlight.classList.remove('active');
  });

  heroSection.addEventListener('mousemove', (e) => {
    const rect = heroSection.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;

    if (!rafId) {
      rafId = requestAnimationFrame(updateSpotlight);
    }
  });

  function updateSpotlight() {
    // Smooth lerp for buttery movement
    currentX += (mouseX - currentX) * 0.15;
    currentY += (mouseY - currentY) * 0.15;

    spotlight.style.left = currentX + 'px';
    spotlight.style.top = currentY + 'px';

    // Keep animating while spotlight is active
    if (spotlight.classList.contains('active')) {
      rafId = requestAnimationFrame(updateSpotlight);
    } else {
      rafId = null;
    }
  }
}

// ══════════════════════════════════════════════════════════════
// HERO VIDEO — Autoplay handling + scroll-based pause
// ══════════════════════════════════════════════════════════════

function initHeroVideo() {
  const video = document.getElementById('heroVideo');
  if (!video) return;

  // Only manage if the video has a source
  const hasSource = video.querySelector('source[src]') || video.src;
  if (!hasSource) return;

  // Ensure autoplay (some browsers block it even with muted)
  const playPromise = video.play();
  if (playPromise !== undefined) {
    playPromise.catch(() => {
      // Autoplay was prevented — video stays paused, orbs still look great
      video.style.display = 'none';
    });
  }

  // Pause video when scrolled past hero for performance
  let isPaused = false;
  const heroSection = document.querySelector('.inv-hero');
  if (!heroSection) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          if (isPaused) {
            video.play().catch(() => {});
            isPaused = false;
          }
        } else {
          if (!video.paused) {
            video.pause();
            isPaused = true;
          }
        }
      });
    },
    { threshold: 0.05 }
  );

  observer.observe(heroSection);
}

// ══════════════════════════════════════════════════════════════
// SMOOTH SCROLL for anchor links
// ══════════════════════════════════════════════════════════════

function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href');
      if (href === '#') return;

      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        history.pushState(null, null, href);
      }
    });
  });
}

// ══════════════════════════════════════════════════════════════
// INITIALIZATION
// ══════════════════════════════════════════════════════════════

function init() {
  initScrollProgress();
  initNav();
  initReveal();
  initCounters();
  initHeroParallax();
  initHeroSpotlight();
  initHeroVideo();
  initSmoothScroll();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
