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
  images jsonb not null default '[]'::jsonb,
  confidence text not null default 'Media',
  ocr_confidence numeric,
  boundary_confidence numeric,
  topic_confidence numeric,
  extraction_status text not null default '',
  page_number integer,
  source_file text not null default '',
  bounds jsonb,
  analysis_notes text not null default '',
  question_number integer,
  answer_structure text not null default '',
  notes text not null default '',
  source_name text,
  source_type text,
  created_at timestamptz not null default now()
);

alter table public.exercises add column if not exists images jsonb not null default '[]'::jsonb;
alter table public.exercises add column if not exists confidence text not null default 'Media';
alter table public.exercises add column if not exists ocr_confidence numeric;
alter table public.exercises add column if not exists boundary_confidence numeric;
alter table public.exercises add column if not exists topic_confidence numeric;
alter table public.exercises add column if not exists extraction_status text not null default '';
alter table public.exercises add column if not exists page_number integer;
alter table public.exercises add column if not exists source_file text not null default '';
alter table public.exercises add column if not exists bounds jsonb;
alter table public.exercises add column if not exists analysis_notes text not null default '';
alter table public.exercises add column if not exists question_number integer;
alter table public.exercises add column if not exists answer_structure text not null default '';
alter table public.exercises add column if not exists notes text not null default '';

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

insert into storage.buckets (id, name, public)
values ('exercise-images', 'exercise-images', true)
on conflict (id) do nothing;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'public read exercise images'
  ) then
    create policy "public read exercise images"
    on storage.objects for select
    using (bucket_id = 'exercise-images');
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'public upload exercise images'
  ) then
    create policy "public upload exercise images"
    on storage.objects for insert
    with check (bucket_id = 'exercise-images');
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'public update exercise images'
  ) then
    create policy "public update exercise images"
    on storage.objects for update
    using (bucket_id = 'exercise-images');
  end if;
end $$;
