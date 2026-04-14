import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const BASE_URL = process.env.BASE_URL || 'https://adriano-lezama.vercel.app';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { firstName, lastName, email, social, photos, count, date } = req.body;
    const fullName   = `${firstName} ${lastName}`;
    const downloadedAt = date
      ? new Date(date).toLocaleString('en-CA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })
      : new Date().toLocaleString('en-CA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });

    // Build photo rows HTML
    const photoRows = (photos || []).map((p, i) => {
      const src      = typeof p === 'string' ? p : p.src;
      const title    = typeof p === 'object' && p.title ? p.title : src.split('/').pop().replace(/\.[^.]+$/, '');
      const fullUrl  = `${BASE_URL}/${src.replace(/^\//, '')}`;
      const filename = src.split('/').pop();
      return `
        <tr>
          <td style="padding:9px 0;border-bottom:1px solid rgba(255,255,255,0.05);font-size:12px;color:#888;">${i + 1}</td>
          <td style="padding:9px 0;border-bottom:1px solid rgba(255,255,255,0.05);font-size:12px;color:#e2e2e2;">${title}</td>
          <td style="padding:9px 0;border-bottom:1px solid rgba(255,255,255,0.05);font-size:12px;color:#888;">${filename}</td>
          <td style="padding:9px 0;border-bottom:1px solid rgba(255,255,255,0.05);font-size:12px;text-align:right;">
            <a href="${fullUrl}" style="color:#c8a96e;text-decoration:none;font-size:11px;letter-spacing:0.08em;text-transform:uppercase;">↓ Download</a>
          </td>
        </tr>`;
    }).join('');

    await resend.emails.send({
      from:     'Gallery — Adriano Lezama <onboarding@resend.dev>',
      to:       'adrimantionz5@gmail.com',
      reply_to: email,
      subject:  `📥 Gallery Download — ${fullName} · ${count} photo${count !== 1 ? 's' : ''}`,
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
          <h1 style="margin:0;font-size:22px;font-weight:400;color:#ffffff;letter-spacing:-0.01em;">Gallery Download</h1>
        </td></tr>

        <!-- Client info -->
        <tr><td style="padding:28px 40px 0;">
          <p style="margin:0 0 16px;font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:#666;">Client</p>
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.05);font-size:13px;color:#888;">Name</td>
              <td style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.05);font-size:13px;color:#e2e2e2;text-align:right;">${fullName}</td>
            </tr>
            <tr>
              <td style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.05);font-size:13px;color:#888;">Email</td>
              <td style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.05);font-size:13px;color:#e2e2e2;text-align:right;"><a href="mailto:${email}" style="color:#c8a96e;text-decoration:none;">${email}</a></td>
            </tr>
            <tr>
              <td style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.05);font-size:13px;color:#888;">Social</td>
              <td style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.05);font-size:13px;color:#e2e2e2;text-align:right;">${social || '—'}</td>
            </tr>
            <tr>
              <td style="padding:8px 0;font-size:13px;color:#888;">Downloaded at</td>
              <td style="padding:8px 0;font-size:13px;color:#e2e2e2;text-align:right;">${downloadedAt}</td>
            </tr>
          </table>
        </td></tr>

        <!-- Photos list -->
        <tr><td style="padding:28px 40px 0;">
          <p style="margin:0 0 4px;font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:#666;">Photos downloaded</p>
          <p style="margin:0 0 16px;font-size:12px;color:#555;">${count} file${count !== 1 ? 's' : ''} — click any link to download the original</p>
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding:6px 0;font-size:10px;letter-spacing:0.14em;text-transform:uppercase;color:#444;">#</td>
              <td style="padding:6px 0;font-size:10px;letter-spacing:0.14em;text-transform:uppercase;color:#444;">Title</td>
              <td style="padding:6px 0;font-size:10px;letter-spacing:0.14em;text-transform:uppercase;color:#444;">Filename</td>
              <td style="padding:6px 0;font-size:10px;letter-spacing:0.14em;text-transform:uppercase;color:#444;text-align:right;">Link</td>
            </tr>
            ${photoRows}
          </table>
        </td></tr>

        <!-- Footer -->
        <tr><td style="padding:28px 40px 32px;border-top:1px solid rgba(255,255,255,0.05);margin-top:8px;">
          <p style="margin:0;font-size:11px;color:#444;line-height:1.7;">Reply to this email to contact ${firstName} directly at <a href="mailto:${email}" style="color:#666;text-decoration:none;">${email}</a>.</p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`,
    });

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Gallery download email error:', err);
    return res.status(500).json({ ok: false, error: err.message });
  }
}
