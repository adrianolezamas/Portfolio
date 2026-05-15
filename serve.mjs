import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Resend } from 'resend';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = 3000;

// Load .env manually (no dotenv dependency needed)
try {
  const env = fs.readFileSync(path.join(__dirname, '.env'), 'utf8');
  env.split('\n').forEach(line => {
    const [key, ...rest] = line.split('=');
    if (key && rest.length) process.env[key.trim()] = rest.join('=').trim();
  });
} catch {}

const resend = new Resend(process.env.RESEND_API_KEY);

const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.mjs': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
};

const server = http.createServer((req, res) => {

  // ── POST /api/send ──
  if (req.method === 'POST' && req.url === '/api/send') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const { firstname, lastname, phone, email, subject, message } = JSON.parse(body);
        const fullName = `${firstname} ${lastname}`;
        await resend.emails.send({
          from: 'Contact Form <onboarding@resend.dev>',
          to: 'adrimantionz5@gmail.com',
          reply_to: email,
          subject: subject ? `[Portfolio] ${subject}` : `[Portfolio] New message from ${fullName}`,
          html: `
            <p><strong>Name:</strong> ${fullName}</p>
            <p><strong>Phone:</strong> ${phone}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Subject:</strong> ${subject || '—'}</p>
            <hr>
            <p>${message.replace(/\n/g, '<br>')}</p>
          `,
        });
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true }));
      } catch (err) {
        console.error('Email error:', err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: err.message }));
      }
    });
    return;
  }

  // ── GET /api/distance?destination=... ──
  if (req.method === 'GET' && req.url.startsWith('/api/distance')) {
    const params = new URL(req.url, 'http://localhost').searchParams;
    const destination = params.get('destination');
    if (!destination) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: false, error: 'Missing destination' }));
      return;
    }
    const HEADERS = { 'User-Agent': 'AdrianoCameraBooking/1.0' };
    (async () => {
      try {
        // 1. Geocode origin
        const originGeo = await fetch(
          'https://nominatim.openstreetmap.org/search?q=' +
          encodeURIComponent('5815 Rue Bretagne, Brossard, QC, Canada') +
          '&format=json&limit=1', { headers: HEADERS }
        ).then(r => r.json());
        if (!originGeo.length) throw new Error('Could not geocode origin');

        // 2. Geocode destination
        const destGeo = await fetch(
          'https://nominatim.openstreetmap.org/search?q=' +
          encodeURIComponent(destination) +
          '&format=json&limit=1', { headers: HEADERS }
        ).then(r => r.json());
        if (!destGeo.length) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ok: false, error: 'Address not found' }));
          return;
        }

        // 3. Driving distance via OSRM
        const oLon = originGeo[0].lon, oLat = originGeo[0].lat;
        const dLon = destGeo[0].lon,   dLat = destGeo[0].lat;
        const route = await fetch(
          `https://router.project-osrm.org/route/v1/driving/${oLon},${oLat};${dLon},${dLat}?overview=false`,
          { headers: HEADERS }
        ).then(r => r.json());

        if (route.code !== 'Ok' || !route.routes.length) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ok: false, error: 'Could not calculate route' }));
          return;
        }

        const km = Math.ceil(route.routes[0].distance / 1000);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true, km }));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: err.message }));
      }
    })();
    return;
  }

  // ── POST /api/gallery-download ──
  if (req.method === 'POST' && req.url === '/api/gallery-download') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const d = JSON.parse(body);
        const fullName = `${d.firstName} ${d.lastName}`;
        const downloadedAt = new Date(d.date || Date.now()).toLocaleString('en-CA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
        const BASE = 'http://localhost:3000';

        const photoRows = (d.photos || []).map((p, i) => {
          const src     = typeof p === 'string' ? p : p.src;
          const title   = typeof p === 'object' && p.title ? p.title : src.split('/').pop().replace(/\.[^.]+$/, '');
          const fullUrl = `${BASE}/${src.replace(/^\//, '')}`;
          const fname   = src.split('/').pop();
          return `<tr><td style="padding:9px 0;border-bottom:1px solid rgba(255,255,255,0.05);font-size:12px;color:#888;">${i+1}</td><td style="padding:9px 0;border-bottom:1px solid rgba(255,255,255,0.05);font-size:12px;color:#e2e2e2;">${title}</td><td style="padding:9px 0;border-bottom:1px solid rgba(255,255,255,0.05);font-size:12px;color:#888;">${fname}</td><td style="padding:9px 0;border-bottom:1px solid rgba(255,255,255,0.05);font-size:12px;text-align:right;"><a href="${fullUrl}" style="color:#c8a96e;text-decoration:none;font-size:11px;">↓ Download</a></td></tr>`;
        }).join('');

        await resend.emails.send({
          from:     'Gallery — Adriano Lezama <onboarding@resend.dev>',
          to:       'adrimantionz5@gmail.com',
          reply_to: d.email,
          subject:  `📥 Gallery Download — ${fullName} · ${d.count} photo${d.count !== 1 ? 's' : ''}`,
          html: `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"></head><body style="margin:0;padding:0;background:#0e0e0e;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0e0e0e;padding:40px 0;"><tr><td align="center">
  <table width="600" cellpadding="0" cellspacing="0" style="background:#141414;border-radius:12px;overflow:hidden;border:1px solid rgba(255,255,255,0.08);">
    <tr><td style="background:#0a0a0a;padding:32px 40px;border-bottom:1px solid rgba(255,255,255,0.07);">
      <p style="margin:0 0 4px;font-size:10px;letter-spacing:0.22em;text-transform:uppercase;color:#c8a96e;">Adriano Lezama Photography</p>
      <h1 style="margin:0;font-size:22px;font-weight:400;color:#fff;letter-spacing:-0.01em;">Gallery Download</h1>
    </td></tr>
    <tr><td style="padding:28px 40px 0;">
      <p style="margin:0 0 16px;font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:#666;">Client</p>
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.05);font-size:13px;color:#888;">Name</td><td style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.05);font-size:13px;color:#e2e2e2;text-align:right;">${fullName}</td></tr>
        <tr><td style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.05);font-size:13px;color:#888;">Email</td><td style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.05);font-size:13px;color:#e2e2e2;text-align:right;"><a href="mailto:${d.email}" style="color:#c8a96e;text-decoration:none;">${d.email}</a></td></tr>
        <tr><td style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.05);font-size:13px;color:#888;">Social</td><td style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.05);font-size:13px;color:#e2e2e2;text-align:right;">${d.social || '—'}</td></tr>
        <tr><td style="padding:8px 0;font-size:13px;color:#888;">Downloaded at</td><td style="padding:8px 0;font-size:13px;color:#e2e2e2;text-align:right;">${downloadedAt}</td></tr>
      </table>
    </td></tr>
    <tr><td style="padding:28px 40px 0;">
      <p style="margin:0 0 4px;font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:#666;">Photos downloaded</p>
      <p style="margin:0 0 16px;font-size:12px;color:#555;">${d.count} file${d.count !== 1 ? 's' : ''} — click any link to download the original</p>
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="padding:6px 0;font-size:10px;letter-spacing:0.14em;text-transform:uppercase;color:#444;">#</td><td style="padding:6px 0;font-size:10px;letter-spacing:0.14em;text-transform:uppercase;color:#444;">Title</td><td style="padding:6px 0;font-size:10px;letter-spacing:0.14em;text-transform:uppercase;color:#444;">Filename</td><td style="padding:6px 0;font-size:10px;letter-spacing:0.14em;text-transform:uppercase;color:#444;text-align:right;">Link</td></tr>
        ${photoRows}
      </table>
    </td></tr>
    <tr><td style="padding:28px 40px 32px;border-top:1px solid rgba(255,255,255,0.05);">
      <p style="margin:0;font-size:11px;color:#444;line-height:1.7;">Reply to this email to contact ${d.firstName} at <a href="mailto:${d.email}" style="color:#666;text-decoration:none;">${d.email}</a>.</p>
    </td></tr>
  </table></td></tr></table></body></html>`,
        });

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true }));
      } catch (err) {
        console.error('Gallery download email error:', err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: err.message }));
      }
    });
    return;
  }

  // ── POST /api/stripe-session ──
  if (req.method === 'POST' && req.url === '/api/stripe-session') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const stripeModule = await import('stripe');
        const Stripe = stripeModule.default;
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
        const { amountCents, pkg, name, email } = JSON.parse(body);

        if (!amountCents || amountCents < 50) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Invalid amount' }));
          return;
        }

        const paymentIntent = await stripe.paymentIntents.create({
          amount: Math.round(amountCents),
          currency: 'cad',
          receipt_email: email || undefined,
          description: `${pkg} — Adriano Lezama Photography`,
          metadata: { client_name: name || '', package: pkg || '' },
        });

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          clientSecret: paymentIntent.client_secret,
          publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
        }));
      } catch (err) {
        console.error('Stripe session error:', err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // ── POST /api/book ──
  if (req.method === 'POST' && req.url === '/api/book') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const d = JSON.parse(body);
        const fullName = `${d.firstname} ${d.lastname}`;
        const bookingDate = d.date ? new Date(d.date).toLocaleDateString('en-CA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : '—';

        await resend.emails.send({
          from: 'Booking — Adriano Lezama <onboarding@resend.dev>',
          to: 'adrimantionz5@gmail.com',
          reply_to: d.email,
          subject: `📸 New Booking Request — ${fullName} · ${d.package}`,
          html: `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0e0e0e;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0e0e0e;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#141414;border-radius:12px;overflow:hidden;border:1px solid rgba(255,255,255,0.08);">

        <!-- Header -->
        <tr><td style="background:#0a0a0a;padding:32px 40px;border-bottom:1px solid rgba(255,255,255,0.07);">
          <p style="margin:0 0 4px;font-size:10px;letter-spacing:0.22em;text-transform:uppercase;color:#c8a96e;">Adriano Lezama Photography</p>
          <h1 style="margin:0;font-size:22px;font-weight:400;color:#ffffff;letter-spacing:-0.01em;">New Booking Request</h1>
        </td></tr>

        <!-- Client info -->
        <tr><td style="padding:28px 40px 0;">
          <p style="margin:0 0 18px;font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:#666;">Client</p>
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.05);font-size:13px;color:#888;">Name</td>
              <td style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.05);font-size:13px;color:#e2e2e2;text-align:right;">${fullName}</td>
            </tr>
            <tr>
              <td style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.05);font-size:13px;color:#888;">Email</td>
              <td style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.05);font-size:13px;color:#e2e2e2;text-align:right;"><a href="mailto:${d.email}" style="color:#c8a96e;text-decoration:none;">${d.email}</a></td>
            </tr>
            <tr>
              <td style="padding:8px 0;font-size:13px;color:#888;">Phone</td>
              <td style="padding:8px 0;font-size:13px;color:#e2e2e2;text-align:right;">${d.phone || '—'}</td>
            </tr>
          </table>
        </td></tr>

        <!-- Event info -->
        <tr><td style="padding:28px 40px 0;">
          <p style="margin:0 0 18px;font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:#666;">Event Details</p>
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.05);font-size:13px;color:#888;">Sport / Type</td>
              <td style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.05);font-size:13px;color:#e2e2e2;text-align:right;">${d.sport || '—'}</td>
            </tr>
            <tr>
              <td style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.05);font-size:13px;color:#888;">Date</td>
              <td style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.05);font-size:13px;color:#e2e2e2;text-align:right;">${bookingDate}</td>
            </tr>
            <tr>
              <td style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.05);font-size:13px;color:#888;">Kickoff time</td>
              <td style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.05);font-size:13px;color:#e2e2e2;text-align:right;">${d.time || '—'}</td>
            </tr>
            <tr>
              <td style="padding:8px 0;font-size:13px;color:#888;">Venue</td>
              <td style="padding:8px 0;font-size:13px;color:#e2e2e2;text-align:right;">${d.address || '—'}</td>
            </tr>
          </table>
        </td></tr>

        <!-- Invoice -->
        <tr><td style="padding:28px 40px 0;">
          <p style="margin:0 0 18px;font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:#666;">Invoice Breakdown</p>
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.05);font-size:13px;color:#888;">Package</td>
              <td style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.05);font-size:13px;color:#e2e2e2;text-align:right;">${d.package}</td>
            </tr>
            <tr>
              <td style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.05);font-size:13px;color:#888;">Add-ons</td>
              <td style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.05);font-size:13px;color:#e2e2e2;text-align:right;">${d.addons || 'None'}</td>
            </tr>
            <tr>
              <td style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.05);font-size:13px;color:#888;">Travel (${d.km} km × $0.75)</td>
              <td style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.05);font-size:13px;color:#e2e2e2;text-align:right;">$${d.travelFee}</td>
            </tr>
            <tr>
              <td style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.05);font-size:13px;color:#888;">Subtotal</td>
              <td style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.05);font-size:13px;color:#e2e2e2;text-align:right;">${d.subtotal}</td>
            </tr>
            <tr>
              <td style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.05);font-size:13px;color:#888;">GST (5%)</td>
              <td style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.05);font-size:13px;color:#e2e2e2;text-align:right;">${d.gst}</td>
            </tr>
            <tr>
              <td style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.08);font-size:13px;color:#888;">QST (9.975%)</td>
              <td style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.08);font-size:13px;color:#e2e2e2;text-align:right;">${d.qst}</td>
            </tr>
            <tr>
              <td style="padding:16px 0 8px;font-size:15px;color:#ffffff;font-weight:500;">Total (taxes incl.)</td>
              <td style="padding:16px 0 8px;font-size:18px;color:#c8a96e;text-align:right;font-weight:500;">${d.total}</td>
            </tr>
          </table>
        </td></tr>

        ${d.notes ? `
        <!-- Notes -->
        <tr><td style="padding:24px 40px 0;">
          <p style="margin:0 0 10px;font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:#666;">Notes from client</p>
          <p style="margin:0;font-size:13px;color:#aaa;line-height:1.7;background:#0e0e0e;border-radius:8px;padding:14px 16px;border:1px solid rgba(255,255,255,0.06);">${d.notes.replace(/\n/g, '<br>')}</p>
        </td></tr>` : ''}

        <!-- Footer -->
        <tr><td style="padding:32px 40px;margin-top:28px;">
          <p style="margin:0;font-size:11px;color:#444;line-height:1.7;">Reply directly to this email to respond to ${d.firstname}. Their reply-to is set to <a href="mailto:${d.email}" style="color:#666;text-decoration:none;">${d.email}</a>.</p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`,
        });

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true }));
      } catch (err) {
        console.error('Booking email error:', err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: err.message }));
      }
    });
    return;
  }

  // ── GET /api/respond?action=accept|decline&email=...&name=...&pkg=...&total=...&date=... ──
  if (req.method === 'GET' && req.url.startsWith('/api/respond')) {
    const params = new URL(req.url, 'http://localhost').searchParams;
    const action = params.get('action');
    const email  = params.get('email');
    const name   = params.get('name');
    const pkg    = params.get('pkg')   || 'Photography Package';
    const total  = params.get('total') || '';
    const date   = params.get('date')  || '';
    const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
    const payUrl = `${BASE_URL}/pay.html?` + new URLSearchParams({
      name, email: email || '', pkg, total, date,
      ...(params.get('addons') ? { addons: params.get('addons') } : {}),
      ...(params.get('travel') ? { travel: params.get('travel') } : {}),
      ...(params.get('gst')    ? { gst:    params.get('gst')    } : {}),
      ...(params.get('qst')    ? { qst:    params.get('qst')    } : {}),
    }).toString();

    const page = (icon, heading, body, color) => `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${heading}</title>
<style>*{margin:0;padding:0;box-sizing:border-box}body{background:#0e0e0e;font-family:'Helvetica Neue',Arial,sans-serif;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px}.card{background:#141414;border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:48px 40px;max-width:480px;width:100%;text-align:center}.icon{font-size:48px;margin-bottom:24px}.label{font-size:10px;letter-spacing:0.22em;text-transform:uppercase;color:#c8a96e;margin-bottom:8px}h1{font-size:22px;font-weight:400;color:#fff;letter-spacing:-0.01em;margin-bottom:16px}p{font-size:13px;color:#888;line-height:1.7}.accent{color:${color}}</style>
</head><body><div class="card"><div class="icon">${icon}</div><p class="label">Adriano Lezama Photography</p><h1>${heading}</h1><p>${body}</p></div></body></html>`;

    if (!action || !email || !name) {
      res.writeHead(400, { 'Content-Type': 'text/html' });
      res.end(page('⚠️', 'Missing parameters', 'This link is missing required information.', '#888'));
      return;
    }

    (async () => {
      try {
        if (action === 'accept') {
          await resend.emails.send({
            from: 'Adriano Lezama Photography <onboarding@resend.dev>',
            to:   'adrimantionz5@gmail.com',
            reply_to: 'adrimantionz5@gmail.com',
            subject: `✅ Your Booking is Confirmed — ${pkg}`,
            html: `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"></head><body style="margin:0;padding:0;background:#0e0e0e;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0e0e0e;padding:40px 0;"><tr><td align="center">
  <table width="600" cellpadding="0" cellspacing="0" style="background:#141414;border-radius:12px;overflow:hidden;border:1px solid rgba(255,255,255,0.08);">
    <tr><td style="background:#0a0a0a;padding:32px 40px;border-bottom:1px solid rgba(255,255,255,0.07);">
      <p style="margin:0 0 4px;font-size:10px;letter-spacing:0.22em;text-transform:uppercase;color:#c8a96e;">Adriano Lezama Photography</p>
      <h1 style="margin:0;font-size:22px;font-weight:400;color:#fff;letter-spacing:-0.01em;">Booking Confirmed</h1>
    </td></tr>
    <tr><td style="padding:32px 40px 0;">
      <p style="margin:0 0 20px;font-size:15px;color:#e2e2e2;line-height:1.7;">Hi ${name},</p>
      <p style="margin:0 0 20px;font-size:14px;color:#aaa;line-height:1.7;">Your booking has been confirmed. Here's a summary:</p>
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
        <tr><td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.05);font-size:13px;color:#888;">Package</td><td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.05);font-size:13px;color:#e2e2e2;text-align:right;">${pkg}</td></tr>
        ${date ? `<tr><td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.05);font-size:13px;color:#888;">Date</td><td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.05);font-size:13px;color:#e2e2e2;text-align:right;">${date}</td></tr>` : ''}
        ${total ? `<tr><td style="padding:14px 0 6px;font-size:14px;color:#fff;font-weight:500;">Total (taxes incl.)</td><td style="padding:14px 0 6px;font-size:17px;color:#c8a96e;text-align:right;font-weight:500;">${total}</td></tr>` : ''}
      </table>
      <p style="margin:0 0 12px;font-size:13px;color:#aaa;line-height:1.7;">To secure your spot, please complete your payment below:</p>
    </td></tr>
    <tr><td style="padding:20px 40px 32px;text-align:center;">
      <a href="${payUrl}" style="display:inline-block;background:#c8a96e;color:#0a0a0a;font-size:13px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;text-decoration:none;padding:14px 36px;border-radius:6px;">Complete Payment →</a>
    </td></tr>
    <tr><td style="padding:0 40px 32px;"><p style="margin:0;font-size:12px;color:#444;line-height:1.7;">Questions? Reply to this email. We look forward to shooting your event.</p></td></tr>
  </table></td></tr></table></body></html>`,
          });
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(page('✅', 'Booking Accepted', `A payment email has been sent to <span class="accent">${name}</span> for <span class="accent">${pkg}</span>${total ? ` — ${total}` : ''}.`, '#4ade80'));

        } else if (action === 'decline') {
          await resend.emails.send({
            from: 'Adriano Lezama Photography <onboarding@resend.dev>',
            to:   'adrimantionz5@gmail.com',
            reply_to: 'adrimantionz5@gmail.com',
            subject: `Re: Your Booking Request — ${pkg}`,
            html: `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"></head><body style="margin:0;padding:0;background:#0e0e0e;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0e0e0e;padding:40px 0;"><tr><td align="center">
  <table width="600" cellpadding="0" cellspacing="0" style="background:#141414;border-radius:12px;overflow:hidden;border:1px solid rgba(255,255,255,0.08);">
    <tr><td style="background:#0a0a0a;padding:32px 40px;border-bottom:1px solid rgba(255,255,255,0.07);">
      <p style="margin:0 0 4px;font-size:10px;letter-spacing:0.22em;text-transform:uppercase;color:#c8a96e;">Adriano Lezama Photography</p>
      <h1 style="margin:0;font-size:22px;font-weight:400;color:#fff;letter-spacing:-0.01em;">Booking Update</h1>
    </td></tr>
    <tr><td style="padding:32px 40px;">
      <p style="margin:0 0 20px;font-size:15px;color:#e2e2e2;line-height:1.7;">Hi ${name},</p>
      <p style="margin:0 0 20px;font-size:14px;color:#aaa;line-height:1.7;">Thank you for reaching out. Unfortunately, I'm not available for your requested date${date ? ` (${date})` : ''} and won't be able to take on this booking.</p>
      <p style="margin:0 0 20px;font-size:14px;color:#aaa;line-height:1.7;">I appreciate your interest and hope we can work together in the future.</p>
      <p style="margin:0;font-size:14px;color:#aaa;line-height:1.7;">Best,<br><span style="color:#e2e2e2;">Adriano</span></p>
    </td></tr>
  </table></td></tr></table></body></html>`,
          });
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(page('❌', 'Booking Declined', `A decline notice has been sent to <span class="accent">${name}</span>.`, '#f87171'));

        } else {
          res.writeHead(400, { 'Content-Type': 'text/html' });
          res.end(page('⚠️', 'Unknown Action', 'The action must be "accept" or "decline".', '#888'));
        }
      } catch (err) {
        console.error('Respond error:', err);
        res.writeHead(500, { 'Content-Type': 'text/html' });
        res.end(page('⚠️', 'Something went wrong', err.message, '#888'));
      }
    })();
    return;
  }

  let urlPath = req.url === '/' ? '/index.html' : req.url;
  // Strip query strings
  urlPath = urlPath.split('?')[0];
  // Decode percent-encoded characters (e.g. %20 → space) so folder names with spaces resolve correctly
  try { urlPath = decodeURIComponent(urlPath); } catch {}

  const filePath = path.join(__dirname, urlPath);
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end(`404 Not Found: ${urlPath}`);
      return;
    }
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
