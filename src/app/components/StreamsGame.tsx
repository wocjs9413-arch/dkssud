'use client';

import { useState, useEffect } from 'react';
import {
  createStreamsRoomAction,
  getStreamsRoomAction,
  joinOrUpdateStreamsPlayerAction,
  drawNextStreamsNumberAction,
  resetStreamsRoomAction,
  StreamsRoom,
  StreamsPlayer,
} from '@/app/streams_actions';
import { StudentUser } from '@/app/actions';
import { Gamepad2, RefreshCw, Trophy, Sparkles, CheckCircle, Lock, Play, Plus, Users, Crown, ArrowLeft } from 'lucide-react';

interface StreamsGameProps {
  currentUser: StudentUser | null;
  onOpenAuth: () => void;
}

export default function StreamsGame({ currentUser, onOpenAuth }: StreamsGameProps) {
  const [roomCodeInput, setRoomCodeInput] = useState('');
  const [currentRoom, setCurrentRoom] = useState<StreamsRoom | null>(null);
  const [players, setPlayers] = useState<StreamsPlayer[]>([]);
  const [myBoard, setMyBoard] = useState<(number | string | null)[]>(Array(20).fill(null));
  const [confirmedSlots, setConfirmedSlots] = useState<boolean[]>(Array(20).fill(false));
  const [selectedSlotIndex, setSelectedSlotIndex] = useState<number | null>(null);
  const [inputVal, setInputVal] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const isAdmin = currentUser?.student_id === '10000';

  // 방 상태 실시간 주기적 폴링 (2초마다)
  useEffect(() => {
    if (!currentRoom) return;

    const interval = setInterval(async () => {
      const res = await getStreamsRoomAction(currentRoom.room_code);
      if (res.success && res.room) {
        setCurrentRoom(res.room);
        if (res.players) {
          setPlayers(res.players);
          // 내 보드 상태가 동기화되지 않은 경우 반영
          if (currentUser) {
            const me = res.players.find((p) => p.student_id === currentUser.student_id);
            if (me && me.board && me.board.length === 20) {
              // 학생이 이미 확정한 칸은 유지하면서 동기화
            }
          }
        }
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [currentRoom, currentUser]);

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

  // 학생/공통: 방 참가
  const handleJoinRoom = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!roomCodeInput.trim()) return;
    setLoading(true);
    setErrorMsg('');
    const res = await getStreamsRoomAction(roomCodeInput.trim());
    if (res.success && res.room) {
      setCurrentRoom(res.room);
      setPlayers(res.players || []);
      // 기존 참가 기록 확인
      if (currentUser && res.players) {
        const me = res.players.find((p) => p.student_id === currentUser.student_id);
        if (me && me.board && me.board.length === 20) {
          setMyBoard(me.board);
          // 이미 값이 있는 칸은 확정 처리
          const conf = me.board.map((v) => v !== null && v !== undefined);
          setConfirmedSlots(conf);
        }
      }
    } else {
      setErrorMsg(res.error || '방을 찾을 수 없습니다.');
    }
    setLoading(false);
  };

  // 관리자: 숫자 뽑기 (1~30, 11~20은 최대2번, ★ 포함)
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
    if (!confirm('게임을 리셋하고 새로 시작하시겠습니까?')) return;
    setLoading(true);
    const res = await resetStreamsRoomAction(currentRoom.id);
    if (res.success && res.room) {
      setCurrentRoom(res.room);
      setMyBoard(Array(20).fill(null));
      setConfirmedSlots(Array(20).fill(false));
      setSelectedSlotIndex(null);
    } else {
      setErrorMsg(res.error || '리셋 실패');
    }
    setLoading(false);
  };

  // 학생: 칸 선택 후 값 입력 & 확인 (확인 후 수정 불가)
  const handleConfirmSlot = async (slotIdx: number) => {
    if (confirmedSlots[slotIdx]) return;
    if (!currentUser) {
      alert('로그인이 필요합니다.');
      onOpenAuth();
      return;
    }
    if (!inputVal) return;

    let finalVal: number | string = inputVal.trim();
    if (finalVal !== '★') {
      const num = parseInt(finalVal, 10);
      if (isNaN(num) || num < 1 || num > 30) {
        alert('1~30 사이의 숫자 또는 ★ 기호를 입력해주세요!');
        return;
      }
      finalVal = num;
    }

    const newBoard = [...myBoard];
    newBoard[slotIdx] = finalVal;
    const newConfirmed = [...confirmedSlots];
    newConfirmed[slotIdx] = true;

    setMyBoard(newBoard);
    setConfirmedSlots(newConfirmed);
    setSelectedSlotIndex(null);
    setInputVal('');

    // 서버에 보드 상태 업데이트 저장
    if (currentRoom) {
      await joinOrUpdateStreamsPlayerAction(currentRoom.id, currentUser.student_id, currentUser.name, newBoard);
    }
  };

  // 최근 뽑힌 가장 최신 숫자
  const lastDrawnNumber = currentRoom?.numbers && currentRoom.numbers.length > 0
    ? currentRoom.numbers[currentRoom.numbers.length - 1]
    : null;

  // ㄱ자 20칸 좌표 배치 (상단 가로 12칸, 우측 세로 8칸 -> 총 20칸 ㄱ자)
  // 0~11: 1행(가로 12칸), 12~19: 2~9행의 가장 오른쪽 열 (세로 8칸)
  const renderLShapedGrid = () => {
    return (
      <div className="flex flex-col gap-2 items-center justify-center my-6 overflow-x-auto p-4 bg-gradient-to-br from-indigo-50/50 to-purple-50/50 rounded-3xl border border-indigo-100/60 shadow-inner">
        {/* 가로 12칸 (인덱스 0 ~ 11) */}
        <div className="flex gap-2">
          {Array.from({ length: 12 }).map((_, i) => {
            const idx = i;
            const val = myBoard[idx];
            const isConfirmed = confirmedSlots[idx];
            const isSelected = selectedSlotIndex === idx;

            return (
              <div
                key={idx}
                onClick={() => !isConfirmed && setSelectedSlotIndex(idx)}
                className={`w-12 h-14 sm:w-14 sm:h-16 rounded-2xl flex flex-col items-center justify-center font-black text-base sm:text-lg transition-all duration-200 cursor-pointer relative shadow-sm border ${
                  isConfirmed
                    ? 'bg-gradient-to-b from-emerald-500 to-teal-600 text-white border-emerald-400 shadow-md scale-[0.98]'
                    : isSelected
                    ? 'bg-amber-100 text-amber-900 border-amber-400 ring-4 ring-amber-300/50 scale-105 z-10'
                    : 'bg-white text-gray-700 border-indigo-100 hover:border-indigo-300 hover:scale-105'
                }`}
              >
                <span className="text-[10px] text-gray-400 font-semibold absolute top-1 left-2">{idx + 1}</span>
                <span className="mt-2">{val !== null && val !== undefined ? val : ''}</span>
                {isConfirmed && <Lock className="w-3 h-3 text-emerald-200 absolute bottom-1 right-1" />}
              </div>
            );
          })}
        </div>

        {/* 세로 8칸 (인덱스 12 ~ 19) : ㄱ자의 우측 하단 꼬리 */}
        <div className="flex flex-col gap-2 w-full items-end pr-[1px] sm:pr-[2px]">
          {Array.from({ length: 8 }).map((_, i) => {
            const idx = 12 + i;
            const val = myBoard[idx];
            const isConfirmed = confirmedSlots[idx];
            const isSelected = selectedSlotIndex === idx;

            return (
              <div
                key={idx}
                onClick={() => !isConfirmed && setSelectedSlotIndex(idx)}
                className={`w-12 h-14 sm:w-14 sm:h-16 rounded-2xl flex flex-col items-center justify-center font-black text-base sm:text-lg transition-all duration-200 cursor-pointer relative shadow-sm border ${
                  isConfirmed
                    ? 'bg-gradient-to-b from-emerald-500 to-teal-600 text-white border-emerald-400 shadow-md scale-[0.98]'
                    : isSelected
                    ? 'bg-amber-100 text-amber-900 border-amber-400 ring-4 ring-amber-300/50 scale-105 z-10'
                    : 'bg-white text-gray-700 border-indigo-100 hover:border-indigo-300 hover:scale-105'
                }`}
              >
                <span className="text-[10px] text-gray-400 font-semibold absolute top-1 left-2">{idx + 1}</span>
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
      {/* 타이틀 헤더 */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 rounded-[2.5rem] p-8 text-white shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="flex items-center gap-4 z-10">
          <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-3xl shadow-inner border border-white/30">
            🎲
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-3 py-0.5 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold border border-white/30">
                실시간 소통 멀티게임
              </span>
              {isAdmin && <span className="px-2.5 py-0.5 bg-amber-400 text-amber-950 rounded-full text-xs font-black">👑 관리자</span>}
            </div>
            <h2 className="text-3xl font-black tracking-tight">스트림스 (STREAMS) 🎯</h2>
            <p className="text-sm text-indigo-100 mt-1 font-medium">
              선생님이 뽑는 숫자를 20개 ㄱ자 칸에 순서대로 적절히 넣어 최고의 오름차순 스트림을 완성하세요!
            </p>
          </div>
        </div>

        {currentRoom && (
          <button
            onClick={() => setCurrentRoom(null)}
            className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-full text-sm font-bold transition-all border border-white/30 shrink-0 z-10"
          >
            <ArrowLeft className="w-4 h-4" /> 방 나가기
          </button>
        )}
      </div>

      {errorMsg && (
        <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-2xl text-center text-sm font-bold">
          ⚠️ {errorMsg}
        </div>
      )}

      {/* ───── 방 접속 전 (대기실 / 방생성) ───── */}
      {!currentRoom && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 학생: 방 입장 */}
          <div className="bg-white rounded-[2.5rem] p-8 shadow-[0_10px_30px_rgba(181,200,255,0.2)] border border-white flex flex-col justify-between gap-6">
            <div>
              <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center text-2xl mb-4 font-bold">
                🔑
              </div>
              <h3 className="text-2xl font-black text-[#2D3748] mb-2">게임 방 입장하기</h3>
              <p className="text-sm text-[#8E9BAE] font-medium mb-6">
                선생님이 만드신 4자리 방 코드를 입력하여 실시간 게임에 참여해보세요!
              </p>

              <form onSubmit={handleJoinRoom} className="flex flex-col gap-4">
                <input
                  type="text"
                  maxLength={4}
                  placeholder="방 코드 4자리 (예: 1234)"
                  value={roomCodeInput}
                  onChange={(e) => setRoomCodeInput(e.target.value)}
                  className="w-full px-5 py-4 text-center text-2xl font-black tracking-widest bg-[#F8FBFE] border border-gray-200 rounded-2xl focus:outline-none focus:border-indigo-400 text-gray-800"
                />
                <button
                  type="submit"
                  disabled={loading || !roomCodeInput.trim()}
                  className="w-full py-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-black text-lg rounded-full shadow-lg hover:scale-[1.02] transition-all disabled:opacity-50"
                >
                  {loading ? '입장 중...' : '방 참가하기 🚀'}
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
              <h3 className="text-2xl font-black text-[#2D3748] mb-2">선생님 전용 방 만들기</h3>
              <p className="text-sm text-gray-600 font-medium mb-6">
                학생들과 함께할 새로운 스트림스 멀티플레이 방을 생성하고 숫자를 진행하세요.
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
          {/* 방 대기 및 상태 보드 */}
          <div className="bg-white rounded-[2.5rem] p-6 sm:p-8 shadow-[0_10px_30px_rgba(181,200,255,0.2)] border border-white flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-indigo-100 text-indigo-700 rounded-2xl flex items-center justify-center font-black text-2xl shadow-inner">
                {currentRoom.room_code}
              </div>
              <div>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">입장코드</p>
                <h4 className="text-xl font-black text-gray-800">스트림스 게임 대기실</h4>
                <p className="text-xs text-indigo-600 font-semibold flex items-center gap-1 mt-0.5">
                  <Users className="w-3.5 h-3.5" /> 현재 접속 플레이어: {players.length}명
                </p>
              </div>
            </div>

            {/* 관리자 컨트롤 또는 뽑힌 숫자 디스플레이 */}
            <div className="flex items-center gap-4">
              {isAdmin && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleDrawNumber}
                    disabled={loading || currentRoom.numbers.length >= 20}
                    className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-black rounded-full shadow-md hover:scale-105 transition-all disabled:opacity-40 text-sm flex items-center gap-2"
                  >
                    <Sparkles className="w-4 h-4" />
                    숫자/★ 뽑기 ({currentRoom.numbers.length}/20)
                  </button>
                  <button
                    onClick={handleResetGame}
                    className="p-3 bg-gray-100 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                    title="게임 리셋"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* 최근 뽑힌 숫자 대형 전광판 */}
          <div className="bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl flex flex-col items-center justify-center text-center gap-4 relative overflow-hidden border border-slate-800">
            <p className="text-xs text-indigo-300 font-bold tracking-widest uppercase">
              Current Drawn Number ({currentRoom.numbers.length}/20)
            </p>
            <div className="w-28 h-28 sm:w-32 sm:h-32 bg-gradient-to-br from-amber-400 to-orange-500 rounded-3xl flex items-center justify-center text-5xl sm:text-6xl font-black text-slate-950 shadow-[0_0_50px_rgba(251,191,36,0.5)] border-4 border-amber-200 animate-pulse">
              {lastDrawnNumber !== null && lastDrawnNumber !== undefined ? lastDrawnNumber : '❓'}
            </div>
            <p className="text-xs text-slate-400">
              {lastDrawnNumber ? `선생님이 방금 [ ${lastDrawnNumber} ] (을)를 뽑으셨습니다!` : '선생님이 첫 번째 숫자를 뽑을 때까지 대기하세요.'}
            </p>

            {/* 지금까지 뽑힌 전체 숫자 롤 */}
            <div className="w-full flex items-center justify-center gap-2 flex-wrap mt-2 bg-slate-800/60 p-3 rounded-2xl border border-slate-700">
              <span className="text-xs text-slate-400 font-bold mr-1">뽑힌 히스토리:</span>
              {currentRoom.numbers.length === 0 ? (
                <span className="text-xs text-slate-500">아직 없음</span>
              ) : (
                currentRoom.numbers.map((n, idx) => (
                  <span
                    key={idx}
                    className="w-7 h-7 rounded-lg bg-amber-400/20 border border-amber-400/40 text-amber-300 text-xs font-black flex items-center justify-center"
                  >
                    {n}
                  </span>
                ))
              )}
            </div>
          </div>

          {/* ㄱ자 20칸 스트림스 보드 */}
          <div className="bg-white rounded-[2.5rem] p-6 sm:p-8 shadow-[0_12px_40px_rgba(199,206,234,0.3)] border border-white flex flex-col items-center gap-4">
            <div className="flex items-center justify-between w-full border-b pb-4 border-gray-100">
              <div>
                <h3 className="text-xl font-black text-gray-800 flex items-center gap-2">
                  <Gamepad2 className="w-5 h-5 text-indigo-500" />
                  나의 ㄱ자 스트림스 보드 (20칸)
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  비어있는 칸을 클릭하여 숫자를 적은 뒤 [확인]을 누르면 수정이 불가능합니다.
                </p>
              </div>

              {selectedSlotIndex !== null && (
                <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-bold animate-bounce">
                  ✏️ {selectedSlotIndex + 1}번 칸 선택됨
                </span>
              )}
            </div>

            {/* ㄱ자 그리드 */}
            {renderLShapedGrid()}

            {/* 숫자 입력 폼 (선택된 칸이 있을 때) */}
            {selectedSlotIndex !== null && !confirmedSlots[selectedSlotIndex] && (
              <div className="bg-amber-50 border border-amber-200 p-5 rounded-3xl w-full max-w-md flex flex-col gap-3 items-center shadow-lg animate-fade-in">
                <p className="text-sm font-bold text-amber-900">
                  {selectedSlotIndex + 1}번 칸에 적을 숫자를 입력하고 확인을 눌러주세요.
                </p>
                <div className="flex gap-2 w-full">
                  <input
                    type="text"
                    placeholder="1~30 숫자 또는 ★"
                    value={inputVal}
                    onChange={(e) => setInputVal(e.target.value)}
                    className="flex-grow px-4 py-3 bg-white border border-amber-300 rounded-2xl text-center font-bold text-lg focus:outline-none focus:border-amber-500"
                  />
                  <button
                    onClick={() => setInputVal('★')}
                    className="px-4 py-3 bg-amber-200 hover:bg-amber-300 text-amber-900 font-black rounded-2xl text-sm transition-colors"
                  >
                    ★ 선택
                  </button>
                  <button
                    onClick={() => handleConfirmSlot(selectedSlotIndex)}
                    className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-2xl text-sm transition-colors shadow-md"
                  >
                    확인 (수정 불가)
                  </button>
                </div>
                <p className="text-[11px] text-amber-700">⚠️ 한번 확인을 누르면 숫자를 다시 변경할 수 없으니 신중히 결정하세요!</p>
              </div>
            )}
          </div>

          {/* 접속자 리더보드 & 실시간 현황 */}
          <div className="bg-white rounded-[2.5rem] p-6 sm:p-8 shadow-[0_12px_40px_rgba(199,206,234,0.3)] border border-white flex flex-col gap-4">
            <h3 className="text-xl font-black text-gray-800 flex items-center gap-2 border-b pb-4 border-gray-100">
              <Trophy className="w-5 h-5 text-amber-500" />
              실시간 학생 점수 및 진행 현황
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {players.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-6 col-span-full">아직 다른 학생 접속자가 없습니다.</p>
              ) : (
                players
                  .sort((a, b) => (b.score || 0) - (a.score || 0))
                  .map((p, idx) => {
                    const filledCount = p.board ? p.board.filter((x) => x !== null && x !== undefined).length : 0;
                    return (
                      <div
                        key={p.student_id}
                        className="bg-[#F8FBFE] p-4 rounded-2xl border border-gray-100 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black ${
                            idx === 0 ? 'bg-amber-400 text-white shadow-md' : 'bg-gray-200 text-gray-600'
                          }`}>
                            {idx + 1}
                          </span>
                          <div>
                            <p className="font-bold text-sm text-gray-800">{p.student_name}</p>
                            <p className="text-[11px] text-gray-400">채운 칸: {filledCount}/20</p>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-lg font-black text-indigo-600">{p.score || 0}</span>
                          <span className="text-xs text-gray-400 ml-0.5">점</span>
                        </div>
                      </div>
                    );
                  })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
