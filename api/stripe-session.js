export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const secretKey = process.env.STRIPE_SECRET_KEY || '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';

  try {
    const { amountCents, pkg, name, email, date, lineItems } = req.body;

    if (!amountCents || amountCents < 50) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    async function stripePost(path, params) {
      const body = new URLSearchParams();
      for (const [k, v] of Object.entries(params)) {
        if (v !== undefined && v !== null && v !== '') body.append(k, String(v));
      }
      const r = await fetch(`https://api.stripe.com/v1/${path}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${secretKey}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body.toString(),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error?.message || `Stripe error on ${path}`);
      return data;
    }

    // Build description from line items
    const description = [pkg, date].filter(Boolean).join(' · ');

    // Create a PaymentIntent
    const pi = await stripePost('payment_intents', {
      amount:                              amountCents,
      currency:                            'cad',
      receipt_email:                       email || '',
      description:                         `Photography — ${description}`,
      'automatic_payment_methods[enabled]': 'true',
      'metadata[client_name]':             name  || '',
      'metadata[package]':                 pkg   || '',
      'metadata[booking_date]':            date  || '',
    });

    return res.status(200).json({ clientSecret: pi.client_secret });

  } catch (err) {
    console.error('Stripe PaymentIntent error:', err);
    return res.status(500).json({ error: err.message });
  }
}
