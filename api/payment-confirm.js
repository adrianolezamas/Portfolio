import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  // Accept GET or POST
  const params = req.method === 'POST'
    ? req.body
    : Object.fromEntries(new URL(req.url, `https://${req.headers.host}`).searchParams);

  const { name, email, pkg, total } = params;

  if (!email || !name) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  // Guard: only send once per request (idempotency handled by caller)
  try {
    await resend.emails.send({
      from: 'Adriano Lezama Photography <noreply@adrianolezamas.com>',
      to:   email,
      reply_to: 'adrlezama@gmail.com',
      subject: `Payment confirmed — See you on the pitch, ${name}!`,
      html: `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:48px 0 40px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">

        <!-- Logo -->
        <tr><td style="padding-bottom:32px;text-align:center;">
          <a href="https://adrianolezamas.com" target="_blank">
            <img src="https://adrianolezamas.com/AL.png" alt="Adriano Lezama Photography" width="72" height="72" style="display:inline-block;width:72px;height:auto;border:0;">
          </a>
        </td></tr>

        <!-- Card -->
        <tr><td style="background:#141414;border-radius:14px;overflow:hidden;border:1px solid rgba(255,255,255,0.07);">

          <!-- Header -->
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td style="background:#0e0e0e;padding:36px 44px 32px;border-bottom:1px solid rgba(255,255,255,0.06);text-align:center;">
              <p style="margin:0 0 14px;font-size:10px;letter-spacing:0.28em;text-transform:uppercase;color:#c8a96e;">Adriano Lezama Photography</p>
              <h1 style="margin:0 0 8px;font-size:28px;font-weight:300;color:#ffffff;letter-spacing:-0.02em;line-height:1.25;">Payment Confirmed.</h1>
              <p style="margin:0;font-size:14px;color:#666;letter-spacing:0.01em;">You're officially locked in, ${name}.</p>
            </td></tr>
          </table>

          <!-- Body -->
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td style="padding:36px 44px 32px;">
              <p style="margin:0 0 18px;font-size:14px;color:#aaa;line-height:1.85;">Thank you so much — your payment has been received and your spot is secured. I'm genuinely excited and truly looking forward to being part of your team and capturing something special together.</p>
              <p style="margin:0 0 18px;font-size:14px;color:#aaa;line-height:1.85;">I'll be in touch before your event with everything you need to know. In the meantime, don't hesitate to reach out directly — I'm always happy to chat.</p>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:16px 22px;background:#0e0e0e;border-radius:10px;border:1px solid rgba(255,255,255,0.06);">
                    <p style="margin:0 0 6px;font-size:9px;letter-spacing:0.22em;text-transform:uppercase;color:#555;">Direct contact</p>
                    <p style="margin:0;font-size:16px;font-weight:500;color:#c8a96e;letter-spacing:0.02em;">438-393-3752</p>
                  </td>
                </tr>
              </table>
            </td></tr>
          </table>

          ${pkg || total ? `
          <!-- Summary -->
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td style="padding:0 44px 32px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#0e0e0e;border-radius:10px;border:1px solid rgba(255,255,255,0.06);overflow:hidden;">
                <tr><td style="padding:14px 22px;border-bottom:1px solid rgba(255,255,255,0.05);">
                  <p style="margin:0;font-size:9px;letter-spacing:0.24em;text-transform:uppercase;color:#555;">Payment Receipt</p>
                </td></tr>
                <tr><td style="padding:6px 22px 6px;">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    ${pkg ? `<tr>
                      <td style="font-size:12px;color:#555;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.04);">Package</td>
                      <td style="font-size:12px;color:#ccc;text-align:right;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.04);">${pkg}</td>
                    </tr>` : ''}
                    ${total ? `<tr>
                      <td style="font-size:13px;color:#e2e2e2;font-weight:500;padding:14px 0 6px;">Amount paid</td>
                      <td style="font-size:20px;color:#c8a96e;font-weight:500;text-align:right;padding:14px 0 6px;">${total}</td>
                    </tr>` : ''}
                  </table>
                </td></tr>
              </table>
            </td></tr>
          </table>
          ` : ''}

          <!-- Divider -->
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td style="padding:0 44px;"><div style="height:1px;background:rgba(255,255,255,0.05);"></div></td></tr>
          </table>

          <!-- Social links -->
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td style="padding:30px 44px 36px;">
              <p style="margin:0 0 16px;font-size:9px;letter-spacing:0.24em;text-transform:uppercase;color:#444;">Follow Along</p>
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding-right:12px;">
                    <a href="https://www.instagram.com/byadriano_/" target="_blank" style="display:table;background:#1a1a1a;border:1px solid rgba(255,255,255,0.09);border-radius:8px;padding:11px 18px;text-decoration:none;">
                      <table cellpadding="0" cellspacing="0"><tr>
                        <td style="padding-right:9px;vertical-align:middle;">
                          <img src="https://cdn-icons-png.flaticon.com/24/2111/2111463.png" width="15" height="15" alt="" style="display:block;">
                        </td>
                        <td style="font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:#e2e2e2;font-family:'Helvetica Neue',Arial,sans-serif;vertical-align:middle;">@byadriano_</td>
                      </tr></table>
                    </a>
                  </td>
                  <td>
                    <a href="https://adrianolezamas.com" target="_blank" style="display:table;background:#1a1a1a;border:1px solid rgba(255,255,255,0.09);border-radius:8px;padding:11px 18px;text-decoration:none;">
                      <table cellpadding="0" cellspacing="0"><tr>
                        <td style="padding-right:9px;vertical-align:middle;">
                          <img src="https://adrianolezamas.com/AL.png" width="15" height="15" alt="" style="display:block;border-radius:2px;opacity:0.8;">
                        </td>
                        <td style="font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:#e2e2e2;font-family:'Helvetica Neue',Arial,sans-serif;vertical-align:middle;">adrianolezamas.com</td>
                      </tr></table>
                    </a>
                  </td>
                </tr>
              </table>
            </td></tr>
          </table>

        </td></tr>

        <!-- Footer -->
        <tr><td style="padding:24px 0 0;text-align:center;">
          <p style="margin:0 0 6px;font-size:11px;color:#3a3a3a;line-height:1.7;">Questions? Reply to this email or call <a href="tel:+14383933752" style="color:#555;text-decoration:none;">438-393-3752</a></p>
          <p style="margin:0;font-size:10px;color:#2a2a2a;letter-spacing:0.1em;text-transform:uppercase;">© 2026 · Adriano Lezama Photography</p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`,
    });

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Payment confirm email error:', err);
    return res.status(500).json({ ok: false, error: err.message });
  }
}
