/* ============================================================
   SEXERSIZE — Interactions & Animations
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

  // --- NAV: Scroll shrink + mobile toggle ---
  const nav = document.querySelector('.main-nav');
  const navToggle = document.querySelector('.nav-toggle');
  const navLinks = document.querySelector('.nav-links');

  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 50);
  });

  navToggle.addEventListener('click', () => {
    navLinks.classList.toggle('open');
    // Animate hamburger to X
    navToggle.classList.toggle('active');
  });

  // Close mobile nav on link click
  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      navLinks.classList.remove('open');
      navToggle.classList.remove('active');
    });
  });

  // --- SCROLL REVEAL ---
  const revealElements = document.querySelectorAll(
    '.about-text, .about-card, .story-card, .proof-item, .newsletter-inner, .social-link, .stories-cta, .stories-headline, .section-label'
  );

  revealElements.forEach(el => el.classList.add('reveal'));

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  });

  revealElements.forEach((el, i) => {
    el.style.transitionDelay = `${(i % 4) * 0.1}s`;
    revealObserver.observe(el);
  });

  // --- NEWSLETTER FORM ---
  const form = document.getElementById('newsletter-form');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const name = form.querySelector('input[name="name"]').value;
      const email = form.querySelector('input[name="email"]').value;

      // For now, show a success message (replace with real endpoint later)
      console.log('Newsletter signup:', { name, email });

      form.innerHTML = `
        <div class="form-success">
          <h4>You're In!</h4>
          <p>Welcome to the party, ${name || 'babe'}. Check your inbox for a confirmation.</p>
        </div>
      `;
    });
  }

  // --- SMOOTH SCROLL for anchor links ---
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const target = document.querySelector(anchor.getAttribute('href'));
      if (target) {
        e.preventDefault();
        const offset = nav.offsetHeight + 20;
        const top = target.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  });

  // --- VHS CASE parallax on scroll ---
  const vhsCase = document.querySelector('.vhs-case');
  if (vhsCase) {
    window.addEventListener('scroll', () => {
      const scrolled = window.scrollY;
      if (scrolled < window.innerHeight) {
        vhsCase.style.transform = `perspective(800px) rotateX(${scrolled * 0.02}deg) scale(${1 - scrolled * 0.0002})`;
        vhsCase.style.opacity = Math.max(0.3, 1 - scrolled * 0.001);
      }
    });
  }

  // --- VHS GLITCH on the title (random occasional flicker) ---
  const vhsTitle = document.querySelector('.vhs-title');
  if (vhsTitle) {
    setInterval(() => {
      if (Math.random() < 0.1) {
        vhsTitle.style.transform = `translateX(${(Math.random() - 0.5) * 3}px)`;
        vhsTitle.style.opacity = '0.85';
        setTimeout(() => {
          vhsTitle.style.transform = '';
          vhsTitle.style.opacity = '';
        }, 80);
      }
    }, 2000);
  }

  // --- CURSOR GLOW EFFECT (desktop only) ---
  if (window.innerWidth > 768) {
    const glow = document.createElement('div');
    glow.style.cssText = `
      position: fixed;
      width: 300px;
      height: 300px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(255, 77, 166, 0.06), transparent 70%);
      pointer-events: none;
      z-index: 0;
      transform: translate(-50%, -50%);
      transition: left 0.3s ease, top 0.3s ease;
    `;
    document.body.appendChild(glow);

    document.addEventListener('mousemove', (e) => {
      glow.style.left = e.clientX + 'px';
      glow.style.top = e.clientY + 'px';
    });
  }

  // --- STORY CARDS: subtle tilt on hover ---
  document.querySelectorAll('.story-card').forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      card.style.transform = `translateY(-4px) perspective(1000px) rotateX(${-y * 5}deg) rotateY(${x * 5}deg)`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });

});
