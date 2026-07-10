import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

function isAdmin(req) {
  return (req.headers.authorization || '').replace('Bearer ', '') === process.env.ADMIN_PASSWORD;
}

function slugify(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50) + '-' + Date.now().toString(36);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  if (!isAdmin(req)) return res.status(401).json({ error: 'Unauthorized' });

  const { name, event_date, password, client_email } = req.body;
  if (!name) return res.status(400).json({ error: 'Name required' });

  const slug = slugify(name);

  const { data, error } = await supabase
    .from('galleries')
    .insert({
      name,
      slug,
      event_date: event_date || null,
      password: password || null,
      client_email: client_email || null,
      status: 'draft',
    })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json({ gallery: data });
}
