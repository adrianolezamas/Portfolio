import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { name, email, album, session } = req.body;

  if (!name || !email) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const label = session || album || 'Private Gallery';
  const requestedAt = new Date().toLocaleString('en-CA', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

  try {
    await resend.emails.send({
      from: 'Gallery — Adriano Lezama <onboarding@resend.dev>',
      to: 'adrimantionz5@gmail.com',
      replyTo: email,
      subject: `📸 Photo Request — ${name} · ${label}`,
      html: `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0e0e0e;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0e0e0e;padding:40px 0;">
    <tr><td align="center">
      <table width="580" cellpadding="0" cellspacing="0" style="background:#141414;border-radius:12px;overflow:hidden;border:1px solid rgba(255,255,255,0.08);">

        <tr><td style="background:#0a0a0a;padding:28px 36px;border-bottom:1px solid rgba(255,255,255,0.07);">
          <p style="margin:0 0 4px;font-size:10px;letter-spacing:0.22em;text-transform:uppercase;color:#c8a96e;">Adriano Lezama Photography</p>
          <h1 style="margin:0;font-size:20px;font-weight:400;color:#ffffff;letter-spacing:-0.01em;">New Photo Request</h1>
        </td></tr>

        <tr><td style="padding:28px 36px 0;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.05);font-size:12px;color:#666;width:120px;">Name</td>
              <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.05);font-size:13px;color:#e2e2e2;text-align:right;">${name}</td>
            </tr>
            <tr>
              <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.05);font-size:12px;color:#666;">Email</td>
              <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.05);font-size:13px;text-align:right;">
                <a href="mailto:${email}" style="color:#c8a96e;text-decoration:none;">${email}</a>
              </td>
            </tr>
            <tr>
              <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.05);font-size:12px;color:#666;">Session</td>
              <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.05);font-size:13px;color:#e2e2e2;text-align:right;">${label}</td>
            </tr>
            ${album ? `
            <tr>
              <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.05);font-size:12px;color:#666;">Album</td>
              <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.05);font-size:13px;color:#e2e2e2;text-align:right;">${album}</td>
            </tr>` : ''}
            <tr>
              <td style="padding:10px 0;font-size:12px;color:#666;">Requested at</td>
              <td style="padding:10px 0;font-size:12px;color:#555;text-align:right;">${requestedAt}</td>
            </tr>
          </table>
        </td></tr>

        <tr><td style="padding:24px 36px 28px;">
          <a href="mailto:${email}?subject=Your photos — ${label}&body=Hi ${name},%0A%0AYour photos are ready! Here is your download link:%0A%0A[ADD LINK HERE]%0A%0ABest,%0AAdriano"
             style="display:inline-block;background:#c8a96e;color:#0e0e0e;text-decoration:none;font-size:11px;font-weight:600;letter-spacing:0.14em;text-transform:uppercase;padding:12px 24px;border-radius:6px;">
            Reply to ${name} →
          </a>
        </td></tr>

        <tr><td style="padding:20px 36px;border-top:1px solid rgba(255,255,255,0.05);">
          <p style="margin:0;font-size:11px;color:#444;line-height:1.7;">
            This is an automated notification from your gallery. Reply-to is set to the client's email.
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`,
    });

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Gallery request email error:', err);
    return res.status(500).json({ error: err.message });
  }
}
