const esc = s => String(s ?? '').replace(/[&<>"']/g, c =>
  ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const line  = (s, n) => String(s ?? '').replace(/[\r\n]+/g, ' ').trim().slice(0, n);
const block = (s, n) => String(s ?? '').trim().slice(0, n);
const isEmail = s => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s);
const fail = (res, status, reason) => res.status(status).json({ ok: false, reason });

const FORMS = {
  contact: {
    required: ['name', 'email', 'subject', 'message'],
    title: d => 'Website enquiry: ' + d.subject,
    ackSubject: 'We have received your message',
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
    ackSubject: 'We have received your quote request',
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
  },
  careers: {
    cv: true,
    required: ['first_name', 'last_name', 'email', 'phone', 'role_interest', 'cover_letter'],
    title: d => 'Career interest: ' + d.role_interest + ' - ' + d.first_name + ' ' + d.last_name,
    ackSubject: 'We have received your details',
    ack: 'Thank you for registering your interest with Cuvette Engineering (U) Ltd. We have received your details and CV, and we will contact you when a matching opportunity opens. We keep submissions on file for 6 months.',
    fields: [
      { key: 'first_name', label: 'First name', max: 80 },
      { key: 'last_name', label: 'Last name', max: 80 },
      { key: 'email', label: 'Email', max: 160 },
      { key: 'phone', label: 'Phone', max: 40 },
      { key: 'role_interest', label: 'Area of expertise', max: 120 },
      { key: 'experience', label: 'Experience', max: 200 },
      { key: 'cover_letter', label: 'About the applicant', max: 3000, long: true }
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
  if (!process.env.BREVO_API_KEY || !process.env.TURNSTILE_SECRET) {
    console.error('MISSING ENV VAR');
    return fail(res, 500, 'env_missing');
  }

  const b = req.body || {};
  if (b.website_url || b._gotcha || b._honey) return res.status(200).json({ ok: true }); // honeypots

  const cfg = FORMS[b.form_type];
  if (!cfg) return fail(res, 400, 'bad_form_type');

  const d = {};
  for (const f of cfg.fields) d[f.key] = f.long ? block(b[f.key], f.max) : line(b[f.key], f.max);
  const missing = cfg.required.filter(k => !d[k]);
  if (missing.length) return fail(res, 400, 'missing_fields');
  if (!isEmail(d.email)) return fail(res, 400, 'bad_email');
  if (!b['cf-turnstile-response']) return fail(res, 400, 'no_turnstile_token');

  // CV attachment (careers only): PDF/DOC/DOCX, up to about 3 MB
  let attachment;
  if (cfg.cv) {
    const cvName = String(b.cv_name || '').replace(/[^\w.\- ]/g, '_').slice(0, 100);
    const cvData = String(b.cv_data || '');
    if (!cvData) return fail(res, 400, 'cv_missing');
    if (!/\.(pdf|doc|docx)$/i.test(cvName)) return fail(res, 400, 'cv_type');
    if (cvData.length > 4200000 || !/^[A-Za-z0-9+/=]+$/.test(cvData)) return fail(res, 400, 'cv_invalid');
    attachment = [{ name: cvName, content: cvData }];
  }

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
    if (!check.success) {
      console.error('TURNSTILE rejected', check['error-codes']);
      return fail(res, 400, 'turnstile_rejected');
    }
  } catch (e) {
    console.error('TURNSTILE request error', e);
    return fail(res, 502, 'turnstile_network');
  }

  const who = d.name || [d.first_name, d.last_name].filter(Boolean).join(' ');
  const ref = 'CE-' + Date.now().toString(36).slice(-5).toUpperCase() +
              Math.random().toString(36).slice(2, 4).toUpperCase();
  const wantsCopy = Boolean(b.send_copy);

  const rows = cfg.fields.filter(f => d[f.key]).map(f =>
    `<tr><td style="padding:6px 12px;color:#667085;vertical-align:top">${esc(f.label)}</td>
         <td style="padding:6px 12px;white-space:pre-wrap">${esc(d[f.key])}</td></tr>`).join('');
  const table = `<table style="border-collapse:collapse;font-family:Arial,sans-serif;font-size:14px">${rows}</table>`;

  // 2. Message to you
  const to = b.form_type === 'careers'
    ? (process.env.CAREERS_TO || 'careers@cuvetteengineering.com')
    : (process.env.FORMS_TO || 'info@cuvetteengineering.com');
  try {
    const inbox = await brevo({
      sender: { name: 'Cuvette Website', email: 'info@cuvetteengineering.com' },
      to: [{ email: to }],
      replyTo: { email: d.email, name: who },
      subject: (`[${ref}] ` + cfg.title(d)).slice(0, 150),
      htmlContent: `<p>Reference <b>${ref}</b>${wantsCopy ? ' (sender asked for a copy)' : ''}</p>${table}`,
      ...(attachment ? { attachment } : {})
    });
    if (!inbox.ok) {
      console.error('BREVO enquiry failed', inbox.status, await inbox.text());
      return fail(res, 502, 'brevo_' + inbox.status);
    }
  } catch (e) {
    console.error('BREVO request error', e);
    return fail(res, 502, 'brevo_network');
  }

  // 3. Automatic message to the sender (a failure here must not fail the submission)
  let copySent = false;
  try {
    const ack = await brevo({
      sender: { name: 'Cuvette Engineering (U) Ltd', email: 'info@cuvetteengineering.com' },
      to: [{ email: d.email, name: who }],
      replyTo: { email: 'info@cuvetteengineering.com', name: 'Cuvette Engineering' },
      subject: `${cfg.ackSubject} [${ref}]`,
      htmlContent:
        `<div style="font-family:Arial,sans-serif;font-size:14px;line-height:1.6">
           <p>Hello ${esc(who)},</p>
           <p>${esc(cfg.ack)}</p>
           <p><b>Your reference:</b> ${ref}</p>
           ${wantsCopy ? '<p>Here is a copy of what you sent:</p>' + table : ''}
           <p style="color:#667085;font-size:12px;margin-top:24px">Cuvette Engineering (U) Ltd, Kilimani Mall, Mbogo Rd, Najeera, Kampala | +256 200 940 171<br>
           This is an automated message. If you did not send this request, you can ignore it.</p>
         </div>`
    });
    copySent = ack.ok;
    if (!ack.ok) console.error('BREVO confirmation failed', ack.status, await ack.text());
  } catch (e) { console.error('ack failed', e); }

  return res.status(200).json({ ok: true, ref, copySent });
};