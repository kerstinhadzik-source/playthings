/**
 * PlayThings® — Main JavaScript
 * A company that stands behind you.
 */

import { createClient } from '@supabase/supabase-js';

// ══════════════════════════════════════════════════════════════
// CONFIGURATION
// ══════════════════════════════════════════════════════════════

const CONFIG = {
  supabase: {
    url: import.meta.env.VITE_SUPABASE_URL || '',
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
    table: 'subscribers'
  },
  videoUrl: import.meta.env.VITE_VIDEO_EMBED_URL || 'https://www.youtube.com/embed/VIDEO_ID?autoplay=1'
};

// ══════════════════════════════════════════════════════════════
// SUPABASE CLIENT
// ══════════════════════════════════════════════════════════════

let supabase = null;

function initSupabase() {
  if (CONFIG.supabase.url && CONFIG.supabase.anonKey) {
    supabase = createClient(CONFIG.supabase.url, CONFIG.supabase.anonKey);
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

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showMessage('Please enter a valid email address.', 'error');
      return;
    }

    setLoading(true);

    try {
      if (supabase) {
        const { error } = await supabase
          .from(CONFIG.supabase.table)
          .insert([{
            email: email,
            source: 'landing_page',
            subscribed_at: new Date().toISOString()
          }]);

        if (error) {
          if (error.code === '23505') {
            showMessage('You\'re already on the list. We\'ll be in touch.', 'success');
            emailInput.value = '';
            setLoading(false);
            return;
          }
          throw error;
        }
      } else {
        // Demo mode
        await new Promise(resolve => setTimeout(resolve, 800));
      }

      showMessage('Thanks! We\'ll be in touch soon.', 'success');
      emailInput.value = '';

      if (typeof gtag === 'function') {
        gtag('event', 'sign_up', { method: 'email' });
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
// VIDEO MODAL
// ══════════════════════════════════════════════════════════════

function initVideoModal() {
  const videoPlayer = document.getElementById('videoPlayer');
  const videoModal = document.getElementById('videoModal');
  const videoModalBackdrop = document.getElementById('videoModalBackdrop');
  const videoModalClose = document.getElementById('videoModalClose');
  const videoIframe = document.getElementById('videoIframe');

  if (!videoModal || !videoPlayer) return;

  let lastFocusedElement = null;

  function openModal() {
    lastFocusedElement = document.activeElement;
    videoModal.classList.add('active');
    videoModal.setAttribute('aria-hidden', 'false');
    videoIframe.src = CONFIG.videoUrl;
    document.body.style.overflow = 'hidden';
    videoModalClose.focus();
    document.addEventListener('keydown', handleKeydown);
  }

  function closeModal() {
    videoModal.classList.remove('active');
    videoModal.setAttribute('aria-hidden', 'true');
    videoIframe.src = '';
    document.body.style.overflow = '';
    document.removeEventListener('keydown', handleKeydown);
    if (lastFocusedElement) lastFocusedElement.focus();
  }

  function handleKeydown(e) {
    if (e.key === 'Escape') closeModal();
  }

  videoPlayer.addEventListener('click', openModal);
  videoPlayer.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openModal();
    }
  });

  if (videoModalBackdrop) videoModalBackdrop.addEventListener('click', closeModal);
  if (videoModalClose) videoModalClose.addEventListener('click', closeModal);
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
  initSupabase();
  initEmailForm();
  initVideoModal();
  initSmoothScroll();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
