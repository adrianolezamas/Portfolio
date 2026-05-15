import fs from 'fs';
import path from 'path';

const IMAGE_EXT = /\.(jpg|jpeg|png|webp|gif)$/i;

export default function handler(req, res) {
  const { album } = req.query;

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
