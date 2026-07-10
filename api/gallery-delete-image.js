import { createClient } from '@supabase/supabase-js';
import { createHash } from 'crypto';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

function isAdmin(req) {
  return (req.headers.authorization || '').replace('Bearer ', '') === process.env.ADMIN_PASSWORD;
}

async function destroyCloudinary(publicId) {
  const CLOUD = process.env.CLOUDINARY_CLOUD_NAME;
  const API_KEY = process.env.CLOUDINARY_API_KEY;
  const API_SECRET = process.env.CLOUDINARY_API_SECRET;
  const timestamp = Math.round(Date.now() / 1000);
  const signature = createHash('sha1')
    .update(`public_id=${publicId}&timestamp=${timestamp}${API_SECRET}`)
    .digest('hex');
  const body = new URLSearchParams({ public_id: publicId, signature, api_key: API_KEY, timestamp });
  await fetch(`https://api.cloudinary.com/v1_1/${CLOUD}/image/destroy`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });
}

export default async function handler(req, res) {
  if (req.method !== 'DELETE') return res.status(405).end();
  if (!isAdmin(req)) return res.status(401).json({ error: 'Unauthorized' });

  const { imageId } = req.query;
  if (!imageId) return res.status(400).json({ error: 'imageId required' });

  const { data: image } = await supabase
    .from('images')
    .select('cloudinary_public_id, gallery_id, url')
    .eq('id', imageId)
    .single();

  if (!image) return res.status(404).json({ error: 'Image not found' });

  // Delete from Cloudinary (fire-and-forget on error)
  await destroyCloudinary(image.cloudinary_public_id).catch(() => {});

  const { error } = await supabase.from('images').delete().eq('id', imageId);
  if (error) return res.status(500).json({ error: error.message });

  // If this was the cover, update gallery cover to next image
  const { data: gallery } = await supabase
    .from('galleries')
    .select('cover_url')
    .eq('id', image.gallery_id)
    .single();

  if (gallery?.cover_url === image.url) {
    const { data: next } = await supabase
      .from('images')
      .select('url')
      .eq('gallery_id', image.gallery_id)
      .order('order_index', { ascending: true })
      .limit(1)
      .single();
    await supabase
      .from('galleries')
      .update({ cover_url: next?.url || null })
      .eq('id', image.gallery_id);
  }

  return res.status(200).json({ ok: true });
}
