create type public.app_role as enum ('admin');
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;
create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;
create policy "Users read own roles" on public.user_roles for select to authenticated using (user_id = auth.uid());

-- First account created becomes the administrator
create or replace function public.handle_first_admin()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from public.user_roles where role = 'admin') then
    insert into public.user_roles (user_id, role) values (new.id, 'admin');
  end if;
  return new;
end; $$;
create trigger on_auth_user_created_first_admin after insert on auth.users
for each row execute function public.handle_first_admin();

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  full_name text not null check (char_length(full_name) between 1 and 100),
  relationship text check (relationship is null or char_length(relationship) <= 40),
  message text not null check (char_length(message) between 1 and 2000),
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  created_at timestamptz not null default now()
);
grant insert on public.messages to anon, authenticated;
grant select on public.messages to anon;
grant select, update, delete on public.messages to authenticated;
grant all on public.messages to service_role;
alter table public.messages enable row level security;
create policy "Anyone can submit pending messages" on public.messages for insert to anon, authenticated
  with check (status = 'pending');
create policy "Public reads approved messages" on public.messages for select to anon, authenticated
  using (status = 'approved');
create policy "Admins read all messages" on public.messages for select to authenticated
  using (public.has_role(auth.uid(), 'admin'));
create policy "Admins update messages" on public.messages for update to authenticated
  using (public.has_role(auth.uid(), 'admin'));
create policy "Admins delete messages" on public.messages for delete to authenticated
  using (public.has_role(auth.uid(), 'admin'));

create table public.gallery (
  id uuid primary key default gen_random_uuid(),
  image_url text not null,
  storage_path text,
  caption text,
  display_order integer not null default 0,
  is_featured boolean not null default false,
  created_at timestamptz not null default now()
);
grant select on public.gallery to anon;
grant select, insert, update, delete on public.gallery to authenticated;
grant all on public.gallery to service_role;
alter table public.gallery enable row level security;
create policy "Public reads gallery" on public.gallery for select to anon, authenticated using (true);
create policy "Admins manage gallery" on public.gallery for all to authenticated
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

create table public.event_settings (
  id integer primary key default 1 check (id = 1),
  content jsonb not null default '{}'::jsonb,
  hero_image_url text,
  updated_at timestamptz not null default now()
);
grant select on public.event_settings to anon;
grant select, insert, update on public.event_settings to authenticated;
grant all on public.event_settings to service_role;
alter table public.event_settings enable row level security;
create policy "Public reads settings" on public.event_settings for select to anon, authenticated using (true);
create policy "Admins insert settings" on public.event_settings for insert to authenticated
  with check (public.has_role(auth.uid(), 'admin'));
create policy "Admins update settings" on public.event_settings for update to authenticated
  using (public.has_role(auth.uid(), 'admin'));
insert into public.event_settings (id, content) values (1, '{}'::jsonb);

-- Storage policies for the "gallery" bucket
create policy "Public read gallery files" on storage.objects for select using (bucket_id = 'gallery');
create policy "Admins upload gallery files" on storage.objects for insert to authenticated
  with check (bucket_id = 'gallery' and public.has_role(auth.uid(), 'admin'));
create policy "Admins update gallery files" on storage.objects for update to authenticated
  using (bucket_id = 'gallery' and public.has_role(auth.uid(), 'admin'));
create policy "Admins delete gallery files" on storage.objects for delete to authenticated
  using (bucket_id = 'gallery' and public.has_role(auth.uid(), 'admin'));