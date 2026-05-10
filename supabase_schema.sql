create extension if not exists pgcrypto;

create table if not exists public.subjects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  advice text,
  created_at timestamptz not null default now()
);

create table if not exists public.topics (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid not null references public.subjects(id) on delete cascade,
  name text not null,
  keywords text[] not null default '{}',
  is_custom boolean not null default false,
  created_at timestamptz not null default now(),
  unique (subject_id, name)
);

create table if not exists public.exercises (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid not null references public.subjects(id) on delete cascade,
  topic_names text[] not null default '{}',
  text text not null,
  academic_year text,
  year_start integer,
  semester text,
  month text,
  assessment text,
  difficulty text,
  exercise_type text,
  solution text,
  keywords text[] not null default '{}',
  source_name text,
  source_type text,
  created_at timestamptz not null default now()
);

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid not null references public.subjects(id) on delete cascade,
  name text not null,
  extracted_text text,
  source_type text,
  created_at timestamptz not null default now()
);

alter table public.subjects enable row level security;
alter table public.topics enable row level security;
alter table public.exercises enable row level security;
alter table public.documents enable row level security;

create policy "public read subjects" on public.subjects for select using (true);
create policy "public write subjects" on public.subjects for insert with check (true);
create policy "public update subjects" on public.subjects for update using (true);
create policy "public read topics" on public.topics for select using (true);
create policy "public write topics" on public.topics for insert with check (true);
create policy "public update topics" on public.topics for update using (true);
create policy "public delete topics for testing" on public.topics for delete using (true);

create policy "public read exercises" on public.exercises for select using (true);
create policy "public write exercises" on public.exercises for insert with check (true);
create policy "public update exercises" on public.exercises for update using (true);
create policy "public delete exercises for testing" on public.exercises for delete using (true);

create policy "public read documents" on public.documents for select using (true);
create policy "public write documents" on public.documents for insert with check (true);
create policy "public update documents" on public.documents for update using (true);
create policy "public delete documents for testing" on public.documents for delete using (true);
