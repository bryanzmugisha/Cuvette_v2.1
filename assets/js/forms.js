document.addEventListener('DOMContentLoaded', () => {
  const MAX_CV = 3 * 1024 * 1024;   // 3 MB
  const toBase64 = file => new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result).split(',')[1] || '');
    r.onerror = reject;
    r.readAsDataURL(file);
  });

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

      if (!data['cf-turnstile-response']) {
        show('Please wait a moment for the security check to finish, then press send again.', 'error');
        return;
      }

      const fileInput = form.querySelector('input[type="file"]');
      if (fileInput) delete data[fileInput.name];            // a File object can't go inside JSON
      const file = fileInput && fileInput.files[0];
      if (file && file.size > MAX_CV) {
        show('✗ Your CV is larger than 3MB. Please upload a smaller file.', 'error');
        return;
      }

      busy(true);
      const ctrl  = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 45000);
      try {
        if (file) { data.cv_name = file.name; data.cv_data = await toBase64(file); }

        const r = await fetch('/api/forms', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
          signal: ctrl.signal
        });
        const out = await r.json().catch(() => ({}));
        if (!r.ok || !out.ok) throw new Error('send failed');

        form.reset();
        show((form.dataset.success || '✓ Sent.') +
             (out.ref ? ' Your reference is ' + out.ref + '.' : '') +
             (out.copySent ? ' A confirmation has been emailed to you.' : ''), 'success');
      } catch (err) {
        show('✗ Could not send. Please try again, or call +256 200 940 171.', 'error');
      } finally {
        clearTimeout(timer);
        busy(false);
        if (window.turnstile) window.turnstile.reset();
      }
    });
  });
});