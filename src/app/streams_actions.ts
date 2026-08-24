'use server';

import { createClient } from '@/utils/supabase/server';
import { STREAM_SCORE_TABLE } from '@/app/streams_constants';

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

export async function calculateStreamsScore(b: (number | string | null)[]): Promise<number> {

  let totalScore = 0;
  let currentLen = 0;
  let prevNum: number | null = null;

  for (let i = 0; i < b.length; i++) {
    const val = b[i];
    if (val === null || val === undefined) {
      if (currentLen > 0) {
        totalScore += STREAM_SCORE_TABLE[currentLen] || 0;
        currentLen = 0;
        prevNum = null;
      }
      continue;
    }

    if (val === '★') {
      // 조커 ★ 는 무조건 이전 수 이상으로 간주하여 오름차순 연결을 유지
      currentLen++;
    } else {
      const num = Number(val);
      if (prevNum === null || num >= prevNum) {
        currentLen++;
        prevNum = num;
      } else {
        totalScore += STREAM_SCORE_TABLE[currentLen] || 0;
        currentLen = 1;
        prevNum = num;
      }
    }
  }

  if (currentLen > 0) {
    totalScore += STREAM_SCORE_TABLE[currentLen] || 0;
  }

  return totalScore;
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

// ── 학생 방 참가 (입장 전 닉네임 사용 가능, 게임 시작 시 접속 제한) ──
export async function joinStreamsPlayerAction(
  roomId: string,
  studentId: string,
  studentName: string
): Promise<{ success: boolean; player?: StreamsPlayer; room?: StreamsRoom; error?: string }> {
  try {
    const supabase = await createClient();

    // 1. 방 상태 확인 (playing 또는 ended 상태면 접속 불가)
    const { data: room, error: roomErr } = await supabase
      .from('streams_rooms')
      .select('*')
      .eq('id', roomId)
      .single();

    if (roomErr || !room) {
      return { success: false, error: '존재하지 않는 방입니다.' };
    }

    // 이미 플레이어가 참가되어 있는지 검사
    const { data: existing } = await supabase
      .from('streams_players')
      .select('*')
      .eq('room_id', roomId)
      .eq('student_id', studentId)
      .maybeSingle();

    if (!existing && room.status !== 'waiting') {
      return { success: false, error: '선생님이 이미 게임을 시작하셨습니다! 더 이상 참가할 수 없습니다.' };
    }

    if (existing) {
      // 이미 입장한 학생이면 이름 업데이트
      const { data: updated, error: updateErr } = await supabase
        .from('streams_players')
        .update({ student_name: studentName.trim() })
        .eq('id', existing.id)
        .select()
        .single();

      if (updateErr) return { success: false, error: updateErr.message };
      return { success: true, player: updated as StreamsPlayer, room: room as StreamsRoom };
    } else {
      // 신규 플레이어 등록
      const { data: created, error: insertErr } = await supabase
        .from('streams_players')
        .insert([
          {
            room_id: roomId,
            student_id: studentId,
            student_name: studentName.trim(),
            board: Array(20).fill(null),
            score: 0,
          },
        ])
        .select()
        .single();

      if (insertErr) return { success: false, error: insertErr.message };
      return { success: true, player: created as StreamsPlayer, room: room as StreamsRoom };
    }
  } catch (e) {
    console.error('joinStreamsPlayer exception:', e);
    return { success: false, error: '방 입장 실패' };
  }
}

// ── 학생 보드 업데이트 (선생님이 뽑은 숫자를 지정한 위치에 배치) ──
export async function updateStreamsPlayerBoardAction(
  roomId: string,
  studentId: string,
  board: (number | string | null)[]
): Promise<{ success: boolean; player?: StreamsPlayer; error?: string }> {
  try {
    const supabase = await createClient();
    const calculatedScore = await calculateStreamsScore(board);


    const { data, error } = await supabase
      .from('streams_players')
      .update({
        board,
        score: calculatedScore,
        updated_at: new Date().toISOString(),
      })
      .eq('room_id', roomId)
      .eq('student_id', studentId)
      .select()
      .single();

    if (error) return { success: false, error: error.message };
    return { success: true, player: data as StreamsPlayer };
  } catch (e) {
    console.error('updateStreamsPlayerBoard exception:', e);
    return { success: false, error: '보드 저장 실패' };
  }
}

// ── 관리자 숫자/★ 뽑기 (라운드 시작 -> 방 상태 'playing'으로 변경하여 추가 신규 접속 차단) ──
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
