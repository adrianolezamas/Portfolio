import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const BASE_URL = process.env.BASE_URL || 'https://adriano-lezama.vercel.app';

function page(title, icon, heading, body, color) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${title}</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { background:#0e0e0e; font-family:'Helvetica Neue',Arial,sans-serif; min-height:100vh; display:flex; align-items:center; justify-content:center; padding:24px; }
    .card { background:#141414; border:1px solid rgba(255,255,255,0.08); border-radius:16px; padding:48px 40px; max-width:480px; width:100%; text-align:center; }
    .icon { font-size:48px; margin-bottom:24px; }
    .label { font-size:10px; letter-spacing:0.22em; text-transform:uppercase; color:#c8a96e; margin-bottom:8px; }
    h1 { font-size:22px; font-weight:400; color:#fff; letter-spacing:-0.01em; margin-bottom:16px; }
    p { font-size:13px; color:#888; line-height:1.7; }
    .accent { color:${color}; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">${icon}</div>
    <p class="label">Adriano Lezama Photography</p>
    <h1>${heading}</h1>
    <p>${body}</p>
  </div>
</body>
</html>`;
}

export default async function handler(req, res) {
  const params = new URL(req.url, `https://${req.headers.host}`).searchParams;
  const action   = params.get('action');
  const email    = params.get('email');
  const name     = params.get('name');
  const pkg      = params.get('pkg')    || 'Photography Package';
  const total    = params.get('total')  || '';
  const date     = params.get('date')   || '';
  const addons   = params.get('addons') || '';
  const travel   = params.get('travel') || '';
  const gst      = params.get('gst')    || '';
  const qst      = params.get('qst')    || '';
  const lang     = params.get('lang')   || 'en';
  const isFr     = lang === 'fr';

  // Build the payment page URL with all booking details
  const payUrl = `${BASE_URL}/pay.html?` + new URLSearchParams({
    name, email, pkg, total, date,
    ...(addons ? { addons } : {}),
    ...(travel ? { travel } : {}),
    ...(gst    ? { gst    } : {}),
    ...(qst    ? { qst    } : {}),
    lang,
  }).toString();

  if (!action || !email || !name) {
    res.statusCode = 400;
    res.end(page('Error', '⚠️', 'Missing parameters', 'This link is missing required information.', '#888'));
    return;
  }

  try {
    if (action === 'accept') {
      await resend.emails.send({
        from: 'Adriano Lezama Photography <noreply@adrianolezamas.com>',
        to:   email,
        reply_to: 'adrlezama@gmail.com',
        subject: isFr ? `Merci de m'avoir choisi — votre paiement est prêt` : `Thank you for choosing me — your payment is ready`,
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
              <h1 style="margin:0 0 8px;font-size:28px;font-weight:300;color:#ffffff;letter-spacing:-0.02em;line-height:1.25;">${isFr ? `Merci, ${name}.` : `Thank you, ${name}.`}</h1>
              <p style="margin:0;font-size:14px;color:#666;letter-spacing:0.01em;">${isFr ? 'Votre réservation est confirmée.' : 'Your booking is confirmed.'}</p>
            </td></tr>
          </table>

          <!-- Body -->
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td style="padding:36px 44px 28px;">
              <p style="margin:0 0 18px;font-size:14px;color:#aaa;line-height:1.85;">${isFr
                ? `Merci de m'avoir choisi — ça compte vraiment beaucoup pour moi. Je suis impatient de couvrir votre événement et de capturer chaque moment qui compte.`
                : `Thank you so much for choosing me — it truly means the world. I'm genuinely excited and can't wait to capture your event and every moment that matters.`
              }</p>
              <p style="margin:0;font-size:14px;color:#aaa;line-height:1.85;">${isFr
                ? `Pour sécuriser votre date, complétez votre paiement via le bouton ci-dessous. Une fois reçu, vous recevrez la confirmation finale avec tous les détails.`
                : `To lock in your date, please complete your payment using the button below. Once received, you'll get a final confirmation with all the details.`
              }</p>
            </td></tr>
          </table>

          <!-- Invoice block -->
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td style="padding:0 44px 28px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#0e0e0e;border-radius:10px;border:1px solid rgba(255,255,255,0.06);overflow:hidden;">
                <tr><td style="padding:14px 22px;border-bottom:1px solid rgba(255,255,255,0.05);">
                  <p style="margin:0;font-size:9px;letter-spacing:0.24em;text-transform:uppercase;color:#555;">${isFr ? 'Résumé de réservation' : 'Booking Summary'}</p>
                </td></tr>
                <tr><td style="padding:6px 22px 6px;">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="font-size:12px;color:#555;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.04);">${isFr ? 'Forfait' : 'Package'}</td>
                      <td style="font-size:12px;color:#ccc;text-align:right;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.04);">${pkg}</td>
                    </tr>
                    ${date ? `<tr>
                      <td style="font-size:12px;color:#555;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.04);">${isFr ? 'Date' : 'Date'}</td>
                      <td style="font-size:12px;color:#ccc;text-align:right;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.04);">${date}</td>
                    </tr>` : ''}
                    ${addons ? `<tr>
                      <td style="font-size:12px;color:#555;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.04);">${isFr ? 'Suppléments' : 'Add-ons'}</td>
                      <td style="font-size:12px;color:#ccc;text-align:right;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.04);">${addons}</td>
                    </tr>` : ''}
                    ${travel ? `<tr>
                      <td style="font-size:12px;color:#555;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.04);">${isFr ? 'Déplacement' : 'Travel fee'}</td>
                      <td style="font-size:12px;color:#ccc;text-align:right;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.04);">${travel}</td>
                    </tr>` : ''}
                    ${gst ? `<tr>
                      <td style="font-size:12px;color:#444;padding:7px 0;border-bottom:1px solid rgba(255,255,255,0.03);">GST (5%)</td>
                      <td style="font-size:12px;color:#666;text-align:right;padding:7px 0;border-bottom:1px solid rgba(255,255,255,0.03);">${gst}</td>
                    </tr>` : ''}
                    ${qst ? `<tr>
                      <td style="font-size:12px;color:#444;padding:7px 0;border-bottom:1px solid rgba(255,255,255,0.04);">QST (9.975%)</td>
                      <td style="font-size:12px;color:#666;text-align:right;padding:7px 0;border-bottom:1px solid rgba(255,255,255,0.04);">${qst}</td>
                    </tr>` : ''}
                    ${total ? `<tr>
                      <td style="font-size:13px;color:#e2e2e2;font-weight:500;padding:14px 0 6px;">${isFr ? 'Total (taxes incl.)' : 'Total (taxes incl.)'}</td>
                      <td style="font-size:20px;color:#c8a96e;font-weight:500;text-align:right;padding:14px 0 6px;">${total}</td>
                    </tr>` : ''}
                  </table>
                </td></tr>
              </table>
            </td></tr>
          </table>

          <!-- Payment CTA -->
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td style="padding:0 44px 36px;text-align:center;">
              <a href="${payUrl}" style="display:inline-block;background:#c8a96e;color:#0a0a0a;font-size:13px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;text-decoration:none;padding:16px 40px;border-radius:7px;">${isFr ? 'Compléter le paiement →' : 'Complete Payment →'}</a>
            </td></tr>
          </table>

          <!-- Divider -->
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td style="padding:0 44px;"><div style="height:1px;background:rgba(255,255,255,0.05);"></div></td></tr>
          </table>

          <!-- Social links -->
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td style="padding:30px 44px 36px;">
              <p style="margin:0 0 16px;font-size:9px;letter-spacing:0.24em;text-transform:uppercase;color:#444;">${isFr ? 'Suivez mon travail' : 'Follow Along'}</p>
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
          <p style="margin:0 0 6px;font-size:11px;color:#3a3a3a;line-height:1.7;">${isFr ? 'Des questions ? Répondez à cet email ou écrivez à' : 'Questions? Reply to this email or write to'} <a href="mailto:adrlezama@gmail.com" style="color:#555;text-decoration:none;">adrlezama@gmail.com</a></p>
          <p style="margin:0;font-size:10px;color:#2a2a2a;letter-spacing:0.1em;text-transform:uppercase;">© 2026 · Adriano Lezama Photography</p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`,
      });

      res.statusCode = 200;
      res.setHeader('Content-Type', 'text/html');
      res.end(page(
        'Booking Accepted',
        '✅',
        'Booking Accepted',
        `A payment email has been sent to <span class="accent">${name}</span> for <span class="accent">${pkg}</span>${total ? ` — ${total}` : ''}. They'll receive instructions to complete their payment.`,
        '#4ade80'
      ));

    } else if (action === 'decline') {
      await resend.emails.send({
        from: 'Adriano Lezama Photography <noreply@adrianolezamas.com>',
        to:   email,
        reply_to: 'adrlezama@gmail.com',
        subject: `Re: Your Booking Request — ${pkg}`,
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
          <h1 style="margin:0;font-size:22px;font-weight:400;color:#ffffff;letter-spacing:-0.01em;">${isFr ? 'Mise à jour de réservation' : 'Booking Update'}</h1>
        </td></tr>

        <tr><td style="padding:32px 40px;">
          <p style="margin:0 0 20px;font-size:15px;color:#e2e2e2;line-height:1.7;">${isFr ? `Bonjour ${name},` : `Hi ${name},`}</p>
          <p style="margin:0 0 20px;font-size:14px;color:#aaa;line-height:1.7;">${isFr ? `Merci de m'avoir contacté. Malheureusement, je ne suis pas disponible pour la date demandée${date ? ` (${date})` : ''} et je ne pourrai pas accepter cette réservation.` : `Thank you for reaching out. Unfortunately, I'm not available for your requested date${date ? ` (${date})` : ''} and won't be able to take on this booking.`}</p>
          <p style="margin:0 0 20px;font-size:14px;color:#aaa;line-height:1.7;">${isFr ? "J'apprécie votre intérêt et j'espère que nous pourrons collaborer à l'avenir. N'hésitez pas à me contacter pour de prochains événements." : "I appreciate your interest and hope we can work together in the future. Feel free to reach out for upcoming events."}</p>
          <p style="margin:0;font-size:14px;color:#aaa;line-height:1.7;">${isFr ? 'Cordialement,' : 'Best,'}<br><span style="color:#e2e2e2;">Adriano</span></p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`,
      });

      res.statusCode = 200;
      res.setHeader('Content-Type', 'text/html');
      res.end(page(
        'Booking Declined',
        '❌',
        'Booking Declined',
        `A decline notice has been sent to <span class="accent">${name}</span>. They've been informed you're unavailable for this date.`,
        '#f87171'
      ));

    } else {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'text/html');
      res.end(page('Unknown action', '⚠️', 'Unknown Action', 'The action parameter must be "accept" or "decline".', '#888'));
    }

  } catch (err) {
    console.error('Respond error:', err);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'text/html');
    res.end(page('Error', '⚠️', 'Something went wrong', err.message, '#888'));
  }
}
