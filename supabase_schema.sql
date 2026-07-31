-- ==========================================
-- 솜사탕 퀴즈 웹앱 Supabase 테이블 생성 쿼리
-- Supabase SQL Editor에 복사하여 실행해 주세요!
-- ==========================================

-- 1. quiz_scores 테이블 생성
create table if not exists public.quiz_scores (
    id uuid default gen_random_uuid() primary key,
    student_name text not null,
    score integer not null,
    total_questions integer not null default 5,
    created_at timestamp with time zone default now()
);

-- 2. Row Level Security (RLS) 활성화
alter table public.quiz_scores enable row level security;

-- 3. 누구나 점수를 조회할 수 있는 정책 (리더보드용)
create policy "Allow public read access"
    on public.quiz_scores
    for select
    using (true);

-- 4. 누구나 점수를 제출(저장)할 수 있는 정책
create policy "Allow public insert access"
    on public.quiz_scores
    for insert
    with check (true);
