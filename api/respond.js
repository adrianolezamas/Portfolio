import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const BASE_URL   = process.env.BASE_URL   || 'https://adriano-lezama.vercel.app';
const STRIPE_KEY = process.env.STRIPE_SECRET_KEY || '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';

async function createPaymentIntent(params) {
  const body = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') body.append(k, String(v));
  }
  const r = await fetch('https://api.stripe.com/v1/payment_intents', {
    method:  'POST',
    headers: { 'Authorization': `Bearer ${STRIPE_KEY}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body:    body.toString(),
  });
  const data = await r.json();
  if (!r.ok) throw new Error(data.error?.message || 'Stripe error');
  return data;
}

function toCents(str) {
  if (!str) return 0;
  return Math.round(parseFloat(str.replace(/[^0-9.]/g, '')) * 100) || 0;
}

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

  // Create Stripe PaymentIntent up-front; email links to pay.html?pi=<id>
  let payUrl = `${BASE_URL}/pay.html`; // fallback (no params)
  let piError = null;
  try {
    const amountCents = toCents(total);
    if (amountCents >= 50) {
      const pi = await createPaymentIntent({
        amount:                               amountCents,
        currency:                             'cad',
        receipt_email:                        email,
        description:                          `Photography — ${pkg}${date ? ` · ${date}` : ''}`,
        'automatic_payment_methods[enabled]': 'true',
        'metadata[client_name]':              name,
        'metadata[client_email]':             email,
        'metadata[package]':                  pkg,
        'metadata[date]':                     date,
        'metadata[addons]':                   addons,
        'metadata[travel]':                   travel,
        'metadata[gst]':                      gst,
        'metadata[qst]':                      qst,
        'metadata[total]':                    total,
        'metadata[lang]':                     lang,
      });
      payUrl = `${BASE_URL}/pay.html?pi=${pi.id}`;
    } else {
      piError = `Amount too low to charge (parsed ${toCents(total)} cents from "${total}"). Check the total value being passed.`;
    }
  } catch (e) {
    piError = e.message;
    console.error('PI creation failed:', e.message);
  }

  if (!action || !email || !name) {
    res.statusCode = 400;
    res.end(page('Error', '⚠️', 'Missing parameters', 'This link is missing required information.', '#888'));
    return;
  }

  try {
    if (action === 'accept') {
      await resend.emails.send({
        from:     'Adriano Lezama Photography <noreply@adrianolezamas.com>',
        to:       email,
        reply_to: 'adrlezama@gmail.com',
        subject:  isFr ? `Réservation confirmée — complétez votre paiement` : `Booking Confirmed — Complete Your Payment`,
        html: `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#111111;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#111111;padding:48px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">

        <!-- Card -->
        <tr><td style="background:#1a1a1a;border-radius:12px;overflow:hidden;border:1px solid rgba(255,255,255,0.08);">

          <!-- Header -->
          <tr><td style="padding:36px 44px 28px;border-bottom:1px solid rgba(255,255,255,0.07);">
            <p style="margin:0 0 10px;font-size:10px;letter-spacing:0.26em;text-transform:uppercase;color:#c8a96e;">${isFr ? 'Adriano Lezama Photographie' : 'Adriano Lezama Photography'}</p>
            <h1 style="margin:0;font-size:26px;font-weight:600;color:#ffffff;letter-spacing:-0.01em;line-height:1.2;">${isFr ? 'Réservation confirmée' : 'Booking Confirmed'}</h1>
          </td></tr>

          <!-- Body -->
          <tr><td style="padding:28px 44px 0;">
            <p style="margin:0 0 6px;font-size:15px;color:#e2e2e2;">${isFr ? `Bonjour ${name},` : `Hi ${name},`}</p>
            <p style="margin:0 0 28px;font-size:14px;color:#888;line-height:1.7;">${isFr
              ? `Votre réservation est confirmée. Voici un résumé de ce que vous avez réservé :`
              : `Your booking has been confirmed. Here's a summary of what you reserved:`
            }</p>

            <!-- Summary rows -->
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="font-size:13px;color:#777;padding:11px 0;border-bottom:1px solid rgba(255,255,255,0.06);">${isFr ? 'Forfait' : 'Package'}</td>
                <td style="font-size:13px;color:#e2e2e2;text-align:right;padding:11px 0;border-bottom:1px solid rgba(255,255,255,0.06);">${pkg}</td>
              </tr>
              ${date ? `<tr>
                <td style="font-size:13px;color:#777;padding:11px 0;border-bottom:1px solid rgba(255,255,255,0.06);">Date</td>
                <td style="font-size:13px;color:#e2e2e2;text-align:right;padding:11px 0;border-bottom:1px solid rgba(255,255,255,0.06);">${date}</td>
              </tr>` : ''}
              ${addons ? `<tr>
                <td style="font-size:13px;color:#777;padding:11px 0;border-bottom:1px solid rgba(255,255,255,0.06);">${isFr ? 'Suppléments' : 'Add-ons'}</td>
                <td style="font-size:13px;color:#e2e2e2;text-align:right;padding:11px 0;border-bottom:1px solid rgba(255,255,255,0.06);">${addons}</td>
              </tr>` : ''}
              ${travel ? `<tr>
                <td style="font-size:13px;color:#777;padding:11px 0;border-bottom:1px solid rgba(255,255,255,0.06);">${isFr ? 'Déplacement' : 'Travel'}</td>
                <td style="font-size:13px;color:#e2e2e2;text-align:right;padding:11px 0;border-bottom:1px solid rgba(255,255,255,0.06);">${travel}</td>
              </tr>` : ''}
              ${total ? `<tr>
                <td style="font-size:14px;color:#ffffff;font-weight:600;padding:16px 0 4px;">${isFr ? 'Total (taxes incl.)' : 'Total (taxes incl.)'}</td>
                <td style="font-size:22px;color:#c8a96e;font-weight:600;text-align:right;padding:16px 0 4px;">${total}</td>
              </tr>` : ''}
            </table>
          </td></tr>

          <!-- CTA -->
          <tr><td style="padding:28px 44px 36px;">
            <p style="margin:0 0 20px;font-size:14px;color:#888;line-height:1.7;">${isFr
              ? `Pour sécuriser votre date, complétez votre paiement en cliquant sur le bouton ci-dessous :`
              : `To secure your spot, please complete your payment using the link below:`
            }</p>
            <table cellpadding="0" cellspacing="0"><tr>
              <td>
                <a href="${payUrl}" target="_blank" style="display:inline-block;background:#c8a96e;color:#0a0a0a;font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;text-decoration:none;padding:13px 28px;border-radius:6px;">${isFr ? '&#8594; Compléter le paiement' : 'Complete Payment &#8594;'}</a>
              </td>
            </tr></table>
            <p style="margin:16px 0 0;font-size:11px;color:#444;line-height:1.7;word-break:break-all;">${isFr ? 'Lien direct :' : 'Or copy this link:'} <a href="${payUrl}" style="color:#c8a96e;text-decoration:underline;">${payUrl}</a></p>
            <p style="margin:20px 0 0;font-size:12px;color:#555;line-height:1.7;">${isFr
              ? `Des questions ? Répondez à cet email ou contactez-nous directement. Nous avons hâte de capturer votre événement.`
              : `Questions? Reply to this email or contact us directly. We're looking forward to shooting your event.`
            }</p>
          </td></tr>

        </td></tr>

        <!-- Footer -->
        <tr><td style="padding:20px 0 0;text-align:center;">
          <p style="margin:0;font-size:10px;color:#333;letter-spacing:0.08em;text-transform:uppercase;">© 2026 &nbsp;·&nbsp; Adriano Lezama Photography</p>
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
        piError ? 'Email Sent — Payment Link Failed' : 'Booking Accepted',
        piError ? '⚠️' : '✅',
        piError ? 'Email Sent — But Payment Link Failed' : 'Booking Accepted',
        piError
          ? `The confirmation email was sent to <span class="accent">${name}</span>, but the Stripe payment link could not be created.<br><br><strong style="color:#f87171;font-size:12px;">Stripe error: ${piError}</strong><br><br><span style="font-size:12px;color:#666;">Fix: Check that your <code>STRIPE_SECRET_KEY</code> in Vercel has <strong>Payment Intents: Write</strong> permission, then re-accept the booking.</span>`
          : `A payment email has been sent to <span class="accent">${name}</span> for <span class="accent">${pkg}</span>${total ? ` — ${total}` : ''}. They'll receive instructions to complete their payment.`,
        piError ? '#f87171' : '#4ade80'
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
