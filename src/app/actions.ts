'use server';

import { createClient } from '@/utils/supabase/server';

export interface ScoreRecord {
  id?: string;
  student_name: string;
  score: number;
  total_questions: number;
  created_at?: string;
}

export interface StudentUser {
  student_id: string;
  name: string;
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

// 학생 로그인 (Server Action)
export async function loginStudentAction(studentId: string, password: string): Promise<{ success: boolean; student?: StudentUser; error?: string }> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('students')
      .select('student_id, name, password')
      .eq('student_id', studentId.trim())
      .maybeSingle();

    if (error) {
      return { success: false, error: '로그인 중 오류가 발생했습니다.' };
    }

    if (!data) {
      return { success: false, error: '등록되지 않은 학번입니다. 회원가입을 먼저 진행해 주세요.' };
    }

    if (data.password !== password) {
      return { success: false, error: '비밀번호가 일치하지 않습니다.' };
    }

    return {
      success: true,
      student: {
        student_id: data.student_id,
        name: data.name,
      },
    };
  } catch (e) {
    console.error('Server Action loginStudent Error:', e);
    return { success: false, error: '로그인 서버 오류가 발생했습니다.' };
  }
}

// 학생 회원가입 (Server Action)
export async function registerStudentAction(studentId: string, name: string, password: string): Promise<{ success: boolean; student?: StudentUser; error?: string }> {
  try {
    const supabase = await createClient();

    // 학번 중복 검사
    const { data: existing } = await supabase
      .from('students')
      .select('student_id')
      .eq('student_id', studentId.trim())
      .maybeSingle();

    if (existing) {
      return { success: false, error: '이미 가입되어 있는 학번입니다. 로그인해 주세요.' };
    }

    const { error } = await supabase.from('students').insert([
      {
        student_id: studentId.trim(),
        name: name.trim(),
        password: password,
      },
    ]);

    if (error) {
      return { success: false, error: error.message };
    }

    return {
      success: true,
      student: {
        student_id: studentId.trim(),
        name: name.trim(),
      },
    };
  } catch (e) {
    console.error('Server Action registerStudent Error:', e);
    return { success: false, error: '회원가입 서버 오류가 발생했습니다.' };
  }
}
