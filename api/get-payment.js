export default async function handler(req, res) {
  const secretKey = process.env.STRIPE_SECRET_KEY || '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';

  const piId = new URL(req.url, `https://${req.headers.host}`).searchParams.get('pi') || '';

  if (!piId.startsWith('pi_')) {
    return res.status(400).json({ error: 'Invalid payment ID' });
  }

  try {
    const r = await fetch(`https://api.stripe.com/v1/payment_intents/${piId}`, {
      headers: { 'Authorization': `Bearer ${secretKey}` },
    });
    const pi = await r.json();
    if (!r.ok) throw new Error(pi.error?.message || 'Could not load payment details');

    return res.status(200).json({
      clientSecret: pi.client_secret,
      amount:       pi.amount,
      currency:     pi.currency,
      metadata:     pi.metadata || {},
    });
  } catch (err) {
    console.error('get-payment error:', err);
    return res.status(500).json({ error: err.message });
  }
}
