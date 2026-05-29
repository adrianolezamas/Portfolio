import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { firstname, lastname, phone, email, subject, message, lang } = req.body;
  const name = [firstname, lastname].filter(Boolean).join(' ') || req.body.name;

  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const isFr = lang === 'fr';

  const notifSubject = subject
    ? `[Portfolio] ${subject}`
    : isFr
      ? `[Portfolio] Nouveau message de ${name}`
      : `[Portfolio] New message from ${name}`;

  const notifHtml = isFr ? `
    <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#222;">
      <h2 style="font-size:1.4rem;margin-bottom:4px;">Nouveau message de votre portfolio</h2>
      <hr style="border:none;border-top:1px solid #eee;margin:16px 0;">
      <p><strong>Nom :</strong> ${name}</p>
      <p><strong>Email :</strong> <a href="mailto:${email}">${email}</a></p>
      ${phone ? `<p><strong>Téléphone :</strong> ${phone}</p>` : ''}
      ${subject ? `<p><strong>Sujet :</strong> ${subject}</p>` : ''}
      <hr style="border:none;border-top:1px solid #eee;margin:16px 0;">
      <p style="white-space:pre-wrap;">${message}</p>
    </div>
  ` : `
    <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#222;">
      <h2 style="font-size:1.4rem;margin-bottom:4px;">New message from your portfolio</h2>
      <hr style="border:none;border-top:1px solid #eee;margin:16px 0;">
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
      ${phone ? `<p><strong>Phone:</strong> ${phone}</p>` : ''}
      ${subject ? `<p><strong>Subject:</strong> ${subject}</p>` : ''}
      <hr style="border:none;border-top:1px solid #eee;margin:16px 0;">
      <p style="white-space:pre-wrap;">${message}</p>
    </div>
  `;

  const replySubject = isFr
    ? `Merci pour votre message — Adriano Lezama Photography`
    : `Thank you for your message — Adriano Lezama Photography`;

  const replyHtml = isFr ? `
    <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#222;line-height:1.7;">
      <p>Bonjour ${firstname || name},</p>
      <p>Merci de m'avoir contacté ! J'ai bien reçu votre message et vous répondrai dans les <strong>24–48 heures</strong>.</p>
      <p>En attendant, n'hésitez pas à consulter mon travail sur <a href="https://adrianolezamas.com" style="color:#C4A84F;">adrianolezamas.com</a></p>
      <br>
      <p style="color:#555;font-size:0.9em;">— Adriano Lezama<br>Photographe sportif · Montréal</p>
    </div>
  ` : `
    <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#222;line-height:1.7;">
      <p>Hi ${firstname || name},</p>
      <p>Thank you for reaching out! I've received your message and will get back to you within <strong>24–48 hours</strong>.</p>
      <p>In the meantime, feel free to check out my work at <a href="https://adrianolezamas.com" style="color:#C4A84F;">adrianolezamas.com</a></p>
      <br>
      <p style="color:#555;font-size:0.9em;">— Adriano Lezama<br>Sports Photographer · Montréal</p>
    </div>
  `;

  try {
    await resend.emails.send({
      from: 'Adriano Lezama Photography <onboarding@resend.dev>',
      to: 'adrlezama@gmail.com',
      replyTo: email,
      subject: notifSubject,
      html: notifHtml,
    });

    await resend.emails.send({
      from: 'Adriano Lezama Photography <onboarding@resend.dev>',
      to: email,
      subject: replySubject,
      html: replyHtml,
    });

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Resend error:', err);
    return res.status(500).json({ error: 'Failed to send email' });
  }
}
