const esc = s => String(s ?? '').replace(/[&<>"']/g, c =>
  ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const line  = (s, n) => String(s ?? '').replace(/[\r\n]+/g, ' ').trim().slice(0, n);
const block = (s, n) => String(s ?? '').trim().slice(0, n);
const isEmail = s => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s);

const FORMS = {
  contact: {
    required: ['name', 'email', 'subject', 'message'],
    title: d => 'Website enquiry: ' + d.subject,
    ack: 'Thank you for contacting Cuvette Engineering (U) Ltd. We have received your message and will respond within 24 business hours.',
    fields: [
      { key: 'name', label: 'Full name', max: 100 },
      { key: 'company', label: 'Company', max: 120 },
      { key: 'email', label: 'Email', max: 160 },
      { key: 'phone', label: 'Phone', max: 40 },
      { key: 'subject', label: 'Subject', max: 150 },
      { key: 'message', label: 'Message', max: 3000, long: true }
    ]
  },
  quote: {
    required: ['name', 'email', 'phone', 'service', 'location', 'description'],
    title: d => 'Quote request: ' + d.service + ' (' + d.location + ')',
    ack: 'Thank you for requesting a quotation from Cuvette Engineering (U) Ltd. Our team will review your request and respond within 24 business hours. For larger scopes we may arrange a site visit first.',
    fields: [
      { key: 'name', label: 'Full name', max: 100 },
      { key: 'company', label: 'Company', max: 120 },
      { key: 'email', label: 'Email', max: 160 },
      { key: 'phone', label: 'Phone', max: 40 },
      { key: 'service', label: 'Service required', max: 120 },
      { key: 'location', label: 'Project location', max: 120 },
      { key: 'budget', label: 'Approximate budget', max: 80 },
      { key: 'start_date', label: 'Preferred start', max: 80 },
      { key: 'referral', label: 'Heard about us via', max: 80 },
      { key: 'description', label: 'Project description', max: 3000, long: true }
    ]
  }
};

const brevo = payload => fetch('https://api.brevo.com/v3/smtp/email', {
  method: 'POST',
  headers: { 'api-key': process.env.BREVO_API_KEY, 'content-type': 'application/json' },
  body: JSON.stringify(payload)
});

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).end();
  const b = req.body || {};
  if (b.website_url || b._gotcha) return res.status(200).json({ ok: true }); // honeypots

  const cfg = FORMS[b.form_type];
  if (!cfg) return res.status(400).json({ ok: false });

  const d = {};
  for (const f of cfg.fields) d[f.key] = f.long ? block(b[f.key], f.max) : line(b[f.key], f.max);
  if (!isEmail(d.email) || cfg.required.some(k => !d[k]) || !b['cf-turnstile-response'])
    return res.status(400).json({ ok: false });

  // 1. Turnstile
  try {
    const check = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        secret: process.env.TURNSTILE_SECRET,
        response: b['cf-turnstile-response'],
        remoteip: (req.headers['x-forwarded-for'] || '').split(',')[0]
      })
    }).then(r => r.json());
    if (!check.success) return res.status(400).json({ ok: false });
  } catch (e) { return res.status(502).json({ ok: false }); }

  const ref = 'CE-' + Date.now().toString(36).slice(-5).toUpperCase() +
              Math.random().toString(36).slice(2, 4).toUpperCase();
  const wantsCopy = Boolean(b.send_copy);   // unticked checkboxes are not sent at all

  const rows = cfg.fields.filter(f => d[f.key]).map(f =>
    `<tr><td style="padding:6px 12px;color:#667085;vertical-align:top">${esc(f.label)}</td>
         <td style="padding:6px 12px;white-space:pre-wrap">${esc(d[f.key])}</td></tr>`).join('');
  const table = `<table style="border-collapse:collapse;font-family:Arial,sans-serif;font-size:14px">${rows}</table>`;

  // 2. Enquiry to you
  const to = process.env.FORMS_TO || 'info@cuvetteengineering.com';
  try {
    const inbox = await brevo({
      sender: { name: 'Cuvette Website', email: 'info@cuvetteengineering.com' },
      to: [{ email: to }],
      replyTo: { email: d.email, name: d.name },
      subject: (`[${ref}] ` + cfg.title(d)).slice(0, 150),
      htmlContent: `<p>Reference <b>${ref}</b>${wantsCopy ? ' (sender asked for a copy)' : ''}</p>${table}`
    });
    if (!inbox.ok) return res.status(502).json({ ok: false });
  } catch (e) { return res.status(502).json({ ok: false }); }

  // 3. Automatic message to the sender (a failure here must not fail the enquiry)
  let copySent = false;
  try {
    const ack = await brevo({
      sender: { name: 'Cuvette Engineering (U) Ltd', email: 'info@cuvetteengineering.com' },
      to: [{ email: d.email, name: d.name }],
      replyTo: { email: 'info@cuvetteengineering.com', name: 'Cuvette Engineering' },
      subject: `We have received your ${b.form_type === 'quote' ? 'quote request' : 'message'} [${ref}]`,
      htmlContent:
        `<div style="font-family:Arial,sans-serif;font-size:14px;line-height:1.6">
           <p>Hello ${esc(d.name)},</p>
           <p>${esc(cfg.ack)}</p>
           <p><b>Your reference:</b> ${ref}</p>
           ${wantsCopy ? '<p>Here is a copy of what you sent:</p>' + table : ''}
           <p style="color:#667085;font-size:12px;margin-top:24px">Cuvette Engineering (U) Ltd, Kilimani Mall, Mbogo Rd, Najeera, Kampala | +256 200 940 171<br>
           This is an automated message. If you did not send this request, you can ignore it.</p>
         </div>`
    });
    copySent = ack.ok;
  } catch (e) { console.error('ack failed', e); }

  return res.status(200).json({ ok: true, ref, copySent });
};