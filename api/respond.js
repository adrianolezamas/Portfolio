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
        from: 'Adriano Lezama Photography <onboarding@resend.dev>',
        to:   email,
        reply_to: 'adrlezama@gmail.com',
        subject: `✅ Your Booking is Confirmed — ${pkg}`,
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
          <h1 style="margin:0;font-size:22px;font-weight:400;color:#ffffff;letter-spacing:-0.01em;">${isFr ? 'Réservation confirmée' : 'Booking Confirmed'}</h1>
        </td></tr>

        <tr><td style="padding:32px 40px 0;">
          <p style="margin:0 0 20px;font-size:15px;color:#e2e2e2;line-height:1.7;">${isFr ? `Bonjour ${name},` : `Hi ${name},`}</p>
          <p style="margin:0 0 20px;font-size:14px;color:#aaa;line-height:1.7;">${isFr ? 'Votre réservation a été confirmée. Voici un résumé de ce que vous avez réservé :' : "Your booking has been confirmed. Here's a summary of what you reserved:"}</p>
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
            <tr>
              <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.05);font-size:13px;color:#888;">${isFr ? 'Forfait' : 'Package'}</td>
              <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.05);font-size:13px;color:#e2e2e2;text-align:right;">${pkg}</td>
            </tr>
            ${date ? `<tr>
              <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.05);font-size:13px;color:#888;">${isFr ? 'Date' : 'Date'}</td>
              <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.05);font-size:13px;color:#e2e2e2;text-align:right;">${date}</td>
            </tr>` : ''}
            ${total ? `<tr>
              <td style="padding:14px 0 6px;font-size:14px;color:#ffffff;font-weight:500;">${isFr ? 'Total (taxes incl.)' : 'Total (taxes incl.)'}</td>
              <td style="padding:14px 0 6px;font-size:17px;color:#c8a96e;text-align:right;font-weight:500;">${total}</td>
            </tr>` : ''}
          </table>
          <p style="margin:0 0 12px;font-size:13px;color:#aaa;line-height:1.7;">${isFr ? 'Pour confirmer votre place, veuillez compléter votre paiement via le lien ci-dessous :' : 'To secure your spot, please complete your payment using the link below:'}</p>
        </td></tr>

        <tr><td style="padding:20px 40px 32px;text-align:center;">
          <a href="${payUrl}" style="display:inline-block;background:#c8a96e;color:#0a0a0a;font-size:13px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;text-decoration:none;padding:14px 36px;border-radius:6px;">${isFr ? 'Compléter le paiement →' : 'Complete Payment →'}</a>
        </td></tr>

        <tr><td style="padding:0 40px 32px;">
          <p style="margin:0;font-size:12px;color:#444;line-height:1.7;">${isFr ? "Des questions ? Répondez à cet email ou contactez-nous directement. Nous avons hâte de couvrir votre événement." : "Questions? Reply to this email or contact us directly. We're looking forward to shooting your event."}</p>
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
        from: 'Adriano Lezama Photography <onboarding@resend.dev>',
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
