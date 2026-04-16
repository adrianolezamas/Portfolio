export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const secretKey = process.env.STRIPE_SECRET_KEY || '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';

  try {
    const { amountCents, pkg, name, email, date, lineItems, successUrl, cancelUrl } = req.body;

    if (!amountCents || amountCents < 50) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    // Build URLSearchParams for Stripe REST API
    const body = new URLSearchParams();

    body.append('mode', 'payment');
    body.append('currency', 'cad');
    if (email) body.append('customer_email', email);

    // Line items
    const items = Array.isArray(lineItems) && lineItems.length > 0
      ? lineItems
      : [{ description: pkg || 'Photography Package', amountCents }];

    items.forEach((item, i) => {
      const cents = Math.round(item.amountCents || 0);
      if (cents <= 0) return;
      body.append(`line_items[${i}][price_data][currency]`, 'cad');
      body.append(`line_items[${i}][price_data][unit_amount]`, String(cents));
      body.append(`line_items[${i}][price_data][product_data][name]`, item.description || 'Photography Service');
      body.append(`line_items[${i}][quantity]`, '1');
    });

    // Metadata
    body.append('metadata[client_name]',   name  || '');
    body.append('metadata[package]',       pkg   || '');
    body.append('metadata[booking_date]',  date  || '');

    // Return URLs
    const base = process.env.BASE_URL || 'https://adrianolezamas.com';
    const sUrl = successUrl || `${base}/pay-success.html?name=${encodeURIComponent(name || '')}&email=${encodeURIComponent(email || '')}&pkg=${encodeURIComponent(pkg || '')}&total=${encodeURIComponent(req.body.totalFormatted || '')}`;
    const cUrl = cancelUrl  || `${base}/pay.html`;

    body.append('success_url', sUrl);
    body.append('cancel_url',  cUrl);

    const r = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${secretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    });

    const data = await r.json();
    if (!r.ok) throw new Error(data.error?.message || 'Stripe checkout session error');

    return res.status(200).json({ url: data.url });

  } catch (err) {
    console.error('Stripe checkout error:', err);
    return res.status(500).json({ error: err.message });
  }
}
