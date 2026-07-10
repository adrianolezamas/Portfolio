import { createClient } from '@supabase/supabase-js';
import { createHash } from 'crypto';

const CLOUD = process.env.CLOUDINARY_CLOUD_NAME;
const API_KEY = process.env.CLOUDINARY_API_KEY;
const API_SECRET = process.env.CLOUDINARY_API_SECRET;

function isAdmin(req) {
  return (req.headers.authorization || '').replace('Bearer ', '') === process.env.ADMIN_PASSWORD;
}

function slugify(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 50) + '-' + Date.now().toString(36);
}

export default async function handler(req, res) {
  if (!isAdmin(req)) return res.status(401).json({ error: 'Unauthorized' });

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
  const { action } = req.query;
  const method = req.method;

  res.setHeader('Cache-Control', 'no-store');

  // ── List galleries ────────────────────────────────────────────────────────
  if (action === 'list' && method === 'GET') {
    const { data: galleries, error } = await supabase
      .from('galleries')
      .select('id, slug, name, event_date, status, cover_url, password, client_email')
      .order('created_at', { ascending: false });

    if (error) return res.status(500).json({ error: error.message });

    const { data: counts } = await supabase.from('images').select('gallery_id');
    const countMap = {};
    (counts || []).forEach(r => { countMap[r.gallery_id] = (countMap[r.gallery_id] || 0) + 1; });

    return res.status(200).json({
      galleries: (galleries || []).map(g => ({ ...g, photo_count: countMap[g.id] || 0 })),
    });
  }

  // ── Create gallery ────────────────────────────────────────────────────────
  if (action === 'create' && method === 'POST') {
    const { name, event_date, password, client_email } = req.body;
    if (!name) return res.status(400).json({ error: 'name required' });

    const slug = slugify(name);
    const { data: gallery, error } = await supabase
      .from('galleries')
      .insert({ slug, name, event_date: event_date || null, password: password || null, client_email: client_email || null })
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json({ gallery });
  }

  // ── Get images for gallery (admin — works for draft too) ──────────────────
  if (action === 'images' && method === 'GET') {
    const { galleryId } = req.query;
    if (!galleryId) return res.status(400).json({ error: 'galleryId required' });

    const { data: images, error } = await supabase
      .from('images')
      .select('*')
      .eq('gallery_id', galleryId)
      .order('order_index', { ascending: true });

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ images: images || [] });
  }

  // ── Get Cloudinary upload signature ───────────────────────────────────────
  if (action === 'sign' && method === 'GET') {
    const { galleryId } = req.query;
    if (!galleryId) return res.status(400).json({ error: 'galleryId required' });

    const timestamp = Math.floor(Date.now() / 1000);
    const folder = `galleries/${galleryId}`;
    const signature = createHash('sha1').update(`folder=${folder}&timestamp=${timestamp}${API_SECRET}`).digest('hex');

    return res.status(200).json({ signature, timestamp, folder, api_key: API_KEY, cloud_name: CLOUD });
  }

  // ── Save image metadata ───────────────────────────────────────────────────
  if (action === 'save' && method === 'POST') {
    const { gallery_id, public_id, secure_url, width, height, original_filename, bytes } = req.body;
    if (!gallery_id || !public_id || !secure_url) {
      return res.status(400).json({ error: 'gallery_id, public_id, secure_url required' });
    }

    const { data: existing } = await supabase
      .from('images')
      .select('order_index')
      .eq('gallery_id', gallery_id)
      .order('order_index', { ascending: false })
      .limit(1);

    const order_index = existing?.length ? existing[0].order_index + 1 : 0;

    const { data: image, error } = await supabase
      .from('images')
      .insert({ gallery_id, cloudinary_public_id: public_id, url: secure_url, filename: original_filename, width, height, filesize: bytes, order_index })
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });

    // Auto-set cover if first image
    if (order_index === 0) {
      await supabase.from('galleries').update({ cover_url: secure_url }).eq('id', gallery_id);
    }

    return res.status(201).json({ image });
  }

  // ── Toggle publish status ─────────────────────────────────────────────────
  if (action === 'publish' && method === 'POST') {
    const { slug, status } = req.body;
    if (!slug || !['draft', 'published'].includes(status)) {
      return res.status(400).json({ error: 'slug and status required' });
    }

    const { error } = await supabase
      .from('galleries')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('slug', slug);

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ ok: true });
  }

  // ── Update gallery settings ───────────────────────────────────────────────
  if (action === 'settings' && (method === 'PATCH' || method === 'POST')) {
    const { slug, name, event_date, password, client_email, cover_url } = req.body;
    if (!slug) return res.status(400).json({ error: 'slug required' });

    const updates = { updated_at: new Date().toISOString() };
    if (name !== undefined) updates.name = name;
    if (event_date !== undefined) updates.event_date = event_date;
    if (password !== undefined) updates.password = password;
    if (client_email !== undefined) updates.client_email = client_email;
    if (cover_url !== undefined) updates.cover_url = cover_url;

    const { error } = await supabase.from('galleries').update(updates).eq('slug', slug);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ ok: true });
  }

  // ── Delete entire gallery ─────────────────────────────────────────────────
  if (action === 'gallery' && method === 'DELETE') {
    const { slug } = req.query;
    if (!slug) return res.status(400).json({ error: 'slug required' });

    const { data: gallery } = await supabase.from('galleries').select('id').eq('slug', slug).single();
    if (!gallery) return res.status(404).json({ error: 'Gallery not found' });

    // Delete all Cloudinary assets in folder
    const timestamp = Math.floor(Date.now() / 1000);
    const prefix = `galleries/${gallery.id}`;
    const sig = createHash('sha1').update(`invalidate=true&prefix=${prefix}&timestamp=${timestamp}${API_SECRET}`).digest('hex');

    await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD}/resources/image/upload?prefix=${encodeURIComponent(prefix)}&invalidate=true&timestamp=${timestamp}&api_key=${API_KEY}&signature=${sig}`,
      { method: 'DELETE' }
    ).catch(() => {});

    const { error } = await supabase.from('galleries').delete().eq('id', gallery.id);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ ok: true });
  }

  // ── Delete single image ───────────────────────────────────────────────────
  if (action === 'image' && method === 'DELETE') {
    const { imageId } = req.query;
    if (!imageId) return res.status(400).json({ error: 'imageId required' });

    const { data: image } = await supabase
      .from('images')
      .select('cloudinary_public_id, gallery_id, url')
      .eq('id', imageId)
      .single();

    if (!image) return res.status(404).json({ error: 'Image not found' });

    // Delete from Cloudinary
    const timestamp = Math.floor(Date.now() / 1000);
    const sig = createHash('sha1').update(`public_id=${image.cloudinary_public_id}&timestamp=${timestamp}${API_SECRET}`).digest('hex');

    await fetch(`https://api.cloudinary.com/v1_1/${CLOUD}/image/destroy`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ public_id: image.cloudinary_public_id, timestamp, api_key: API_KEY, signature: sig }),
    }).catch(() => {});

    const { error } = await supabase.from('images').delete().eq('id', imageId);
    if (error) return res.status(500).json({ error: error.message });

    // If deleted image was cover, reassign to next image
    const { data: gallery } = await supabase.from('galleries').select('cover_url').eq('id', image.gallery_id).single();
    if (gallery?.cover_url === image.url) {
      const { data: next } = await supabase
        .from('images')
        .select('url')
        .eq('gallery_id', image.gallery_id)
        .order('order_index', { ascending: true })
        .limit(1);
      await supabase.from('galleries').update({ cover_url: next?.[0]?.url || null }).eq('id', image.gallery_id);
    }

    return res.status(200).json({ ok: true });
  }

  return res.status(400).json({ error: 'Unknown action' });
}
