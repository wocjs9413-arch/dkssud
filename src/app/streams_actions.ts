'use server';

import { createClient } from '@/utils/supabase/server';


export interface StreamsRoom {
  id: string;
  room_code: string;
  created_by: string;
  numbers: (number | string)[]; // array of max 20 items (number 1~30 or '★')
  status: 'waiting' | 'playing' | 'ended';
  created_at?: string;
}

export interface StreamsPlayer {
  id?: string;
  room_id: string;
  student_id: string;
  student_name: string;
  board: (number | string | null)[]; // 20 slots array
  score?: number;
  updated_at?: string;
}

// ── 방 생성 ──
export async function createStreamsRoomAction(creatorId: string): Promise<{ success: boolean; room?: StreamsRoom; error?: string }> {
  try {
    const supabase = await createClient();
    const roomCode = Math.floor(1000 + Math.random() * 9000).toString();
    const { data, error } = await supabase
      .from('streams_rooms')
      .insert([
        {
          room_code: roomCode,
          created_by: creatorId,
          numbers: [],
          status: 'waiting',
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('createStreamsRoom error:', error);
      return { success: false, error: error.message };
    }
    return { success: true, room: data as StreamsRoom };
  } catch (e) {
    console.error('createStreamsRoom exception:', e);
    return { success: false, error: '방 생성 중 오류가 발생했습니다.' };
  }
}

// ── 방 상태 / 정보 조회 ──
export async function getStreamsRoomAction(roomCode: string): Promise<{ success: boolean; room?: StreamsRoom; players?: StreamsPlayer[]; error?: string }> {
  try {
    const supabase = await createClient();
    const { data: room, error: roomErr } = await supabase
      .from('streams_rooms')
      .select('*')
      .eq('room_code', roomCode.trim())
      .maybeSingle();

    if (roomErr || !room) {
      return { success: false, error: '존재하지 않거나 종료된 방입니다.' };
    }

    const { data: players, error: playerErr } = await supabase
      .from('streams_players')
      .select('*')
      .eq('room_id', room.id);

    return { success: true, room: room as StreamsRoom, players: (players as StreamsPlayer[]) || [] };
  } catch (e) {
    console.error('getStreamsRoom exception:', e);
    return { success: false, error: '방 정보 조회 오류' };
  }
}

// ── 학생 방 참가 / 업데이트 ──
export async function joinOrUpdateStreamsPlayerAction(
  roomId: string,
  studentId: string,
  studentName: string,
  board: (number | string | null)[]
): Promise<{ success: boolean; player?: StreamsPlayer; error?: string }> {
  try {
    const supabase = await createClient();
    
    // 플레이어 점수 계산 (오름차순 연결 길이 기준 간이 계산)
    const calculateBoardScore = (b: (number | string | null)[]) => {
      // 숫자 및 ★ 계산 logic
      let maxScore = 0;
      // 스트림스 기본 점수표 (길이에 따른 점수)
      const scoreTable: { [key: number]: number } = {
        1: 0, 2: 1, 3: 3, 4: 5, 5: 7, 6: 9, 7: 11, 8: 15, 9: 20, 10: 25,
        11: 30, 12: 35, 13: 40, 14: 50, 15: 60, 16: 70, 17: 80, 18: 90, 19: 100, 20: 300
      };
      
      // 입력된 연속 오름차순 구간들의 점수 합 계산
      let currentLen = 0;
      let prevVal: number | null = null;
      let totalScore = 0;

      for (let i = 0; i < b.length; i++) {
        const val = b[i];
        if (val === null || val === undefined) {
          if (currentLen > 0) {
            totalScore += scoreTable[currentLen] || 0;
            currentLen = 0;
            prevVal = null;
          }
          continue;
        }

        let numVal = 0;
        if (val === '★') {
          // 조커 ★ 는 유연하게 연결 가능
          numVal = prevVal !== null ? prevVal : 0;
        } else {
          numVal = Number(val);
        }

        if (prevVal === null || numVal >= prevVal || val === '★') {
          currentLen++;
          if (val !== '★') prevVal = numVal;
        } else {
          totalScore += scoreTable[currentLen] || 0;
          currentLen = 1;
          prevVal = numVal;
        }
      }
      if (currentLen > 0) {
        totalScore += scoreTable[currentLen] || 0;
      }
      return totalScore;
    };

    const calculatedScore = calculateBoardScore(board);

    const { data: existing } = await supabase
      .from('streams_players')
      .select('id')
      .eq('room_id', roomId)
      .eq('student_id', studentId)
      .maybeSingle();

    if (existing) {
      const { data, error } = await supabase
        .from('streams_players')
        .update({
          board,
          score: calculatedScore,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) return { success: false, error: error.message };
      return { success: true, player: data as StreamsPlayer };
    } else {
      const { data, error } = await supabase
        .from('streams_players')
        .insert([
          {
            room_id: roomId,
            student_id: studentId,
            student_name: studentName,
            board,
            score: calculatedScore,
          },
        ])
        .select()
        .single();

      if (error) return { success: false, error: error.message };
      return { success: true, player: data as StreamsPlayer };
    }
  } catch (e) {
    console.error('joinOrUpdateStreamsPlayer exception:', e);
    return { success: false, error: '플레이어 등록/업데이트 실패' };
  }
}

// ── 관리자 숫자/★ 뽑기 (1~30, 중복 불가, 11~20은 최대 2번까지, ★ 포함) ──
export async function drawNextStreamsNumberAction(roomId: string, currentNumbers: (number | string)[]): Promise<{ success: boolean; newNumber?: number | string; room?: StreamsRoom; error?: string }> {
  try {
    if (currentNumbers.length >= 20) {
      return { success: false, error: '이미 20개의 숫자를 모두 뽑았습니다.' };
    }

    const supabase = await createClient();

    // 1~30 및 ★ 후보 풀 생성
    // 1~10: 1개씩
    // 11~20: 2개씩
    // 21~30: 1개씩
    // ★ : 1개
    const pool: (number | string)[] = [];
    for (let i = 1; i <= 10; i++) pool.push(i);
    for (let i = 11; i <= 20; i++) { pool.push(i); pool.push(i); }
    for (let i = 21; i <= 30; i++) pool.push(i);
    pool.push('★');

    // 이미 뽑힌 숫자들 제거
    const remainingPool = [...pool];
    for (const drawn of currentNumbers) {
      const idx = remainingPool.findIndex((x) => x === drawn);
      if (idx !== -1) {
        remainingPool.splice(idx, 1);
      }
    }

    if (remainingPool.length === 0) {
      return { success: false, error: '뽑을 수 있는 숫자가 없습니다.' };
    }

    // 남은 풀에서 랜덤 1개 선택
    const randomIndex = Math.floor(Math.random() * remainingPool.length);
    const drawnItem = remainingPool[randomIndex];
    const updatedNumbers = [...currentNumbers, drawnItem];

    const nextStatus = updatedNumbers.length === 20 ? 'ended' : 'playing';

    const { data, error } = await supabase
      .from('streams_rooms')
      .update({
        numbers: updatedNumbers,
        status: nextStatus,
      })
      .eq('id', roomId)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, newNumber: drawnItem, room: data as StreamsRoom };
  } catch (e) {
    console.error('drawNextStreamsNumber exception:', e);
    return { success: false, error: '숫자 뽑기 실패' };
  }
}

// ── 게임 리셋 / 새로 시작 ──
export async function resetStreamsRoomAction(roomId: string): Promise<{ success: boolean; room?: StreamsRoom; error?: string }> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('streams_rooms')
      .update({
        numbers: [],
        status: 'waiting',
      })
      .eq('id', roomId)
      .select()
      .single();

    if (error) return { success: false, error: error.message };

    // 기존 플레이어들의 보드 초기화
    await supabase
      .from('streams_players')
      .update({
        board: Array(20).fill(null),
        score: 0,
      })
      .eq('room_id', roomId);

    return { success: true, room: data as StreamsRoom };
  } catch (e) {
    console.error('resetStreamsRoom exception:', e);
    return { success: false, error: '게임 리셋 실패' };
  }
}
