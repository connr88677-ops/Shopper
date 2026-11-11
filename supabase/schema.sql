-- Fitstify database setup. Run this entire file in Supabase SQL Editor.
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null check (char_length(username) between 3 and 24 and username ~ '^[a-zA-Z0-9_]+$'),
  display_name text,
  bio text not null default '',
  avatar_url text,
  created_at timestamptz not null default now()
);
create table if not exists public.catalogs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 70),
  description text not null default '',
  cover_url text,
  visibility text not null default 'public' check (visibility in ('public','unlisted','private')),
  tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.catalog_items (
  id uuid primary key default gen_random_uuid(),
  catalog_id uuid not null references public.catalogs(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 100),
  brand text not null default '',
  product_url text,
  image_url text,
  created_at timestamptz not null default now()
);
create table if not exists public.catalog_likes (
  user_id uuid not null references auth.users(id) on delete cascade,
  catalog_id uuid not null references public.catalogs(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key(user_id,catalog_id)
);
create table if not exists public.catalog_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references auth.users(id) on delete cascade,
  catalog_id uuid not null references public.catalogs(id) on delete cascade,
  reason text not null check (char_length(reason) between 5 and 500),
  created_at timestamptz not null default now(),
  unique(reporter_id,catalog_id)
);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
declare chosen text;
begin
  chosen := coalesce(nullif(new.raw_user_meta_data->>'username',''), 'user_' || substr(new.id::text,1,8));
  insert into public.profiles(id,username,display_name)
  values(new.id,chosen,coalesce(new.raw_user_meta_data->>'display_name',''))
  on conflict (id) do nothing;
  return new;
end;
$$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute procedure public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.catalogs enable row level security;
alter table public.catalog_items enable row level security;
alter table public.catalog_likes enable row level security;
alter table public.catalog_reports enable row level security;

create policy "Profiles are publicly readable" on public.profiles for select using (true);
create policy "Users update own profile" on public.profiles for update using (auth.uid()=id) with check (auth.uid()=id);
create policy "Profiles insert by owner" on public.profiles for insert with check (auth.uid()=id);

create policy "Public and unlisted catalogs readable; private owner only" on public.catalogs for select
using (visibility in ('public','unlisted') or user_id=auth.uid());
create policy "Owners create catalogs" on public.catalogs for insert with check (user_id=auth.uid());
create policy "Owners update catalogs" on public.catalogs for update using (user_id=auth.uid()) with check (user_id=auth.uid());
create policy "Owners delete catalogs" on public.catalogs for delete using (user_id=auth.uid());

create policy "Items readable when parent catalog is readable" on public.catalog_items for select
using (exists(select 1 from public.catalogs c where c.id=catalog_id and (c.visibility in ('public','unlisted') or c.user_id=auth.uid())));
create policy "Owners add items" on public.catalog_items for insert
with check (exists(select 1 from public.catalogs c where c.id=catalog_id and c.user_id=auth.uid()));
create policy "Owners update items" on public.catalog_items for update
using (exists(select 1 from public.catalogs c where c.id=catalog_id and c.user_id=auth.uid()))
with check (exists(select 1 from public.catalogs c where c.id=catalog_id and c.user_id=auth.uid()));
create policy "Owners delete items" on public.catalog_items for delete
using (exists(select 1 from public.catalogs c where c.id=catalog_id and c.user_id=auth.uid()));

create policy "Likes are readable" on public.catalog_likes for select using (true);
create policy "Users like as themselves" on public.catalog_likes for insert with check (user_id=auth.uid());
create policy "Users remove own likes" on public.catalog_likes for delete using (user_id=auth.uid());
create policy "Users report as themselves" on public.catalog_reports for insert with check (reporter_id=auth.uid());

-- Public bucket for catalog imagery. Never put private user documents here.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('catalog-images','catalog-images',true,5242880,array['image/jpeg','image/png','image/webp','image/avif'])
on conflict(id) do nothing;
create policy "Catalog images are public" on storage.objects for select using (bucket_id='catalog-images');
create policy "Authenticated users upload their own images" on storage.objects for insert
with check (bucket_id='catalog-images' and auth.uid() is not null and (storage.foldername(name))[1]=auth.uid()::text);
create policy "Users update their own images" on storage.objects for update
using (bucket_id='catalog-images' and (storage.foldername(name))[1]=auth.uid()::text)
with check (bucket_id='catalog-images' and (storage.foldername(name))[1]=auth.uid()::text);
create policy "Users delete their own images" on storage.objects for delete
using (bucket_id='catalog-images' and (storage.foldername(name))[1]=auth.uid()::text);

create index if not exists catalogs_visibility_created_idx on public.catalogs(visibility,created_at desc);
create index if not exists catalogs_user_created_idx on public.catalogs(user_id,created_at desc);
create index if not exists catalog_items_catalog_idx on public.catalog_items(catalog_id);
create index if not exists catalog_likes_catalog_idx on public.catalog_likes(catalog_id);