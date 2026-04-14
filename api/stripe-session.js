export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    return res.status(500).json({ error: 'Stripe not configured' });
  }

  try {
    const { amountCents, pkg, name, email, date, lineItems } = req.body;

    if (!amountCents || amountCents < 50) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    // Helper: POST to Stripe REST API
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

    // Helper: GET from Stripe REST API
    async function stripeGet(path) {
      const r = await fetch(`https://api.stripe.com/v1/${path}`, {
        headers: { 'Authorization': `Bearer ${secretKey}` },
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error?.message || `Stripe error on GET ${path}`);
      return data;
    }

    // 1. Create Stripe Customer with full client info
    const customer = await stripePost('customers', {
      email:                   email || '',
      name:                    name  || '',
      'metadata[package]':     pkg   || '',
      'metadata[booking_date]': date || '',
    });

    // 2. Add invoice line items
    const items = Array.isArray(lineItems) && lineItems.length > 0
      ? lineItems
      : [{ description: pkg || 'Photography Package', amountCents }];

    for (const item of items) {
      const cents = Math.round(item.amountCents || 0);
      if (cents > 0) {
        await stripePost('invoiceitems', {
          customer:    customer.id,
          amount:      cents,
          currency:    'cad',
          description: item.description || 'Photography Service',
        });
      }
    }

    // 3. Create the invoice
    const invoice = await stripePost('invoices', {
      customer:                                customer.id,
      collection_method:                       'charge_automatically',
      'payment_settings[payment_method_types][0]': 'card',
      description:                             `Photography session — ${pkg || 'Package'}${date ? ` · ${date}` : ''}`,
      'metadata[client_name]':                 name  || '',
      'metadata[package]':                     pkg   || '',
      'metadata[booking_date]':                date  || '',
    });

    // 4. Finalize the invoice — this creates the PaymentIntent
    const finalized = await stripePost(`invoices/${invoice.id}/finalize`, {});

    // 5. Fetch the PaymentIntent to get the client_secret
    const paymentIntentId = typeof finalized.payment_intent === 'string'
      ? finalized.payment_intent
      : finalized.payment_intent?.id;

    if (!paymentIntentId) {
      throw new Error('Invoice finalized but no PaymentIntent was created.');
    }

    const pi = await stripeGet(`payment_intents/${paymentIntentId}`);

    return res.status(200).json({
      clientSecret: pi.client_secret,
      invoiceId:    finalized.id,
    });

  } catch (err) {
    console.error('Stripe invoice error:', err);
    return res.status(500).json({ error: err.message });
  }
}
