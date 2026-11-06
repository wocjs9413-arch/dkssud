export type CardType =
  | 'ADD_15'
  | 'SUB_15'
  | 'MUL_2'
  | 'MUL_3'
  | 'MUL_NEG_2'
  | 'FLIP_SIGN'
  | 'COIN'
  | 'WILD';

export type OperationCategory = 'add' | 'sub' | 'mul' | 'flip';

export interface AuctionCard {
  id: string;
  type: CardType;
  label: string;
  description: string;
  isSpecial: boolean;
  // 특수 카드 확정 효과 (운명의 동전: ADD_10 / SUB_10, 와일드카드: 복제한 일반 카드 타입)
  resolvedEffect?: 'ADD_10' | 'SUB_10' | Exclude<CardType, 'COIN' | 'WILD'>;
  resolvedLabel?: string;
  winningBid?: number;
  roundNumber?: number;
}

export type SecretMissionType = 'positive' | 'negative';

export interface CalculationStep {
  stepNumber: number;
  card: AuctionCard;
  prevValue: number;
  formula: string;
  resultValue: number;
  opCategory: OperationCategory | null;
}

export interface CommonMissionStatus {
  diverseOps: boolean; // 서로 다른 연산 종류 3가지 이상 사용
  multipleOfRandom: boolean; // 최종 숫자가 랜덤 정수의 배수
  manyDivisors: boolean; // |최종 숫자|의 양의 약수 4개 이상 (0 제외)
  auctionExpert: boolean; // 낙찰받은 카드 4장 이상
  score: number; // 각 20점, 최대 80점
  usedOpCategories: OperationCategory[];
  divisorsOfAbs: number[];
}

export interface TeamScoreResult {
  finalNumber: number;
  steps: CalculationStep[];
  secretMissionScore: number;
  commonMission: CommonMissionStatus;
  totalScore: number;
}

export const CARD_TEMPLATES: {
  type: CardType;
  count: number;
  label: string;
  description: string;
  isSpecial: boolean;
}[] = [
  { type: 'ADD_15', count: 4, label: '+15', description: '현재 숫자에 15를 더한다.', isSpecial: false },
  { type: 'SUB_15', count: 4, label: '−15', description: '현재 숫자에서 15를 뺀다.', isSpecial: false },
  { type: 'MUL_2', count: 3, label: '×2', description: '현재 숫자에 2를 곱한다.', isSpecial: false },
  { type: 'MUL_3', count: 3, label: '×3', description: '현재 숫자에 3을 곱한다.', isSpecial: false },
  { type: 'MUL_NEG_2', count: 3, label: '×(−2)', description: '현재 숫자에 −2를 곱한다.', isSpecial: false },
  { type: 'FLIP_SIGN', count: 3, label: '± 부호 반전', description: '현재 숫자의 부호를 반대로 바꾼다.', isSpecial: false },
  {
    type: 'COIN',
    count: 2,
    label: '🪙 운명의 동전',
    description: '낙찰 직후 동전을 던져 앞면이면 +10, 뒷면이면 −10을 더한다.',
    isSpecial: true,
  },
  {
    type: 'WILD',
    count: 2,
    label: '🃏 미스터리 와일드카드',
    description: '이전에 낙찰된 일반 카드의 효과 중 하나를 선택해 복제한다.',
    isSpecial: true,
  },
];

export const NORMAL_CARD_LABELS: Record<Exclude<CardType, 'COIN' | 'WILD'>, string> = {
  ADD_15: '+15',
  SUB_15: '−15',
  MUL_2: '×2',
  MUL_3: '×3',
  MUL_NEG_2: '×(−2)',
  FLIP_SIGN: '± 부호 반전',
};

export const TEAM_COLORS: {
  teamNumber: number;
  name: string;
  badgeBg: string;
  badgeText: string;
  border: string;
  gradient: string;
  emoji: string;
}[] = [
  {
    teamNumber: 1,
    name: '1팀 (루비)',
    badgeBg: 'bg-rose-100',
    badgeText: 'text-rose-700',
    border: 'border-rose-200',
    gradient: 'from-rose-500 to-pink-500',
    emoji: '🔴',
  },
  {
    teamNumber: 2,
    name: '2팀 (앰버)',
    badgeBg: 'bg-amber-100',
    badgeText: 'text-amber-800',
    border: 'border-amber-200',
    gradient: 'from-amber-500 to-orange-500',
    emoji: '🟠',
  },
  {
    teamNumber: 3,
    name: '3팀 (에메랄드)',
    badgeBg: 'bg-emerald-100',
    badgeText: 'text-emerald-700',
    border: 'border-emerald-200',
    gradient: 'from-emerald-500 to-teal-500',
    emoji: '🟢',
  },
  {
    teamNumber: 4,
    name: '4팀 (사파이어)',
    badgeBg: 'bg-blue-100',
    badgeText: 'text-blue-700',
    border: 'border-blue-200',
    gradient: 'from-blue-500 to-indigo-500',
    emoji: '🔵',
  },
  {
    teamNumber: 5,
    name: '5팀 (바이올렛)',
    badgeBg: 'bg-purple-100',
    badgeText: 'text-purple-700',
    border: 'border-purple-200',
    gradient: 'from-purple-500 to-violet-600',
    emoji: '🟣',
  },
  {
    teamNumber: 6,
    name: '6팀 (크리스탈)',
    badgeBg: 'bg-cyan-100',
    badgeText: 'text-cyan-800',
    border: 'border-cyan-200',
    gradient: 'from-cyan-500 to-sky-500',
    emoji: '💎',
  },
];

// 24장 경매 카드 덱 생성 및 셔플 (첫 카드는 무조건 일반 카드가 오도록 보장)
export function generateShuffledDeck(): AuctionCard[] {
  const deck: AuctionCard[] = [];
  let seq = 1;
  for (const tpl of CARD_TEMPLATES) {
    for (let i = 0; i < tpl.count; i++) {
      deck.push({
        id: `card_${seq++}_${tpl.type}`,
        type: tpl.type,
        label: tpl.label,
        description: tpl.description,
        isSpecial: tpl.isSpecial,
      });
    }
  }

  // Fisher-Yates 셔플
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }

  // 첫 번째 카드가 WILD이면 뒤쪽의 일반 카드와 교환
  if (deck[0].type === 'WILD') {
    const normalIdx = deck.findIndex((c) => !c.isSpecial);
    if (normalIdx > 0) {
      [deck[0], deck[normalIdx]] = [deck[normalIdx], deck[0]];
    }
  }

  return deck;
}

// 카드 1장의 실제 연산 효과 및 카테고리 계산
export function applyCardEffect(
  currentValue: number,
  card: AuctionCard
): { nextValue: number; formula: string; opCategory: OperationCategory | null } {
  const effectiveType =
    card.type === 'COIN' || card.type === 'WILD' ? card.resolvedEffect : card.type;

  switch (effectiveType) {
    case 'ADD_15':
      return {
        nextValue: currentValue + 15,
        formula: `${currentValue} + 15 = ${currentValue + 15}`,
        opCategory: 'add',
      };
    case 'SUB_15':
      return {
        nextValue: currentValue - 15,
        formula: `${currentValue} − 15 = ${currentValue - 15}`,
        opCategory: 'sub',
      };
    case 'ADD_10':
      return {
        nextValue: currentValue + 10,
        formula: `${currentValue} + 10 = ${currentValue + 10}`,
        opCategory: 'add',
      };
    case 'SUB_10':
      return {
        nextValue: currentValue - 10,
        formula: `${currentValue} − 10 = ${currentValue - 10}`,
        opCategory: 'sub',
      };
    case 'MUL_2':
      return {
        nextValue: currentValue * 2,
        formula: `${currentValue} × 2 = ${currentValue * 2}`,
        opCategory: 'mul',
      };
    case 'MUL_3':
      return {
        nextValue: currentValue * 3,
        formula: `${currentValue} × 3 = ${currentValue * 3}`,
        opCategory: 'mul',
      };
    case 'MUL_NEG_2': {
      const res = currentValue * -2;
      const normalized = Object.is(res, -0) ? 0 : res;
      return {
        nextValue: normalized,
        formula: `${currentValue} × (−2) = ${normalized}`,
        opCategory: 'mul',
      };
    }
    case 'FLIP_SIGN': {
      const res = -currentValue;
      const normalized = Object.is(res, -0) ? 0 : res;
      return {
        nextValue: normalized,
        formula: `−(${currentValue}) = ${normalized}`,
        opCategory: 'flip',
      };
    }
    default:
      return {
        nextValue: currentValue,
        formula: `${currentValue} (효과 미정)`,
        opCategory: null,
      };
  }
}

// 양의 약수 목록 구하기 (0이면 빈 배열 반환)
export function getPositiveDivisors(n: number): number[] {
  const absVal = Math.abs(Math.trunc(n));
  if (absVal === 0) return [];
  const divisors: number[] = [];
  for (let i = 1; i * i <= absVal; i++) {
    if (absVal % i === 0) {
      divisors.push(i);
      if (i * i !== absVal) {
        divisors.push(absVal / i);
      }
    }
  }
  return divisors.sort((a, b) => a - b);
}

// 팀의 카드 배치 순서에 따른 계산 과정 및 임무/점수 전체 평가
export function evaluateTeamScore(
  cards: AuctionCard[],
  secretMission: SecretMissionType,
  randomTargetInt: number
): TeamScoreResult {
  let current = 0;
  const steps: CalculationStep[] = [];
  const opSet = new Set<OperationCategory>();

  cards.forEach((card, idx) => {
    const { nextValue, formula, opCategory } = applyCardEffect(current, card);
    if (opCategory) opSet.add(opCategory);
    steps.push({
      stepNumber: idx + 1,
      card,
      prevValue: current,
      formula,
      resultValue: nextValue,
      opCategory,
    });
    current = nextValue;
  });

  const finalNumber = Object.is(current, -0) ? 0 : current;

  // 비밀 임무 점수
  let secretMissionScore = 0;
  if (secretMission === 'positive') {
    secretMissionScore = finalNumber > 0 ? finalNumber : 0;
  } else {
    secretMissionScore = finalNumber < 0 ? Math.abs(finalNumber) : 0;
  }

  // 공통 임무 판정
  const usedOpCategories = Array.from(opSet);
  const diverseOps = usedOpCategories.length >= 3;

  // 랜덤 정수의 배수: 0이 아닌 정수이면서 randomTargetInt로 나누어떨어지는지 (0도 정수 배수로 인정할지 여부는 finalNumber !== 0 && finalNumber % randomTargetInt === 0 기준이 중1 수업에서 명확함. 단 카드를 1장 이상 사용해 만든 배수 판정)
  const multipleOfRandom =
    randomTargetInt !== 0 && finalNumber !== 0 && finalNumber % randomTargetInt === 0;

  // 약수가 많은 수: 최종 숫자가 0이면 달성하지 못한 것으로 처리, |최종 숫자|의 양의 약수 4개 이상
  const divisorsOfAbs = finalNumber === 0 ? [] : getPositiveDivisors(finalNumber);
  const manyDivisors = finalNumber !== 0 && divisorsOfAbs.length >= 4;

  // 경매 전문가: 낙찰받은 카드 4장 이상
  const auctionExpert = cards.length >= 4;

  const commonCount =
    (diverseOps ? 1 : 0) +
    (multipleOfRandom ? 1 : 0) +
    (manyDivisors ? 1 : 0) +
    (auctionExpert ? 1 : 0);

  const commonScore = commonCount * 20;

  return {
    finalNumber,
    steps,
    secretMissionScore,
    commonMission: {
      diverseOps,
      multipleOfRandom,
      manyDivisors,
      auctionExpert,
      score: commonScore,
      usedOpCategories,
      divisorsOfAbs,
    },
    totalScore: secretMissionScore + commonScore,
  };
}

