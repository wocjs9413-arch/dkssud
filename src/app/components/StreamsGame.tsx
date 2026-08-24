'use client';

import { useState, useEffect } from 'react';
import {
  createStreamsRoomAction,
  getStreamsRoomAction,
  joinStreamsPlayerAction,
  updateStreamsPlayerBoardAction,
  drawNextStreamsNumberAction,
  resetStreamsRoomAction,
  calculateStreamsScore,
  STREAM_SCORE_TABLE,
  StreamsRoom,
  StreamsPlayer,
} from '@/app/streams_actions';
import { StudentUser } from '@/app/actions';
import { Gamepad2, RefreshCw, Trophy, Sparkles, CheckCircle, Lock, Plus, Users, Crown, ArrowLeft, Eye, AlertCircle, Check, Table } from 'lucide-react';


interface StreamsGameProps {
  currentUser: StudentUser | null;
  onOpenAuth: () => void;
}

export default function StreamsGame({ currentUser, onOpenAuth }: StreamsGameProps) {
  const [roomCodeInput, setRoomCodeInput] = useState('');
  const [nicknameInput, setNicknameInput] = useState(currentUser?.name || '');
  const [currentRoom, setCurrentRoom] = useState<StreamsRoom | null>(null);
  const [players, setPlayers] = useState<StreamsPlayer[]>([]);
  
  // 학생 플레이용 보드 상태
  const [myBoard, setMyBoard] = useState<(number | string | null)[]>(Array(20).fill(null));
  const [confirmedSlots, setConfirmedSlots] = useState<boolean[]>(Array(20).fill(false));
  const [selectedSlotIndex, setSelectedSlotIndex] = useState<number | null>(null);
  const [myScore, setMyScore] = useState<number>(0);

  // 실시간 학생 자가 점수 계산
  useEffect(() => {
    let scoreAcc = 0;
    let currentLen = 0;
    let prevNum: number | null = null;

    for (let i = 0; i < myBoard.length; i++) {
      const val = myBoard[i];
      if (val === null || val === undefined) {
        if (currentLen > 0) {
          scoreAcc += STREAM_SCORE_TABLE[currentLen] || 0;
          currentLen = 0;
          prevNum = null;
        }
        continue;
      }

      if (val === '★') {
        currentLen++;
      } else {
        const num = Number(val);
        if (prevNum === null || num >= prevNum) {
          currentLen++;
          prevNum = num;
        } else {
          scoreAcc += STREAM_SCORE_TABLE[currentLen] || 0;
          currentLen = 1;
          prevNum = num;
        }
      }
    }

    if (currentLen > 0) {
      scoreAcc += STREAM_SCORE_TABLE[currentLen] || 0;
    }

    setMyScore(scoreAcc);
  }, [myBoard]);

  
  // 관리자 관전 전용 상태
  const [selectedPlayerForView, setSelectedPlayerForView] = useState<StreamsPlayer | null>(null);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const isAdmin = currentUser?.student_id === '10000';

  // 닉네임 기본값 설정
  useEffect(() => {
    if (currentUser?.name && !nicknameInput) {
      setNicknameInput(currentUser.name);
    }
  }, [currentUser, nicknameInput]);

  // 방 상태 실시간 주기적 폴링 (1초마다 자동 동기화)


  // 방 상태 실시간 주기적 폴링 (1초마다 빠른 업데이트)
  useEffect(() => {
    if (!currentRoom?.room_code) return;

    const fetchRoomState = async () => {
      const res = await getStreamsRoomAction(currentRoom.room_code);
      if (res.success && res.room) {
        setCurrentRoom(res.room);
        if (res.players) {
          setPlayers(res.players);

          // 관전 모달이 열려있는 경우 선택된 학생의 보드 실시간 동기화
          setSelectedPlayerForView((prevView) => {
            if (!prevView) return null;
            const updated = res.players?.find((p) => p.student_id === prevView.student_id);
            return updated || prevView;
          });
        }
      }
    };

    fetchRoomState();
    const interval = setInterval(fetchRoomState, 1000);

    return () => clearInterval(interval);
  }, [currentRoom?.room_code]);


  // 관리자: 방 생성
  const handleCreateRoom = async () => {
    if (!currentUser || !isAdmin) return;
    setLoading(true);
    setErrorMsg('');
    const res = await createStreamsRoomAction(currentUser.student_id);
    if (res.success && res.room) {
      setCurrentRoom(res.room);
      setPlayers([]);
    } else {
      setErrorMsg(res.error || '방 생성에 실패했습니다.');
    }
    setLoading(false);
  };

  // 학생/공통: 방 참가 (닉네임 필수, 게임 시작 후 제한)
  const handleJoinRoom = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!roomCodeInput.trim()) {
      setErrorMsg('방 코드를 입력해주세요.');
      return;
    }

    const nickname = nicknameInput.trim() || (currentUser ? currentUser.name : '학생');
    if (!nickname) {
      setErrorMsg('닉네임을 입력해주세요.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    // 1. 방 조회
    const getRes = await getStreamsRoomAction(roomCodeInput.trim());
    if (!getRes.success || !getRes.room) {
      setErrorMsg(getRes.error || '존재하지 않는 방 코드입니다.');
      setLoading(false);
      return;
    }

    let studentId = currentUser ? currentUser.student_id : localStorage.getItem('streams_guest_id');
    if (!studentId) {
      studentId = `guest_${Math.floor(1000 + Math.random() * 9000)}`;
      if (!currentUser) {
        localStorage.setItem('streams_guest_id', studentId);
      }
    }

    // 2. 방 참가 액션
    const joinRes = await joinStreamsPlayerAction(getRes.room.id, studentId, nickname);

    if (joinRes.success && joinRes.room) {
      setCurrentRoom(joinRes.room);
      if (joinRes.player && joinRes.player.board) {
        setMyBoard(joinRes.player.board);
        const conf = joinRes.player.board.map((v) => v !== null && v !== undefined);
        setConfirmedSlots(conf);
      }
    } else {
      setErrorMsg(joinRes.error || '방 참가에 실패했습니다.');
    }
    setLoading(false);
  };


  // 관리자: 숫자/★ 뽑기 (1~30, 11~20은 최대2번, ★ 포함)
  const handleDrawNumber = async () => {
    if (!currentRoom || !isAdmin) return;
    setLoading(true);
    setErrorMsg('');
    const res = await drawNextStreamsNumberAction(currentRoom.id, currentRoom.numbers);
    if (res.success && res.room) {
      setCurrentRoom(res.room);
    } else {
      setErrorMsg(res.error || '숫자 뽑기에 실패했습니다.');
    }
    setLoading(false);
  };

  // 관리자: 게임 리셋
  const handleResetGame = async () => {
    if (!currentRoom || !isAdmin) return;
    if (!confirm('게임을 리셋하고 새로 시작하시겠습니까? (이전 플레이어들의 보드가 초기화됩니다)')) return;
    setLoading(true);
    const res = await resetStreamsRoomAction(currentRoom.id);
    if (res.success && res.room) {
      setCurrentRoom(res.room);
      setMyBoard(Array(20).fill(null));
      setConfirmedSlots(Array(20).fill(false));
      setSelectedSlotIndex(null);
      setSelectedPlayerForView(null);
    } else {
      setErrorMsg(res.error || '리셋 실패');
    }
    setLoading(false);
  };

  // 최근 선생님이 뽑은 가장 최신 숫자
  const currentRoundIndex = currentRoom?.numbers ? currentRoom.numbers.length - 1 : -1;
  const currentDrawnNumber = currentRoundIndex >= 0 ? currentRoom!.numbers[currentRoundIndex] : null;

  // 학생: 선생님이 뽑은 숫자를 지정한 비어있는 칸에 배치 및 확정 (확인 후 수정 불가)
  const handleConfirmPlacement = async (slotIdx: number) => {
    if (confirmedSlots[slotIdx]) return;
    if (currentDrawnNumber === null || currentDrawnNumber === undefined) {
      alert('선생님이 숫자를 뽑으실 때까지 기다려주세요!');
      return;
    }

    const newBoard = [...myBoard];
    newBoard[slotIdx] = currentDrawnNumber;

    const newConfirmed = [...confirmedSlots];
    newConfirmed[slotIdx] = true;

    setMyBoard(newBoard);
    setConfirmedSlots(newConfirmed);
    setSelectedSlotIndex(null);

    // DB에 보드 및 점수 저장
    if (currentRoom) {
      let studentId = currentUser ? currentUser.student_id : localStorage.getItem('streams_guest_id');
      if (!studentId) {
        studentId = `guest_${Math.floor(1000 + Math.random() * 9000)}`;
        localStorage.setItem('streams_guest_id', studentId);
      }
      await updateStreamsPlayerBoardAction(currentRoom.id, studentId, newBoard);
    }
  };


  // 현재 라운드(최근 뽑힌 숫자)를 몇 명의 학생이 칸에 적었는지 계산
  const currentRoundFilledCount = currentRoom && currentRoom.numbers.length > 0
    ? players.filter((p) => p.board && p.board.filter((x) => x !== null && x !== undefined).length >= currentRoom.numbers.length).length
    : 0;

  // ㄱ자 20칸 그리드 컴포넌트 (학생용 / 관리자 관전용 공용)
  const renderLShapedGrid = (
    boardData: (number | string | null)[],
    confirmedData: boolean[],
    isInteractive: boolean = false
  ) => {
    return (
      <div className="flex flex-col gap-2 items-center justify-center my-4 overflow-x-auto p-4 bg-gradient-to-br from-indigo-50/50 to-purple-50/50 rounded-3xl border border-indigo-100/60 shadow-inner">
        {/* 가로 12칸 (0 ~ 11) */}
        <div className="flex gap-1.5 sm:gap-2">
          {Array.from({ length: 12 }).map((_, i) => {
            const idx = i;
            const val = boardData[idx];
            const isConfirmed = confirmedData[idx];
            const isSelected = selectedSlotIndex === idx;

            return (
              <div
                key={idx}
                onClick={() => isInteractive && !isConfirmed && setSelectedSlotIndex(idx)}
                className={`w-11 h-13 sm:w-14 sm:h-16 rounded-2xl flex flex-col items-center justify-center font-black text-sm sm:text-lg transition-all duration-200 relative shadow-sm border ${
                  isConfirmed
                    ? 'bg-gradient-to-b from-emerald-500 to-teal-600 text-white border-emerald-400 shadow-md scale-[0.98]'
                    : isSelected
                    ? 'bg-amber-100 text-amber-900 border-amber-400 ring-4 ring-amber-300/50 scale-105 z-10 cursor-pointer'
                    : isInteractive
                    ? 'bg-white text-gray-700 border-indigo-100 hover:border-indigo-300 hover:scale-105 cursor-pointer'
                    : 'bg-white/80 text-gray-500 border-gray-200'
                }`}
              >
                <span className="text-[10px] text-gray-400 font-semibold absolute top-1 left-1.5">{idx + 1}</span>
                <span className="mt-2">{val !== null && val !== undefined ? val : ''}</span>
                {isConfirmed && <Lock className="w-3 h-3 text-emerald-200 absolute bottom-1 right-1" />}
              </div>
            );
          })}
        </div>

        {/* 세로 8칸 (12 ~ 19) : ㄱ자의 우측 하단 꼬리 */}
        <div className="flex flex-col gap-1.5 sm:gap-2 w-full items-end pr-[1px]">
          {Array.from({ length: 8 }).map((_, i) => {
            const idx = 12 + i;
            const val = boardData[idx];
            const isConfirmed = confirmedData[idx];
            const isSelected = selectedSlotIndex === idx;

            return (
              <div
                key={idx}
                onClick={() => isInteractive && !isConfirmed && setSelectedSlotIndex(idx)}
                className={`w-11 h-13 sm:w-14 sm:h-16 rounded-2xl flex flex-col items-center justify-center font-black text-sm sm:text-lg transition-all duration-200 relative shadow-sm border ${
                  isConfirmed
                    ? 'bg-gradient-to-b from-emerald-500 to-teal-600 text-white border-emerald-400 shadow-md scale-[0.98]'
                    : isSelected
                    ? 'bg-amber-100 text-amber-900 border-amber-400 ring-4 ring-amber-300/50 scale-105 z-10 cursor-pointer'
                    : isInteractive
                    ? 'bg-white text-gray-700 border-indigo-100 hover:border-indigo-300 hover:scale-105 cursor-pointer'
                    : 'bg-white/80 text-gray-500 border-gray-200'
                }`}
              >
                <span className="text-[10px] text-gray-400 font-semibold absolute top-1 left-1.5">{idx + 1}</span>
                <span className="mt-2">{val !== null && val !== undefined ? val : ''}</span>
                {isConfirmed && <Lock className="w-3 h-3 text-emerald-200 absolute bottom-1 right-1" />}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col gap-8 animate-fade-in py-4">
      {/* ── 상단 헤더 ── */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 rounded-[2.5rem] p-8 text-white shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="flex items-center gap-4 z-10">
          <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-3xl shadow-inner border border-white/30">
            🎲
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-3 py-0.5 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold border border-white/30">
                실시간 멀티 대결
              </span>
              {isAdmin && <span className="px-2.5 py-0.5 bg-amber-400 text-amber-950 rounded-full text-xs font-black">👑 선생님(관리자)</span>}
            </div>
            <h2 className="text-3xl font-black tracking-tight">스트림스 (STREAMS) 🎯</h2>
            <p className="text-sm text-indigo-100 mt-1 font-medium">
              선생님이 라운드마다 뽑는 숫자를 20개 ㄱ자 칸 중 원하는 위치에 지정하세요!
            </p>
          </div>
        </div>

        {currentRoom && (
          <button
            onClick={() => { setCurrentRoom(null); setSelectedPlayerForView(null); }}
            className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-full text-sm font-bold transition-all border border-white/30 shrink-0 z-10"
          >
            <ArrowLeft className="w-4 h-4" /> 대기실 나가기
          </button>
        )}
      </div>

      {errorMsg && (
        <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-2xl text-center text-sm font-bold animate-fade-in flex items-center justify-center gap-2">
          <AlertCircle className="w-4 h-4" /> {errorMsg}
        </div>
      )}

      {/* ───── 방 접속 전 (대기실 / 닉네임 입력 / 방생성) ───── */}
      {!currentRoom && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 학생: 방 코드 & 닉네임 입력 후 입장 */}
          <div className="bg-white rounded-[2.5rem] p-8 shadow-[0_10px_30px_rgba(181,200,255,0.2)] border border-white flex flex-col justify-between gap-6">
            <div>
              <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center text-2xl mb-4 font-bold">
                🎮
              </div>
              <h3 className="text-2xl font-black text-[#2D3748] mb-2">게임 방 참가하기</h3>
              <p className="text-sm text-[#8E9BAE] font-medium mb-6">
                선생님의 방 코드와 사용할 **닉네임**을 입력하세요. (게임을 시작하면 접속이 제한됩니다)
              </p>

              <form onSubmit={handleJoinRoom} className="flex flex-col gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-500 mb-1 block">방 코드 (4자리)</label>
                  <input
                    type="text"
                    maxLength={4}
                    placeholder="예: 1234"
                    value={roomCodeInput}
                    onChange={(e) => setRoomCodeInput(e.target.value)}
                    className="w-full px-5 py-3 text-center text-xl font-black tracking-widest bg-[#F8FBFE] border border-gray-200 rounded-2xl focus:outline-none focus:border-indigo-400 text-gray-800"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-500 mb-1 block">플레이어 닉네임 (이름)</label>
                  <input
                    type="text"
                    placeholder="닉네임 입력 (예: 수학왕홍길동)"
                    value={nicknameInput}
                    onChange={(e) => setNicknameInput(e.target.value)}
                    className="w-full px-5 py-3 text-center font-bold bg-[#F8FBFE] border border-gray-200 rounded-2xl focus:outline-none focus:border-indigo-400 text-gray-800"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || !roomCodeInput.trim()}
                  className="w-full py-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-black text-lg rounded-full shadow-lg hover:scale-[1.02] transition-all disabled:opacity-50 mt-2"
                >
                  {loading ? '입장 검증 중...' : '게임 방 참가하기 🚀'}
                </button>
              </form>
            </div>
          </div>

          {/* 관리자(선생님): 방 생성 */}
          <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 rounded-[2.5rem] p-8 shadow-[0_10px_30px_rgba(181,200,255,0.2)] border border-amber-200/60 flex flex-col justify-between gap-6">
            <div>
              <div className="w-12 h-12 bg-amber-100 text-amber-700 rounded-2xl flex items-center justify-center text-2xl mb-4 font-bold">
                🏫
              </div>
              <h3 className="text-2xl font-black text-[#2D3748] mb-2">선생님 전용 방 생성</h3>
              <p className="text-sm text-gray-600 font-medium mb-6">
                학생들과 실시간 스트림스 대결을 펼칠 새로운 게임 방을 생성하고 진행하세요.
              </p>
            </div>

            {isAdmin ? (
              <button
                onClick={handleCreateRoom}
                disabled={loading}
                className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-black text-lg rounded-full shadow-lg hover:scale-[1.02] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Plus className="w-5 h-5" />
                {loading ? '생성 중...' : '새로운 멀티 방 만들기 ✨'}
              </button>
            ) : (
              <div className="p-4 bg-white/80 rounded-2xl border border-amber-200 text-xs text-amber-800 font-semibold text-center">
                💡 방 생성을 하려면 관리자 계정(학번 10000)으로 로그인해 주세요.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ───── 방 접속 후 (게임 진행 화면) ───── */}
      {currentRoom && (
        <div className="flex flex-col gap-8">
          {/* 방 상태 상단 바 */}
          <div className="bg-white rounded-[2.5rem] p-6 sm:p-8 shadow-[0_10px_30px_rgba(181,200,255,0.2)] border border-white flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-indigo-100 text-indigo-700 rounded-2xl flex items-center justify-center font-black text-2xl shadow-inner">
                {currentRoom.room_code}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">입장코드</span>
                  {currentRoom.status === 'playing' ? (
                    <span className="px-2.5 py-0.5 bg-red-100 text-red-600 rounded-full text-[11px] font-black flex items-center gap-1">
                      <Lock className="w-3 h-3" /> 게임 진행 중 (신규 접속 차단)
                    </span>
                  ) : currentRoom.status === 'ended' ? (
                    <span className="px-2.5 py-0.5 bg-gray-100 text-gray-600 rounded-full text-[11px] font-black">
                      🏁 게임 종료
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 bg-green-100 text-green-700 rounded-full text-[11px] font-black">
                      🟢 대기 중 (학생 접속 가능)
                    </span>
                  )}
                </div>
                <h4 className="text-xl font-black text-gray-800 mt-1">스트림스 멀티 게임 공간</h4>
                <p className="text-xs text-indigo-600 font-semibold flex items-center gap-1 mt-0.5">
                  <Users className="w-3.5 h-3.5" /> 참여자: {players.length}명
                </p>
              </div>
            </div>

            {/* 관리자 컨트롤 (숫자 뽑기 & 라운드별 학생 제출 비율 확인) */}
            {isAdmin && (
              <div className="flex flex-col sm:flex-row items-center gap-3">
                {/* 현 라운드 제출 진행도 현황 */}
                {currentRoom.numbers.length > 0 && (
                  <div className="px-4 py-2 bg-indigo-50 border border-indigo-100 rounded-2xl text-center">
                    <p className="text-[11px] text-indigo-400 font-bold">라운드 {currentRoom.numbers.length} 배치 완료 현황</p>
                    <p className="text-sm font-black text-indigo-700">
                      {currentRoundFilledCount}명 / {players.length}명 완료
                    </p>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleDrawNumber}
                    disabled={loading || currentRoom.numbers.length >= 20}
                    className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-black rounded-full shadow-md hover:scale-105 transition-all disabled:opacity-40 text-sm flex items-center gap-2"
                  >
                    <Sparkles className="w-4 h-4" />
                    다음 숫자/★ 뽑기 ({currentRoom.numbers.length}/20)
                  </button>
                  <button
                    onClick={handleResetGame}
                    className="p-3 bg-gray-100 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                    title="게임 리셋"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 선생님 전광판: 이번 라운드 뽑힌 숫자 */}
          <div className="bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl flex flex-col items-center justify-center text-center gap-4 relative overflow-hidden border border-slate-800">
            <p className="text-xs text-indigo-300 font-bold tracking-widest uppercase">
              Current Round {currentRoom.numbers.length} / 20
            </p>
            <div className="w-28 h-28 sm:w-32 sm:h-32 bg-gradient-to-br from-amber-400 to-orange-500 rounded-3xl flex items-center justify-center text-5xl sm:text-6xl font-black text-slate-950 shadow-[0_0_50px_rgba(251,191,36,0.5)] border-4 border-amber-200 animate-bounce">
              {currentDrawnNumber !== null && currentDrawnNumber !== undefined ? currentDrawnNumber : '❓'}
            </div>
            <p className="text-xs text-slate-300 font-medium">
              {currentDrawnNumber !== null && currentDrawnNumber !== undefined
                ? `선생님이 뽑은 숫자 [ ${currentDrawnNumber} ] (을)를 원하는 빈 칸에 배치하세요!`
                : '선생님이 첫 번째 숫자를 뽑을 때까지 대기하세요.'}
            </p>

            {/* 지금까지 뽑힌 히스토리 롤 */}
            <div className="w-full flex items-center justify-center gap-2 flex-wrap mt-2 bg-slate-800/60 p-3 rounded-2xl border border-slate-700">
              <span className="text-xs text-slate-400 font-bold mr-1">뽑힌 히스토리:</span>
              {currentRoom.numbers.length === 0 ? (
                <span className="text-xs text-slate-500">아직 없음</span>
              ) : (
                currentRoom.numbers.map((n, idx) => (
                  <span
                    key={idx}
                    className={`w-7 h-7 rounded-lg text-xs font-black flex items-center justify-center border ${
                      idx === currentRoundIndex
                        ? 'bg-amber-400 text-slate-950 border-amber-300 scale-110 shadow-md'
                        : 'bg-amber-400/20 text-amber-300 border-amber-400/40'
                    }`}
                  >
                    {n}
                  </span>
                ))
              )}
            </div>
          </div>

          {/* ── 학생 화면: 내 ㄱ자 보드에 숫자 넣기 ── */}
          {!isAdmin && (
            <div className="bg-white rounded-[2.5rem] p-6 sm:p-8 shadow-[0_12px_40px_rgba(199,206,234,0.3)] border border-white flex flex-col items-center gap-4">
              <div className="flex flex-col sm:flex-row items-center justify-between w-full border-b pb-4 border-gray-100 gap-3">
                <div>
                  <h3 className="text-xl font-black text-gray-800 flex items-center gap-2">
                    <Gamepad2 className="w-5 h-5 text-indigo-500" />
                    {nicknameInput} 님의 ㄱ자 스트림스 보드
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    원하는 비어있는 칸을 클릭하면 이번 라운드의 숫자 [ {currentDrawnNumber ?? '❓'} ] (이)가 배치됩니다.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  {/* 실시간 자동 계산 점수 뱃지 */}
                  <div className="px-4 py-2 bg-gradient-to-r from-amber-400 to-orange-500 text-white rounded-2xl shadow-md flex items-center gap-2">
                    <Trophy className="w-5 h-5" />
                    <div>
                      <p className="text-[10px] uppercase font-bold opacity-90">실시간 자동계산 점수</p>
                      <p className="text-lg font-black leading-none">{myScore}점</p>
                    </div>
                  </div>

                  {selectedSlotIndex !== null && (
                    <button
                      onClick={() => handleConfirmPlacement(selectedSlotIndex)}
                      className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-full text-sm shadow-md transition-all flex items-center gap-1.5 animate-pulse"
                    >
                      <Check className="w-4 h-4" /> {selectedSlotIndex + 1}번 칸에 배치 확정 (수정 불가)
                    </button>
                  )}
                </div>
              </div>

              {/* ㄱ자 보드 그리드 (인터랙티브 활성화) */}
              {renderLShapedGrid(myBoard, confirmedSlots, true)}

              {selectedSlotIndex !== null && !confirmedSlots[selectedSlotIndex] && (
                <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl w-full max-w-md text-center text-xs text-amber-900 font-bold animate-fade-in">
                  👉 {selectedSlotIndex + 1}번 칸에 숫자 [ {currentDrawnNumber} ] (을)를 넣으시겠습니까? 오른쪽 상단의 [배치 확정]을 클릭해 주세요!
                </div>
              )}
            </div>
          )}

          {/* ── 스트림스 연결 길이별 점수표 (학생 & 관리자 모두 볼 수 있는 안내판) ── */}
          <div className="bg-white rounded-[2.5rem] p-6 sm:p-8 shadow-[0_10px_30px_rgba(181,200,255,0.2)] border border-white flex flex-col gap-4">
            <div className="flex items-center justify-between border-b pb-3 border-gray-100">
              <h3 className="text-lg font-black text-gray-800 flex items-center gap-2">
                <Table className="w-5 h-5 text-indigo-500" />
                스트림스 연속 수열 길이별 득점표
              </h3>
              <span className="text-xs text-gray-400 font-semibold">
                💡 연속 오름차순으로 묶인 칸 수에 따라 점수가 부여됩니다.
              </span>
            </div>

            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-10 gap-2">
              {Object.entries(STREAM_SCORE_TABLE).map(([len, score]) => (
                <div
                  key={len}
                  className="flex flex-col items-center justify-center p-2 bg-[#F8FBFE] border border-gray-100 rounded-xl text-center"
                >
                  <span className="text-[11px] font-bold text-gray-400">{len}개 묶음</span>
                  <span className="text-sm font-black text-indigo-600 mt-0.5">{score}점</span>
                </div>
              ))}
            </div>
          </div>


          {/* ── 관리자 관전 화면: 특정 학생의 보드 실시간 조회 모달/영역 ── */}
          {isAdmin && selectedPlayerForView && (
            <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-[2.5rem] p-6 sm:p-8 border-2 border-purple-200 shadow-xl flex flex-col gap-4 animate-fade-in">
              <div className="flex items-center justify-between border-b pb-3 border-purple-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-600 text-white rounded-xl flex items-center justify-center font-bold">
                    <Eye className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-lg font-black text-purple-950">
                      [실시간 화면 관전] {selectedPlayerForView.student_name} 학생
                    </h4>
                    <p className="text-xs text-purple-600">
                      현재 진행 점수: <strong>{selectedPlayerForView.score || 0}점</strong> · 입력된 칸: {selectedPlayerForView.board.filter(x => x !== null && x !== undefined).length}/20
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedPlayerForView(null)}
                  className="px-4 py-1.5 bg-white text-purple-700 hover:bg-purple-100 rounded-full text-xs font-bold transition-colors border border-purple-200"
                >
                  관전 닫기 ✕
                </button>
              </div>

              {/* 해당 학생의 보드 그리기 */}
              {renderLShapedGrid(
                selectedPlayerForView.board,
                selectedPlayerForView.board.map(v => v !== null && v !== undefined),
                false
              )}
            </div>
          )}

          {/* ── 실시간 참가자 목록 & 닉네임 관전 (선생님/관리자 전용) ── */}
          {isAdmin && (
            <div className="bg-white rounded-[2.5rem] p-6 sm:p-8 shadow-[0_12px_40px_rgba(199,206,234,0.3)] border border-white flex flex-col gap-4">
              <div className="flex items-center justify-between border-b pb-4 border-gray-100">
                <h3 className="text-xl font-black text-gray-800 flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-amber-500" />
                  실시간 참가 플레이어 현황 및 실시간 관전 ({players.length}명)
                </h3>
                <span className="text-xs text-indigo-500 font-semibold">
                  💡 학생 이름을 클릭하면 해당 학생의 ㄱ자 보드를 실시간으로 볼 수 있습니다.
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {players.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-6 col-span-full">아직 접속한 학생이 없습니다.</p>
                ) : (
                  players
                    .sort((a, b) => (b.score || 0) - (a.score || 0))
                    .map((p, idx) => {
                      const filledCount = p.board ? p.board.filter((x) => x !== null && x !== undefined).length : 0;
                      const isRoundFilled = currentRoom.numbers.length > 0 && filledCount >= currentRoom.numbers.length;

                      return (
                        <div
                          key={p.student_id}
                          onClick={() => setSelectedPlayerForView(p)}
                          className={`p-4 rounded-2xl border transition-all flex items-center justify-between cursor-pointer hover:border-purple-300 hover:shadow-md ${
                            selectedPlayerForView?.student_id === p.student_id
                              ? 'bg-purple-100 border-purple-400 ring-2 ring-purple-300'
                              : 'bg-[#F8FBFE] border-gray-100'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black ${
                              idx === 0 ? 'bg-amber-400 text-white shadow-md' : 'bg-gray-200 text-gray-600'
                            }`}>
                              {idx + 1}
                            </span>
                            <div>
                              <p className="font-bold text-sm text-gray-800 flex items-center gap-1.5">
                                {p.student_name}
                                <Eye className="w-3.5 h-3.5 text-purple-400" />
                              </p>
                              <p className="text-[11px] text-gray-400">
                                채운 칸: {filledCount}/20
                              </p>
                            </div>
                          </div>

                          <div className="text-right flex flex-col items-end gap-1">
                            <div>
                              <span className="text-lg font-black text-indigo-600">{p.score || 0}</span>
                              <span className="text-xs text-gray-400 ml-0.5">점</span>
                            </div>
                            {isRoundFilled ? (
                              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-bold flex items-center gap-0.5">
                                <Check className="w-3 h-3" /> 배치 완료
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full text-[10px] font-bold">
                                배치 대기 중
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

