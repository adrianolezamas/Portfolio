import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const BASE_URL = process.env.BASE_URL || 'https://adriano-lezama.vercel.app';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const d = req.body;
    const fullName = `${d.firstname} ${d.lastname}`;
    const bookingDate = d.date
      ? new Date(d.date).toLocaleDateString('en-CA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
      : '—';

    const respondParams = new URLSearchParams({
      email:  d.email,
      name:   d.firstname,
      pkg:    d.package,
      total:  d.total   || '',
      date:   bookingDate,
      addons: d.addons  || '',
      travel: d.travelFee ? `$${d.travelFee}` : '',
      gst:    d.gst     || '',
      qst:    d.qst     || '',
      lang:   d.lang    || 'en',
    });
    const acceptUrl  = `${BASE_URL}/api/respond?action=accept&${respondParams}`;
    const declineUrl = `${BASE_URL}/api/respond?action=decline&${respondParams}`;

    // ── Confirmation email to the client ──────────────────────────────────
    await resend.emails.send({
      from: 'Adriano Lezama Photography <onboarding@resend.dev>',
      to: d.email,
      reply_to: 'adrlezama@gmail.com',
      subject: `Booking request received — Adriano Lezama Photography`,
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
              <h1 style="margin:0 0 6px;font-size:28px;font-weight:300;color:#ffffff;letter-spacing:-0.02em;line-height:1.25;">Thank you, ${d.firstname}.</h1>
              <p style="margin:0;font-size:14px;color:#666;letter-spacing:0.01em;">Your booking request has been received.</p>
            </td></tr>
          </table>

          <!-- Body -->
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td style="padding:36px 44px 28px;">
              <p style="margin:0 0 18px;font-size:14px;color:#aaa;line-height:1.85;">I'm thrilled you reached out — it means a lot. I've received everything and will get back to you <strong style="color:#e2e2e2;font-weight:500;">within an hour</strong> to confirm availability and walk you through the next steps.</p>
              <p style="margin:0;font-size:14px;color:#aaa;line-height:1.85;">In the meantime, have a look at my latest work or follow along on socials below.</p>
            </td></tr>
          </table>

          <!-- Booking summary -->
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td style="padding:0 44px 36px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#0e0e0e;border-radius:10px;border:1px solid rgba(255,255,255,0.06);overflow:hidden;">
                <tr><td style="padding:14px 22px;border-bottom:1px solid rgba(255,255,255,0.05);">
                  <p style="margin:0;font-size:9px;letter-spacing:0.24em;text-transform:uppercase;color:#555;">Request Summary</p>
                </td></tr>
                <tr><td style="padding:4px 22px 16px;">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="font-size:12px;color:#555;padding:9px 0;border-bottom:1px solid rgba(255,255,255,0.04);">Package</td>
                      <td style="font-size:12px;color:#ccc;text-align:right;padding:9px 0;border-bottom:1px solid rgba(255,255,255,0.04);">${d.package}</td>
                    </tr>
                    <tr>
                      <td style="font-size:12px;color:#555;padding:9px 0;border-bottom:1px solid rgba(255,255,255,0.04);">Date</td>
                      <td style="font-size:12px;color:#ccc;text-align:right;padding:9px 0;border-bottom:1px solid rgba(255,255,255,0.04);">${bookingDate}</td>
                    </tr>
                    ${d.addons && d.addons !== 'None' ? `<tr>
                      <td style="font-size:12px;color:#555;padding:9px 0;border-bottom:1px solid rgba(255,255,255,0.04);">Add-ons</td>
                      <td style="font-size:12px;color:#ccc;text-align:right;padding:9px 0;border-bottom:1px solid rgba(255,255,255,0.04);">${d.addons}</td>
                    </tr>` : ''}
                    <tr>
                      <td style="font-size:13px;color:#e2e2e2;font-weight:500;padding:14px 0 6px;">Estimated Total</td>
                      <td style="font-size:17px;color:#c8a96e;font-weight:500;text-align:right;padding:14px 0 6px;">${d.total}</td>
                    </tr>
                  </table>
                </td></tr>
              </table>
            </td></tr>
          </table>

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
                          <img src="https://cdn-icons-png.flaticon.com/24/2111/2111463.png" width="15" height="15" alt="" style="display:block;filter:sepia(1) saturate(3) hue-rotate(5deg) brightness(0.85);">
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
          <p style="margin:0 0 6px;font-size:11px;color:#3a3a3a;line-height:1.7;">Questions? Reply to this email or write to <a href="mailto:adrlezama@gmail.com" style="color:#555;text-decoration:none;">adrlezama@gmail.com</a></p>
          <p style="margin:0;font-size:10px;color:#2a2a2a;letter-spacing:0.1em;text-transform:uppercase;">© 2026 · Adriano Lezama Photography</p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`,
    });

    // ── Internal notification to photographer ─────────────────────────────
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
        <tr><td style="background:#0a0a0a;padding:32px 40px;border-bottom:1px solid rgba(255,255,255,0.07);">
          <p style="margin:0 0 4px;font-size:10px;letter-spacing:0.22em;text-transform:uppercase;color:#c8a96e;">Adriano Lezama Photography</p>
          <h1 style="margin:0;font-size:22px;font-weight:400;color:#ffffff;letter-spacing:-0.01em;">New Booking Request</h1>
        </td></tr>
        <tr><td style="padding:28px 40px 0;">
          <p style="margin:0 0 18px;font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:#666;">Client</p>
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.05);font-size:13px;color:#888;">Name</td><td style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.05);font-size:13px;color:#e2e2e2;text-align:right;">${fullName}</td></tr>
            <tr><td style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.05);font-size:13px;color:#888;">Email</td><td style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.05);font-size:13px;color:#e2e2e2;text-align:right;"><a href="mailto:${d.email}" style="color:#c8a96e;text-decoration:none;">${d.email}</a></td></tr>
            <tr><td style="padding:8px 0;font-size:13px;color:#888;">Phone</td><td style="padding:8px 0;font-size:13px;color:#e2e2e2;text-align:right;">${d.phone || '—'}</td></tr>
          </table>
        </td></tr>
        <tr><td style="padding:28px 40px 0;">
          <p style="margin:0 0 18px;font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:#666;">Event Details</p>
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.05);font-size:13px;color:#888;">Sport / Type</td><td style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.05);font-size:13px;color:#e2e2e2;text-align:right;">${d.sport || '—'}</td></tr>
            <tr><td style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.05);font-size:13px;color:#888;">Date</td><td style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.05);font-size:13px;color:#e2e2e2;text-align:right;">${bookingDate}</td></tr>
            <tr><td style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.05);font-size:13px;color:#888;">Kickoff time</td><td style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.05);font-size:13px;color:#e2e2e2;text-align:right;">${d.time || '—'}</td></tr>
            <tr><td style="padding:8px 0;font-size:13px;color:#888;">Venue</td><td style="padding:8px 0;font-size:13px;color:#e2e2e2;text-align:right;">${d.address || '—'}</td></tr>
          </table>
        </td></tr>
        <tr><td style="padding:28px 40px 0;">
          <p style="margin:0 0 18px;font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:#666;">Invoice Breakdown</p>
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.05);font-size:13px;color:#888;">Package</td><td style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.05);font-size:13px;color:#e2e2e2;text-align:right;">${d.package}</td></tr>
            <tr><td style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.05);font-size:13px;color:#888;">Add-ons</td><td style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.05);font-size:13px;color:#e2e2e2;text-align:right;">${d.addons || 'None'}</td></tr>
            <tr><td style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.05);font-size:13px;color:#888;">Travel (${d.km} km × $0.75)</td><td style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.05);font-size:13px;color:#e2e2e2;text-align:right;">$${d.travelFee}</td></tr>
            <tr><td style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.05);font-size:13px;color:#888;">Subtotal</td><td style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.05);font-size:13px;color:#e2e2e2;text-align:right;">${d.subtotal}</td></tr>
            <tr><td style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.05);font-size:13px;color:#888;">GST (5%)</td><td style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.05);font-size:13px;color:#e2e2e2;text-align:right;">${d.gst}</td></tr>
            <tr><td style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.08);font-size:13px;color:#888;">QST (9.975%)</td><td style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.08);font-size:13px;color:#e2e2e2;text-align:right;">${d.qst}</td></tr>
            <tr><td style="padding:16px 0 8px;font-size:15px;color:#ffffff;font-weight:500;">Total (taxes incl.)</td><td style="padding:16px 0 8px;font-size:18px;color:#c8a96e;text-align:right;font-weight:500;">${d.total}</td></tr>
          </table>
        </td></tr>
        ${d.notes ? `<tr><td style="padding:24px 40px 0;"><p style="margin:0 0 10px;font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:#666;">Notes from client</p><p style="margin:0;font-size:13px;color:#aaa;line-height:1.7;background:#0e0e0e;border-radius:8px;padding:14px 16px;border:1px solid rgba(255,255,255,0.06);">${d.notes.replace(/\n/g, '<br>')}</p></td></tr>` : ''}
        <!-- Accept / Decline buttons -->
        <tr><td style="padding:32px 40px 8px;">
          <p style="margin:0 0 6px;font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:#666;">Respond to this request</p>
          <p style="margin:0 0 20px;font-size:12px;color:#555;line-height:1.6;">Clicking Accept will send ${d.firstname} a confirmation with your payment link. Clicking Decline will send a polite unavailability notice.</p>
          <table cellpadding="0" cellspacing="0"><tr>
            <td style="padding-right:12px;">
              <a href="${acceptUrl}" style="display:inline-block;background:#c8a96e;color:#0a0a0a;font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;text-decoration:none;padding:13px 28px;border-radius:6px;">✓ Accept Booking</a>
            </td>
            <td>
              <a href="${declineUrl}" style="display:inline-block;background:transparent;color:#888;font-size:12px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;text-decoration:none;padding:12px 28px;border-radius:6px;border:1px solid rgba(255,255,255,0.12);">✕ Decline</a>
            </td>
          </tr></table>
        </td></tr>

        <!-- Footer -->
        <tr><td style="padding:24px 40px 32px;border-top:1px solid rgba(255,255,255,0.05);">
          <p style="margin:0;font-size:11px;color:#444;line-height:1.7;">Client: <a href="mailto:${d.email}" style="color:#666;text-decoration:none;">${d.email}</a> · Phone: ${d.phone || '—'}</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
    });

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Booking email error:', err);
    return res.status(500).json({ ok: false, error: err.message });
  }
}
