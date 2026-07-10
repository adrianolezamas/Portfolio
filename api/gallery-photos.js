import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const IMAGE_EXT = /\.(jpg|jpeg|png|webp|gif)$/i;
const CLOUD = process.env.CLOUDINARY_CLOUD_NAME;

function cloudUrl(publicId, transforms = '') {
  const t = transforms ? transforms + '/' : '';
  return `https://res.cloudinary.com/${CLOUD}/image/upload/${t}${publicId}`;
}

export default async function handler(req, res) {
  const { slug, album, pw } = req.query;

  // ── New Supabase-backed system (slug-based) ───────────────────────────────
  if (slug && process.env.SUPABASE_URL) {
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

    const { data: gallery } = await supabase
      .from('galleries')
      .select('id, name, event_date, status, password, cover_url')
      .eq('slug', slug)
      .single();

    if (!gallery || gallery.status !== 'published') {
      return res.status(404).json({ error: 'Gallery not found', photos: [], count: 0 });
    }

    const hasPw = !!gallery.password;

    // Password-protected: return meta only if no password supplied
    if (hasPw && !pw) {
      return res.status(200).json({
        meta: { name: gallery.name, event_date: gallery.event_date, has_password: true },
        photos: [],
        count: 0,
      });
    }

    if (hasPw && pw !== gallery.password) {
      return res.status(401).json({ error: 'Wrong password' });
    }

    const { data: images } = await supabase
      .from('images')
      .select('*')
      .eq('gallery_id', gallery.id)
      .order('order_index', { ascending: true });

    const photos = (images || []).map(img => ({
      id: img.id,
      src: cloudUrl(img.cloudinary_public_id, 'f_auto,q_auto,w_1400'),
      thumb: cloudUrl(img.cloudinary_public_id, 'f_auto,q_auto,w_600'),
      full: cloudUrl(img.cloudinary_public_id, 'f_auto,q_best'),
      filename: img.filename,
      width: img.width,
      height: img.height,
    }));

    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json({
      meta: {
        name: gallery.name,
        event_date: gallery.event_date,
        has_password: hasPw,
        cover_url: gallery.cover_url,
      },
      photos,
      count: photos.length,
    });
  }

  // ── Legacy filesystem system (album-based, unchanged) ─────────────────────
  if (album && !/^[a-zA-Z0-9_-]+$/.test(album)) {
    return res.status(400).json({ error: 'Invalid album name' });
  }

  const dir = album
    ? path.join(process.cwd(), 'photos', album)
    : path.join(process.cwd(), 'photos');

  try {
    const files = fs.readdirSync(dir)
      .filter(f => IMAGE_EXT.test(f) && !f.startsWith('.'))
      .sort();

    const photos = files.map(f => ({
      src: album ? `photos/${album}/${f}` : `photos/${f}`,
      filename: f,
    }));

    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json({ photos, album: album || null, count: photos.length });
  } catch {
    return res.status(404).json({ error: 'Album not found', photos: [], count: 0 });
  }
}
