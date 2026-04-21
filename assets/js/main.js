/* ============================================================
   Cuvette Engineering (U) Ltd — main.js
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {

  /* ── Loader ── */
  const loader = document.querySelector('.loader');
  if (loader) setTimeout(() => loader.classList.add('hidden'), 700);

  /* ── Mobile nav ── */
  const navToggle = document.querySelector('.nav-toggle');
  const nav = document.querySelector('.nav');
  if (navToggle && nav) {
    navToggle.addEventListener('click', () => nav.classList.toggle('open'));
    nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => nav.classList.remove('open')));
  }
  const menuToggle = document.getElementById('menuToggle');
  const mainNav = document.getElementById('mainNav');
  if (menuToggle && mainNav) {
    menuToggle.addEventListener('click', () => mainNav.classList.toggle('open'));
    mainNav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => mainNav.classList.remove('open')));
  }

  /* ── FAQ accordion ── */
  document.querySelectorAll('.faq-item').forEach(item => {
    item.querySelector('.faq-question')?.addEventListener('click', () => item.classList.toggle('active'));
  });

  /* ── Animated counters ── */
  document.querySelectorAll('[data-counter]').forEach(el => {
    new IntersectionObserver(([e]) => {
      if (!e.isIntersecting || el.dataset.done) return;
      el.dataset.done = '1';
      const target = Number(el.dataset.counter || 0);
      const suffix = el.dataset.suffix || '';
      let value = 0;
      const step = Math.max(1, Math.ceil(target / 70));
      const t = setInterval(() => {
        value = Math.min(value + step, target);
        el.textContent = value + suffix;
        if (value >= target) clearInterval(t);
      }, 25);
    }, { threshold: .5 }).observe(el);
  });

  /* ── Project filters ── */
  const filterBtns = document.querySelectorAll('.filter-btn');
  const filterItems = document.querySelectorAll('[data-category]');
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const filter = btn.dataset.filter;
      filterItems.forEach(item => {
        item.style.display = (filter === 'all' || item.dataset.category === filter) ? '' : 'none';
      });
    });
  });

  /* ── Hero image slideshow ── */
  if (window.Swiper && document.querySelector('.hero-swiper')) {
    new Swiper('.hero-swiper', {
      loop: true,
      speed: 1400,
      effect: 'fade',
      fadeEffect: { crossFade: true },
      autoplay: { delay: 5000, disableOnInteraction: false },
      pagination: { el: '.hero-swiper-pagination', clickable: true }
    });
  }

  /* ── Typed.js ── */
  if (window.Typed && document.querySelector('#typed-text')) {
    new Typed('#typed-text', {
      strings: [
        'Construction &amp; Civil Works',
        'Fiber &amp; Telecom Infrastructure',
        'Facility Maintenance &amp; Management',
        'Electro-Mechanical Installations',
        'Security &amp; Surveillance Systems',
        'Project Management &amp; Consultancy'
      ],
      typeSpeed: 65, backSpeed: 38, backDelay: 2400,
      startDelay: 900, loop: true, smartBackspace: true,
      cursorChar: '|', fadeOut: false,
      onBegin() {
        const line = document.querySelector('.typed-line');
        if (line) line.style.height = getComputedStyle(line).height;
      }
    });
  }

  /* ── Testimonial swiper ── */
  if (window.Swiper && document.querySelector('.testimonial-swiper')) {
    new Swiper('.testimonial-swiper', {
      loop: true, spaceBetween: 24,
      autoplay: { delay: 3800, disableOnInteraction: false },
      pagination: { el: '.swiper-pagination', clickable: true },
      breakpoints: { 0: { slidesPerView: 1 }, 860: { slidesPerView: 2 } }
    });
  }

  /* ── GLightbox ── */
  if (window.GLightbox) GLightbox({ selector: '.glightbox' });

  /* ── AOS ── */
  if (window.AOS) AOS.init({ duration: 850, once: true, offset: 70 });

  /* ── Reveal fallback ── */
  document.querySelectorAll('.reveal').forEach(el => {
    new IntersectionObserver(([e]) => { if (e.isIntersecting) el.classList.add('show'); }, { threshold: .15 }).observe(el);
  });

  /* ── Footer year ── */
  document.querySelectorAll('[data-year]').forEach(el => { el.textContent = new Date().getFullYear(); });

 

  /* ── Sticky header ── */
  const header = document.querySelector('.site-header');
  if (header) window.addEventListener('scroll', () => header.classList.toggle('scrolled', window.scrollY > 10), { passive: true });

  /* ── Formspree handler ─────────────────────────────────────────
     Add  data-formspree  attribute to any <form> to activate.
     Set  action="https://formspree.io/f/YOUR_FORM_ID"  on the form.
     Get your free ID at formspree.io — 50 submissions/month free.
     ─────────────────────────────────────────────────────────── */
  document.querySelectorAll('form[data-formspree]').forEach(form => {
    const btn      = form.querySelector('button[type="submit"]');
    const feedback = form.querySelector('.form-feedback');
    const origLabel = btn ? btn.textContent : 'Send';

    form.addEventListener('submit', async e => {
      e.preventDefault();
      if (btn) { btn.disabled = true; btn.textContent = 'Sending…'; }

      try {
        const res = await fetch(form.action, {
          method: 'POST',
          headers: { Accept: 'application/json' },
          body: new FormData(form)
        });
        if (!res.ok) throw new Error();
        form.reset();
        if (feedback) {
          feedback.textContent = form.dataset.success || '✓ Received — we will respond within 24 hours.';
          feedback.className = 'form-feedback success';
          setTimeout(() => { feedback.textContent = ''; feedback.className = 'form-feedback'; }, 7000);
        }
      } catch {
        if (feedback) {
          feedback.textContent = '✗ Could not send. Please email info@cuvetteengineering.com directly.';
          feedback.className = 'form-feedback error';
        }
      } finally {
        if (btn) { btn.disabled = false; btn.textContent = origLabel; }
      }
    });
  });

});