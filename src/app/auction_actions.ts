'use server';

import { createClient } from '@/utils/supabase/server';
import {
  AuctionCard,
  CardType,
  SecretMissionType,
  generateShuffledDeck,
  evaluateTeamScore,
  NORMAL_CARD_LABELS,
} from '@/app/auction_constants';

export type AuctionPhase =
  | 'waiting' // 게임 준비 (팀 참가 및 비밀 임무 선택)
  | 'bidding' // 현재 카드 비공개 입찰 중
  | 'tie_rebidding' // 최고 입찰 금액 동점팀 재입찰 중
  | 'tie_rps' // 재입찰 동점팀 가위바위보 결정 중
  | 'special_effect' // 특수 카드(운명의 동전/미스터리 와일드카드) 효과 결정 중
  | 'revealed' // 이번 라운드 낙찰/유찰 결과 공개 화면
  | 'arranging' // 24장 경매 종료 후 각 팀 카드 순서 배치 및 최종 숫자 계산
  | 'ended'; // 최종 점수 및 우승팀 발표

export type RPSChoice = 'rock' | 'paper' | 'scissors';

export interface TeamMember {
  id: string;
  name: string;
}

export interface AuctionTeamState {
  teamNumber: number; // 1 ~ 6
  teamName: string;
  coins: number; // 시작 100코인
  secretMission: SecretMissionType; // 'positive' | 'negative'
  missionConfirmed: boolean;
  randomInt: number; // 공통 임무용 랜덤 정수 (예: 2 ~ 9)
  cards: AuctionCard[]; // 낙찰받은 카드 배열 (순서 배치에 그대로 사용)
  currentBid: number | null; // 현재 라운드 입찰 금액 (null = 아직 미입찰)
  hasBid: boolean;
  rebidAmount: number | null; // 동점 재입찰 금액
  hasRebid: boolean;
  rpsChoice: RPSChoice | null; // 가위바위보 선택
  orderConfirmed: boolean; // 최종 계산 단계에서 카드 순서 제출 완료 여부
  members: TeamMember[]; // 접속한 팀원 목록
}

export interface RoundHistoryItem {
  roundNumber: number;
  card: AuctionCard;
  winnerTeam: number | null; // null = 유찰
  winningBid: number;
  summary: string;
}

export interface AuctionRoomMeta {
  phase: AuctionPhase;
  currentCardIndex: number; // 0 ~ 23
  deck: AuctionCard[]; // 24장
  wonNormalCardTypes: Exclude<CardType, 'COIN' | 'WILD'>[]; // 지금까지 낙찰된 일반 카드 종류 (와일드카드 복제 후보)
  tiedTeams: number[]; // 동점 처리 중인 팀 번호 배열
  tieMinBid: number; // 재입찰 최소 금액 (처음 동점이 된 금액)
  pendingWinnerTeam: number | null; // 특수 카드 효과 결정 대기 중인 낙찰 팀 번호
  pendingWinningBid: number; // 낙찰 금액
  lastRoundMessage: string; // 전광판 안내 메시지
  rpsRoundCount: number; // 가위바위보 진행 횟수 (무승부 시 증가)
  lastRpsChoices?: Record<number, RPSChoice>; // 직전 가위바위보 선택 공개용
  history: RoundHistoryItem[];
}

export interface AuctionRoomFull {
  id: string;
  room_code: string;
  status: 'waiting' | 'playing' | 'ended';
  created_at?: string;
  meta: AuctionRoomMeta;
  teams: AuctionTeamState[];
}

const AUCTION_CREATOR_TAG = 'auction_10000';

// 2~9 사이의 랜덤 정수 생성 (공통 임무 '랜덤 정수의 배수 만들기'용)
function generateRandomTargetInt(): number {
  const candidates = [2, 3, 4, 5, 6, 7, 8, 9];
  return candidates[Math.floor(Math.random() * candidates.length)];
}

function createInitialTeams(): AuctionTeamState[] {
  const names = [
    '1팀 (루비)',
    '2팀 (앰버)',
    '3팀 (에메랄드)',
    '4팀 (사파이어)',
    '5팀 (바이올렛)',
    '6팀 (크리스탈)',
  ];
  return Array.from({ length: 6 }, (_, i) => ({
    teamNumber: i + 1,
    teamName: names[i],
    coins: 100,
    secretMission: 'positive',
    missionConfirmed: false,
    randomInt: generateRandomTargetInt(),
    cards: [],
    currentBid: null,
    hasBid: false,
    rebidAmount: null,
    hasRebid: false,
    rpsChoice: null,
    orderConfirmed: false,
    members: [],
  }));
}

function createInitialMeta(): AuctionRoomMeta {
  return {
    phase: 'waiting',
    currentCardIndex: 0,
    deck: generateShuffledDeck(),
    wonNormalCardTypes: [],
    tiedTeams: [],
    tieMinBid: 0,
    pendingWinnerTeam: null,
    pendingWinningBid: 0,
    lastRoundMessage: '게임 대기 중입니다. 각 팀은 비밀 임무를 선택해 주세요!',
    rpsRoundCount: 0,
    history: [],
  };
}

// 현재 인덱스의 카드가 WILD인데 아직 낙찰된 일반 카드가 없다면 뒤쪽 일반 카드와 스왑
function ensureValidWildcardOrder(meta: AuctionRoomMeta): AuctionRoomMeta {
  const currentCard = meta.deck[meta.currentCardIndex];
  if (!currentCard) return meta;

  if (currentCard.type === 'WILD' && meta.wonNormalCardTypes.length === 0) {
    const swapIdx = meta.deck.findIndex(
      (c, idx) => idx > meta.currentCardIndex && !c.isSpecial
    );
    if (swapIdx !== -1) {
      const newDeck = [...meta.deck];
      [newDeck[meta.currentCardIndex], newDeck[swapIdx]] = [
        newDeck[swapIdx],
        newDeck[meta.currentCardIndex],
      ];
      return { ...meta, deck: newDeck };
    }
  }
  return meta;
}

// DB row -> AuctionRoomFull 파싱 헬퍼
async function loadAuctionRoomById(roomId: string): Promise<AuctionRoomFull | null> {
  const supabase = await createClient();
  const { data: room, error: roomErr } = await supabase
    .from('streams_rooms')
    .select('*')
    .eq('id', roomId)
    .eq('created_by', AUCTION_CREATOR_TAG)
    .maybeSingle();

  if (roomErr || !room) return null;

  const { data: playerRows } = await supabase
    .from('streams_players')
    .select('*')
    .eq('room_id', room.id);

  const rawMeta = Array.isArray(room.numbers) ? room.numbers[0] : room.numbers;
  const meta: AuctionRoomMeta = rawMeta && rawMeta.deck ? rawMeta : createInitialMeta();

  const defaultTeams = createInitialTeams();
  const teams: AuctionTeamState[] = defaultTeams.map((defTeam) => {
    const row = (playerRows || []).find((r) => r.student_id === `TEAM_${defTeam.teamNumber}`);
    if (!row || !row.board) return defTeam;
    const parsed = Array.isArray(row.board) ? row.board[0] : row.board;
    return parsed && parsed.teamNumber ? { ...defTeam, ...parsed } : defTeam;
  });

  return {
    id: room.id,
    room_code: room.room_code,
    status: room.status as 'waiting' | 'playing' | 'ended',
    created_at: room.created_at,
    meta,
    teams,
  };
}

// 특정 팀의 row 업데이트 헬퍼
async function saveTeamState(roomId: string, team: AuctionTeamState) {
  const supabase = await createClient();
  const evalRes = evaluateTeamScore(team.cards, team.secretMission, team.randomInt);
  await supabase
    .from('streams_players')
    .update({
      student_name: team.teamName,
      board: [team],
      score: evalRes.totalScore,
      updated_at: new Date().toISOString(),
    })
    .eq('room_id', roomId)
    .eq('student_id', `TEAM_${team.teamNumber}`);
}

// 방 메타데이터 업데이트 헬퍼
async function saveRoomMeta(
  roomId: string,
  meta: AuctionRoomMeta,
  status?: 'waiting' | 'playing' | 'ended'
) {
  const supabase = await createClient();
  const updatePayload: Record<string, unknown> = {
    numbers: [meta],
  };
  if (status) {
    updatePayload.status = status;
  }
  await supabase.from('streams_rooms').update(updatePayload).eq('id', roomId);
}

// ── 1. 방 생성 (관리자 전용) ──
export async function createAuctionRoomAction(
  creatorId: string
): Promise<{ success: boolean; room?: AuctionRoomFull; error?: string }> {
  if (creatorId.trim() !== '10000') {
    return { success: false, error: '관리자(선생님)만 방을 생성할 수 있습니다.' };
  }
  try {
    const supabase = await createClient();
    const roomCode = Math.floor(1000 + Math.random() * 9000).toString();
    const initialMeta = createInitialMeta();
    const initialTeams = createInitialTeams();

    const { data: roomData, error: roomErr } = await supabase
      .from('streams_rooms')
      .insert([
        {
          room_code: roomCode,
          created_by: AUCTION_CREATOR_TAG,
          numbers: [initialMeta],
          status: 'waiting',
        },
      ])
      .select()
      .single();

    if (roomErr || !roomData) {
      return { success: false, error: roomErr?.message || '방 생성 실패' };
    }

    // 6개 팀 슬롯 생성
    const teamInserts = initialTeams.map((t) => ({
      room_id: roomData.id,
      student_id: `TEAM_${t.teamNumber}`,
      student_name: t.teamName,
      board: [t],
      score: 0,
    }));

    await supabase.from('streams_players').insert(teamInserts);

    const fullRoom = await loadAuctionRoomById(roomData.id);
    return { success: true, room: fullRoom! };
  } catch (e) {
    console.error('createAuctionRoomAction error:', e);
    return { success: false, error: '경매 방 생성 중 오류가 발생했습니다.' };
  }
}

// ── 2. 방 코드로 방 상태 조회 ──
export async function getAuctionRoomAction(
  roomCode: string
): Promise<{ success: boolean; room?: AuctionRoomFull; error?: string }> {
  try {
    const supabase = await createClient();
    const { data: room, error } = await supabase
      .from('streams_rooms')
      .select('id')
      .eq('room_code', roomCode.trim())
      .eq('created_by', AUCTION_CREATOR_TAG)
      .maybeSingle();

    if (error || !room) {
      return { success: false, error: '존재하지 않는 숫자 경매 게임 방 코드입니다.' };
    }

    const full = await loadAuctionRoomById(room.id);
    if (!full) {
      return { success: false, error: '방 데이터를 불러올 수 없습니다.' };
    }
    return { success: true, room: full };
  } catch (e) {
    console.error('getAuctionRoomAction error:', e);
    return { success: false, error: '방 조회 중 오류 발생' };
  }
}

// ── 3. 관리자 전용 전체 경매 방 목록 조회 ──
export async function getAllAuctionRoomsAction(
  creatorId: string
): Promise<{ success: boolean; rooms?: AuctionRoomFull[]; error?: string }> {
  if (creatorId.trim() !== '10000') {
    return { success: false, error: '관리자 권한이 없습니다.' };
  }
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('streams_rooms')
      .select('*')
      .eq('created_by', AUCTION_CREATOR_TAG)
      .order('created_at', { ascending: false });

    if (error) return { success: false, error: error.message };

    const rooms: AuctionRoomFull[] = [];
    for (const r of data || []) {
      const full = await loadAuctionRoomById(r.id);
      if (full) rooms.push(full);
    }
    return { success: true, rooms };
  } catch (e) {
    console.error('getAllAuctionRoomsAction error:', e);
    return { success: false, error: '방 목록 조회 실패' };
  }
}

// ── 4. 관리자 전용 방 삭제 ──
export async function deleteAuctionRoomAction(
  creatorId: string,
  roomId: string
): Promise<{ success: boolean; error?: string }> {
  if (creatorId.trim() !== '10000') {
    return { success: false, error: '관리자 권한이 없습니다.' };
  }
  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from('streams_rooms')
      .delete()
      .eq('id', roomId)
      .eq('created_by', AUCTION_CREATOR_TAG);

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (e) {
    console.error('deleteAuctionRoomAction error:', e);
    return { success: false, error: '방 삭제 실패' };
  }
}

// ── 5. 학생/참가자 팀 입장 및 팀 변경 ──
export async function joinAuctionTeamAction(
  roomId: string,
  studentId: string,
  studentName: string,
  teamNumber: number
): Promise<{ success: boolean; room?: AuctionRoomFull; error?: string }> {
  try {
    const full = await loadAuctionRoomById(roomId);
    if (!full) return { success: false, error: '존재하지 않는 방입니다.' };

    if (teamNumber < 1 || teamNumber > 6) {
      return { success: false, error: '1팀~6팀 중 하나를 선택해 주세요.' };
    }

    // 기존에 다른 팀에 속해 있었다면 제거 후 선택한 팀에 추가
    for (const t of full.teams) {
      const hadMember = t.members.some((m) => m.id === studentId);
      if (t.teamNumber === teamNumber) {
        const filtered = t.members.filter((m) => m.id !== studentId);
        t.members = [...filtered, { id: studentId, name: studentName.trim() }];
        await saveTeamState(roomId, t);
      } else if (hadMember) {
        t.members = t.members.filter((m) => m.id !== studentId);
        await saveTeamState(roomId, t);
      }
    }

    const updated = await loadAuctionRoomById(roomId);
    return { success: true, room: updated! };
  } catch (e) {
    console.error('joinAuctionTeamAction error:', e);
    return { success: false, error: '팀 참가 중 오류가 발생했습니다.' };
  }
}

// ── 6. 팀 비밀 임무 선택 (양수 최대화 / 음수 최대화) ──
export async function selectSecretMissionAction(
  roomId: string,
  teamNumber: number,
  mission: SecretMissionType
): Promise<{ success: boolean; room?: AuctionRoomFull; error?: string }> {
  try {
    const full = await loadAuctionRoomById(roomId);
    if (!full) return { success: false, error: '방 정보를 찾을 수 없습니다.' };

    const team = full.teams.find((t) => t.teamNumber === teamNumber);
    if (!team) return { success: false, error: '팀 정보를 찾을 수 없습니다.' };

    team.secretMission = mission;
    team.missionConfirmed = true;
    await saveTeamState(roomId, team);

    const updated = await loadAuctionRoomById(roomId);
    return { success: true, room: updated! };
  } catch (e) {
    console.error('selectSecretMissionAction error:', e);
    return { success: false, error: '비밀 임무 저장 실패' };
  }
}

// ── 7. 관리자: 1라운드 경매 시작 ──
export async function startAuctionGameAction(
  roomId: string
): Promise<{ success: boolean; room?: AuctionRoomFull; error?: string }> {
  try {
    const full = await loadAuctionRoomById(roomId);
    if (!full) return { success: false, error: '방 정보를 찾을 수 없습니다.' };

    // 미확정 팀도 기본값으로 확정 처리 및 입찰값 초기화
    for (const t of full.teams) {
      t.missionConfirmed = true;
      t.currentBid = null;
      t.hasBid = false;
      t.rebidAmount = null;
      t.hasRebid = false;
      t.rpsChoice = null;
      await saveTeamState(roomId, t);
    }

    let meta = ensureValidWildcardOrder({
      ...full.meta,
      phase: 'bidding',
      currentCardIndex: 0,
      tiedTeams: [],
      tieMinBid: 0,
      pendingWinnerTeam: null,
      pendingWinningBid: 0,
      lastRoundMessage: '1라운드 경매가 시작되었습니다! 각 팀은 입찰 금액을 비공개로 제출하세요.',
    });

    await saveRoomMeta(roomId, meta, 'playing');
    const updated = await loadAuctionRoomById(roomId);
    return { success: true, room: updated! };
  } catch (e) {
    console.error('startAuctionGameAction error:', e);
    return { success: false, error: '경매 시작 실패' };
  }
}

// ── 8. 팀: 일반 경매 입찰 제출 (0코인 = 입찰 포기 가능, 보유 코인 이하만 가능) ──
export async function submitTeamBidAction(
  roomId: string,
  teamNumber: number,
  bidAmount: number
): Promise<{ success: boolean; room?: AuctionRoomFull; error?: string }> {
  try {
    const full = await loadAuctionRoomById(roomId);
    if (!full) return { success: false, error: '방 정보를 찾을 수 없습니다.' };
    if (full.meta.phase !== 'bidding') {
      return { success: false, error: '현재 일반 입찰 단계가 아닙니다.' };
    }

    const team = full.teams.find((t) => t.teamNumber === teamNumber);
    if (!team) return { success: false, error: '팀 정보를 찾을 수 없습니다.' };

    const cleanBid = Math.trunc(Number(bidAmount));
    if (isNaN(cleanBid) || cleanBid < 0) {
      return { success: false, error: '입찰 금액은 0 이상의 정수여야 합니다.' };
    }
    if (cleanBid > team.coins) {
      return {
        success: false,
        error: `보유 코인(${team.coins}코인)보다 높은 금액을 입찰할 수 없습니다!`,
      };
    }

    team.currentBid = cleanBid;
    team.hasBid = true;
    await saveTeamState(roomId, team);

    const updated = await loadAuctionRoomById(roomId);
    return { success: true, room: updated! };
  } catch (e) {
    console.error('submitTeamBidAction error:', e);
    return { success: false, error: '입찰 제출 실패' };
  }
}

// 낙찰 확정 내부 처리 헬퍼 (일반 카드는 즉시 지급, 특수 카드는 special_effect 단계로 이동)
async function finalizeCardWinner(
  roomId: string,
  full: AuctionRoomFull,
  winnerTeamNumber: number,
  winningBid: number,
  winReasonPrefix: string
) {
  const currentCard = full.meta.deck[full.meta.currentCardIndex];
  const roundNum = full.meta.currentCardIndex + 1;
  const winnerTeam = full.teams.find((t) => t.teamNumber === winnerTeamNumber)!;

  // 코인 차감
  winnerTeam.coins = Math.max(0, winnerTeam.coins - winningBid);

  if (currentCard.isSpecial) {
    await saveTeamState(roomId, winnerTeam);
    const nextMeta: AuctionRoomMeta = {
      ...full.meta,
      phase: 'special_effect',
      pendingWinnerTeam: winnerTeamNumber,
      pendingWinningBid: winningBid,
      tiedTeams: [],
      lastRoundMessage:
        currentCard.type === 'COIN'
          ? `🎉 ${winnerTeam.teamName}이(가) ${winningBid}코인에 [🪙 운명의 동전]을 낙찰받았습니다! 동전을 던져 앞면(+10) 또는 뒷면(−10) 효과를 결정하세요!`
          : `🎉 ${winnerTeam.teamName}이(가) ${winningBid}코인에 [🃏 미스터리 와일드카드]를 낙찰받았습니다! 이전에 낙찰된 일반 카드 중 복제할 효과를 선택하세요!`,
    };
    await saveRoomMeta(roomId, nextMeta);
  } else {
    const awardedCard: AuctionCard = {
      ...currentCard,
      winningBid,
      roundNumber: roundNum,
    };
    winnerTeam.cards = [...winnerTeam.cards, awardedCard];
    await saveTeamState(roomId, winnerTeam);

    const normalType = currentCard.type as Exclude<CardType, 'COIN' | 'WILD'>;
    const updatedWonTypes = full.meta.wonNormalCardTypes.includes(normalType)
      ? full.meta.wonNormalCardTypes
      : [...full.meta.wonNormalCardTypes, normalType];

    const summary = `${winReasonPrefix}${winnerTeam.teamName}이(가) ${winningBid}코인으로 [${currentCard.label}] 카드를 낙찰받았습니다!`;
    const nextMeta: AuctionRoomMeta = {
      ...full.meta,
      phase: 'revealed',
      wonNormalCardTypes: updatedWonTypes,
      tiedTeams: [],
      pendingWinnerTeam: winnerTeamNumber,
      pendingWinningBid: winningBid,
      lastRoundMessage: summary,
      history: [
        ...full.meta.history,
        {
          roundNumber: roundNum,
          card: awardedCard,
          winnerTeam: winnerTeamNumber,
          winningBid,
          summary,
        },
      ],
    };
    await saveRoomMeta(roomId, nextMeta);
  }
}

// ── 9. 관리자: 입찰 마감 및 금액 공개 (단독 낙찰 / 동점 재입찰 / 유찰 판정) ──
export async function revealBidsAction(
  roomId: string
): Promise<{ success: boolean; room?: AuctionRoomFull; error?: string }> {
  try {
    const full = await loadAuctionRoomById(roomId);
    if (!full) return { success: false, error: '방 정보를 찾을 수 없습니다.' };
    if (full.meta.phase !== 'bidding') {
      return { success: false, error: '현재 입찰 진행 단계가 아닙니다.' };
    }

    // 아직 입찰하지 않은 팀은 0코인(입찰 포기) 처리
    for (const t of full.teams) {
      if (!t.hasBid || t.currentBid === null) {
        t.currentBid = 0;
        t.hasBid = true;
        await saveTeamState(roomId, t);
      }
    }

    const maxBid = Math.max(...full.teams.map((t) => t.currentBid || 0));
    const roundNum = full.meta.currentCardIndex + 1;
    const currentCard = full.meta.deck[full.meta.currentCardIndex];

    // 아무도 입찰하지 않은 경우 (모두 0코인) -> 유찰
    if (maxBid <= 0) {
      const summary = `라운드 ${roundNum} [${currentCard.label}] 카드는 모든 팀이 입찰을 포기하여 유찰되었습니다.`;
      const nextMeta: AuctionRoomMeta = {
        ...full.meta,
        phase: 'revealed',
        pendingWinnerTeam: null,
        pendingWinningBid: 0,
        tiedTeams: [],
        lastRoundMessage: summary,
        history: [
          ...full.meta.history,
          {
            roundNumber: roundNum,
            card: currentCard,
            winnerTeam: null,
            winningBid: 0,
            summary,
          },
        ],
      };
      await saveRoomMeta(roomId, nextMeta);
      const updated = await loadAuctionRoomById(roomId);
      return { success: true, room: updated! };
    }

    // 최고 금액을 입찰한 팀 목록
    const topTeams = full.teams.filter((t) => (t.currentBid || 0) === maxBid);

    if (topTeams.length === 1) {
      // 단독 최고가 낙찰!
      await finalizeCardWinner(roomId, full, topTeams[0].teamNumber, maxBid, '🎉 ');
    } else {
      // 최고 입찰 금액 동점 발생 -> 동점 팀끼리 재입찰 단계로 전환
      const tiedNums = topTeams.map((t) => t.teamNumber);
      for (const t of full.teams) {
        t.rebidAmount = null;
        t.hasRebid = false;
        t.rpsChoice = null;
        await saveTeamState(roomId, t);
      }

      const tiedNames = topTeams.map((t) => `${t.teamNumber}팀`).join(', ');
      const nextMeta: AuctionRoomMeta = {
        ...full.meta,
        phase: 'tie_rebidding',
        tiedTeams: tiedNums,
        tieMinBid: maxBid,
        pendingWinnerTeam: null,
        pendingWinningBid: maxBid,
        lastRoundMessage: `⚡ 최고 입찰 금액(${maxBid}코인) 동점 발생! [${tiedNames}]끼리 재입찰을 진행합니다. (최소 ${maxBid}코인 이상 입력)`,
      };
      await saveRoomMeta(roomId, nextMeta);
    }

    const updated = await loadAuctionRoomById(roomId);
    return { success: true, room: updated! };
  } catch (e) {
    console.error('revealBidsAction error:', e);
    return { success: false, error: '입찰 공개 처리 실패' };
  }
}

// ── 10. 동점 팀: 재입찰 금액 제출 (처음 동점이 된 금액 이상 ~ 보유 코인 이하) ──
export async function submitRebidAction(
  roomId: string,
  teamNumber: number,
  rebidAmount: number
): Promise<{ success: boolean; room?: AuctionRoomFull; error?: string }> {
  try {
    const full = await loadAuctionRoomById(roomId);
    if (!full) return { success: false, error: '방 정보를 찾을 수 없습니다.' };
    if (full.meta.phase !== 'tie_rebidding') {
      return { success: false, error: '현재 재입찰 단계가 아닙니다.' };
    }
    if (!full.meta.tiedTeams.includes(teamNumber)) {
      return { success: false, error: '이번 재입찰 대상 팀이 아닙니다.' };
    }

    const team = full.teams.find((t) => t.teamNumber === teamNumber);
    if (!team) return { success: false, error: '팀 정보를 찾을 수 없습니다.' };

    const cleanBid = Math.trunc(Number(rebidAmount));
    if (isNaN(cleanBid) || cleanBid < full.meta.tieMinBid) {
      return {
        success: false,
        error: `재입찰 금액은 처음 동점이 된 금액(${full.meta.tieMinBid}코인) 이상이어야 합니다!`,
      };
    }
    if (cleanBid > team.coins) {
      return {
        success: false,
        error: `보유 코인(${team.coins}코인)보다 높은 금액을 제시할 수 없습니다!`,
      };
    }

    team.rebidAmount = cleanBid;
    team.hasRebid = true;
    await saveTeamState(roomId, team);

    const updated = await loadAuctionRoomById(roomId);
    return { success: true, room: updated! };
  } catch (e) {
    console.error('submitRebidAction error:', e);
    return { success: false, error: '재입찰 제출 실패' };
  }
}

// ── 11. 관리자: 재입찰 마감 및 공개 (단독 승자 결정 또는 가위바위보 이동) ──
export async function revealRebidsAction(
  roomId: string
): Promise<{ success: boolean; room?: AuctionRoomFull; error?: string }> {
  try {
    const full = await loadAuctionRoomById(roomId);
    if (!full) return { success: false, error: '방 정보를 찾을 수 없습니다.' };
    if (full.meta.phase !== 'tie_rebidding') {
      return { success: false, error: '현재 재입찰 단계가 아닙니다.' };
    }

    // 미제출 동점 팀은 기존 동점 금액(tieMinBid)으로 자동 설정
    for (const t of full.teams) {
      if (full.meta.tiedTeams.includes(t.teamNumber) && (!t.hasRebid || t.rebidAmount === null)) {
        t.rebidAmount = full.meta.tieMinBid;
        t.hasRebid = true;
        await saveTeamState(roomId, t);
      }
    }

    const tiedTeamObjs = full.teams.filter((t) => full.meta.tiedTeams.includes(t.teamNumber));
    const maxRebid = Math.max(...tiedTeamObjs.map((t) => t.rebidAmount || full.meta.tieMinBid));
    const topRebidTeams = tiedTeamObjs.filter((t) => (t.rebidAmount || 0) === maxRebid);

    if (topRebidTeams.length === 1) {
      await finalizeCardWinner(
        roomId,
        full,
        topRebidTeams[0].teamNumber,
        maxRebid,
        '🔥 [재입찰 승리] '
      );
    } else {
      // 재입찰에서도 동점 -> 가위바위보 단계로 이동!
      const stillTiedNums = topRebidTeams.map((t) => t.teamNumber);
      for (const t of full.teams) {
        t.rpsChoice = null;
        await saveTeamState(roomId, t);
      }
      const tiedNames = topRebidTeams.map((t) => `${t.teamNumber}팀`).join(', ');
      const nextMeta: AuctionRoomMeta = {
        ...full.meta,
        phase: 'tie_rps',
        tiedTeams: stillTiedNums,
        tieMinBid: maxRebid,
        pendingWinningBid: maxRebid,
        rpsRoundCount: 1,
        lastRpsChoices: {},
        lastRoundMessage: `✊✌️✋ 재입찰에서도 최고 금액(${maxRebid}코인)이 같습니다! [${tiedNames}]끼리 가위바위보로 낙찰 팀을 결정합니다!`,
      };
      await saveRoomMeta(roomId, nextMeta);
    }

    const updated = await loadAuctionRoomById(roomId);
    return { success: true, room: updated! };
  } catch (e) {
    console.error('revealRebidsAction error:', e);
    return { success: false, error: '재입찰 결과 처리 실패' };
  }
}

// ── 12. 가위바위보 선택 제출 및 자동 판정 (또는 관리자 직접 승자 지정) ──
export async function submitRPSChoiceAction(
  roomId: string,
  teamNumber: number,
  choice: RPSChoice
): Promise<{ success: boolean; room?: AuctionRoomFull; error?: string }> {
  try {
    const full = await loadAuctionRoomById(roomId);
    if (!full) return { success: false, error: '방 정보를 찾을 수 없습니다.' };
    if (full.meta.phase !== 'tie_rps') {
      return { success: false, error: '현재 가위바위보 단계가 아닙니다.' };
    }
    if (!full.meta.tiedTeams.includes(teamNumber)) {
      return { success: false, error: '가위바위보 대상 팀이 아닙니다.' };
    }

    const team = full.teams.find((t) => t.teamNumber === teamNumber);
    if (!team) return { success: false, error: '팀 정보를 찾을 수 없습니다.' };

    team.rpsChoice = choice;
    await saveTeamState(roomId, team);

    // 모든 대상 팀이 가위바위보를 선택했는지 확인
    const fresh = await loadAuctionRoomById(roomId);
    if (!fresh) return { success: false, error: '동기화 오류' };

    const activeTeams = fresh.teams.filter((t) => fresh.meta.tiedTeams.includes(t.teamNumber));
    const allChosen = activeTeams.every((t) => t.rpsChoice !== null);

    if (allChosen) {
      const choicesMap: Record<number, RPSChoice> = {};
      activeTeams.forEach((t) => {
        if (t.rpsChoice) choicesMap[t.teamNumber] = t.rpsChoice;
      });

      const distinctChoices = Array.from(new Set(activeTeams.map((t) => t.rpsChoice!)));

      // 무승부 조건: 모두 같은 것을 냈거나, 가위/바위/보 3가지가 모두 나온 경우
      if (distinctChoices.length === 1 || distinctChoices.length === 3) {
        for (const t of activeTeams) {
          t.rpsChoice = null;
          await saveTeamState(roomId, t);
        }
        const choiceKorean: Record<RPSChoice, string> = {
          scissors: '✌️가위',
          rock: '✊바위',
          paper: '✋보',
        };
        const detailStr = activeTeams
          .map((t) => `${t.teamNumber}팀(${choiceKorean[choicesMap[t.teamNumber]]})`)
          .join(' vs ');
        const nextMeta: AuctionRoomMeta = {
          ...fresh.meta,
          rpsRoundCount: (fresh.meta.rpsRoundCount || 1) + 1,
          lastRpsChoices: choicesMap,
          lastRoundMessage: `🔄 가위바위보 무승부! [${detailStr}] — 다시 한번 가위바위보를 선택해 주세요!`,
        };
        await saveRoomMeta(roomId, nextMeta);
      } else {
        // 정확히 2종류만 나온 경우 -> 이긴 종류 판별
        const hasRock = distinctChoices.includes('rock');
        const hasPaper = distinctChoices.includes('paper');
        const hasScissors = distinctChoices.includes('scissors');

        let winningMove: RPSChoice = 'rock';
        if (hasRock && hasScissors) winningMove = 'rock';
        else if (hasScissors && hasPaper) winningMove = 'scissors';
        else if (hasPaper && hasRock) winningMove = 'paper';

        const survivors = activeTeams.filter((t) => t.rpsChoice === winningMove);
        const choiceKorean: Record<RPSChoice, string> = {
          scissors: '✌️가위',
          rock: '✊바위',
          paper: '✋보',
        };
        const detailStr = activeTeams
          .map((t) => `${t.teamNumber}팀(${choiceKorean[choicesMap[t.teamNumber]]})`)
          .join(' vs ');

        if (survivors.length === 1) {
          // 최종 가위바위보 승리 팀 결정!
          await finalizeCardWinner(
            roomId,
            fresh,
            survivors[0].teamNumber,
            fresh.meta.pendingWinningBid || fresh.meta.tieMinBid,
            `✌️ [가위바위보 승리: ${detailStr}] `
          );
        } else {
          // 3팀 이상 중 2팀 이상이 이긴 경우 -> 생존한 팀끼리만 다시 가위바위보!
          for (const t of fresh.teams) {
            t.rpsChoice = null;
            await saveTeamState(roomId, t);
          }
          const survivorNums = survivors.map((s) => s.teamNumber);
          const nextMeta: AuctionRoomMeta = {
            ...fresh.meta,
            tiedTeams: survivorNums,
            rpsRoundCount: (fresh.meta.rpsRoundCount || 1) + 1,
            lastRpsChoices: choicesMap,
            lastRoundMessage: `🔥 [${detailStr}] 결과 ${survivorNums.map((n) => `${n}팀`).join(', ')} 생존! 남은 팀끼리 결승 가위바위보를 진행합니다!`,
          };
          await saveRoomMeta(roomId, nextMeta);
        }
      }
    }

    const updated = await loadAuctionRoomById(roomId);
    return { success: true, room: updated! };
  } catch (e) {
    console.error('submitRPSChoiceAction error:', e);
    return { success: false, error: '가위바위보 처리 실패' };
  }
}

// ── 13. 관리자: 동점/가위바위보 상황에서 특정 팀을 즉시 낙찰자로 지정 (오프라인 가위바위보 지원) ──
export async function adminSelectTieWinnerAction(
  roomId: string,
  winnerTeamNumber: number
): Promise<{ success: boolean; room?: AuctionRoomFull; error?: string }> {
  try {
    const full = await loadAuctionRoomById(roomId);
    if (!full) return { success: false, error: '방 정보를 찾을 수 없습니다.' };

    const winningBid = full.meta.pendingWinningBid || full.meta.tieMinBid || 0;
    await finalizeCardWinner(
      roomId,
      full,
      winnerTeamNumber,
      winningBid,
      '👑 [가위바위보 최종 승리] '
    );

    const updated = await loadAuctionRoomById(roomId);
    return { success: true, room: updated! };
  } catch (e) {
    console.error('adminSelectTieWinnerAction error:', e);
    return { success: false, error: '승자 지정 실패' };
  }
}

// ── 14. 특수 카드 해결: 운명의 동전 던지기 & 미스터리 와일드카드 효과 선택 ──
export async function resolveSpecialCardAction(
  roomId: string,
  chosenWildType?: Exclude<CardType, 'COIN' | 'WILD'>
): Promise<{ success: boolean; room?: AuctionRoomFull; error?: string }> {
  try {
    const full = await loadAuctionRoomById(roomId);
    if (!full) return { success: false, error: '방 정보를 찾을 수 없습니다.' };
    if (full.meta.phase !== 'special_effect' || !full.meta.pendingWinnerTeam) {
      return { success: false, error: '현재 특수 카드 효과 결정 단계가 아닙니다.' };
    }

    const currentCard = full.meta.deck[full.meta.currentCardIndex];
    const roundNum = full.meta.currentCardIndex + 1;
    const winnerTeam = full.teams.find((t) => t.teamNumber === full.meta.pendingWinnerTeam);
    if (!winnerTeam) return { success: false, error: '낙찰 팀 정보를 찾을 수 없습니다.' };

    let resolvedCard: AuctionCard;
    let summary = '';

    if (currentCard.type === 'COIN') {
      const isHeads = Math.random() < 0.5;
      const effect = isHeads ? 'ADD_10' : 'SUB_10';
      const effectLabel = isHeads ? '앞면 (+10)' : '뒷면 (−10)';
      resolvedCard = {
        ...currentCard,
        resolvedEffect: effect,
        resolvedLabel: `🪙 동전: ${isHeads ? '+10' : '−10'}`,
        winningBid: full.meta.pendingWinningBid,
        roundNumber: roundNum,
      };
      summary = `🪙 [운명의 동전 결과: ${effectLabel}] ${winnerTeam.teamName}의 동전이 '${effectLabel}'으로 나와 카드에 기록되었습니다!`;
    } else if (currentCard.type === 'WILD') {
      const targetType =
        chosenWildType && full.meta.wonNormalCardTypes.includes(chosenWildType)
          ? chosenWildType
          : full.meta.wonNormalCardTypes[0] || 'ADD_15';

      const targetLabel = NORMAL_CARD_LABELS[targetType];
      resolvedCard = {
        ...currentCard,
        resolvedEffect: targetType,
        resolvedLabel: `🃏 와일드(${targetLabel})`,
        winningBid: full.meta.pendingWinningBid,
        roundNumber: roundNum,
      };
      summary = `🃏 [미스터리 와일드카드 복제 완료] ${winnerTeam.teamName}이(가) 이전에 낙찰된 [${targetLabel}] 효과를 선택하여 카드에 기록했습니다!`;
    } else {
      return { success: false, error: '특수 카드가 아닙니다.' };
    }

    winnerTeam.cards = [...winnerTeam.cards, resolvedCard];
    await saveTeamState(roomId, winnerTeam);

    const nextMeta: AuctionRoomMeta = {
      ...full.meta,
      phase: 'revealed',
      lastRoundMessage: summary,
      history: [
        ...full.meta.history,
        {
          roundNumber: roundNum,
          card: resolvedCard,
          winnerTeam: winnerTeam.teamNumber,
          winningBid: full.meta.pendingWinningBid,
          summary,
        },
      ],
    };
    await saveRoomMeta(roomId, nextMeta);

    const updated = await loadAuctionRoomById(roomId);
    return { success: true, room: updated! };
  } catch (e) {
    console.error('resolveSpecialCardAction error:', e);
    return { success: false, error: '특수 카드 효과 적용 실패' };
  }
}

// ── 15. 관리자: 다음 카드로 넘어가기 (24장 완료 시 카드 배치 단계로 전환) ──
export async function nextAuctionRoundAction(
  roomId: string
): Promise<{ success: boolean; room?: AuctionRoomFull; error?: string }> {
  try {
    const full = await loadAuctionRoomById(roomId);
    if (!full) return { success: false, error: '방 정보를 찾을 수 없습니다.' };

    const nextIndex = full.meta.currentCardIndex + 1;

    // 모든 팀 입찰 상태 초기화
    for (const t of full.teams) {
      t.currentBid = null;
      t.hasBid = false;
      t.rebidAmount = null;
      t.hasRebid = false;
      t.rpsChoice = null;
      await saveTeamState(roomId, t);
    }

    if (nextIndex >= full.meta.deck.length) {
      // 24장 경매가 모두 끝남 -> 최종 숫자 계산(순서 배치) 단계로 이동
      const nextMeta: AuctionRoomMeta = {
        ...full.meta,
        phase: 'arranging',
        tiedTeams: [],
        pendingWinnerTeam: null,
        lastRoundMessage:
          '🎯 24장의 경매가 모두 종료되었습니다! 각 팀은 획득한 카드의 사용 순서를 자유롭게 배치하여 최종 숫자를 완성하세요!',
      };
      await saveRoomMeta(roomId, nextMeta);
    } else {
      let nextMeta: AuctionRoomMeta = {
        ...full.meta,
        phase: 'bidding',
        currentCardIndex: nextIndex,
        tiedTeams: [],
        tieMinBid: 0,
        pendingWinnerTeam: null,
        pendingWinningBid: 0,
        lastRoundMessage: `${nextIndex + 1}라운드 경매 카드가 공개되었습니다! 각 팀은 제한 시간 안에 비공개로 입찰해 주세요.`,
      };
      nextMeta = ensureValidWildcardOrder(nextMeta);
      await saveRoomMeta(roomId, nextMeta);
    }

    const updated = await loadAuctionRoomById(roomId);
    return { success: true, room: updated! };
  } catch (e) {
    console.error('nextAuctionRoundAction error:', e);
    return { success: false, error: '다음 라운드 진행 실패' };
  }
}

// ── 16. 관리자: 원하는 시점에 즉시 최종 숫자 계산(카드 배치) 단계로 이동 ──
export async function startArrangingPhaseAction(
  roomId: string
): Promise<{ success: boolean; room?: AuctionRoomFull; error?: string }> {
  try {
    const full = await loadAuctionRoomById(roomId);
    if (!full) return { success: false, error: '방 정보를 찾을 수 없습니다.' };

    const nextMeta: AuctionRoomMeta = {
      ...full.meta,
      phase: 'arranging',
      tiedTeams: [],
      pendingWinnerTeam: null,
      lastRoundMessage:
        '🧮 경매가 종료되고 최종 숫자 계산 단계가 시작되었습니다! 각 팀은 획득한 카드의 순서를 전략적으로 배치하세요!',
    };
    await saveRoomMeta(roomId, nextMeta);

    const updated = await loadAuctionRoomById(roomId);
    return { success: true, room: updated! };
  } catch (e) {
    console.error('startArrangingPhaseAction error:', e);
    return { success: false, error: '계산 단계 전환 실패' };
  }
}

// ── 17. 팀: 획득한 카드 순서 변경 및 확정 제출 ──
export async function updateTeamCardOrderAction(
  roomId: string,
  teamNumber: number,
  orderedCardIds: string[],
  confirmOrder: boolean = false
): Promise<{ success: boolean; room?: AuctionRoomFull; error?: string }> {
  try {
    const full = await loadAuctionRoomById(roomId);
    if (!full) return { success: false, error: '방 정보를 찾을 수 없습니다.' };

    const team = full.teams.find((t) => t.teamNumber === teamNumber);
    if (!team) return { success: false, error: '팀 정보를 찾을 수 없습니다.' };

    // 기존 카드들이 누락/중복되지 않도록 ID 매핑 검증
    if (orderedCardIds.length === team.cards.length) {
      const cardMap = new Map(team.cards.map((c) => [c.id, c]));
      const reordered: AuctionCard[] = [];
      for (const id of orderedCardIds) {
        const found = cardMap.get(id);
        if (found) {
          reordered.push(found);
          cardMap.delete(id);
        }
      }
      // 혹시 빠진 카드가 있으면 뒤에 추가
      cardMap.forEach((v) => reordered.push(v));
      team.cards = reordered;
    }

    team.orderConfirmed = confirmOrder;
    await saveTeamState(roomId, team);

    const updated = await loadAuctionRoomById(roomId);
    return { success: true, room: updated! };
  } catch (e) {
    console.error('updateTeamCardOrderAction error:', e);
    return { success: false, error: '카드 순서 저장 실패' };
  }
}

// ── 18. 관리자: 최종 점수 및 순위 결과 발표 (게임 종료) ──
export async function finishAuctionGameAction(
  roomId: string
): Promise<{ success: boolean; room?: AuctionRoomFull; error?: string }> {
  try {
    const full = await loadAuctionRoomById(roomId);
    if (!full) return { success: false, error: '방 정보를 찾을 수 없습니다.' };

    for (const t of full.teams) {
      t.orderConfirmed = true;
      await saveTeamState(roomId, t);
    }

    const nextMeta: AuctionRoomMeta = {
      ...full.meta,
      phase: 'ended',
      lastRoundMessage:
        '🏆 모든 계산이 완료되어 최종 점수와 우승팀이 발표되었습니다! 각 팀의 비밀 임무와 계산 과정을 확인해 보세요!',
    };
    await saveRoomMeta(roomId, nextMeta, 'ended');

    const updated = await loadAuctionRoomById(roomId);
    return { success: true, room: updated! };
  } catch (e) {
    console.error('finishAuctionGameAction error:', e);
    return { success: false, error: '결과 발표 전환 실패' };
  }
}

// ── 19. 관리자: 게임 초기화 (리셋) ──
export async function resetAuctionGameAction(
  roomId: string
): Promise<{ success: boolean; room?: AuctionRoomFull; error?: string }> {
  try {
    const full = await loadAuctionRoomById(roomId);
    if (!full) return { success: false, error: '방 정보를 찾을 수 없습니다.' };

    const freshTeams = createInitialTeams();
    // 기존 접속한 팀원 명단은 유지해 주면 재게임 시 편리함
    for (let i = 0; i < 6; i++) {
      freshTeams[i].members = full.teams[i]?.members || [];
      await saveTeamState(roomId, freshTeams[i]);
    }

    const freshMeta = createInitialMeta();
    await saveRoomMeta(roomId, freshMeta, 'waiting');

    const updated = await loadAuctionRoomById(roomId);
    return { success: true, room: updated! };
  } catch (e) {
    console.error('resetAuctionGameAction error:', e);
    return { success: false, error: '게임 리셋 실패' };
  }
}

