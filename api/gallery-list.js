import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

function isAdmin(req) {
  return (req.headers.authorization || '').replace('Bearer ', '') === process.env.ADMIN_PASSWORD;
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();
  if (!isAdmin(req)) return res.status(401).json({ error: 'Unauthorized' });

  const { data: galleries, error } = await supabase
    .from('galleries')
    .select('id, slug, name, event_date, status, cover_url, client_email, password, created_at')
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });

  // Count images per gallery
  const ids = (galleries || []).map(g => g.id);
  const { data: counts } = await supabase
    .from('images')
    .select('gallery_id')
    .in('gallery_id', ids);

  const countMap = {};
  (counts || []).forEach(r => {
    countMap[r.gallery_id] = (countMap[r.gallery_id] || 0) + 1;
  });

  const result = (galleries || []).map(g => ({
    ...g,
    photo_count: countMap[g.id] || 0,
  }));

  res.setHeader('Cache-Control', 'no-store');
  return res.status(200).json({ galleries: result });
}
