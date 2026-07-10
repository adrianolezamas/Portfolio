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

  const { galleryId } = req.query;
  if (!galleryId) return res.status(400).json({ error: 'galleryId required' });

  const { data: images, error } = await supabase
    .from('images')
    .select('*')
    .eq('gallery_id', galleryId)
    .order('order_index', { ascending: true });

  if (error) return res.status(500).json({ error: error.message });

  res.setHeader('Cache-Control', 'no-store');
  return res.status(200).json({ images: images || [] });
}
