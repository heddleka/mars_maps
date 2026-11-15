create table if not exists public.zone_content (
  zone_id text primary key check (zone_id in ('gale', 'jezero')),
  waypoints jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.zone_content enable row level security;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'mars-map-photos',
  'mars-map-photos',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
