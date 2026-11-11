document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('form[data-cv-form]').forEach(form => {
    const btn   = form.querySelector('button[type="submit"]');
    const fb    = form.querySelector('.form-feedback');
    const label = btn ? (btn.dataset.label || btn.textContent.trim()) : '';
    if (fb) fb.setAttribute('aria-live', 'polite');

    const show = (msg, cls) => {
      if (!fb) return;
      fb.textContent = msg;
      fb.className = 'form-feedback ' + cls;
      fb.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    };
    const busy = on => {
      if (!btn) return;
      btn.disabled = on;
      btn.textContent = on ? 'Sending…' : label;
    };

    form.addEventListener('submit', async e => {
      e.preventDefault();
      if (btn && btn.disabled) return;

      const data = Object.fromEntries(new FormData(form));   // includes cf-turnstile-response
      data.form_type = form.dataset.cvForm;

      // the security check must finish before we send
      if (!data['cf-turnstile-response']) {
        show('Please wait a moment for the security check to finish, then press send again.', 'error');
        return;
      }

      busy(true);
      let why = '';
      const ctrl  = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 20000);
      try {
        const r = await fetch('/api/forms', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
          signal: ctrl.signal
        });
        const out = await r.json().catch(() => ({}));
        if (!r.ok || !out.ok) {
          why = ' [' + r.status + (out.reason ? ' ' + out.reason : '') + (out.detail ? ': ' + out.detail : '') + ']';
          throw new Error('send failed');
        }

        form.reset();
        show('✓ Sent.' + (out.ref ? ' Your reference is ' + out.ref + '.' : '') +
             (out.copySent ? ' A confirmation has been emailed to you.' : ''), 'success');
      } catch (err) {
            show('✗ Could not send. Please try again, or call +256 200 940 171.' + (why || ' [network]'), 'error');
      } finally {
        clearTimeout(timer);
        busy(false);
        if (window.turnstile) window.turnstile.reset();
      }
    });
  });
});