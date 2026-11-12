document.addEventListener('DOMContentLoaded', () => {
  const MAX_CV = 3 * 1024 * 1024;           // 3 MB
  const OK_EXT = /\.(pdf|doc|docx)$/i;
  const MB = n => (n / 1048576).toFixed(1) + ' MB';
  const inApp = /(FBAN|FBAV|Instagram|TikTok|musical_ly|Bytedance|Snapchat|MicroMessenger)/i.test(navigator.userAgent);

  const toBase64 = file => new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload  = () => resolve(String(r.result).split(',')[1] || '');
    r.onerror = () => reject(new Error('read'));
    r.onabort = () => reject(new Error('read'));
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

    // ---- CV field: instant feedback ----
    const fileInput = form.querySelector('input[type="file"]');
    let note = null;
    if (fileInput) {
      note = document.createElement('div');
      note.style.cssText = 'font-size:.82rem;margin-top:6px;color:#667085';
      fileInput.insertAdjacentElement('afterend', note);
      if (inApp) note.textContent = 'Tip: if the file picker does not open in this app, open this page in Chrome or Safari, or email your CV to careers@cuvetteengineering.com.';

      const problem = msg => { fileInput.value = ''; note.style.color = '#b42318'; note.textContent = '✗ ' + msg; };
      fileInput.addEventListener('change', () => {
        const f = fileInput.files[0];
        if (!f) { note.style.color = '#667085'; note.textContent = ''; return; }
        if (!OK_EXT.test(f.name)) return problem('Please choose a PDF, DOC or DOCX file.');
        if (f.size > MAX_CV) return problem('That file is ' + MB(f.size) + '. The limit is 3 MB. Please compress it, or email it to careers@cuvetteengineering.com.');
        note.style.color = '#166534';
        note.textContent = '✓ ' + f.name + ' (' + MB(f.size) + ')';
      });
    }

    // ---- submit ----
    form.addEventListener('submit', async e => {
      e.preventDefault();
      if (btn && btn.disabled) return;

      const data = Object.fromEntries(new FormData(form));   // includes cf-turnstile-response
      data.form_type = form.dataset.cvForm;

      if (!data['cf-turnstile-response']) {
        show('Please wait a moment for the security check to finish, then press send again.', 'error');
        return;
      }

      if (fileInput) delete data[fileInput.name];            // a File object can't go inside JSON
      const file = fileInput && fileInput.files[0];

      busy(true);
      const ctrl  = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 45000);
      try {
        if (file) {
          try {
            data.cv_name = file.name;
            data.cv_data = await toBase64(file);
          } catch (err) {
            show('✗ We could not read that file. If it is stored in the cloud (Google Drive, iCloud, WhatsApp), download it to your phone first, or email it to careers@cuvetteengineering.com.', 'error');
            return;
          }
        }

        const r = await fetch('/api/forms', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
          signal: ctrl.signal
        });
        const out = await r.json().catch(() => ({}));
        if (!r.ok || !out.ok) throw new Error('send failed');

        form.reset();
        if (note) { note.style.color = '#667085'; note.textContent = ''; }
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