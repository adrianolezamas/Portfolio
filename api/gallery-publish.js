import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

function isAdmin(req) {
  return (req.headers.authorization || '').replace('Bearer ', '') === process.env.ADMIN_PASSWORD;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  if (!isAdmin(req)) return res.status(401).json({ error: 'Unauthorized' });

  const { slug, status } = req.body;
  if (!slug || !['draft', 'published'].includes(status)) {
    return res.status(400).json({ error: 'slug and valid status required' });
  }

  const { error } = await supabase
    .from('galleries')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('slug', slug);

  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json({ ok: true, status });
}
