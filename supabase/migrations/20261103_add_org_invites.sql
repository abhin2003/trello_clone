-- supabase/migrations/20261103_add_org_invites.sql
create extension if not exists "uuid-ossp";

create table org_invitations (
  id uuid default uuid_generate_v4() primary key,
  token text not null unique,
  org_id uuid references organisations(id) on delete cascade,
  expires_at timestamptz not null,
  status text check (status in ('PENDING','ACCEPTED','REVOKED')) default 'PENDING'
);

create table org_members (
  id uuid default uuid_generate_v4() primary key,
  org_id uuid references organisations(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  role text check (role in ('owner','member')) default 'member',
  unique (org_id, user_id)
);

-- optional: add foreign key for org_id in profiles if not present

