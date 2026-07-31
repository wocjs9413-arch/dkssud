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
    created_at timestamp with time zone default now()
);

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

-- 4. RLS 정책 설정
drop policy if exists "Allow public read access" on public.quiz_scores;
create policy "Allow public read access" on public.quiz_scores for select using (true);

drop policy if exists "Allow public insert access" on public.quiz_scores;
create policy "Allow public insert access" on public.quiz_scores for insert with check (true);

drop policy if exists "Allow public select students" on public.students;
create policy "Allow public select students" on public.students for select using (true);

drop policy if exists "Allow public insert students" on public.students;
create policy "Allow public insert students" on public.students for insert with check (true);
