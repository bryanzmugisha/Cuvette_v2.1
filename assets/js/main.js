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
      loop: true, speed: 1400, effect: 'fade',
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

  /* ── Smart Sticky Header (Hide down, Show up) ── */
  const header = document.querySelector('.site-header');
  
  if (header) {
      let lastScrollTop = 0;
      const delta = 10; // The "glitch fix"

      window.addEventListener('scroll', () => {
          const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

          // 1. Keep your existing "scrolled" background change
          header.classList.toggle('scrolled', scrollTop > 10);

          // 2. THE GLITCH FIX: Ignore tiny scroll movements
          if (Math.abs(lastScrollTop - scrollTop) <= delta) return;

          // 3. Hide/Show Logic
          if (scrollTop > lastScrollTop && scrollTop > 100) {
              // Scrolling DOWN -> Hide the navbar
              header.classList.add('nav-up');
          } else {
              // Scrolling UP -> Show the navbar
              header.classList.remove('nav-up');
          }

          // Update the last scroll position
          lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
      }, { passive: true });
  }


  /* ============================================================
     FORM HANDLERS & HONEYPOT PROTECTION
     ============================================================ */

  /* ── 1. Formspree handler (Contact Form) ── */
  document.querySelectorAll('form[data-formspree]').forEach(form => {
    const btn      = form.querySelector('button[type="submit"]');
    const feedback = form.querySelector('.form-feedback');
    const origLabel = btn ? btn.textContent : 'Send';

    form.addEventListener('submit', async e => {
      e.preventDefault(); // Stop page reload immediately

      // 🛡️ HONEYPOT CHECK
      const honeypot = form.querySelector('input[name="website_url"]')?.value;
      if (honeypot) {
        console.log("Spam blocked on Contact Form.");
        return; // Silent exit. Bot thinks it worked.
      }

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

     /* ── 2. FormSubmit handler (Careers Form): normal POST so the CV is attached ── */
  document.querySelectorAll('form[data-careers-form]').forEach(form => {
    const btn      = form.querySelector('button[type="submit"]');
    const feedback = form.querySelector('.form-feedback');

    form.addEventListener('submit', e => {
      // honeypots: bots exit silently
      const fsHoney     = form.querySelector('input[name="_honey"]')?.value;
      const customHoney = form.querySelector('input[name="website_url"]')?.value;
      if (fsHoney || customHoney) { e.preventDefault(); return; }

      // check the CV before sending
      const file = form.querySelector('input[type="file"]')?.files[0];
      if (file && file.size > 5 * 1024 * 1024) {
        e.preventDefault();
        if (feedback) {
          feedback.textContent = '✗ Your CV is larger than 5MB. Please upload a smaller file.';
          feedback.className = 'form-feedback error';
        }
        return;
      }
      if (btn) { btn.disabled = true; btn.textContent = 'Submitting…'; }
      // no preventDefault: the browser now submits the form normally
    });
  });

  // confirmation message after Formsubmit sends the visitor back
  if (new URLSearchParams(location.search).get('sent') === '1') {
    const fb = document.querySelector('form[data-careers-form] .form-feedback');
    if (fb) {
      fb.textContent = '✓ Details received! We will be in touch when a matching opportunity arises.';
      fb.className = 'form-feedback success';
    }
  }
  /* ── 3. Brevo newsletter handler ── */
  document.querySelectorAll('form[action*="sibforms.com"]').forEach(form => {
    const btn      = form.querySelector('button[type="submit"]');
    const feedback = form.querySelector('.form-feedback');

    form.addEventListener('submit', async e => {
      e.preventDefault();

      // 🛡️ HONEYPOT CHECK
      const honeypot = form.querySelector('input[name="website_url"]')?.value;
      if (honeypot) {
        console.log("Spam blocked on Newsletter Form.");
        return; // Silent exit. Bot thinks it worked.
      }

      if (btn) { btn.disabled = true; btn.textContent = 'Subscribing…'; }

      try {
        await fetch(form.action, {
          method: 'POST',
          mode: 'no-cors',
          body: new FormData(form)
        });
        form.reset();
        if (feedback) {
          feedback.textContent = '✓ Subscribed! Welcome to the Cuvette Engineering newsletter.';
          feedback.className = 'form-feedback success';
          setTimeout(() => { feedback.textContent = ''; feedback.className = 'form-feedback'; }, 8000);
        }
      } catch {
        form.reset();
        if (feedback) {
          feedback.textContent = '✓ Subscribed! Welcome to the Cuvette Engineering newsletter.';
          feedback.className = 'form-feedback success';
          setTimeout(() => { feedback.textContent = ''; feedback.className = 'form-feedback'; }, 8000);
        }
      } finally {
        if (btn) { btn.disabled = false; btn.textContent = 'Subscribe'; }
      }
    });
  });

});