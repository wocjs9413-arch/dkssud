'use client';

import { useState, useEffect } from 'react';
import {
  createAuctionRoomAction,
  getAuctionRoomAction,
  getAllAuctionRoomsAction,
  deleteAuctionRoomAction,
  joinAuctionTeamAction,
  selectSecretMissionAction,
  startAuctionGameAction,
  submitTeamBidAction,
  revealBidsAction,
  submitRebidAction,
  revealRebidsAction,
  submitRPSChoiceAction,
  adminSelectTieWinnerAction,
  resolveSpecialCardAction,
  nextAuctionRoundAction,
  startArrangingPhaseAction,
  updateTeamCardOrderAction,
  finishAuctionGameAction,
  resetAuctionGameAction,
  AuctionRoomFull,
  AuctionTeamState,
  RPSChoice,
} from '@/app/auction_actions';
import {
  CARD_TEMPLATES,
  NORMAL_CARD_LABELS,
  TEAM_COLORS,
  evaluateTeamScore,
  CardType,
  SecretMissionType,
} from '@/app/auction_constants';
import { StudentUser } from '@/app/actions';
import {
  Trophy,
  RefreshCw,
  Sparkles,
  Lock,
  Plus,
  Users,
  Crown,
  ArrowLeft,
  ArrowRight,
  AlertCircle,
  Check,
  Trash2,
  Settings,
  Play,
  BookOpen,
  Coins,
  Calculator,
  HelpCircle,
  X,
  Eye,
} from 'lucide-react';

interface AuctionGameProps {
  currentUser: StudentUser | null;
  onOpenAuth: () => void;
}

export default function AuctionGame({ currentUser }: AuctionGameProps) {
  const [roomCodeInput, setRoomCodeInput] = useState('');
  const [nicknameInput, setNicknameInput] = useState(currentUser?.name || '');
  const [selectedTeamNum, setSelectedTeamNum] = useState<number>(1);

  const [currentRoom, setCurrentRoom] = useState<AuctionRoomFull | null>(null);
  const [adminRoomList, setAdminRoomList] = useState<AuctionRoomFull[]>([]);
  const [loadingRoomList, setLoadingRoomList] = useState(false);

  const [bidInput, setBidInput] = useState<string>('0');
  const [rebidInput, setRebidInput] = useState<string>('0');
  const [showRuleModal, setShowRuleModal] = useState(false);
  const [adminShowSecretMissions, setAdminShowSecretMissions] = useState(false);
  const [selectedTeamDetail, setSelectedTeamDetail] = useState<number | null>(null);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const isAdmin = currentUser?.student_id === '10000';

  useEffect(() => {
    if (currentUser?.name && !nicknameInput) {
      setNicknameInput(currentUser.name);
    }
  }, [currentUser, nicknameInput]);

  // 게스트/학생 고유 ID 가져오기
  const getParticipantId = () => {
    if (currentUser) return currentUser.student_id;
    if (typeof window !== 'undefined') {
      let saved = localStorage.getItem('auction_guest_id');
      if (!saved) {
        saved = `guest_${Math.floor(1000 + Math.random() * 9000)}`;
        localStorage.setItem('auction_guest_id', saved);
      }
      return saved;
    }
    return 'guest_0000';
  };

  // 관리자 방 목록 불러오기
  const fetchAdminRoomList = async () => {
    if (!currentUser || !isAdmin) return;
    setLoadingRoomList(true);
    const res = await getAllAuctionRoomsAction(currentUser.student_id);
    if (res.success && res.rooms) {
      setAdminRoomList(res.rooms);
    }
    setLoadingRoomList(false);
  };

  useEffect(() => {
    if (isAdmin && !currentRoom) {
      fetchAdminRoomList();
    }
  }, [isAdmin, currentRoom]);

  // 1초 주기 실시간 방 상태 폴링
  useEffect(() => {
    if (!currentRoom?.room_code) return;

    const pollRoom = async () => {
      const res = await getAuctionRoomAction(currentRoom.room_code);
      if (res.success && res.room) {
        setCurrentRoom(res.room);
      }
    };

    const interval = setInterval(pollRoom, 1000);
    return () => clearInterval(interval);
  }, [currentRoom?.room_code]);

  // 라운드가 바뀌거나 동점 최소 금액이 바뀌면 입력창 기본값 동기화
  useEffect(() => {
    if (!currentRoom) return;
    if (currentRoom.meta.phase === 'tie_rebidding') {
      setRebidInput(String(currentRoom.meta.tieMinBid || 0));
    }
  }, [currentRoom?.meta.phase, currentRoom?.meta.currentCardIndex, currentRoom?.meta.tieMinBid]);

  // 관리자: 새 경매 방 생성
  const handleCreateRoom = async () => {
    if (!currentUser || !isAdmin) return;
    setLoading(true);
    setErrorMsg('');
    const res = await createAuctionRoomAction(currentUser.student_id);
    if (res.success && res.room) {
      setCurrentRoom(res.room);
      fetchAdminRoomList();
    } else {
      setErrorMsg(res.error || '방 생성에 실패했습니다.');
    }
    setLoading(false);
  };

  // 관리자: 방 삭제
  const handleDeleteRoom = async (roomId: string, roomCode: string) => {
    if (!currentUser || !isAdmin) return;
    if (!confirm(`숫자 경매 방 [ ${roomCode} ]을(를) 삭제하시겠습니까?`)) return;
    setLoading(true);
    const res = await deleteAuctionRoomAction(currentUser.student_id, roomId);
    if (res.success) {
      fetchAdminRoomList();
    } else {
      alert(res.error || '방 삭제 실패');
    }
    setLoading(false);
  };

  // 관리자: 방 입장
  const handleAdminEnterRoom = async (roomCode: string) => {
    setLoading(true);
    setErrorMsg('');
    const res = await getAuctionRoomAction(roomCode);
    if (res.success && res.room) {
      setCurrentRoom(res.room);
    } else {
      setErrorMsg(res.error || '방 입장 실패');
    }
    setLoading(false);
  };

  // 학생/참가자: 방 참가
  const handleJoinRoom = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!roomCodeInput.trim()) {
      setErrorMsg('방 코드 4자리를 입력해 주세요.');
      return;
    }
    const nickname = nicknameInput.trim() || (currentUser ? currentUser.name : '');
    if (!nickname) {
      setErrorMsg('닉네임(이름)을 입력해 주세요.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    const getRes = await getAuctionRoomAction(roomCodeInput.trim());
    if (!getRes.success || !getRes.room) {
      setErrorMsg(getRes.error || '존재하지 않는 방 코드입니다.');
      setLoading(false);
      return;
    }

    const pid = getParticipantId();
    const joinRes = await joinAuctionTeamAction(getRes.room.id, pid, nickname, selectedTeamNum);
    if (joinRes.success && joinRes.room) {
      setCurrentRoom(joinRes.room);
    } else {
      setErrorMsg(joinRes.error || '방 참가에 실패했습니다.');
    }
    setLoading(false);
  };

  // 대기실에서 소속 팀 변경
  const handleSwitchTeam = async (teamNum: number) => {
    if (!currentRoom) return;
    setSelectedTeamNum(teamNum);
    if (isAdmin) return;
    setLoading(true);
    const pid = getParticipantId();
    const nickname = nicknameInput.trim() || currentUser?.name || '학생';
    const res = await joinAuctionTeamAction(currentRoom.id, pid, nickname, teamNum);
    if (res.success && res.room) {
      setCurrentRoom(res.room);
    }
    setLoading(false);
  };

  // 비밀 임무 선택
  const handleSelectMission = async (teamNum: number, mission: SecretMissionType) => {
    if (!currentRoom) return;
    setLoading(true);
    const res = await selectSecretMissionAction(currentRoom.id, teamNum, mission);
    if (res.success && res.room) {
      setCurrentRoom(res.room);
    } else {
      setErrorMsg(res.error || '비밀 임무 선택 실패');
    }
    setLoading(false);
  };

  // 관리자: 1라운드 경매 시작
  const handleStartAuction = async () => {
    if (!currentRoom || !isAdmin) return;
    setLoading(true);
    setErrorMsg('');
    const res = await startAuctionGameAction(currentRoom.id);
    if (res.success && res.room) {
      setCurrentRoom(res.room);
    } else {
      setErrorMsg(res.error || '경매 시작 실패');
    }
    setLoading(false);
  };

  // 팀: 입찰 제출
  const handleSubmitBid = async (teamNum: number, customAmount?: number) => {
    if (!currentRoom) return;
    const amount = customAmount !== undefined ? customAmount : parseInt(bidInput, 10);
    if (isNaN(amount) || amount < 0) {
      alert('0 이상의 유효한 코인을 입력해 주세요.');
      return;
    }
    setLoading(true);
    setErrorMsg('');
    const res = await submitTeamBidAction(currentRoom.id, teamNum, amount);
    if (res.success && res.room) {
      setCurrentRoom(res.room);
    } else {
      setErrorMsg(res.error || '입찰 실패');
    }
    setLoading(false);
  };

  // 관리자: 입찰 마감 및 금액 공개
  const handleRevealBids = async () => {
    if (!currentRoom || !isAdmin) return;
    setLoading(true);
    setErrorMsg('');
    const res = await revealBidsAction(currentRoom.id);
    if (res.success && res.room) {
      setCurrentRoom(res.room);
    } else {
      setErrorMsg(res.error || '입찰 공개 실패');
    }
    setLoading(false);
  };

  // 팀: 동점 재입찰 제출
  const handleSubmitRebid = async (teamNum: number) => {
    if (!currentRoom) return;
    const amount = parseInt(rebidInput, 10);
    if (isNaN(amount)) {
      alert('유효한 재입찰 코인을 입력해 주세요.');
      return;
    }
    setLoading(true);
    setErrorMsg('');
    const res = await submitRebidAction(currentRoom.id, teamNum, amount);
    if (res.success && res.room) {
      setCurrentRoom(res.room);
    } else {
      setErrorMsg(res.error || '재입찰 실패');
    }
    setLoading(false);
  };

  // 관리자: 재입찰 마감 및 공개
  const handleRevealRebids = async () => {
    if (!currentRoom || !isAdmin) return;
    setLoading(true);
    setErrorMsg('');
    const res = await revealRebidsAction(currentRoom.id);
    if (res.success && res.room) {
      setCurrentRoom(res.room);
    } else {
      setErrorMsg(res.error || '재입찰 공개 실패');
    }
    setLoading(false);
  };

  // 팀: 가위바위보 제출
  const handleSubmitRPS = async (teamNum: number, choice: RPSChoice) => {
    if (!currentRoom) return;
    setLoading(true);
    setErrorMsg('');
    const res = await submitRPSChoiceAction(currentRoom.id, teamNum, choice);
    if (res.success && res.room) {
      setCurrentRoom(res.room);
    } else {
      setErrorMsg(res.error || '가위바위보 제출 실패');
    }
    setLoading(false);
  };

  // 관리자: 오프라인 가위바위보 승자 직접 지정
  const handleAdminSelectTieWinner = async (teamNum: number) => {
    if (!currentRoom || !isAdmin) return;
    setLoading(true);
    const res = await adminSelectTieWinnerAction(currentRoom.id, teamNum);
    if (res.success && res.room) {
      setCurrentRoom(res.room);
    } else {
      setErrorMsg(res.error || '승자 지정 실패');
    }
    setLoading(false);
  };

  // 특수 카드(운명의 동전 / 와일드카드) 효과 확정
  const handleResolveSpecial = async (chosenWildType?: Exclude<CardType, 'COIN' | 'WILD'>) => {
    if (!currentRoom) return;
    setLoading(true);
    setErrorMsg('');
    const res = await resolveSpecialCardAction(currentRoom.id, chosenWildType);
    if (res.success && res.room) {
      setCurrentRoom(res.room);
    } else {
      setErrorMsg(res.error || '특수 카드 처리 실패');
    }
    setLoading(false);
  };

  // 관리자: 다음 라운드 카드로 이동
  const handleNextRound = async () => {
    if (!currentRoom || !isAdmin) return;
    setLoading(true);
    setErrorMsg('');
    const res = await nextAuctionRoundAction(currentRoom.id);
    if (res.success && res.room) {
      setCurrentRoom(res.room);
      setBidInput('0');
    } else {
      setErrorMsg(res.error || '다음 라운드 진행 실패');
    }
    setLoading(false);
  };

  // 관리자: 즉시 최종 숫자 계산(카드 배치) 단계로 이동
  const handleStartArranging = async () => {
    if (!currentRoom || !isAdmin) return;
    if (!confirm('경매를 종료하고 최종 숫자 계산(카드 순서 배치) 단계로 이동하시겠습니까?')) return;
    setLoading(true);
    const res = await startArrangingPhaseAction(currentRoom.id);
    if (res.success && res.room) {
      setCurrentRoom(res.room);
    }
    setLoading(false);
  };

  // 팀: 카드 순서 이동 (index <-> targetIndex)
  const handleMoveCard = async (
    team: AuctionTeamState,
    fromIdx: number,
    toIdx: number,
    confirmFlag: boolean = false
  ) => {
    if (!currentRoom) return;
    if (toIdx < 0 || toIdx >= team.cards.length) return;
    const newCards = [...team.cards];
    const [moved] = newCards.splice(fromIdx, 1);
    newCards.splice(toIdx, 0, moved);

    const orderedIds = newCards.map((c) => c.id);
    const res = await updateTeamCardOrderAction(
      currentRoom.id,
      team.teamNumber,
      orderedIds,
      confirmFlag
    );
    if (res.success && res.room) {
      setCurrentRoom(res.room);
    }
  };

  // 팀: 현재 카드 순서 확정 제출
  const handleConfirmCardOrder = async (team: AuctionTeamState) => {
    if (!currentRoom) return;
    setLoading(true);
    const orderedIds = team.cards.map((c) => c.id);
    const res = await updateTeamCardOrderAction(currentRoom.id, team.teamNumber, orderedIds, true);
    if (res.success && res.room) {
      setCurrentRoom(res.room);
    }
    setLoading(false);
  };

  // 관리자: 최종 결과 발표
  const handleFinishGame = async () => {
    if (!currentRoom || !isAdmin) return;
    if (!confirm('모든 팀의 최종 점수와 순위를 발표하시겠습니까?')) return;
    setLoading(true);
    const res = await finishAuctionGameAction(currentRoom.id);
    if (res.success && res.room) {
      setCurrentRoom(res.room);
    }
    setLoading(false);
  };

  // 관리자: 게임 리셋
  const handleResetGame = async () => {
    if (!currentRoom || !isAdmin) return;
    if (!confirm('게임을 초기화하고 처음(대기실)부터 다시 시작하시겠습니까?')) return;
    setLoading(true);
    const res = await resetAuctionGameAction(currentRoom.id);
    if (res.success && res.room) {
      setCurrentRoom(res.room);
      setBidInput('0');
    }
    setLoading(false);
  };

  // 현재 내 팀 객체 (관리자는 선택된 탭의 팀을 조작/점검 가능)
  const myTeam: AuctionTeamState | undefined = currentRoom?.teams.find(
    (t) => t.teamNumber === selectedTeamNum
  );
  const myTeamTheme = TEAM_COLORS.find((c) => c.teamNumber === selectedTeamNum) || TEAM_COLORS[0];

  // 현재 경매 카드
  const currentCard =
    currentRoom && currentRoom.meta.deck[currentRoom.meta.currentCardIndex]
      ? currentRoom.meta.deck[currentRoom.meta.currentCardIndex]
      : null;

  // 동점 처리 규칙을 반영한 팀 순위 계산 함수
  // 1. 최종 점수 내림차순 -> 2. 획득 카드 수 내림차순 -> 3. 남은 코인 내림차순 -> 4. 모두 같으면 공동 등수
  const getRankedTeams = () => {
    if (!currentRoom) return [];
    const evaluated = currentRoom.teams.map((t) => {
      const scoreInfo = evaluateTeamScore(t.cards, t.secretMission, t.randomInt);
      return {
        team: t,
        scoreInfo,
      };
    });

    evaluated.sort((a, b) => {
      if (b.scoreInfo.totalScore !== a.scoreInfo.totalScore) {
        return b.scoreInfo.totalScore - a.scoreInfo.totalScore;
      }
      if (b.team.cards.length !== a.team.cards.length) {
        return b.team.cards.length - a.team.cards.length;
      }
      return b.team.coins - a.team.coins;
    });

    let currentRank = 1;
    return evaluated.map((item, idx) => {
      if (idx > 0) {
        const prev = evaluated[idx - 1];
        const isSameRank =
          prev.scoreInfo.totalScore === item.scoreInfo.totalScore &&
          prev.team.cards.length === item.team.cards.length &&
          prev.team.coins === item.team.coins;
        if (!isSameRank) {
          currentRank = idx + 1;
        }
      }
      return {
        ...item,
        rank: currentRank,
      };
    });
  };

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col gap-8 animate-fade-in py-4">
      {/* ── 상단 배너 헤더 ── */}
      <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 rounded-[2.5rem] p-8 text-white shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="flex items-center gap-4 z-10">
          <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-3xl shadow-inner border border-white/30">
            🪙
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="px-3 py-0.5 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold border border-white/30">
                중1 수학 · 6팀 전략 경매
              </span>
              {isAdmin && (
                <span className="px-2.5 py-0.5 bg-slate-900 text-amber-300 rounded-full text-xs font-black">
                  👑 선생님(진행자)
                </span>
              )}
            </div>
            <h2 className="text-3xl font-black tracking-tight">숫자 경매 게임 ⚖️</h2>
            <p className="text-sm text-amber-50 mt-1 font-medium">
              100코인으로 연산 카드를 낙찰받고, 순서를 전략적으로 배치해 목표 숫자와 임무를 달성하세요!
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 z-10">
          <button
            onClick={() => setShowRuleModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-full text-sm font-bold transition-all border border-white/30"
          >
            <BookOpen className="w-4 h-4" /> 규칙서 보기
          </button>
          {currentRoom && (
            <button
              onClick={() => {
                setCurrentRoom(null);
                setSelectedTeamDetail(null);
              }}
              className="flex items-center gap-1.5 px-4 py-2 bg-slate-900/40 hover:bg-slate-900/60 backdrop-blur-md rounded-full text-sm font-bold transition-all border border-white/20"
            >
              <ArrowLeft className="w-4 h-4" /> 대기실 나가기
            </button>
          )}
        </div>
      </div>

      {errorMsg && (
        <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-2xl text-center text-sm font-bold animate-fade-in flex items-center justify-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" /> {errorMsg}
        </div>
      )}

      {/* ───── 1. 방 접속 전 (대기실 / 팀 선택 입장 / 방 생성) ───── */}
      {!currentRoom && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 학생/팀원: 방 코드 + 닉네임 + 소속 팀 선택 */}
          <div className="bg-white rounded-[2.5rem] p-8 shadow-[0_10px_30px_rgba(181,200,255,0.2)] border border-white flex flex-col justify-between gap-6">
            <div>
              <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center text-2xl mb-4 font-bold">
                🪙
              </div>
              <h3 className="text-2xl font-black text-[#2D3748] mb-2">경매 방 참가하기</h3>
              <p className="text-sm text-[#8E9BAE] font-medium mb-6">
                선생님이 알려주신 <strong>방 코드(4자리)</strong>와 <strong>닉네임</strong>, 그리고 소속된 <strong>팀(1~6팀)</strong>을 선택해 입장하세요!
              </p>

              <form onSubmit={handleJoinRoom} className="flex flex-col gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-500 mb-1 block">방 코드 (4자리)</label>
                  <input
                    type="text"
                    maxLength={4}
                    placeholder="예: 5678"
                    value={roomCodeInput}
                    onChange={(e) => setRoomCodeInput(e.target.value)}
                    className="w-full px-5 py-3 text-center text-xl font-black tracking-widest bg-[#F8FBFE] border border-gray-200 rounded-2xl focus:outline-none focus:border-amber-400 text-gray-800"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-500 mb-1 block">이름 / 닉네임</label>
                  <input
                    type="text"
                    placeholder="예: 홍길동"
                    value={nicknameInput}
                    onChange={(e) => setNicknameInput(e.target.value)}
                    className="w-full px-5 py-3 text-center font-bold bg-[#F8FBFE] border border-gray-200 rounded-2xl focus:outline-none focus:border-amber-400 text-gray-800"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-500 mb-2 block">소속 팀 선택 (1팀 ~ 6팀)</label>
                  <div className="grid grid-cols-3 gap-2">
                    {TEAM_COLORS.map((tc) => (
                      <button
                        key={tc.teamNumber}
                        type="button"
                        onClick={() => setSelectedTeamNum(tc.teamNumber)}
                        className={`py-2.5 px-3 rounded-2xl font-black text-xs sm:text-sm border transition-all flex items-center justify-center gap-1.5 ${
                          selectedTeamNum === tc.teamNumber
                            ? `bg-gradient-to-r ${tc.gradient} text-white border-transparent shadow-md scale-[1.03]`
                            : 'bg-[#F8FBFE] text-gray-600 border-gray-200 hover:border-amber-300'
                        }`}
                      >
                        <span>{tc.emoji}</span>
                        <span>{tc.teamNumber}팀</span>
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || !roomCodeInput.trim()}
                  className="w-full py-4 bg-gradient-to-r from-amber-500 to-rose-500 text-white font-black text-lg rounded-full shadow-lg hover:scale-[1.02] transition-all disabled:opacity-50 mt-2"
                >
                  {loading ? '입장 중...' : `${selectedTeamNum}팀으로 경매 방 입장하기 🚀`}
                </button>
              </form>
            </div>
          </div>

          {/* 선생님(관리자): 기존 방 관리 및 새 경매 방 만들기 */}
          <div className="flex flex-col gap-6">
            {isAdmin && (
              <div className="bg-white rounded-[2.5rem] p-8 shadow-[0_10px_30px_rgba(181,200,255,0.2)] border border-amber-100 flex flex-col gap-4">
                <div className="flex items-center justify-between border-b pb-3 border-gray-100">
                  <h3 className="text-xl font-black text-gray-800 flex items-center gap-2">
                    <Settings className="w-5 h-5 text-amber-600" />
                    생성된 숫자 경매 방 목록
                  </h3>
                  <button
                    onClick={fetchAdminRoomList}
                    className="p-2 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-full transition-colors"
                    title="목록 새로고침"
                  >
                    <RefreshCw className={`w-4 h-4 ${loadingRoomList ? 'animate-spin' : ''}`} />
                  </button>
                </div>

                <div className="flex flex-col gap-2.5 max-h-60 overflow-y-auto pr-1">
                  {loadingRoomList ? (
                    <p className="text-xs text-gray-400 text-center py-4">방 목록 불러오는 중...</p>
                  ) : adminRoomList.length === 0 ? (
                    <p className="text-xs text-gray-400 text-center py-4">
                      아직 생성된 경매 방이 없습니다. 아래 버튼으로 새 방을 만드세요!
                    </p>
                  ) : (
                    adminRoomList.map((room) => (
                      <div
                        key={room.id}
                        className="flex items-center justify-between p-3.5 bg-[#F8FBFE] rounded-2xl border border-gray-100 hover:border-amber-200 transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-amber-100 text-amber-800 rounded-xl font-black flex items-center justify-center text-sm">
                            {room.room_code}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm text-gray-800">방코드: {room.room_code}</span>
                              {room.status === 'playing' ? (
                                <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-[10px] font-bold">
                                  진행 중 ({room.meta.currentCardIndex + 1}/24)
                                </span>
                              ) : room.status === 'ended' ? (
                                <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full text-[10px] font-bold">
                                  종료됨
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-[10px] font-bold">
                                  대기 중
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-gray-400">
                              단계: {room.meta.phase} ·{' '}
                              {room.created_at ? new Date(room.created_at).toLocaleDateString() : ''}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleAdminEnterRoom(room.room_code)}
                            className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition-transform hover:scale-105 shadow-sm flex items-center gap-1"
                          >
                            <Play className="w-3 h-3 fill-current" /> 진행하기
                          </button>
                          <button
                            onClick={() => handleDeleteRoom(room.id, room.room_code)}
                            className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                            title="방 삭제"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            <div className="bg-gradient-to-br from-amber-500/10 to-rose-500/10 rounded-[2.5rem] p-8 shadow-[0_10px_30px_rgba(181,200,255,0.2)] border border-amber-200/60 flex flex-col justify-between gap-6">
              <div>
                <div className="w-12 h-12 bg-amber-100 text-amber-700 rounded-2xl flex items-center justify-center text-2xl mb-4 font-bold">
                  🏫
                </div>
                <h3 className="text-2xl font-black text-[#2D3748] mb-2">선생님 전용 경매 방 생성</h3>
                <p className="text-sm text-gray-600 font-medium mb-4">
                  6개 팀에 자동으로 <strong>100코인</strong>과 <strong>공통 임무용 랜덤 정수</strong>가 배정되며, <strong>24장의 연산·특수 경매 카드</strong>가 준비됩니다.
                </p>
                <div className="bg-white/80 rounded-2xl p-4 border border-amber-100 text-xs text-gray-600 flex flex-col gap-1.5">
                  <div className="font-black text-amber-800">📌 진행 요약</div>
                  <div>1. 각 팀 접속 & 비밀 임무(양수 최대화 / 음수 최대화) 선택</div>
                  <div>2. 24장 카드 라운드별 비공개 입찰 → 최고가 낙찰 (동점 시 재입찰·가위바위보)</div>
                  <div>3. 경매 종료 후 획득 카드 순서 배치 → 비밀 임무 + 공통 임무(최대 80점) 합산!</div>
                </div>
              </div>

              {isAdmin ? (
                <button
                  onClick={handleCreateRoom}
                  disabled={loading}
                  className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-black text-lg rounded-full shadow-lg hover:scale-[1.02] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  {loading ? '생성 중...' : '새로운 숫자 경매 방 만들기 ✨'}
                </button>
              ) : (
                <div className="p-4 bg-white/80 rounded-2xl border border-amber-200 text-xs text-amber-800 font-semibold text-center">
                  💡 방 생성을 하려면 선생님 계정(학번 10000)으로 로그인해 주세요.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ───── 2. 방 접속 후 (실시간 경매 게임 화면) ───── */}
      {currentRoom && (
        <div className="flex flex-col gap-6">
          {/* 상단 방 정보 & 관리자 진행 컨트롤 바 */}
          <div className="bg-white rounded-[2.5rem] p-6 shadow-[0_10px_30px_rgba(181,200,255,0.2)] border border-white flex flex-col lg:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-amber-100 text-amber-800 rounded-2xl flex items-center justify-center font-black text-2xl shadow-inner">
                {currentRoom.room_code}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">방 코드</span>
                  <span className="px-2.5 py-0.5 bg-amber-100 text-amber-800 rounded-full text-xs font-black">
                    {currentRoom.meta.phase === 'waiting' && '🟢 게임 준비 · 비밀 임무 선택 중'}
                    {currentRoom.meta.phase === 'bidding' &&
                      `🔥 라운드 ${currentRoom.meta.currentCardIndex + 1}/24 비공개 입찰 중`}
                    {currentRoom.meta.phase === 'tie_rebidding' && '⚡ 최고가 동점 팀 재입찰 중'}
                    {currentRoom.meta.phase === 'tie_rps' && '✌️ 재입찰 동점 가위바위보 결정 중'}
                    {currentRoom.meta.phase === 'special_effect' && '✨ 특수 카드 효과 결정 중'}
                    {currentRoom.meta.phase === 'revealed' &&
                      `📢 라운드 ${currentRoom.meta.currentCardIndex + 1}/24 결과 공개`}
                    {currentRoom.meta.phase === 'arranging' && '🧮 최종 숫자 계산 · 카드 순서 배치 중'}
                    {currentRoom.meta.phase === 'ended' && '🏆 최종 점수 및 순위 발표 완료'}
                  </span>
                </div>
                <h4 className="text-lg font-black text-gray-800 mt-1">
                  숫자 경매 게임 멀티룸
                </h4>
                <p className="text-xs text-gray-500 font-semibold flex items-center gap-2 mt-0.5">
                  <Users className="w-3.5 h-3.5 text-amber-600" />
                  접속 인원:{' '}
                  {currentRoom.teams.reduce((acc, t) => acc + t.members.length, 0)}명 (6개 팀)
                </p>
              </div>
            </div>

            {/* 관리자 전용 진행 버튼 모음 */}
            {isAdmin && (
              <div className="flex items-center gap-2 flex-wrap justify-center">
                {currentRoom.meta.phase === 'waiting' && (
                  <button
                    onClick={handleStartAuction}
                    disabled={loading}
                    className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-black rounded-full shadow-md hover:scale-105 transition-all text-sm flex items-center gap-2"
                  >
                    <Play className="w-4 h-4 fill-current" /> 1라운드 경매 시작하기 (1/24)
                  </button>
                )}

                {currentRoom.meta.phase === 'bidding' && (
                  <>
                    <div className="px-3.5 py-2 bg-amber-50 border border-amber-200 rounded-2xl text-xs font-black text-amber-900">
                      입찰 완료: {currentRoom.teams.filter((t) => t.hasBid).length} / 6팀
                    </div>
                    <button
                      onClick={handleRevealBids}
                      disabled={loading}
                      className="px-5 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-black rounded-full shadow-md hover:scale-105 transition-all text-sm flex items-center gap-1.5"
                    >
                      <Sparkles className="w-4 h-4" /> 입찰 마감 및 금액 공개
                    </button>
                  </>
                )}

                {currentRoom.meta.phase === 'tie_rebidding' && (
                  <>
                    <div className="px-3.5 py-2 bg-rose-50 border border-rose-200 rounded-2xl text-xs font-black text-rose-800">
                      재입찰 완료:{' '}
                      {
                        currentRoom.teams.filter(
                          (t) => currentRoom.meta.tiedTeams.includes(t.teamNumber) && t.hasRebid
                        ).length
                      }{' '}
                      / {currentRoom.meta.tiedTeams.length}팀
                    </div>
                    <button
                      onClick={handleRevealRebids}
                      disabled={loading}
                      className="px-5 py-3 bg-gradient-to-r from-rose-500 to-pink-600 text-white font-black rounded-full shadow-md hover:scale-105 transition-all text-sm flex items-center gap-1.5"
                    >
                      <Sparkles className="w-4 h-4" /> 재입찰 마감 및 결과 공개
                    </button>
                  </>
                )}

                {currentRoom.meta.phase === 'revealed' && (
                  <button
                    onClick={handleNextRound}
                    disabled={loading}
                    className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-black rounded-full shadow-md hover:scale-105 transition-all text-sm flex items-center gap-1.5"
                  >
                    {currentRoom.meta.currentCardIndex + 1 < currentRoom.meta.deck.length ? (
                      <>
                        다음 카드로 이동 ({currentRoom.meta.currentCardIndex + 2}/24){' '}
                        <ArrowRight className="w-4 h-4" />
                      </>
                    ) : (
                      <>
                        최종 숫자 계산 단계로 이동 <Calculator className="w-4 h-4" />
                      </>
                    )}
                  </button>
                )}

                {(currentRoom.meta.phase === 'bidding' ||
                  currentRoom.meta.phase === 'revealed') && (
                  <button
                    onClick={handleStartArranging}
                    disabled={loading}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-full text-xs transition-all"
                    title="남은 카드를 건너뛰고 즉시 카드 순서 배치 단계로 이동"
                  >
                    계산 단계로 바로 이동
                  </button>
                )}

                {currentRoom.meta.phase === 'arranging' && (
                  <>
                    <div className="px-3.5 py-2 bg-indigo-50 border border-indigo-200 rounded-2xl text-xs font-black text-indigo-800">
                      순서 확정: {currentRoom.teams.filter((t) => t.orderConfirmed).length} / 6팀
                    </div>
                    <button
                      onClick={handleFinishGame}
                      disabled={loading}
                      className="px-6 py-3 bg-gradient-to-r from-amber-500 to-rose-500 text-white font-black rounded-full shadow-lg hover:scale-105 transition-all text-sm flex items-center gap-1.5"
                    >
                      <Trophy className="w-4 h-4" /> 최종 점수 및 순위 발표!
                    </button>
                  </>
                )}

                <button
                  onClick={handleResetGame}
                  className="p-2.5 bg-gray-100 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                  title="게임 초기화(리셋)"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* ── 중앙 메인 전광판 (현재 경매 카드 / 진행 메시지 / 특수 카드 모션) ── */}
          <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-[2.5rem] p-6 sm:p-8 text-white shadow-2xl flex flex-col items-center justify-center text-center gap-5 relative overflow-hidden border border-slate-800">
            {/* 상단 상태 메시지 */}
            <div className="px-4 py-2 bg-white/10 backdrop-blur-md rounded-2xl border border-white/15 text-xs sm:text-sm font-bold text-amber-200 max-w-2xl">
              {currentRoom.meta.lastRoundMessage}
            </div>

            {/* 경매 진행 중일 때 현재 라운드 카드 표시 */}
            {(currentRoom.meta.phase === 'bidding' ||
              currentRoom.meta.phase === 'tie_rebidding' ||
              currentRoom.meta.phase === 'tie_rps' ||
              currentRoom.meta.phase === 'special_effect' ||
              currentRoom.meta.phase === 'revealed') &&
              currentCard && (
                <div className="flex flex-col items-center gap-3 my-1">
                  <span className="text-xs font-black uppercase tracking-widest text-indigo-300">
                    Auction Card {currentRoom.meta.currentCardIndex + 1} / {currentRoom.meta.deck.length}
                  </span>

                  <div
                    className={`w-56 sm:w-64 p-6 rounded-3xl flex flex-col items-center justify-center gap-2 shadow-[0_0_50px_rgba(251,191,36,0.35)] border-4 transition-all ${
                      currentCard.isSpecial
                        ? 'bg-gradient-to-br from-purple-500 via-fuchsia-500 to-amber-400 text-white border-amber-200'
                        : 'bg-gradient-to-br from-amber-300 via-amber-400 to-orange-500 text-slate-950 border-white'
                    }`}
                  >
                    <span className="text-[11px] font-black px-2.5 py-0.5 rounded-full bg-black/20 text-white uppercase">
                      {currentCard.isSpecial ? '★ 특수 카드 ★' : '일반 연산 카드'}
                    </span>
                    <div className="text-3xl sm:text-4xl font-black tracking-tight my-1">
                      {currentCard.label}
                    </div>
                    <p
                      className={`text-xs font-bold leading-snug ${
                        currentCard.isSpecial ? 'text-purple-50' : 'text-slate-900/80'
                      }`}
                    >
                      {currentCard.description}
                    </p>
                  </div>

                  {/* 이전에 낙찰된 일반 카드 목록 안내 (미스터리 와일드카드 복제 가능 후보) */}
                  <div className="flex items-center gap-1.5 flex-wrap justify-center text-xs text-slate-300 mt-1">
                    <span className="text-slate-400 font-bold">복제 가능한 낙찰 일반 카드:</span>
                    {currentRoom.meta.wonNormalCardTypes.length === 0 ? (
                      <span className="text-slate-500">아직 없음</span>
                    ) : (
                      currentRoom.meta.wonNormalCardTypes.map((t) => (
                        <span
                          key={t}
                          className="px-2 py-0.5 bg-slate-800 text-amber-300 rounded-lg font-black border border-slate-700"
                        >
                          {NORMAL_CARD_LABELS[t]}
                        </span>
                      ))
                    )}
                  </div>
                </div>
              )}

            {/* ── 특수 카드 효과 결정 UI (운명의 동전 던지기 / 미스터리 와일드카드 선택) ── */}
            {currentRoom.meta.phase === 'special_effect' && currentCard && (
              <div className="w-full max-w-xl bg-white/10 backdrop-blur-md border-2 border-amber-300 rounded-3xl p-6 flex flex-col items-center gap-4 animate-fade-in">
                <h4 className="text-lg font-black text-amber-300">
                  ✨ {currentRoom.meta.pendingWinnerTeam}팀 특수 카드 효과 결정!
                </h4>
                {selectedTeamNum === currentRoom.meta.pendingWinnerTeam || isAdmin ? (
                  currentCard.type === 'COIN' ? (
                    <div className="flex flex-col items-center gap-3">
                      <p className="text-xs text-slate-200">
                        아래 버튼을 눌러 운명의 동전을 던지세요! 앞면이면 <strong>+10</strong>, 뒷면이면 <strong>−10</strong>이 카드에 기록됩니다.
                      </p>
                      <button
                        onClick={() => handleResolveSpecial()}
                        disabled={loading}
                        className="px-8 py-4 bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 font-black text-lg rounded-full shadow-xl hover:scale-105 transition-transform flex items-center gap-2"
                      >
                        🪙 운명의 동전 던지기!
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-3 w-full">
                      <p className="text-xs text-slate-200">
                        이전에 낙찰된 일반 카드 중 복제할 효과 하나를 선택하세요!
                      </p>
                      <div className="flex flex-wrap gap-2 justify-center">
                        {currentRoom.meta.wonNormalCardTypes.map((type) => (
                          <button
                            key={type}
                            onClick={() => handleResolveSpecial(type)}
                            disabled={loading}
                            className="px-5 py-3 bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 font-black rounded-2xl shadow-md hover:scale-105 transition-all text-base"
                          >
                            {NORMAL_CARD_LABELS[type]} 복제하기
                          </button>
                        ))}
                      </div>
                    </div>
                  )
                ) : (
                  <p className="text-sm text-amber-200 font-bold animate-pulse">
                    ⏳ 낙찰받은 {currentRoom.meta.pendingWinnerTeam}팀이 특수 카드 효과를 결정하고 있습니다...
                  </p>
                )}
              </div>
            )}

            {/* ── 가위바위보 동점 결승전 UI (tie_rps) ── */}
            {currentRoom.meta.phase === 'tie_rps' && (
              <div className="w-full max-w-xl bg-white/10 backdrop-blur-md border-2 border-rose-400 rounded-3xl p-6 flex flex-col items-center gap-4 animate-fade-in">
                <div className="text-base font-black text-rose-300">
                  ✊✌️✋ 재입찰 동점 가위바위보! (대상:{' '}
                  {currentRoom.meta.tiedTeams.map((n) => `${n}팀`).join(' vs ')})
                </div>

                {currentRoom.meta.tiedTeams.includes(selectedTeamNum) && myTeam && (
                  <div className="flex flex-col items-center gap-3 w-full">
                    {myTeam.rpsChoice ? (
                      <div className="px-4 py-2 bg-emerald-500/20 border border-emerald-400 rounded-2xl text-emerald-200 font-bold text-sm">
                        ✅ {selectedTeamNum}팀 선택 완료! 다른 동점 팀의 선택을 기다리는 중입니다...
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 justify-center flex-wrap">
                        <button
                          onClick={() => handleSubmitRPS(selectedTeamNum, 'scissors')}
                          disabled={loading}
                          className="px-6 py-4 bg-white text-slate-900 hover:bg-amber-300 font-black rounded-2xl text-xl shadow-lg transition-transform hover:scale-105"
                        >
                          ✌️ 가위
                        </button>
                        <button
                          onClick={() => handleSubmitRPS(selectedTeamNum, 'rock')}
                          disabled={loading}
                          className="px-6 py-4 bg-white text-slate-900 hover:bg-amber-300 font-black rounded-2xl text-xl shadow-lg transition-transform hover:scale-105"
                        >
                          ✊ 바위
                        </button>
                        <button
                          onClick={() => handleSubmitRPS(selectedTeamNum, 'paper')}
                          disabled={loading}
                          className="px-6 py-4 bg-white text-slate-900 hover:bg-amber-300 font-black rounded-2xl text-xl shadow-lg transition-transform hover:scale-105"
                        >
                          ✋ 보
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* 선생님용 오프라인 가위바위보 승자 즉시 지정 버튼 */}
                {isAdmin && (
                  <div className="border-t border-white/15 pt-3 w-full flex flex-col items-center gap-2">
                    <span className="text-xs text-slate-300">
                      💡 교실에서 직접 가위바위보를 진행했다면 승리한 팀을 바로 클릭해 낙찰시킬 수 있습니다:
                    </span>
                    <div className="flex gap-2 flex-wrap justify-center">
                      {currentRoom.meta.tiedTeams.map((tNum) => (
                        <button
                          key={tNum}
                          onClick={() => handleAdminSelectTieWinner(tNum)}
                          disabled={loading}
                          className="px-4 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-full text-xs shadow"
                        >
                          👑 {tNum}팀 승리로 낙찰
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── 팀 전환 바 (학생은 대기실에서 팀 변경 가능, 선생님은 1~6팀 탭 전환으로 모든 팀 지원 가능) ── */}
          <div className="bg-white rounded-3xl p-4 shadow-sm border border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-gray-500">
                {isAdmin ? '👑 선생님 팀 제어 탭 선택:' : '🙋 내 소속 팀:'}
              </span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {TEAM_COLORS.map((tc) => {
                  const active = selectedTeamNum === tc.teamNumber;
                  const canSwitch = isAdmin || currentRoom.meta.phase === 'waiting';
                  return (
                    <button
                      key={tc.teamNumber}
                      disabled={!canSwitch && !active}
                      onClick={() => handleSwitchTeam(tc.teamNumber)}
                      className={`px-3 py-1.5 rounded-full text-xs font-black transition-all flex items-center gap-1 ${
                        active
                          ? `bg-gradient-to-r ${tc.gradient} text-white shadow-md scale-105`
                          : canSwitch
                          ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          : 'bg-gray-50 text-gray-300 cursor-not-allowed'
                      }`}
                    >
                      <span>{tc.emoji}</span>
                      <span>{tc.teamNumber}팀</span>
                    </button>
                  );
                })}
              </div>
            </div>
            {!isAdmin && currentRoom.meta.phase !== 'waiting' && (
              <span className="text-[11px] text-gray-400 font-semibold">
                * 경매가 시작된 이후에는 소속 팀이 고정됩니다.
              </span>
            )}
          </div>

          {/* ── 선택된 팀(내 팀) 전용 컨트롤 & 실시간 계산기 대시보드 ── */}
          {myTeam && currentRoom.meta.phase !== 'ended' && (
            <div
              className={`bg-white rounded-[2.5rem] p-6 sm:p-8 shadow-[0_12px_40px_rgba(199,206,234,0.3)] border-2 ${myTeamTheme.border} flex flex-col gap-6`}
            >
              {/* 팀 상단 요약 바 */}
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b pb-4 border-gray-100">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${myTeamTheme.gradient} text-white flex items-center justify-center text-2xl shadow-md`}
                  >
                    {myTeamTheme.emoji}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl font-black text-gray-800">{myTeam.teamName} 전략 보드</h3>
                      <span className="px-2.5 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs font-bold">
                        팀원 {myTeam.members.length}명
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {myTeam.members.length > 0
                        ? `참가자: ${myTeam.members.map((m) => m.name).join(', ')}`
                        : '아직 이 팀에 입장한 학생이 없습니다.'}
                    </p>
                  </div>
                </div>

                {/* 보유 코인 & 비밀 임무 & 공통 임무 랜덤 정수 배지 */}
                <div className="flex items-center gap-2.5 flex-wrap">
                  <div className="px-4 py-2 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-2">
                    <Coins className="w-5 h-5 text-amber-500" />
                    <div>
                      <p className="text-[10px] text-amber-700 font-bold">보유 자금</p>
                      <p className="text-base font-black text-amber-900">{myTeam.coins} 코인</p>
                    </div>
                  </div>

                  <div className="px-4 py-2 bg-indigo-50 border border-indigo-200 rounded-2xl">
                    <p className="text-[10px] text-indigo-600 font-bold">공통임무 랜덤 정수</p>
                    <p className="text-base font-black text-indigo-900">{myTeam.randomInt}의 배수 만들기</p>
                  </div>

                  <div className="px-4 py-2 bg-rose-50 border border-rose-200 rounded-2xl">
                    <p className="text-[10px] text-rose-600 font-bold">우리 팀 비밀 임무</p>
                    <p className="text-base font-black text-rose-900">
                      {myTeam.secretMission === 'positive' ? '➕ 양수 최대화' : '➖ 음수 최대화'}
                    </p>
                  </div>
                </div>
              </div>

              {/* 1) 대기 중일 때: 비밀 임무 선택 UI */}
              {currentRoom.meta.phase === 'waiting' && (
                <div className="bg-gradient-to-br from-indigo-50/70 to-purple-50/70 rounded-3xl p-6 border border-indigo-100 flex flex-col gap-4">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <h4 className="text-base font-black text-indigo-950">
                        🎯 1단계: 우리 팀의 비밀 임무를 선택하세요!
                      </h4>
                      <p className="text-xs text-indigo-700 mt-0.5">
                        여러 팀이 같은 임무를 선택해도 됩니다. 다른 팀에게는 게임이 끝날 때까지 비밀로 유지됩니다!
                      </p>
                    </div>
                    {myTeam.missionConfirmed && (
                      <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-black flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> 임무 선택 완료
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => handleSelectMission(myTeam.teamNumber, 'positive')}
                      disabled={loading}
                      className={`p-5 rounded-2xl border-2 text-left transition-all flex flex-col gap-1 ${
                        myTeam.secretMission === 'positive'
                          ? 'bg-white border-rose-500 shadow-md ring-2 ring-rose-200'
                          : 'bg-white/70 border-gray-200 hover:border-rose-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-black text-rose-600">➕ 양수 최대화</span>
                        {myTeam.secretMission === 'positive' && (
                          <span className="px-2 py-0.5 bg-rose-500 text-white rounded-full text-[10px] font-bold">
                            선택됨
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-600 font-medium">
                        최종 숫자를 가능한 한 <strong>큰 양수(+)</strong>로 만듭니다. (최종 숫자가 양수이면 그 숫자가 그대로 점수!)
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSelectMission(myTeam.teamNumber, 'negative')}
                      disabled={loading}
                      className={`p-5 rounded-2xl border-2 text-left transition-all flex flex-col gap-1 ${
                        myTeam.secretMission === 'negative'
                          ? 'bg-white border-indigo-600 shadow-md ring-2 ring-indigo-200'
                          : 'bg-white/70 border-gray-200 hover:border-indigo-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-black text-indigo-600">➖ 음수 최대화</span>
                        {myTeam.secretMission === 'negative' && (
                          <span className="px-2 py-0.5 bg-indigo-600 text-white rounded-full text-[10px] font-bold">
                            선택됨
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-600 font-medium">
                        최종 숫자를 가능한 한 <strong>작은 음수(−)</strong>로 만듭니다. (최종 숫자가 음수이면 절댓값이 점수!)
                      </p>
                    </button>
                  </div>
                </div>
              )}

              {/* 2) 일반 입찰 단계일 때: 비공개 입찰 입력 UI */}
              {currentRoom.meta.phase === 'bidding' && (
                <div className="bg-amber-50/70 rounded-3xl p-6 border border-amber-200 flex flex-col gap-4">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <h4 className="text-base font-black text-amber-950">
                        💰 라운드 {currentRoom.meta.currentCardIndex + 1} 비공개 입찰하기
                      </h4>
                      <p className="text-xs text-amber-800">
                        보유 코인(<strong>{myTeam.coins}코인</strong>) 이하로 입찰할 수 있습니다. 입찰하지 않으려면 0코인을 제출하세요.
                      </p>
                    </div>
                    {myTeam.hasBid && (
                      <span className="px-3 py-1 bg-emerald-500 text-white rounded-full text-xs font-black flex items-center gap-1 shadow-sm">
                        <Check className="w-3.5 h-3.5" /> 비공개 입찰 완료 ({myTeam.currentBid}코인)
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-3">
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <input
                        type="number"
                        min={0}
                        max={myTeam.coins}
                        value={bidInput}
                        onChange={(e) => setBidInput(e.target.value)}
                        className="w-full sm:w-36 px-4 py-3 text-center text-xl font-black bg-white border-2 border-amber-300 rounded-2xl focus:outline-none focus:border-amber-500"
                      />
                      <span className="font-black text-amber-900 shrink-0">코인</span>
                    </div>

                    {/* 빠른 금액 버튼 */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {[0, 5, 10, 15, 20, 30].map((val) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setBidInput(String(Math.min(myTeam.coins, val)))}
                          className="px-3 py-2 bg-white hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-xl text-xs font-bold transition-colors"
                        >
                          {val === 0 ? '0 (포기)' : `${val}코인`}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => setBidInput(String(myTeam.coins))}
                        className="px-3 py-2 bg-rose-100 hover:bg-rose-200 text-rose-700 border border-rose-200 rounded-xl text-xs font-black transition-colors"
                      >
                        올인 ({myTeam.coins})
                      </button>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto sm:ml-auto">
                      <button
                        type="button"
                        onClick={() => handleSubmitBid(myTeam.teamNumber)}
                        disabled={loading}
                        className="flex-1 sm:flex-initial px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-black rounded-2xl shadow-md hover:scale-105 transition-all text-sm"
                      >
                        {myTeam.hasBid ? '입찰 금액 수정' : '비공개 입찰 확정 🔒'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setBidInput('0');
                          handleSubmitBid(myTeam.teamNumber, 0);
                        }}
                        disabled={loading}
                        className="px-4 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold rounded-2xl text-xs transition-all"
                      >
                        입찰 포기(0)
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* 3) 최고가 동점 재입찰 단계일 때 (동점 대상 팀만 활성화) */}
              {currentRoom.meta.phase === 'tie_rebidding' &&
                currentRoom.meta.tiedTeams.includes(myTeam.teamNumber) && (
                  <div className="bg-rose-50 rounded-3xl p-6 border-2 border-rose-300 flex flex-col gap-4 animate-fade-in">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div>
                        <h4 className="text-base font-black text-rose-900">
                          ⚡ 최고가 동점 재입찰! (최소 {currentRoom.meta.tieMinBid}코인 ~ 최대 {myTeam.coins}코인)
                        </h4>
                        <p className="text-xs text-rose-700">
                          재입찰 금액은 처음 동점이 된 금액({currentRoom.meta.tieMinBid}코인) 이상이어야 합니다!
                        </p>
                      </div>
                      {myTeam.hasRebid && (
                        <span className="px-3 py-1 bg-emerald-500 text-white rounded-full text-xs font-black">
                          ✅ 재입찰 완료 ({myTeam.rebidAmount}코인)
                        </span>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-3">
                      <input
                        type="number"
                        min={currentRoom.meta.tieMinBid}
                        max={myTeam.coins}
                        value={rebidInput}
                        onChange={(e) => setRebidInput(e.target.value)}
                        className="w-full sm:w-40 px-4 py-3 text-center text-xl font-black bg-white border-2 border-rose-300 rounded-2xl"
                      />
                      <button
                        type="button"
                        onClick={() => handleSubmitRebid(myTeam.teamNumber)}
                        disabled={loading}
                        className="px-6 py-3 bg-gradient-to-r from-rose-500 to-pink-600 text-white font-black rounded-2xl shadow-md hover:scale-105 transition-all text-sm"
                      >
                        🔥 재입찰 금액 제출
                      </button>
                    </div>
                  </div>
                )}

              {/* 4) 우리 팀 획득 카드 순서 배치 & 실시간 계산 시뮬레이터 (상시 또는 arranging 단계에서 사용) */}
              {(() => {
                const evalInfo = evaluateTeamScore(
                  myTeam.cards,
                  myTeam.secretMission,
                  myTeam.randomInt
                );
                return (
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                      <div>
                        <h4 className="text-base font-black text-gray-800 flex items-center gap-2">
                          <Calculator className="w-5 h-5 text-indigo-600" />
                          획득한 카드 순서 배치 & 최종 숫자 계산표 ({myTeam.cards.length}장)
                        </h4>
                        <p className="text-xs text-gray-500">
                          카드의 ◀ ▶ 버튼을 눌러 사용할 순서를 자유롭게 바꾸면 최종 숫자와 점수가 즉시 계산됩니다!
                        </p>
                      </div>

                      {currentRoom.meta.phase === 'arranging' && (
                        <button
                          onClick={() => handleConfirmCardOrder(myTeam)}
                          disabled={loading}
                          className={`px-5 py-2.5 rounded-full font-black text-xs shadow-md transition-all flex items-center gap-1.5 ${
                            myTeam.orderConfirmed
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:scale-105'
                          }`}
                        >
                          <Check className="w-4 h-4" />
                          {myTeam.orderConfirmed ? '최종 순서 제출 완료 (수정 가능)' : '이 순서로 최종 제출하기'}
                        </button>
                      )}
                    </div>

                    {/* 카드 순서 변경 슬롯 */}
                    {myTeam.cards.length === 0 ? (
                      <div className="p-6 bg-[#F8FBFE] rounded-2xl border border-dashed border-gray-200 text-center text-xs text-gray-400 font-semibold">
                        아직 낙찰받은 카드가 없습니다. 경매에서 카드를 낙찰받아 보세요! (시작 숫자: 0)
                      </div>
                    ) : (
                      <div className="flex items-center gap-2.5 flex-wrap bg-[#F8FBFE] p-4 rounded-3xl border border-gray-100">
                        <div className="px-3 py-2 bg-slate-800 text-white rounded-2xl text-xs font-black">
                          시작: 0
                        </div>
                        {myTeam.cards.map((card, idx) => (
                          <div key={card.id} className="flex items-center gap-1.5">
                            <span className="text-gray-300 font-black">➔</span>
                            <div className="bg-white border-2 border-indigo-200 rounded-2xl px-3.5 py-2 shadow-sm flex flex-col items-center gap-1 min-w-[96px]">
                              <span className="text-[10px] font-bold text-indigo-400">
                                {idx + 1}번째 사용
                              </span>
                              <span className="text-sm font-black text-gray-800">
                                {card.resolvedLabel || card.label}
                              </span>
                              <div className="flex items-center gap-1 mt-0.5">
                                <button
                                  type="button"
                                  disabled={idx === 0}
                                  onClick={() => handleMoveCard(myTeam, idx, idx - 1, false)}
                                  className="px-1.5 py-0.5 bg-gray-100 hover:bg-indigo-100 disabled:opacity-30 rounded text-[10px] font-black text-gray-600"
                                  title="앞으로 이동"
                                >
                                  ◀
                                </button>
                                <button
                                  type="button"
                                  disabled={idx === myTeam.cards.length - 1}
                                  onClick={() => handleMoveCard(myTeam, idx, idx + 1, false)}
                                  className="px-1.5 py-0.5 bg-gray-100 hover:bg-indigo-100 disabled:opacity-30 rounded text-[10px] font-black text-gray-600"
                                  title="뒤로 이동"
                                >
                                  ▶
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                        <span className="text-gray-400 font-black">➔</span>
                        <div className="px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl text-sm font-black shadow-md">
                          최종 숫자: {evalInfo.finalNumber}
                        </div>
                      </div>
                    )}

                    {/* 단계별 계산 과정 표 & 공통/비밀 임무 달성 현황 */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {/* 계산 과정 테이블 */}
                      <div className="bg-[#F8FBFE] rounded-2xl p-4 border border-gray-100">
                        <h5 className="text-xs font-black text-gray-700 mb-2">
                          📋 단계별 계산 과정 기록표
                        </h5>
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs text-left">
                            <thead>
                              <tr className="border-b border-gray-200 text-gray-400">
                                <th className="py-1.5 px-2">순서</th>
                                <th className="py-1.5 px-2">카드</th>
                                <th className="py-1.5 px-2">계산</th>
                                <th className="py-1.5 px-2 text-right">결과</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 font-semibold">
                              <tr>
                                <td className="py-1.5 px-2 text-gray-500">시작</td>
                                <td className="py-1.5 px-2 text-gray-400">—</td>
                                <td className="py-1.5 px-2 text-gray-400">—</td>
                                <td className="py-1.5 px-2 text-right font-black text-gray-700">0</td>
                              </tr>
                              {evalInfo.steps.map((st) => (
                                <tr key={st.stepNumber}>
                                  <td className="py-1.5 px-2 text-indigo-600 font-bold">
                                    {st.stepNumber}
                                  </td>
                                  <td className="py-1.5 px-2 font-black text-gray-800">
                                    {st.card.resolvedLabel || st.card.label}
                                  </td>
                                  <td className="py-1.5 px-2 text-gray-600">{st.formula}</td>
                                  <td className="py-1.5 px-2 text-right font-black text-indigo-700">
                                    {st.resultValue}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* 공통 임무(4종) & 예상 점수 요약 */}
                      <div className="bg-[#F8FBFE] rounded-2xl p-4 border border-gray-100 flex flex-col justify-between gap-3">
                        <div>
                          <h5 className="text-xs font-black text-gray-700 mb-2">
                            🏅 공통 임무 달성 현황 (각 20점, 최대 80점)
                          </h5>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                            <div
                              className={`p-2.5 rounded-xl border flex items-center justify-between ${
                                evalInfo.commonMission.diverseOps
                                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                                  : 'bg-white border-gray-100 text-gray-400'
                              }`}
                            >
                              <div>
                                <div className="font-bold">1. 다양한 연산 활용</div>
                                <div className="text-[10px]">
                                  연산 종류 3가지 이상 ({evalInfo.commonMission.usedOpCategories.length}/3)
                                </div>
                              </div>
                              <span className="font-black">
                                {evalInfo.commonMission.diverseOps ? '+20점 ✅' : '0점'}
                              </span>
                            </div>

                            <div
                              className={`p-2.5 rounded-xl border flex items-center justify-between ${
                                evalInfo.commonMission.multipleOfRandom
                                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                                  : 'bg-white border-gray-100 text-gray-400'
                              }`}
                            >
                              <div>
                                <div className="font-bold">2. 랜덤 정수의 배수</div>
                                <div className="text-[10px]">
                                  랜덤 정수 [{myTeam.randomInt}]의 배수
                                </div>
                              </div>
                              <span className="font-black">
                                {evalInfo.commonMission.multipleOfRandom ? '+20점 ✅' : '0점'}
                              </span>
                            </div>

                            <div
                              className={`p-2.5 rounded-xl border flex items-center justify-between ${
                                evalInfo.commonMission.manyDivisors
                                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                                  : 'bg-white border-gray-100 text-gray-400'
                              }`}
                            >
                              <div>
                                <div className="font-bold">3. 약수가 많은 수</div>
                                <div className="text-[10px]">
                                  |{evalInfo.finalNumber}|의 약수 4개 이상 ({evalInfo.commonMission.divisorsOfAbs.length}개)
                                </div>
                              </div>
                              <span className="font-black">
                                {evalInfo.commonMission.manyDivisors ? '+20점 ✅' : '0점'}
                              </span>
                            </div>

                            <div
                              className={`p-2.5 rounded-xl border flex items-center justify-between ${
                                evalInfo.commonMission.auctionExpert
                                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                                  : 'bg-white border-gray-100 text-gray-400'
                              }`}
                            >
                              <div>
                                <div className="font-bold">4. 경매 전문가</div>
                                <div className="text-[10px]">
                                  카드 4장 이상 낙찰 ({myTeam.cards.length}장)
                                </div>
                              </div>
                              <span className="font-black">
                                {evalInfo.commonMission.auctionExpert ? '+20점 ✅' : '0점'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* 점수 합산 바 */}
                        <div className="bg-white p-3 rounded-xl border border-indigo-100 flex items-center justify-between text-xs font-bold">
                          <span className="text-gray-600">
                            비밀임무({evalInfo.secretMissionScore}점) + 공통임무({evalInfo.commonMission.score}점)
                          </span>
                          <span className="text-base font-black text-indigo-600">
                            예상 총점: {evalInfo.totalScore}점
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* ── 최종 결과 발표 리더보드 (phase === 'ended') ── */}
          {currentRoom.meta.phase === 'ended' && (
            <div className="bg-white rounded-[2.5rem] p-6 sm:p-8 shadow-2xl border-2 border-amber-300 flex flex-col gap-6 animate-fade-in">
              <div className="flex flex-col sm:flex-row items-center justify-between border-b pb-4 border-gray-100 gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 text-white rounded-2xl flex items-center justify-center text-2xl shadow-md">
                    🏆
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-gray-800">
                      숫자 경매 게임 최종 결과 및 우승팀 발표!
                    </h3>
                    <p className="text-xs text-gray-500 font-semibold">
                      동점 처리 기준: 1순위 최종 점수 ➔ 2순위 획득 카드 수 ➔ 3순위 남은 코인 (모두 같으면 공동 등수)
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                {getRankedTeams().map(({ team, scoreInfo, rank }) => {
                  const tc = TEAM_COLORS.find((c) => c.teamNumber === team.teamNumber) || TEAM_COLORS[0];
                  const medals: Record<number, string> = { 1: '🥇 1위', 2: '🥈 2위', 3: '🥉 3위' };
                  const isExpanded = selectedTeamDetail === team.teamNumber;

                  return (
                    <div
                      key={team.teamNumber}
                      className={`rounded-3xl p-5 border-2 transition-all ${
                        rank === 1
                          ? 'bg-gradient-to-r from-amber-50 via-yellow-50 to-orange-50 border-amber-400 shadow-lg'
                          : 'bg-[#F8FBFE] border-gray-100'
                      }`}
                    >
                      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <span
                            className={`px-3.5 py-1.5 rounded-2xl font-black text-sm ${
                              rank === 1
                                ? 'bg-amber-400 text-slate-950 shadow'
                                : rank <= 3
                                ? 'bg-indigo-100 text-indigo-800'
                                : 'bg-gray-200 text-gray-700'
                            }`}
                          >
                            {medals[rank] || `${rank}위`}
                          </span>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-lg font-black text-gray-800">
                                {tc.emoji} {team.teamName}
                              </span>
                              <span className="px-2.5 py-0.5 bg-white border border-gray-200 rounded-full text-xs font-bold text-gray-600">
                                비밀임무: {team.secretMission === 'positive' ? '➕ 양수 최대화' : '➖ 음수 최대화'}
                              </span>
                              <span className="px-2.5 py-0.5 bg-white border border-gray-200 rounded-full text-xs font-bold text-indigo-600">
                                랜덤 정수: {team.randomInt}의 배수
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                              최종 만든 숫자: <strong className="text-indigo-700">{scoreInfo.finalNumber}</strong> · 획득 카드: <strong>{team.cards.length}장</strong> · 남은 코인: <strong>{team.coins}코인</strong>
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 self-end md:self-center">
                          <div className="text-right">
                            <p className="text-[11px] text-gray-500 font-bold">
                              비밀({scoreInfo.secretMissionScore}) + 공통({scoreInfo.commonMission.score})
                            </p>
                            <p className="text-2xl font-black text-amber-600">
                              최종 {scoreInfo.totalScore}점
                            </p>
                          </div>
                          <button
                            onClick={() =>
                              setSelectedTeamDetail(isExpanded ? null : team.teamNumber)
                            }
                            className="px-3 py-2 bg-white hover:bg-gray-100 text-gray-700 border border-gray-200 rounded-xl text-xs font-bold flex items-center gap-1"
                          >
                            <Eye className="w-3.5 h-3.5" /> {isExpanded ? '과정 접기' : '계산 과정 보기'}
                          </button>
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="mt-4 pt-4 border-t border-gray-200 flex flex-col gap-2 text-xs">
                          <div className="font-bold text-gray-700">
                            사용한 카드 순서 및 계산식:
                          </div>
                          {scoreInfo.steps.length === 0 ? (
                            <p className="text-gray-400">사용한 카드가 없습니다 (최종 숫자: 0)</p>
                          ) : (
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="px-2.5 py-1 bg-slate-800 text-white rounded-lg font-bold">
                                시작: 0
                              </span>
                              {scoreInfo.steps.map((st) => (
                                <span
                                  key={st.stepNumber}
                                  className="px-3 py-1 bg-white border border-gray-200 rounded-lg font-semibold text-gray-700"
                                >
                                  {st.stepNumber}. [{st.card.resolvedLabel || st.card.label}] ➔ {st.formula}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── 6개 팀 전체 현황판 (보유 코인, 획득 카드, 입찰 현황) ── */}
          <div className="bg-white rounded-[2.5rem] p-6 sm:p-8 shadow-[0_10px_30px_rgba(181,200,255,0.2)] border border-white flex flex-col gap-4">
            <div className="flex items-center justify-between border-b pb-3 border-gray-100 flex-wrap gap-2">
              <h3 className="text-lg font-black text-gray-800 flex items-center gap-2">
                <Users className="w-5 h-5 text-amber-500" />
                전체 6팀 실시간 경매 현황판
              </h3>
              {isAdmin && (
                <button
                  onClick={() => setAdminShowSecretMissions(!adminShowSecretMissions)}
                  className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full text-xs font-bold transition-colors"
                >
                  {adminShowSecretMissions ? '🙈 팀별 비밀임무 가리기' : '👀 [선생님용] 팀별 비밀임무 미리보기'}
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {currentRoom.teams.map((t) => {
                const tc = TEAM_COLORS.find((c) => c.teamNumber === t.teamNumber) || TEAM_COLORS[0];
                const isWinnerThisRound =
                  currentRoom.meta.phase === 'revealed' &&
                  currentRoom.meta.pendingWinnerTeam === t.teamNumber;

                return (
                  <div
                    key={t.teamNumber}
                    className={`p-5 rounded-3xl border-2 transition-all flex flex-col justify-between gap-3 ${
                      isWinnerThisRound
                        ? 'bg-amber-50/80 border-amber-400 ring-2 ring-amber-200 shadow-md'
                        : 'bg-[#F8FBFE] border-gray-100'
                    }`}
                  >
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <span className="font-black text-base text-gray-800 flex items-center gap-1.5">
                          <span>{tc.emoji}</span>
                          <span>{t.teamName}</span>
                        </span>
                        <span className="px-3 py-1 bg-amber-100 text-amber-900 rounded-full text-xs font-black">
                          🪙 {t.coins}코인
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 flex-wrap text-[11px]">
                        <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-lg font-bold border border-indigo-100">
                          배수 목표: {t.randomInt}의 배수
                        </span>
                        {currentRoom.meta.phase === 'ended' || adminShowSecretMissions ? (
                          <span className="px-2 py-0.5 bg-rose-50 text-rose-700 rounded-lg font-bold border border-rose-100">
                            비밀: {t.secretMission === 'positive' ? '양수 최대화' : '음수 최대화'}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded-lg font-bold flex items-center gap-1">
                            <Lock className="w-3 h-3" /> 비밀임무 비공개
                          </span>
                        )}
                      </div>

                      {/* 획득한 카드 배지 목록 */}
                      <div className="mt-1">
                        <p className="text-[11px] font-bold text-gray-400 mb-1">
                          획득 카드 ({t.cards.length}장):
                        </p>
                        {t.cards.length === 0 ? (
                          <span className="text-xs text-gray-300">없음</span>
                        ) : (
                          <div className="flex items-center gap-1 flex-wrap">
                            {t.cards.map((c) => (
                              <span
                                key={c.id}
                                className="px-2 py-0.5 bg-white border border-gray-200 rounded-lg text-xs font-black text-gray-700 shadow-sm"
                              >
                                {c.resolvedLabel || c.label}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 현재 라운드 입찰 상태 표시 */}
                    <div className="pt-2 border-t border-gray-200/70 flex items-center justify-between text-xs">
                      <span className="text-gray-400 font-semibold">
                        팀원: {t.members.length > 0 ? t.members.map((m) => m.name).join(', ') : '없음'}
                      </span>

                      {currentRoom.meta.phase === 'bidding' && (
                        <span
                          className={`px-2.5 py-0.5 rounded-full font-black ${
                            t.hasBid
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-amber-100 text-amber-800 animate-pulse'
                          }`}
                        >
                          {t.hasBid ? '입찰 완료 🔒' : '고민 중 ⏳'}
                        </span>
                      )}

                      {(currentRoom.meta.phase === 'revealed' ||
                        currentRoom.meta.phase === 'tie_rebidding' ||
                        currentRoom.meta.phase === 'tie_rps' ||
                        currentRoom.meta.phase === 'special_effect') && (
                        <span className="px-2.5 py-0.5 bg-indigo-100 text-indigo-800 rounded-full font-black">
                          입찰가: {t.rebidAmount !== null ? `${t.rebidAmount}코인(재)` : `${t.currentBid ?? 0}코인`}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ───── 모달: 수학 경매 게임 규칙서 ───── */}
      {showRuleModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-2xl w-full p-6 sm:p-8 flex flex-col gap-5 max-h-[85vh] overflow-hidden">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-xl font-black text-gray-800 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-amber-500" />
                수학(숫자) 경매 게임 공식 규칙서
              </h3>
              <button
                onClick={() => setShowRuleModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="overflow-y-auto pr-2 flex flex-col gap-5 text-xs sm:text-sm text-gray-700 leading-relaxed">
              <div>
                <h4 className="font-black text-base text-amber-700 mb-1">1. 게임 개요 및 준비</h4>
                <ul className="list-disc list-inside space-y-1">
                  <li>팀 구성: 6팀 (각 팀 시작 자금 <strong>100코인</strong>, 시작 숫자 <strong>0</strong>)</li>
                  <li>각 팀은 <strong>비밀 임무(양수 최대화 / 음수 최대화)</strong> 중 하나를 선택하고, 공통 임무에 사용할 <strong>랜덤 정수</strong>를 하나 받습니다.</li>
                </ul>
              </div>

              <div>
                <h4 className="font-black text-base text-amber-700 mb-1">2. 경매 카드 목록 (총 24장)</h4>
                <div className="grid grid-cols-2 gap-2">
                  {CARD_TEMPLATES.map((c) => (
                    <div key={c.type} className="p-2.5 bg-[#F8FBFE] rounded-xl border border-gray-100">
                      <div className="font-black text-gray-800">
                        {c.label} <span className="text-amber-600">({c.count}장)</span>
                      </div>
                      <div className="text-xs text-gray-500">{c.description}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-black text-base text-amber-700 mb-1">3. 입찰 및 동점 규칙</h4>
                <ul className="list-disc list-inside space-y-1">
                  <li>보유 코인보다 높은 금액은 입찰할 수 없으며, 입찰하지 않는 것(0코인)도 가능합니다.</li>
                  <li>가장 높은 금액을 입찰한 팀이 카드를 낙찰받고 입찰한 코인을 지불합니다.</li>
                  <li><strong>동점 시:</strong> 최고 입찰 금액이 같은 팀끼리 <strong>재입찰</strong>(처음 동점 금액 이상)을 진행하고, 재입찰에서도 같으면 <strong>가위바위보</strong>로 낙찰 팀을 결정합니다.</li>
                </ul>
              </div>

              <div>
                <h4 className="font-black text-base text-amber-700 mb-1">4. 공통 임무 (각 20점, 최대 80점)</h4>
                <ul className="list-disc list-inside space-y-1">
                  <li><strong>다양한 연산 활용 (20점):</strong> 서로 다른 연산 종류(덧셈, 뺄셈, 곱셈, 부호 반전) 3가지 이상 사용</li>
                  <li><strong>랜덤 정수의 배수 만들기 (20점):</strong> 최종 숫자가 팀이 받은 랜덤 정수의 배수</li>
                  <li><strong>약수가 많은 수 만들기 (20점):</strong> 최종 숫자의 절댓값이 양의 약수 4개 이상인 정수 (※ 최종 숫자가 0이면 미달성)</li>
                  <li><strong>경매 전문가 (20점):</strong> 경매에서 카드 4장 이상 낙찰받기</li>
                </ul>
              </div>

              <div>
                <h4 className="font-black text-base text-amber-700 mb-1">5. 최종 점수 및 동점 처리</h4>
                <p>
                  <strong>최종 점수 = 비밀 임무 점수 + 공통 임무 점수</strong>
                  <br />
                  최종 점수가 같으면 ① 획득한 카드가 더 많은 팀 ➔ ② 남은 코인이 더 많은 팀 ➔ ③ 모두 같으면 공동 등수로 결정합니다.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

