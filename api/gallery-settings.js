import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

function isAdmin(req) {
  return (req.headers.authorization || '').replace('Bearer ', '') === process.env.ADMIN_PASSWORD;
}

export default async function handler(req, res) {
  if (req.method !== 'PATCH') return res.status(405).end();
  if (!isAdmin(req)) return res.status(401).json({ error: 'Unauthorized' });

  const { slug, name, event_date, password, client_email, cover_url } = req.body;
  if (!slug) return res.status(400).json({ error: 'slug required' });

  const updates = { updated_at: new Date().toISOString() };
  if (name !== undefined)         updates.name = name;
  if (event_date !== undefined)   updates.event_date = event_date || null;
  if (password !== undefined)     updates.password = password || null;
  if (client_email !== undefined) updates.client_email = client_email || null;
  if (cover_url !== undefined)    updates.cover_url = cover_url || null;

  const { error } = await supabase
    .from('galleries')
    .update(updates)
    .eq('slug', slug);

  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json({ ok: true });
}
