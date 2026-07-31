'use server';

import { createClient } from '@/utils/supabase/server';

export interface ScoreRecord {
  id?: string;
  student_name: string;
  score: number;
  total_questions: number;
  unit_id: string;
  created_at?: string;
}

export interface StudentUser {
  student_id: string;
  name: string;
  password?: string;
  created_at?: string;
}

// 단원별 점수 목록 가져오기 (Server Action)
export async function getScoresByUnitAction(unitId: string): Promise<{ success: boolean; data?: ScoreRecord[]; error?: string }> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('quiz_scores')
      .select('*')
      .eq('unit_id', unitId)
      .order('score', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Supabase fetch error:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data: (data as ScoreRecord[]) || [] };
  } catch (e) {
    console.error('Server Action getScoresByUnit Error:', e);
    return { success: false, error: '서버 연동 오류가 발생했습니다.' };
  }
}

// 전체 점수 목록 (레거시 - 호환성 유지)
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

// 점수 저장하기 - unit_id 포함 (Server Action)
export async function submitScoreAction(
  studentName: string,
  score: number,
  totalQuestions: number = 5,
  unitId: string = 'mid1_unit1'
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from('quiz_scores').insert([
      {
        student_name: studentName.trim(),
        score: score,
        total_questions: totalQuestions,
        unit_id: unitId,
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

// 관리자 검증 함수
function isAdminUser(studentId: string) {
  return studentId.trim() === '10000';
}

// [관리자 전용] 전체 학생 목록 및 비밀번호 조회
export async function getAllStudentsAdminAction(adminStudentId: string): Promise<{ success: boolean; students?: StudentUser[]; error?: string }> {
  if (!isAdminUser(adminStudentId)) {
    return { success: false, error: '관리자 권한이 없습니다.' };
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('students')
      .select('student_id, name, password, created_at')
      .order('student_id', { ascending: true });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, students: (data as StudentUser[]) || [] };
  } catch (e) {
    console.error('Server Action getAllStudentsAdmin Error:', e);
    return { success: false, error: '학생 목록을 불러오지 못했습니다.' };
  }
}

// [관리자 전용] 학생 삭제
export async function deleteStudentAdminAction(adminStudentId: string, targetStudentId: string): Promise<{ success: boolean; error?: string }> {
  if (!isAdminUser(adminStudentId)) {
    return { success: false, error: '관리자 권한이 없습니다.' };
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from('students')
      .delete()
      .eq('student_id', targetStudentId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (e) {
    console.error('Server Action deleteStudentAdmin Error:', e);
    return { success: false, error: '학생 삭제에 실패했습니다.' };
  }
}

// [관리자 전용] 학생 정보(이름, 비밀번호) 수정
export async function updateStudentAdminAction(
  adminStudentId: string,
  targetStudentId: string,
  newName: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  if (!isAdminUser(adminStudentId)) {
    return { success: false, error: '관리자 권한이 없습니다.' };
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from('students')
      .update({ name: newName.trim(), password: newPassword })
      .eq('student_id', targetStudentId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (e) {
    console.error('Server Action updateStudentAdmin Error:', e);
    return { success: false, error: '학생 정보 수정 실패' };
  }
}
