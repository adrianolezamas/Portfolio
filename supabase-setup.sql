-- Run this entire file in Supabase → SQL Editor → New Query

-- Galleries table
create table if not exists galleries (
  id           uuid primary key default gen_random_uuid(),
  slug         text unique not null,
  name         text not null,
  event_date   date,
  password     text,          -- null = no password required
  client_email text,
  status       text not null default 'draft',  -- draft | published
  cover_url    text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- Images table
create table if not exists images (
  id                   uuid primary key default gen_random_uuid(),
  gallery_id           uuid not null references galleries(id) on delete cascade,
  cloudinary_public_id text not null,
  url                  text not null,
  filename             text,
  width                integer,
  height               integer,
  filesize             integer,
  order_index          integer not null default 0,
  created_at           timestamptz not null default now()
);

-- Indexes for fast lookups
create index if not exists idx_images_gallery_id on images(gallery_id);
create index if not exists idx_galleries_slug    on galleries(slug);

-- Disable RLS (auth is handled at the API layer with ADMIN_PASSWORD env var)
alter table galleries disable row level security;
alter table images    disable row level security;
