-- ==========================================
-- 솜사탕 수학교실 Supabase 테이블 생성 쿼리
-- Supabase SQL Editor에 복사하여 실행해 주세요!
-- ==========================================

-- 1. quiz_scores 테이블 생성 (점수 저장용)
create table if not exists public.quiz_scores (
    id uuid default gen_random_uuid() primary key,
    student_name text not null,
    score integer not null,
    total_questions integer not null default 5,
    unit_id text not null default 'mid1_unit1',  -- 단원 ID (예: mid1_unit1, mid2_unit3 등)
    created_at timestamp with time zone default now()
);

-- unit_id 컬럼 추가 (기존 테이블에 적용)
alter table public.quiz_scores add column if not exists unit_id text not null default 'mid1_unit1';

-- 2. students 테이블 생성 (학생 로그인/회원가입용)
create table if not exists public.students (
    student_id text primary key, -- 학번 (예: 10101)
    name text not null,          -- 학생 이름
    password text not null,      -- 비밀번호
    created_at timestamp with time zone default now()
);

-- 3. Row Level Security (RLS) 활성화
alter table public.quiz_scores enable row level security;
alter table public.students enable row level security;

-- 4. RLS 정책 설정 (quiz_scores)
drop policy if exists "Allow public read access" on public.quiz_scores;
create policy "Allow public read access" on public.quiz_scores for select using (true);

drop policy if exists "Allow public insert access" on public.quiz_scores;
create policy "Allow public insert access" on public.quiz_scores for insert with check (true);

-- 5. RLS 정책 설정 (students - SELECT, INSERT, UPDATE, DELETE)
drop policy if exists "Allow public select students" on public.students;
create policy "Allow public select students" on public.students for select using (true);

drop policy if exists "Allow public insert students" on public.students;
create policy "Allow public insert students" on public.students for insert with check (true);

drop policy if exists "Allow public update students" on public.students;
create policy "Allow public update students" on public.students for update using (true) with check (true);

drop policy if exists "Allow public delete students" on public.students;
create policy "Allow public delete students" on public.students for delete using (true);

-- ==========================================
-- 4. 스트림스 게임용 테이블 생성
-- ==========================================
create table if not exists public.streams_rooms (
    id uuid default gen_random_uuid() primary key,
    room_code text not null unique,
    created_by text not null,
    numbers jsonb not null default '[]'::jsonb,
    status text not null default 'waiting',
    created_at timestamp with time zone default now()
);

create table if not exists public.streams_players (
    id uuid default gen_random_uuid() primary key,
    room_id uuid references public.streams_rooms(id) on delete cascade,
    student_id text not null,
    student_name text not null,
    board jsonb not null default '[]'::jsonb,
    score integer default 0,
    updated_at timestamp with time zone default now()
);

alter table public.streams_rooms enable row level security;
alter table public.streams_players enable row level security;

create policy "Allow public access streams_rooms" on public.streams_rooms for all using (true) with check (true);
create policy "Allow public access streams_players" on public.streams_players for all using (true) with check (true);

