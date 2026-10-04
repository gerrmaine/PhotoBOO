-- Photobooth schema for Supabase (Postgres).
-- Paste this into Supabase → SQL Editor → Run once.

create table if not exists themes (
  id                  text primary key,
  slug                text not null unique,
  name                text not null,
  tagline             text not null default '',
  frame_asset_url     text not null,
  thumb_url           text not null,
  default_frame_color text not null default '#FFFFFF',
  accent_color        text not null default '#4A90D9',
  is_active           boolean not null default true,
  sort_order          integer not null default 0,
  created_at          timestamptz not null default now()
);

create table if not exists characters (
  id          text primary key,
  theme_id    text not null references themes(id) on delete cascade,
  slug        text not null,
  name        text not null,
  art_url     text not null,
  face_anchor jsonb not null,
  sort_order  integer not null default 0,
  unique (theme_id, slug)
);

create table if not exists stickers (
  id         text primary key,
  theme_id   text references themes(id) on delete cascade,
  slug       text not null,
  name       text not null,
  mood       text not null default '',
  asset_url  text not null,
  sort_order integer not null default 0
);

create unique index if not exists idx_stickers_theme_slug
  on stickers (theme_id, slug) where theme_id is not null;
create unique index if not exists idx_stickers_global_slug
  on stickers (slug) where theme_id is null;

create table if not exists worlds (
  id           text primary key,
  join_code    text not null unique,
  name         text not null,
  theme_id     text references themes(id) on delete set null,
  revision     integer not null default 1,
  member_limit integer not null default 20,
  created_at   timestamptz not null default now()
);

create index if not exists idx_worlds_join_code on worlds (join_code);

create table if not exists members (
  id                  text primary key,
  world_id            text not null references worlds(id) on delete cascade,
  display_name        text not null,
  member_token        text not null,
  is_host             boolean not null default false,
  character_id        text references characters(id) on delete set null,
  character_image_url text,
  face_image_url      text,
  face_crop           jsonb,
  joined_at           timestamptz not null default now(),
  last_seen_at        timestamptz not null default now(),
  unique (world_id, display_name)
);

create index if not exists idx_members_world on members (world_id);
create unique index if not exists idx_members_token on members (member_token);
create unique index if not exists idx_one_host_per_world on members (world_id) where is_host = true;

create table if not exists photo_strips (
  id           text primary key,
  share_slug   text not null unique,
  theme_id     text not null references themes(id) on delete restrict,
  world_id     text references worlds(id) on delete set null,
  member_id    text references members(id) on delete set null,
  author_name  text,
  image_url    text not null,
  frames_data  jsonb not null default '[]',
  frame_color  text not null default '#FFFFFF',
  sticker_data jsonb not null default '[]',
  drawing_data jsonb not null default '[]',
  edit_token   text,
  updated_at   timestamptz,
  width        integer not null,
  height       integer not null,
  byte_size    integer not null,
  created_at   timestamptz not null default now()
);

create index if not exists idx_strips_slug on photo_strips (share_slug);
create index if not exists idx_strips_world on photo_strips (world_id, created_at desc);

-- The API uses the service role key, which bypasses RLS. Lock the tables
-- anyway so the public anon key cannot read or write them directly.
alter table themes enable row level security;
alter table characters enable row level security;
alter table stickers enable row level security;
alter table worlds enable row level security;
alter table members enable row level security;
alter table photo_strips enable row level security;

-- Public bucket for strips, frames, faces and character composites.
-- The API uses the service role, which bypasses Storage RLS on write.
insert into storage.buckets (id, name, public)
values ('photobooth', 'photobooth', true)
on conflict (id) do update set public = true;

drop policy if exists "photobooth_public_read" on storage.objects;
create policy "photobooth_public_read"
  on storage.objects for select
  to public
  using (bucket_id = 'photobooth');
