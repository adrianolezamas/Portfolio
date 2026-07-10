import { createHash } from 'crypto';

function isAdmin(req) {
  return (req.headers.authorization || '').replace('Bearer ', '') === process.env.ADMIN_PASSWORD;
}

export default function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();
  if (!isAdmin(req)) return res.status(401).json({ error: 'Unauthorized' });

  const { galleryId } = req.query;
  if (!galleryId) return res.status(400).json({ error: 'galleryId required' });

  const timestamp = Math.round(Date.now() / 1000);
  const folder = `galleries/${galleryId}`;

  // Signature covers all params sent with the upload (alphabetical order)
  const paramStr = `folder=${folder}&timestamp=${timestamp}`;
  const signature = createHash('sha1')
    .update(paramStr + process.env.CLOUDINARY_API_SECRET)
    .digest('hex');

  return res.status(200).json({
    signature,
    timestamp,
    folder,
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
  });
}
