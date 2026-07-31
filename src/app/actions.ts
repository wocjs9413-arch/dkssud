'use server';

import { createClient } from '@/utils/supabase/server';

export interface ScoreRecord {
  id?: string;
  student_name: string;
  score: number;
  total_questions: number;
  created_at?: string;
}

// 점수 목록 가져오기 (Server Action)
export async function getScoresAction(): Promise<{ success: boolean; data?: ScoreRecord[]; error?: string }> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('quiz_scores')
      .select('*')
      .order('score', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Supabase fetch error:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data: (data as ScoreRecord[]) || [] };
  } catch (e) {
    console.error('Server Action getScores Error:', e);
    return { success: false, error: '서버 연동 오류가 발생했습니다.' };
  }
}

// 점수 저장하기 (Server Action)
export async function submitScoreAction(studentName: string, score: number, totalQuestions: number = 5): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from('quiz_scores').insert([
      {
        student_name: studentName.trim(),
        score: score,
        total_questions: totalQuestions,
      },
    ]);

    if (error) {
      console.error('Supabase insert error:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (e) {
    console.error('Server Action submitScore Error:', e);
    return { success: false, error: '점수 저장 중 서버 오류가 발생했습니다.' };
  }
}
