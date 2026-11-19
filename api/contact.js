// Vercel Serverless Function: POST /api/contact
// Secrets live ONLY in Vercel Environment Variables, never in front-end code:
//   RESEND_API_KEY     – API key from resend.com (required to send mail)
//   CONTACT_TO_EMAIL   – inbox that receives enquiries (e.g. sanchita@srkhospitality.net)
//   CONTACT_FROM_EMAIL – verified sender, e.g. "The Hospitality Doctor <hello@srkhospitality.net>"
//   ALLOWED_ORIGINS    – optional, comma-separated, e.g. "https://www.srkhospitality.net,https://srkhospitality.net"

const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 5;
const hits = new Map(); // best-effort per-instance rate limit

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RE = /^[+0-9 ()-]{7,20}$/;
const URL_RE = /(https?:\/\/|www\.)/gi;

const clean = (v, max) => String(v ?? '').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').trim().slice(0, max);
const esc = s => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function rateLimited(ip) {
  const now = Date.now();
  const list = (hits.get(ip) || []).filter(t => now - t < WINDOW_MS);
  list.push(now);
  hits.set(ip, list);
  if (hits.size > 5000) hits.clear();
  return list.length > MAX_PER_WINDOW;
}

function originAllowed(req) {
  const origin = req.headers.origin || '';
  const host = req.headers['x-forwarded-host'] || req.headers.host || '';
  const allowed = (process.env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
  if (!origin) return false;
  if (allowed.length) return allowed.includes(origin);
  try { return new URL(origin).host === host; } catch { return false; }
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed.' });
  }
  if (!originAllowed(req)) return res.status(403).json({ error: 'Request blocked.' });
  if (!String(req.headers['content-type'] || '').includes('application/json')) {
    return res.status(415).json({ error: 'Unsupported content type.' });
  }

  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
  if (rateLimited(ip)) return res.status(429).json({ error: 'Too many requests. Please try again in a few minutes.' });

  const body = typeof req.body === 'object' && req.body ? req.body : {};

  // Bot traps: hidden honeypot field + minimum human fill time.
  const elapsed = Date.now() - Number(body.t || 0);
  if (clean(body.website, 200) || !Number.isFinite(elapsed) || elapsed < 3000 || elapsed > 86400000) {
    return res.status(200).json({ ok: true }); // silently accept, never deliver
  }

  const data = {
    name: clean(body.name, 80),
    hotel: clean(body.hotel, 120),
    email: clean(body.email, 120),
    phone: clean(body.phone, 20),
    message: clean(body.message, 2000)
  };
  const errors = {};
  if (data.name.length < 2) errors.name = 'Please enter your name.';
  if (data.hotel.length < 2) errors.hotel = 'Please tell us your hotel or property.';
  if (!EMAIL_RE.test(data.email)) errors.email = 'Please enter a valid email address.';
  if (data.phone && !PHONE_RE.test(data.phone)) errors.phone = 'Please enter a valid phone number.';
  if (data.message.length < 10) errors.message = 'Please add a few more words.';
  if (body.consent !== true) errors.consent = 'Please accept the Privacy Policy.';
  if ((data.message.match(URL_RE) || []).length > 2) errors.message = 'Please remove links from your message.';
  if (Object.keys(errors).length) return res.status(422).json({ error: Object.values(errors)[0], fields: errors });

  const { RESEND_API_KEY, CONTACT_TO_EMAIL, CONTACT_FROM_EMAIL } = process.env;
  if (!RESEND_API_KEY || !CONTACT_TO_EMAIL || !CONTACT_FROM_EMAIL) {
    console.error('contact: email delivery is not configured');
    return res.status(503).json({ error: 'Our form is being set up.' });
  }

  const rows = [['Name', data.name], ['Hotel', data.hotel], ['Email', data.email], ['Phone', data.phone || '—']];
  const html = `<h2 style="font-family:-apple-system,Helvetica,Arial,sans-serif">New diagnosis request</h2>
<table style="font-family:-apple-system,Helvetica,Arial,sans-serif;font-size:15px">${rows.map(([k, v]) => `<tr><td style="padding:4px 16px 4px 0;color:#666">${k}</td><td>${esc(v)}</td></tr>`).join('')}</table>
<p style="font-family:-apple-system,Helvetica,Arial,sans-serif;font-size:15px;white-space:pre-wrap">${esc(data.message)}</p>`;
  const text = rows.map(([k, v]) => `${k}: ${v}`).join('\n') + `\n\n${data.message}`;

  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: CONTACT_FROM_EMAIL,
        to: CONTACT_TO_EMAIL.split(',').map(s => s.trim()),
        reply_to: data.email,
        subject: `Diagnosis request: ${data.hotel}`,
        html,
        text
      })
    });
    if (!r.ok) {
      console.error('contact: resend error', r.status);
      return res.status(502).json({ error: 'We couldn\'t send your message just now.' });
    }
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error('contact: network error');
    return res.status(502).json({ error: 'We couldn\'t send your message just now.' });
  }
};
