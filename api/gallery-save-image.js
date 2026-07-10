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

  const { gallery_id, public_id, secure_url, width, height, original_filename, bytes } = req.body;
  if (!gallery_id || !public_id || !secure_url) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Get current image count for order_index
  const { count } = await supabase
    .from('images')
    .select('id', { count: 'exact', head: true })
    .eq('gallery_id', gallery_id);

  const { data: image, error } = await supabase
    .from('images')
    .insert({
      gallery_id,
      cloudinary_public_id: public_id,
      url: secure_url,
      filename: original_filename || public_id.split('/').pop(),
      width: width || null,
      height: height || null,
      filesize: bytes || null,
      order_index: count || 0,
    })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });

  // Set first uploaded image as cover automatically
  if ((count || 0) === 0) {
    await supabase
      .from('galleries')
      .update({ cover_url: secure_url })
      .eq('id', gallery_id);
  }

  return res.status(200).json({ image });
}
