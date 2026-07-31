'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  getScoresByUnitAction,
  submitScoreAction,
  loginStudentAction,
  registerStudentAction,
  getAllStudentsAdminAction,
  deleteStudentAdminAction,
  updateStudentAdminAction,
  ScoreRecord,
  StudentUser,
} from '@/app/actions';
import {
  Trophy,
  CheckCircle2,
  RefreshCw,
  User,
  Play,
  Send,
  Star,
  Lock,
  LogOut,
  LogIn,
  Calculator,
  Smile,
  GraduationCap,
  ShieldCheck,
  Trash2,
  Edit3,
  Save,
  X,
  Search,
  BookOpen,
  RotateCcw,
} from 'lucide-react';

// ─── 타입 정의 ───────────────────────────────────────────────
interface Question {
  id: number;
  question: string;
  options: string[];
  answer: number;
}

interface Unit {
  id: string;
  name: string;
  emoji: string;
  description: string;
  questions: Question[];
}

interface Grade {
  id: string;
  name: string;
  color: string;
  bgColor: string;
  shadowColor: string;
  emoji: string;
  units: Unit[];
}

// ─── 문제 데이터 ─────────────────────────────────────────────
const GRADES: Grade[] = [
  {
    id: 'mid1',
    name: '중1',
    color: '#FF85A1',
    bgColor: '#FFD1DC',
    shadowColor: 'rgba(255,209,220,0.7)',
    emoji: '📐',
    units: [
      {
        id: 'mid1_unit1',
        name: '1단원: 소인수분해',
        emoji: '🔢',
        description: '소수, 합성수, 소인수분해의 원리를 익혀요!',
        questions: [
          { id: 1, question: '다음 중 소수(Prime Number)는 어느 것인가요? 🔢', options: ['1', '4', '7', '9'], answer: 2 },
          { id: 2, question: '12를 소인수분해하면 어떻게 되나요?', options: ['2 × 6', '2² × 3', '3 × 4', '2 × 3²'], answer: 1 },
          { id: 3, question: '36의 소인수분해 결과는 무엇인가요?', options: ['2² × 3²', '2³ × 3', '4 × 9', '6²'], answer: 0 },
          { id: 4, question: '다음 중 합성수(Composite Number)가 아닌 것은?', options: ['4', '6', '9', '11'], answer: 3 },
          { id: 5, question: '60의 소인수의 합은 얼마인가요?', options: ['5', '7', '10', '12'], answer: 1 },
          { id: 6, question: '2³ × 5의 값은 얼마인가요?', options: ['30', '40', '45', '50'], answer: 1 },
          { id: 7, question: '48을 소인수분해하면 어떻게 되나요?', options: ['2³ × 6', '2⁴ × 3', '4 × 12', '2 × 3 × 8'], answer: 1 },
          { id: 8, question: '소수가 아닌 자연수(1 제외)를 무엇이라 하나요?', options: ['정수', '유리수', '합성수', '무리수'], answer: 2 },
          { id: 9, question: '100 이하의 소수의 개수는 몇 개인가요?', options: ['20개', '25개', '30개', '15개'], answer: 1 },
          { id: 10, question: '90의 소인수분해로 올바른 것은?', options: ['2 × 3² × 5', '2 × 45', '3 × 30', '2² × 3 × 5'], answer: 0 },
        ],
      },
      {
        id: 'mid1_unit2',
        name: '2단원: 정수와 유리수',
        emoji: '±️',
        description: '양수, 음수, 유리수의 덧셈·뺄셈·곱셈·나눗셈!',
        questions: [
          { id: 1, question: '(-3) + (+7) 의 값은 얼마일까요? 🧮', options: ['-4', '+4', '-10', '+10'], answer: 1 },
          { id: 2, question: '(-5) × (-4) 의 값은?', options: ['-20', '+20', '-9', '+9'], answer: 1 },
          { id: 3, question: '(-12) ÷ (+3) 의 값은?', options: ['+4', '-4', '+9', '-9'], answer: 1 },
          { id: 4, question: '절댓값 |−7| 의 값은?', options: ['-7', '0', '7', '1/7'], answer: 2 },
          { id: 5, question: '다음 중 유리수가 아닌 것은?', options: ['1/2', '0.3', '√2', '-5'], answer: 2 },
          { id: 6, question: '(-2)³ 의 값은?', options: ['8', '-8', '6', '-6'], answer: 1 },
          { id: 7, question: '+3보다 크고 -3보다 작은 정수의 개수는?', options: ['5개', '6개', '7개', '없음'], answer: 0 },
          { id: 8, question: '(-1/3) × (+9) 의 값은?', options: ['+3', '-3', '+27', '-27'], answer: 1 },
          { id: 9, question: '(-8) - (-3) 의 값은?', options: ['-11', '-5', '+5', '+11'], answer: 1 },
          { id: 10, question: '다음 중 가장 큰 수는?', options: ['-1/2', '-0.6', '-1', '-0.1'], answer: 3 },
        ],
      },
      {
        id: 'mid1_unit3',
        name: '3단원: 일차방정식',
        emoji: '📏',
        description: '방정식의 풀이와 활용 문제에 도전해요!',
        questions: [
          { id: 1, question: '일차방정식 2x + 4 = 10 의 해(x값)는?', options: ['x = 2', 'x = 3', 'x = 4', 'x = 5'], answer: 1 },
          { id: 2, question: '방정식 3x - 6 = 0 의 해는?', options: ['x = -2', 'x = 0', 'x = 2', 'x = 6'], answer: 2 },
          { id: 3, question: 'x + 5 = 2x - 3 의 해는?', options: ['x = 2', 'x = 4', 'x = 6', 'x = 8'], answer: 3 },
          { id: 4, question: '방정식 5x = 25 의 해는?', options: ['x = 4', 'x = 5', 'x = 20', 'x = 30'], answer: 1 },
          { id: 5, question: '2(x + 3) = 10 의 해는?', options: ['x = 1', 'x = 2', 'x = 4', 'x = 7'], answer: 1 },
          { id: 6, question: '어떤 수를 3배 하면 24가 된다. 이 수는?', options: ['6', '7', '8', '9'], answer: 2 },
          { id: 7, question: '방정식 4x - 2 = 2x + 8 의 해는?', options: ['x = 3', 'x = 5', 'x = 7', 'x = 9'], answer: 1 },
          { id: 8, question: 'x/2 + 3 = 7 의 해는?', options: ['x = 4', 'x = 6', 'x = 8', 'x = 10'], answer: 2 },
          { id: 9, question: '3(2x - 1) = 9 의 해는?', options: ['x = 1', 'x = 2', 'x = 3', 'x = 4'], answer: 1 },
          { id: 10, question: '연속된 두 정수의 합이 23이라면, 작은 수는?', options: ['10', '11', '12', '13'], answer: 1 },
        ],
      },
    ],
  },
  {
    id: 'mid2',
    name: '중2',
    color: '#52B788',
    bgColor: '#B5EAD7',
    shadowColor: 'rgba(181,234,215,0.7)',
    emoji: '📊',
    units: [
      {
        id: 'mid2_unit1',
        name: '1단원: 유리수와 순환소수',
        emoji: '🔄',
        description: '분수를 소수로! 순환소수의 세계를 탐구해요!',
        questions: [
          { id: 1, question: '분수 3/8 을 소수로 나타내면? 🔢', options: ['0.375 (유한소수)', '0.333... (순환소수)', '0.625 (유한소수)', '0.875 (유한소수)'], answer: 0 },
          { id: 2, question: '분수 1/3 을 소수로 나타내면?', options: ['0.333...', '0.3 (유한)', '0.133...', '3.0'], answer: 0 },
          { id: 3, question: '유한소수가 되는 분수는? (기약분수 기준)', options: ['1/7', '1/6', '3/8', '2/9'], answer: 2 },
          { id: 4, question: '0.333... 을 분수로 나타내면?', options: ['3/10', '1/3', '33/100', '1/30'], answer: 1 },
          { id: 5, question: '분모가 2^m × 5^n 꼴인 기약분수는?', options: ['순환소수', '무리수', '유한소수', '정수'], answer: 2 },
          { id: 6, question: '0.272727... 을 분수로 나타내면?', options: ['27/99 = 3/11', '27/100', '3/10', '27/9'], answer: 0 },
          { id: 7, question: '5/12 는 어떤 소수인가요?', options: ['유한소수', '순환소수', '무리수', '정수'], answer: 1 },
          { id: 8, question: '유한소수와 순환소수를 합쳐서 부르는 이름은?', options: ['실수', '무리수', '유리수', '복소수'], answer: 2 },
          { id: 9, question: '0.6 (순환소수) 을 분수로 나타내면?', options: ['6/10', '2/3', '6/99', '3/5'], answer: 1 },
          { id: 10, question: '분수 7/20 를 소수로 나타내면?', options: ['0.35', '0.7', '0.37', '0.307'], answer: 0 },
        ],
      },
      {
        id: 'mid2_unit2',
        name: '2단원: 일차부등식',
        emoji: '⚖️',
        description: '부등식을 풀고 수직선에 나타내 봐요!',
        questions: [
          { id: 1, question: '부등식 3x - 2 > 7 의 해는? ⚖️', options: ['x > 3', 'x < 3', 'x > 5', 'x < 5'], answer: 0 },
          { id: 2, question: '부등식 2x + 4 ≤ 10 의 해는?', options: ['x ≤ 3', 'x ≥ 3', 'x ≤ 7', 'x ≥ 7'], answer: 0 },
          { id: 3, question: '-x > 2 를 풀면?', options: ['x > -2', 'x < -2', 'x > 2', 'x < 2'], answer: 1 },
          { id: 4, question: '3x - 5 < x + 3 의 해는?', options: ['x < 1', 'x > 1', 'x < 4', 'x > 4'], answer: 2 },
          { id: 5, question: '부등식의 양변에 음수를 곱하거나 나누면 부등호 방향은?', options: ['바뀐다', '바뀌지 않는다', '없어진다', '같아진다'], answer: 0 },
          { id: 6, question: '5x ≥ -15 의 해는?', options: ['x ≤ -3', 'x ≥ -3', 'x ≤ 3', 'x ≥ 3'], answer: 1 },
          { id: 7, question: '2(x - 1) > 4 의 해는?', options: ['x > 1', 'x > 2', 'x > 3', 'x > 4'], answer: 2 },
          { id: 8, question: 'x/(-3) < 2 를 풀면?', options: ['x > -6', 'x < -6', 'x > 6', 'x < 6'], answer: 0 },
          { id: 9, question: '어떤 수에 4를 더하면 10보다 작다. 이를 부등식으로 나타내면?', options: ['x + 4 > 10', 'x + 4 < 10', 'x - 4 < 10', '4x < 10'], answer: 1 },
          { id: 10, question: '-2x + 6 ≥ 2 의 해는?', options: ['x ≤ 2', 'x ≥ 2', 'x ≤ -2', 'x ≥ -2'], answer: 0 },
        ],
      },
      {
        id: 'mid2_unit3',
        name: '3단원: 일차함수',
        emoji: '📈',
        description: '기울기, y절편, 그래프를 마스터해요!',
        questions: [
          { id: 1, question: '일차함수 y = 2x + 5 의 y절편은? 📈', options: ['2', '5', '-5', '-2'], answer: 1 },
          { id: 2, question: 'y = 3x - 4 의 기울기(slope)는?', options: ['-4', '3', '-3', '4'], answer: 1 },
          { id: 3, question: 'y = -x + 2 가 x축과 만나는 점(x절편)은?', options: ['(2, 0)', '(-2, 0)', '(0, 2)', '(0, -2)'], answer: 0 },
          { id: 4, question: '기울기가 2, y절편이 -3인 일차함수 식은?', options: ['y = 2x - 3', 'y = -3x + 2', 'y = 2x + 3', 'y = 3x - 2'], answer: 0 },
          { id: 5, question: '두 점 (0,1), (2,5)를 지나는 직선의 기울기는?', options: ['1', '2', '3', '4'], answer: 1 },
          { id: 6, question: 'y = -2x + 6 에서 x = 3일 때 y값은?', options: ['0', '3', '-6', '12'], answer: 0 },
          { id: 7, question: '일차함수 y = x - 1 의 그래프가 지나는 사분면은?', options: ['1, 2, 3사분면', '1, 3, 4사분면', '1, 2, 4사분면', '2, 3, 4사분면'], answer: 1 },
          { id: 8, question: 'y = -3x + 9 의 그래프에서 x가 증가하면 y는?', options: ['증가', '감소', '일정', '알 수 없음'], answer: 1 },
          { id: 9, question: '일차함수 y = 4x + b 가 점 (1, 7)을 지날 때 b의 값은?', options: ['1', '2', '3', '4'], answer: 2 },
          { id: 10, question: '기울기가 -1이고 점 (3, 0)을 지나는 직선의 식은?', options: ['y = -x + 3', 'y = x - 3', 'y = -x - 3', 'y = x + 3'], answer: 0 },
        ],
      },
    ],
  },
  {
    id: 'mid3',
    name: '중3',
    color: '#7B8DE0',
    bgColor: '#C7CEEA',
    shadowColor: 'rgba(199,206,234,0.7)',
    emoji: '🔭',
    units: [
      {
        id: 'mid3_unit1',
        name: '1단원: 제곱근과 실수',
        emoji: '√',
        description: '무리수와 실수의 세계로 들어가 봐요!',
        questions: [
          { id: 1, question: '√16 의 값은? 📐', options: ['2', '4', '8', '16'], answer: 1 },
          { id: 2, question: '√2 는 어떤 수인가요?', options: ['유한소수', '순환소수', '무리수', '정수'], answer: 2 },
          { id: 3, question: '√49 를 간단히 하면?', options: ['√7', '7', '7²', '√7²'], answer: 1 },
          { id: 4, question: '√12 를 간단히 하면?', options: ['2√3', '3√2', '√6 × 2', '4√3'], answer: 0 },
          { id: 5, question: '√5 × √5 의 값은?', options: ['25', '5', '√25', '10'], answer: 1 },
          { id: 6, question: '실수에 포함되지 않는 것은?', options: ['√2', '3/4', '-5', '√(-4)'], answer: 3 },
          { id: 7, question: '√18 을 간단히 하면?', options: ['3√2', '2√3', '6√3', '9√2'], answer: 0 },
          { id: 8, question: '√3 + √3 의 값은?', options: ['√6', '2√3', '3√2', '√9'], answer: 1 },
          { id: 9, question: '2√5 × 3√5 의 값은?', options: ['5√5', '6√25', '30', '6√5'], answer: 2 },
          { id: 10, question: '√50 ÷ √2 의 값은?', options: ['5', '√25', '√10', '√100'], answer: 0 },
        ],
      },
      {
        id: 'mid3_unit2',
        name: '2단원: 이차방정식',
        emoji: '🧮',
        description: '인수분해와 근의 공식으로 이차방정식 정복!',
        questions: [
          { id: 1, question: 'x² - 5x + 6 = 0 의 두 근은?', options: ['x = 1 또는 6', 'x = 2 또는 3', 'x = -2 또는 -3', 'x = 0 또는 5'], answer: 1 },
          { id: 2, question: 'x² - 9 = 0 의 해는?', options: ['x = ±3', 'x = 9', 'x = ±9', 'x = 3'], answer: 0 },
          { id: 3, question: '(x - 2)(x + 5) = 0 의 해는?', options: ['x = 2 또는 -5', 'x = -2 또는 5', 'x = 2 또는 5', 'x = -2 또는 -5'], answer: 0 },
          { id: 4, question: 'x² + 6x + 9 = 0 의 해는?', options: ['x = 3', 'x = -3', 'x = ±3', 'x = 6'], answer: 1 },
          { id: 5, question: 'x² - 4x = 0 의 해는?', options: ['x = 0 또는 4', 'x = 4', 'x = 0', 'x = 2'], answer: 0 },
          { id: 6, question: '2x² - 8 = 0 의 해는?', options: ['x = ±1', 'x = ±2', 'x = ±4', 'x = 2'], answer: 1 },
          { id: 7, question: 'x² + 3x - 10 = 0 의 해는?', options: ['x = 2 또는 -5', 'x = -2 또는 5', 'x = 2 또는 5', 'x = -2 또는 -5'], answer: 0 },
          { id: 8, question: '이차방정식의 판별식 D = b² - 4ac 에서 D > 0이면?', options: ['서로 다른 두 실근', '중근', '실근 없음', '허수근'], answer: 0 },
          { id: 9, question: 'x² - 2x - 15 = 0 의 두 근의 합은?', options: ['2', '-2', '15', '-15'], answer: 0 },
          { id: 10, question: '넓이가 24인 직사각형의 가로가 (x+2), 세로가 (x+4)일 때 x값은?', options: ['x = 2', 'x = 0', 'x = -2', 'x = 4'], answer: 0 },
        ],
      },
      {
        id: 'mid3_unit3',
        name: '3단원: 이차함수',
        emoji: '🌊',
        description: '포물선의 아름다운 세계, 이차함수를 배워요!',
        questions: [
          { id: 1, question: 'y = x² 의 그래프는 어떤 모양인가요?', options: ['직선', '포물선', '원', '타원'], answer: 1 },
          { id: 2, question: 'y = 2x² 에서 꼭짓점의 좌표는?', options: ['(0, 0)', '(2, 0)', '(0, 2)', '(1, 2)'], answer: 0 },
          { id: 3, question: 'y = x² - 4 의 꼭짓점 y좌표는?', options: ['0', '-4', '4', '2'], answer: 1 },
          { id: 4, question: 'y = (x - 3)² 의 꼭짓점은?', options: ['(3, 0)', '(-3, 0)', '(0, 3)', '(0, -3)'], answer: 0 },
          { id: 5, question: 'y = -x² 의 그래프는 어느 방향으로 열려있나요?', options: ['위쪽', '아래쪽', '오른쪽', '왼쪽'], answer: 1 },
          { id: 6, question: 'y = x² + 2x + 1 을 완전제곱식으로 변환하면?', options: ['y = (x+1)²', 'y = (x-1)²', 'y = (x+2)²', 'y = (x-2)²'], answer: 0 },
          { id: 7, question: 'y = 2(x-1)² + 3 의 꼭짓점 좌표는?', options: ['(1, 3)', '(-1, 3)', '(1, -3)', '(-1, -3)'], answer: 0 },
          { id: 8, question: 'y = x² - 6x + 8 의 꼭짓점의 y좌표는?', options: ['-1', '0', '1', '-2'], answer: 0 },
          { id: 9, question: 'a > 0 일 때 y = ax² + q 의 그래프의 특징은?', options: ['아래로 볼록, 꼭짓점 (0,q)', '위로 볼록, 꼭짓점 (0,q)', '아래로 볼록, 꼭짓점 (q,0)', '위로 볼록, 꼭짓점 (q,0)'], answer: 0 },
          { id: 10, question: 'y = 3x² 와 y = (1/3)x² 를 비교하면?', options: ['3x²가 더 좁다', '1/3x²가 더 좁다', '폭이 같다', '방향이 반대다'], answer: 0 },
        ],
      },
    ],
  },
];

// ─── 유틸: 배열 셔플 (Fisher-Yates) ─────────────────────────
function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickRandom<T>(arr: T[], count: number): T[] {
  return shuffleArray(arr).slice(0, count);
}

// ─── 메인 컴포넌트 ───────────────────────────────────────────
export default function Home() {
  // 내비게이션
  const [activeGradeId, setActiveGradeId] = useState<string>('mid1');
  const [activeUnitId, setActiveUnitId] = useState<string>('mid1_unit1');

  // 뷰 모드: 'home' | 'quiz' | 'result' | 'leaderboard'
  const [viewMode, setViewMode] = useState<'home' | 'quiz' | 'result' | 'leaderboard'>('home');

  // 현재 사용자
  const [currentUser, setCurrentUser] = useState<StudentUser | null>(null);

  // Auth
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [inputStudentId, setInputStudentId] = useState('');
  const [inputName, setInputName] = useState('');
  const [inputPassword, setInputPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Admin
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [studentList, setStudentList] = useState<StudentUser[]>([]);
  const [loadingAdminList, setLoadingAdminList] = useState(false);
  const [adminSearch, setAdminSearch] = useState('');
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [editNameInput, setEditNameInput] = useState('');
  const [editPasswordInput, setEditPasswordInput] = useState('');

  // Quiz
  const [quizQuestions, setQuizQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [isSubmittingScore, setIsSubmittingScore] = useState(false);
  const [isScoreSubmitted, setIsScoreSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Leaderboard
  const [leaderboard, setLeaderboard] = useState<ScoreRecord[]>([]);
  const [isLoadingLeaderboard, setIsLoadingLeaderboard] = useState(false);

  // ── 편의 헬퍼 ──
  const activeGrade = GRADES.find((g) => g.id === activeGradeId)!;
  const activeUnit = activeGrade.units.find((u) => u.id === activeUnitId)!;

  // 학년 변경 시 첫 번째 단원으로
  const handleGradeChange = (gradeId: string) => {
    const grade = GRADES.find((g) => g.id === gradeId)!;
    setActiveGradeId(gradeId);
    setActiveUnitId(grade.units[0].id);
    setViewMode('home');
    setIsScoreSubmitted(false);
  };

  // 단원 변경
  const handleUnitChange = (unitId: string) => {
    setActiveUnitId(unitId);
    setViewMode('home');
    setIsScoreSubmitted(false);
  };

  // localStorage 복원
  useEffect(() => {
    const saved = localStorage.getItem('math_student_user');
    if (saved) {
      try { setCurrentUser(JSON.parse(saved)); } catch { /* ignore */ }
    }
  }, []);

  // ── 리더보드 불러오기 ──
  const fetchLeaderboard = useCallback(async () => {
    setIsLoadingLeaderboard(true);
    const res = await getScoresByUnitAction(activeUnitId);
    if (res.success && res.data) setLeaderboard(res.data);
    setIsLoadingLeaderboard(false);
  }, [activeUnitId]);

  useEffect(() => {
    if (viewMode === 'leaderboard') fetchLeaderboard();
  }, [viewMode, fetchLeaderboard]);

  // ── 관리자 ──
  const fetchAdminStudentList = useCallback(async () => {
    if (!currentUser || currentUser.student_id !== '10000') return;
    setLoadingAdminList(true);
    const res = await getAllStudentsAdminAction(currentUser.student_id);
    if (res.success && res.students) setStudentList(res.students);
    setLoadingAdminList(false);
  }, [currentUser]);

  useEffect(() => {
    if (showAdminModal) fetchAdminStudentList();
  }, [showAdminModal, fetchAdminStudentList]);

  const handleDeleteStudent = async (targetId: string, name: string) => {
    if (!currentUser || currentUser.student_id !== '10000') return;
    if (!confirm(`${name} (${targetId}) 학생 계정을 정말 삭제하시겠습니까?`)) return;
    const res = await deleteStudentAdminAction(currentUser.student_id, targetId);
    if (res.success) fetchAdminStudentList();
    else alert(res.error || '삭제 실패');
  };

  const handleStartEdit = (st: StudentUser) => {
    setEditingStudentId(st.student_id);
    setEditNameInput(st.name);
    setEditPasswordInput(st.password || '');
  };

  const handleSaveEdit = async (targetId: string) => {
    if (!currentUser || currentUser.student_id !== '10000') return;
    const res = await updateStudentAdminAction(currentUser.student_id, targetId, editNameInput, editPasswordInput);
    if (res.success) { setEditingStudentId(null); fetchAdminStudentList(); }
    else alert(res.error || '수정 실패');
  };

  // ── 로그인 / 회원가입 ──
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);
    const res = await loginStudentAction(inputStudentId, inputPassword);
    if (res.success && res.student) {
      setCurrentUser(res.student);
      localStorage.setItem('math_student_user', JSON.stringify(res.student));
      setShowAuthModal(false);
      resetAuthForm();
    } else {
      setAuthError(res.error || '로그인 실패');
    }
    setAuthLoading(false);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);
    const res = await registerStudentAction(inputStudentId, inputName, inputPassword);
    if (res.success && res.student) {
      setCurrentUser(res.student);
      localStorage.setItem('math_student_user', JSON.stringify(res.student));
      setShowAuthModal(false);
      resetAuthForm();
    } else {
      setAuthError(res.error || '회원가입 실패');
    }
    setAuthLoading(false);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('math_student_user');
  };

  const resetAuthForm = () => {
    setInputStudentId(''); setInputName(''); setInputPassword(''); setAuthError('');
  };

  // ── 퀴즈 ──
  const startQuiz = () => {
    if (!currentUser) { setShowAuthModal(true); return; }
    const picked = pickRandom(activeUnit.questions, 5);
    setQuizQuestions(picked);
    setCurrentQuestionIndex(0);
    setSelectedAnswers([]);
    setIsScoreSubmitted(false);
    setSubmitError('');
    setViewMode('quiz');
  };

  const handleSelectOption = (idx: number) => {
    const newAnswers = [...selectedAnswers];
    newAnswers[currentQuestionIndex] = idx;
    setSelectedAnswers(newAnswers);
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < quizQuestions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    } else {
      setViewMode('result');
    }
  };

  const calculateScore = () =>
    selectedAnswers.reduce((score, answer, index) =>
      answer === quizQuestions[index].answer ? score + 1 : score, 0);

  const handleSubmitScore = async () => {
    if (!currentUser || isScoreSubmitted) return;
    setIsSubmittingScore(true);
    setSubmitError('');
    const score = calculateScore();
    const displayName = `${currentUser.name} (${currentUser.student_id})`;
    const res = await submitScoreAction(displayName, score, quizQuestions.length, activeUnitId);
    if (res.success) {
      setIsScoreSubmitted(true);
      setViewMode('leaderboard');
    } else {
      setSubmitError(res.error || '점수 저장에 실패했습니다.');
    }
    setIsSubmittingScore(false);
  };

  const filteredAdminStudents = studentList.filter(
    (st) =>
      st.student_id.includes(adminSearch.trim()) ||
      st.name.toLowerCase().includes(adminSearch.trim().toLowerCase())
  );

  // ── 색상 헬퍼 ──
  const gc = activeGrade.bgColor;
  const shadow = activeGrade.shadowColor;

  return (
    <div className="flex flex-col min-h-screen font-sans bg-[#F4F7FF] text-[#4B5563]" style={{ fontFamily: "'Noto Sans KR', sans-serif" }}>

      {/* ───── 헤더 ───── */}
      <header className="flex flex-col gap-4 p-5 bg-white/80 backdrop-blur-xl shadow-[0_4px_30px_rgba(181,200,255,0.2)] border-b border-white/60">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* 로고 */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => { setActiveGradeId('mid1'); setActiveUnitId('mid1_unit1'); setViewMode('home'); }}>
            <div className="w-11 h-11 bg-gradient-to-br from-[#FFD1DC] to-[#B5EAD7] rounded-2xl flex items-center justify-center shadow-lg">
              <Calculator className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#FF85A1] to-[#7B8DE0] tracking-tight">
                수학교실 📐
              </h1>
              <p className="text-xs text-[#A2B5E2]">즐거운 중등 수학 탐구 공간</p>
            </div>
          </div>

          {/* 학년 내비게이션 */}
          <nav className="flex items-center gap-1 bg-[#F0F4FF] p-1.5 rounded-full shadow-inner">
            {GRADES.map((grade) => (
              <button
                key={grade.id}
                onClick={() => handleGradeChange(grade.id)}
                className={`px-5 py-2 rounded-full text-base font-bold transition-all duration-200 ${
                  activeGradeId === grade.id
                    ? 'text-white scale-105 shadow-lg'
                    : 'text-[#8E9BAE] hover:text-[#4B5563]'
                }`}
                style={activeGradeId === grade.id ? { backgroundColor: grade.bgColor, boxShadow: `0 4px 15px ${grade.shadowColor}` } : {}}
              >
                {grade.name}
              </button>
            ))}
          </nav>

          {/* 로그인 영역 */}
          <div>
            {currentUser ? (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm border border-gray-100">
                  <GraduationCap className="w-5 h-5 text-[#A2B5E2]" />
                  <span className="font-bold text-sm text-[#4B5563]">{currentUser.name}</span>
                  <span className="text-xs text-[#8E9BAE]">({currentUser.student_id})</span>
                  {currentUser.student_id === '10000' && (
                    <button
                      onClick={() => setShowAdminModal(true)}
                      className="flex items-center gap-1 ml-1 px-2.5 py-1 bg-[#FFD1DC] text-white text-xs rounded-full hover:scale-105 transition-transform font-bold"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      관리
                    </button>
                  )}
                  <button onClick={handleLogout} className="p-1 hover:text-red-400 transition-colors text-gray-300 ml-1">
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => { resetAuthForm(); setShowAuthModal(true); }}
                className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-[#B5EAD7] to-[#A2D4FF] text-white rounded-full hover:scale-105 transition-transform shadow-md font-bold"
              >
                <LogIn className="w-4 h-4" />
                학번 로그인
              </button>
            )}
          </div>
        </div>

        {/* ── 단원 탭 (2차 내비게이션) ── */}
        <div className="flex items-center gap-2 flex-wrap justify-center">
          {activeGrade.units.map((unit) => (
            <button
              key={unit.id}
              onClick={() => handleUnitChange(unit.id)}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-semibold transition-all duration-200 border ${
                activeUnitId === unit.id
                  ? 'text-white border-transparent shadow-md scale-105'
                  : 'text-[#8E9BAE] bg-white border-gray-100 hover:border-gray-200'
              }`}
              style={activeUnitId === unit.id ? { backgroundColor: activeGrade.color, boxShadow: `0 3px 12px ${shadow}` } : {}}
            >
              <span>{unit.emoji}</span>
              <span>{unit.name}</span>
            </button>
          ))}
          <button
            onClick={() => setViewMode('leaderboard')}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-semibold transition-all duration-200 border ${
              viewMode === 'leaderboard'
                ? 'bg-amber-400 text-white border-transparent shadow-md scale-105'
                : 'text-[#8E9BAE] bg-white border-gray-100 hover:border-gray-200'
            }`}
          >
            <Trophy className="w-4 h-4" />
            이 단원 명예의 전당
          </button>
        </div>
      </header>

      {/* ───── 메인 ───── */}
      <main className="flex-grow flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-2xl">

          {/* ── 홈: 단원 소개 + 퀴즈 시작 ── */}
          {viewMode === 'home' && (
            <div className="bg-white rounded-[2.5rem] shadow-[0_12px_40px_rgba(199,206,234,0.3)] p-10 flex flex-col items-center gap-8 text-center">
              <div
                className="w-24 h-24 rounded-full flex items-center justify-center text-5xl shadow-xl"
                style={{ backgroundColor: gc + '60', boxShadow: `0 8px 30px ${shadow}` }}
              >
                {activeUnit.emoji}
              </div>
              <div>
                <p className="text-sm font-bold uppercase tracking-widest mb-2" style={{ color: activeGrade.color }}>
                  {activeGrade.name} 수학교실
                </p>
                <h2 className="text-3xl font-black text-[#2D3748] mb-3">{activeUnit.name}</h2>
                <p className="text-lg text-[#8E9BAE]">{activeUnit.description}</p>
              </div>

              <div className="flex flex-col gap-3 w-full">
                <div className="flex justify-center gap-6 text-sm text-[#8E9BAE] bg-[#F8FBFE] rounded-2xl p-4">
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-2xl font-black text-[#4B5563]">5</span>
                    <span>문제</span>
                  </div>
                  <div className="w-px bg-gray-100" />
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-2xl font-black text-[#4B5563]">{activeUnit.questions.length}</span>
                    <span>문제 풀에서 랜덤</span>
                  </div>
                  <div className="w-px bg-gray-100" />
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-2xl font-black text-[#4B5563]">5점</span>
                    <span>만점</span>
                  </div>
                </div>

                {!currentUser && (
                  <div className="bg-amber-50 border border-amber-100 p-3 rounded-2xl text-sm text-amber-700">
                    💡 점수를 저장하려면 먼저 <strong>학번 로그인</strong>을 해주세요!
                  </div>
                )}

                <button
                  onClick={startQuiz}
                  className="group flex items-center justify-center gap-3 w-full py-4 text-white text-xl font-bold rounded-full hover:scale-105 transition-all duration-200 shadow-xl"
                  style={{ background: `linear-gradient(135deg, ${activeGrade.color}, ${gc})`, boxShadow: `0 8px 25px ${shadow}` }}
                >
                  <Play className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                  퀴즈 시작하기!
                </button>

                <button
                  onClick={() => setViewMode('leaderboard')}
                  className="flex items-center justify-center gap-2 w-full py-3 text-[#8E9BAE] text-base font-semibold rounded-full bg-[#F8FBFE] hover:bg-[#F0F4FF] transition-colors"
                >
                  <Trophy className="w-5 h-5 text-amber-400" />
                  이 단원 명예의 전당 보기
                </button>
              </div>
            </div>
          )}

          {/* ── 퀴즈 진행 ── */}
          {viewMode === 'quiz' && quizQuestions.length > 0 && (
            <div className="bg-white rounded-[2.5rem] shadow-[0_12px_40px_rgba(199,206,234,0.3)] p-8 flex flex-col gap-6">
              {/* 헤더 */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-[#A2B5E2]">{activeGrade.name} · {activeUnit.name}</p>
                  <p className="font-bold text-[#4B5563]">도전자: <span style={{ color: activeGrade.color }}>{currentUser?.name}</span></p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-black text-[#4B5563]">{currentQuestionIndex + 1}<span className="text-base text-[#A2B5E2]">/{quizQuestions.length}</span></p>
                  <p className="text-xs text-[#A2B5E2]">문제</p>
                </div>
              </div>

              {/* 진행 바 */}
              <div className="w-full h-2 bg-[#F0F4FF] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${((currentQuestionIndex + 1) / quizQuestions.length) * 100}%`,
                    backgroundColor: activeGrade.color,
                  }}
                />
              </div>

              {/* 문제 */}
              <div className="bg-gradient-to-br from-[#F8FBFE] to-[#F0F4FF] p-7 rounded-3xl text-center">
                <h3 className="text-xl sm:text-2xl text-[#2D3748] font-bold leading-relaxed">
                  {quizQuestions[currentQuestionIndex].question}
                </h3>
              </div>

              {/* 선택지 */}
              <div className="grid grid-cols-1 gap-3">
                {quizQuestions[currentQuestionIndex].options.map((option, idx) => {
                  const isSelected = selectedAnswers[currentQuestionIndex] === idx;
                  return (
                    <button
                      key={idx}
                      onClick={() => handleSelectOption(idx)}
                      className={`w-full py-3.5 px-6 text-base text-left rounded-2xl transition-all duration-200 flex items-center justify-between font-medium ${
                        isSelected
                          ? 'text-white scale-[1.02] shadow-lg'
                          : 'bg-[#F8FBFE] text-[#4B5563] hover:bg-[#F0F4FF] border border-gray-100'
                      }`}
                      style={isSelected ? { backgroundColor: activeGrade.color, boxShadow: `0 6px 20px ${shadow}` } : {}}
                    >
                      <span>{idx + 1}. {option}</span>
                      {isSelected && <CheckCircle2 className="w-5 h-5 text-white shrink-0" />}
                    </button>
                  );
                })}
              </div>

              {/* 다음 버튼 */}
              <button
                onClick={handleNextQuestion}
                disabled={selectedAnswers[currentQuestionIndex] === undefined}
                className="w-full py-4 text-white text-lg font-bold rounded-full hover:scale-105 disabled:opacity-40 disabled:hover:scale-100 transition-all duration-200 shadow-lg"
                style={{ backgroundColor: activeGrade.color, boxShadow: `0 8px 20px ${shadow}` }}
              >
                {currentQuestionIndex < quizQuestions.length - 1 ? '다음 문제 ➡️' : '결과 보기 🎉'}
              </button>
            </div>
          )}

          {/* ── 결과 ── */}
          {viewMode === 'result' && (
            <div className="bg-white rounded-[2.5rem] shadow-[0_12px_40px_rgba(199,206,234,0.3)] p-10 flex flex-col items-center gap-6 text-center">
              <div className="w-28 h-28 bg-gradient-to-br from-amber-300 to-orange-400 rounded-full flex items-center justify-center text-5xl shadow-xl animate-bounce">
                🏆
              </div>
              <div>
                <h2 className="text-3xl font-black text-[#2D3748] mb-1">{currentUser?.name} 학생 수고했어요!</h2>
                <p className="text-[#8E9BAE] text-sm">{activeGrade.name} · {activeUnit.name}</p>
              </div>

              {/* 점수 카드 */}
              <div className="w-full bg-gradient-to-br from-[#F8FBFE] to-[#F0F4FF] p-8 rounded-3xl flex flex-col items-center gap-3">
                <p className="text-[#8E9BAE] font-semibold">최종 점수</p>
                <div className="flex items-end gap-2">
                  <span className="text-6xl font-black" style={{ color: activeGrade.color }}>{calculateScore()}</span>
                  <span className="text-2xl text-[#8E9BAE] mb-2">/ {quizQuestions.length}점</span>
                </div>
                {/* 문제별 O/X */}
                <div className="flex gap-2 mt-2">
                  {quizQuestions.map((q, i) => (
                    <div
                      key={i}
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${
                        selectedAnswers[i] === q.answer ? 'bg-green-100 text-green-500' : 'bg-red-100 text-red-400'
                      }`}
                    >
                      {selectedAnswers[i] === q.answer ? '⭕' : '❌'}
                    </div>
                  ))}
                </div>
              </div>

              {submitError && (
                <p className="text-red-400 text-sm bg-red-50 p-3 rounded-2xl w-full">{submitError}</p>
              )}

              <div className="flex flex-col gap-3 w-full">
                {!isScoreSubmitted ? (
                  <button
                    onClick={handleSubmitScore}
                    disabled={isSubmittingScore}
                    className="flex items-center justify-center gap-3 w-full py-4 text-white text-lg font-bold rounded-full hover:scale-105 disabled:opacity-50 transition-all shadow-xl"
                    style={{ backgroundColor: activeGrade.color, boxShadow: `0 8px 25px ${shadow}` }}
                  >
                    <Send className="w-5 h-5" />
                    {isSubmittingScore ? '저장 중...' : '점수 제출하고 랭킹 등록!'}
                  </button>
                ) : (
                  <button
                    onClick={() => setViewMode('leaderboard')}
                    className="flex items-center justify-center gap-3 w-full py-4 bg-amber-400 text-white text-lg font-bold rounded-full hover:scale-105 transition-all shadow-xl"
                  >
                    <Trophy className="w-5 h-5" />
                    명예의 전당 보기 🏆
                  </button>
                )}
                <button
                  onClick={startQuiz}
                  className="flex items-center justify-center gap-2 w-full py-3 text-[#8E9BAE] font-semibold rounded-full bg-[#F8FBFE] hover:bg-[#F0F4FF] transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                  다시 풀기 (랜덤 5문제)
                </button>
              </div>
            </div>
          )}

          {/* ── 명예의 전당 ── */}
          {viewMode === 'leaderboard' && (
            <div className="bg-white rounded-[2.5rem] shadow-[0_12px_40px_rgba(199,206,234,0.3)] p-8 flex flex-col gap-6">
              <div className="flex items-center justify-between border-b pb-4 border-[#F0F4FF]">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-[#A2B5E2] mb-1">{activeGrade.name} · {activeUnit.name}</p>
                  <div className="flex items-center gap-2">
                    <Trophy className="w-6 h-6 text-amber-400" />
                    <h2 className="text-2xl font-black text-[#2D3748]">명예의 전당</h2>
                  </div>
                </div>
                <button
                  onClick={fetchLeaderboard}
                  className="p-2.5 bg-[#F0F4FF] rounded-full hover:rotate-180 transition-transform duration-500 text-[#A2B5E2]"
                >
                  <RefreshCw className="w-5 h-5" />
                </button>
              </div>

              {isLoadingLeaderboard ? (
                <div className="py-16 text-center text-[#8E9BAE]">랭킹을 불러오는 중... ✨</div>
              ) : leaderboard.length === 0 ? (
                <div className="py-16 text-center flex flex-col items-center gap-4">
                  <Star className="w-14 h-14 text-amber-200" />
                  <p className="text-xl text-[#8E9BAE] font-semibold">첫 번째 퀴즈왕이 되어보세요!</p>
                  <button
                    onClick={() => setViewMode('home')}
                    className="flex items-center gap-2 px-6 py-3 text-white font-bold rounded-full transition-all hover:scale-105 shadow-lg"
                    style={{ backgroundColor: activeGrade.color }}
                  >
                    <Play className="w-4 h-4" /> 퀴즈 도전하기
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-3 max-h-[420px] overflow-y-auto pr-1">
                  {leaderboard.map((item, index) => {
                    const medals = ['🥇', '🥈', '🥉'];
                    return (
                      <div
                        key={item.id || index}
                        className={`flex items-center justify-between p-4 rounded-2xl transition-all ${
                          index === 0
                            ? 'bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-100 shadow-md'
                            : index === 1
                            ? 'bg-gradient-to-r from-slate-50 to-gray-50 border border-gray-100'
                            : index === 2
                            ? 'bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-100'
                            : 'bg-[#F8FBFE]'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-9 text-center text-xl font-bold">
                            {index < 3 ? medals[index] : <span className="text-[#A2B5E2] text-base">#{index + 1}</span>}
                          </span>
                          <div>
                            <p className="font-bold text-[#2D3748]">{item.student_name}</p>
                            <p className="text-xs text-[#A2B5E2]">{item.created_at ? new Date(item.created_at).toLocaleDateString('ko-KR') : ''}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-xl font-black" style={{ color: activeGrade.color }}>{item.score}</span>
                          <span className="text-sm text-[#A2B5E2]">/ {item.total_questions}점</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <button
                onClick={() => setViewMode('home')}
                className="flex items-center justify-center gap-2 w-full py-3 text-[#8E9BAE] font-semibold rounded-full bg-[#F8FBFE] hover:bg-[#F0F4FF] transition-colors"
              >
                <BookOpen className="w-4 h-4" />
                단원으로 돌아가기
              </button>
            </div>
          )}

        </div>
      </main>

      {/* ───── 관리자 모달 ───── */}
      {showAdminModal && currentUser?.student_id === '10000' && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white w-full max-w-2xl p-8 rounded-[2.5rem] shadow-2xl flex flex-col gap-6 relative max-h-[90vh] overflow-hidden">
            <button onClick={() => setShowAdminModal(false)} className="absolute top-6 right-6 text-gray-400 hover:text-gray-600">
              <X className="w-6 h-6" />
            </button>

            <div className="flex items-center gap-3 border-b pb-4 border-gray-100">
              <ShieldCheck className="w-7 h-7 text-[#FF85A1]" />
              <div>
                <h3 className="text-xl font-black text-[#2D3748]">학생 계정 관리 🔐</h3>
                <p className="text-xs text-[#8E9BAE]">관리자: {currentUser.name}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative flex-grow">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A2B5E2]" />
                <input
                  type="text"
                  placeholder="학번 또는 이름으로 검색"
                  value={adminSearch}
                  onChange={(e) => setAdminSearch(e.target.value)}
                  className="w-full pl-11 pr-4 py-2.5 bg-[#F8FBFE] text-sm rounded-full outline-none focus:ring-2 focus:ring-[#FFD1DC]"
                />
              </div>
              <button onClick={fetchAdminStudentList} className="p-2.5 bg-[#F0F4FF] rounded-full text-[#A2B5E2] hover:rotate-180 transition-transform duration-500">
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-grow overflow-y-auto pr-1 flex flex-col gap-2 max-h-[380px]">
              {loadingAdminList ? (
                <div className="py-8 text-center text-[#8E9BAE]">목록 불러오는 중...</div>
              ) : filteredAdminStudents.length === 0 ? (
                <div className="py-8 text-center text-[#8E9BAE]">검색 결과가 없습니다.</div>
              ) : (
                filteredAdminStudents.map((st) => {
                  const isEditing = editingStudentId === st.student_id;
                  const isAdmin = st.student_id === '10000';
                  return (
                    <div
                      key={st.student_id}
                      className={`flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-2xl gap-2 ${
                        isAdmin ? 'bg-amber-50 border border-amber-100' : 'bg-[#F8FBFE]'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 bg-[#C7CEEA]/40 text-[#4B5563] font-bold rounded-lg text-xs">{st.student_id}</span>
                        {isEditing ? (
                          <input type="text" value={editNameInput} onChange={(e) => setEditNameInput(e.target.value)} className="px-2 py-1 border rounded-lg text-sm w-28 outline-none" />
                        ) : (
                          <span className="font-bold text-[#2D3748]">{st.name} {isAdmin && '👑'}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 justify-end">
                        <div className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-xl border border-gray-100 text-xs">
                          <Lock className="w-3 h-3 text-[#A2B5E2]" />
                          {isEditing ? (
                            <input type="text" value={editPasswordInput} onChange={(e) => setEditPasswordInput(e.target.value)} className="px-1 border rounded text-xs w-24 outline-none font-mono" />
                          ) : (
                            <span className="font-mono text-[#FF85A1] font-bold">{st.password}</span>
                          )}
                        </div>
                        <div className="flex gap-1">
                          {isEditing ? (
                            <>
                              <button onClick={() => handleSaveEdit(st.student_id)} className="p-1.5 bg-[#B5EAD7] text-white rounded-lg hover:scale-105 transition-transform"><Save className="w-3.5 h-3.5" /></button>
                              <button onClick={() => setEditingStudentId(null)} className="p-1.5 bg-gray-200 text-gray-600 rounded-lg hover:scale-105 transition-transform"><X className="w-3.5 h-3.5" /></button>
                            </>
                          ) : (
                            <>
                              <button onClick={() => handleStartEdit(st)} className="p-1.5 bg-[#F0F4FF] text-[#A2B5E2] rounded-lg hover:bg-[#E0E8FF] transition-colors"><Edit3 className="w-3.5 h-3.5" /></button>
                              {!isAdmin && (
                                <button onClick={() => handleDeleteStudent(st.student_id, st.name)} className="p-1.5 bg-red-50 text-red-400 hover:bg-red-100 rounded-lg transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="text-right text-xs text-[#8E9BAE] border-t pt-3">
              총 {filteredAdminStudents.length}개 계정
            </div>
          </div>
        </div>
      )}

      {/* ───── 로그인/회원가입 모달 ───── */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white w-full max-w-md p-8 rounded-[2.5rem] shadow-2xl flex flex-col gap-6 relative">
            <button onClick={() => setShowAuthModal(false)} className="absolute top-6 right-6 text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
            <div className="text-center">
              <div className="w-14 h-14 bg-gradient-to-br from-[#B5EAD7] to-[#A2D4FF] rounded-full flex items-center justify-center mx-auto mb-3">
                <Smile className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-black text-[#2D3748]">{authMode === 'login' ? '학생 로그인' : '학생 회원가입'}</h3>
              <p className="text-sm text-[#8E9BAE] mt-1">{authMode === 'login' ? '학번과 비밀번호를 입력해 주세요.' : '학번, 이름, 비밀번호를 등록해 주세요.'}</p>
            </div>

            <form onSubmit={authMode === 'login' ? handleLogin : handleRegister} className="flex flex-col gap-3">
              <div className="relative">
                <GraduationCap className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A2B5E2]" />
                <input type="text" required placeholder="학번 (예: 10101)" value={inputStudentId} onChange={(e) => setInputStudentId(e.target.value)} className="w-full pl-11 pr-4 py-3 bg-[#F8FBFE] rounded-full outline-none focus:ring-2 focus:ring-[#B5EAD7] text-sm" />
              </div>
              {authMode === 'register' && (
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A2B5E2]" />
                  <input type="text" required placeholder="이름 (예: 홍길동)" value={inputName} onChange={(e) => setInputName(e.target.value)} className="w-full pl-11 pr-4 py-3 bg-[#F8FBFE] rounded-full outline-none focus:ring-2 focus:ring-[#B5EAD7] text-sm" />
                </div>
              )}
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A2B5E2]" />
                <input type="password" required placeholder="비밀번호" value={inputPassword} onChange={(e) => setInputPassword(e.target.value)} className="w-full pl-11 pr-4 py-3 bg-[#F8FBFE] rounded-full outline-none focus:ring-2 focus:ring-[#B5EAD7] text-sm" />
              </div>
              {authError && <p className="text-red-400 text-sm text-center bg-red-50 p-2 rounded-xl">{authError}</p>}
              <button type="submit" disabled={authLoading} className="w-full py-3.5 bg-gradient-to-r from-[#B5EAD7] to-[#A2D4FF] text-white font-bold rounded-full hover:scale-105 transition-transform shadow-md mt-1 text-sm">
                {authLoading ? '처리 중...' : authMode === 'login' ? '로그인하기' : '회원가입 완료'}
              </button>
            </form>

            <div className="text-center text-xs text-[#8E9BAE] border-t pt-3">
              {authMode === 'login' ? (
                <p>처음 방문하셨나요? <button onClick={() => { resetAuthForm(); setAuthMode('register'); }} className="text-[#A2B5E2] font-bold underline ml-1">회원가입</button></p>
              ) : (
                <p>이미 계정이 있나요? <button onClick={() => { resetAuthForm(); setAuthMode('login'); }} className="text-[#A2B5E2] font-bold underline ml-1">로그인</button></p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ───── 푸터 ───── */}
      <footer className="p-5 text-center text-[#AFAFAF] bg-white/50 border-t border-gray-100 text-sm">
        <p>© {new Date().getFullYear()} 솜사탕 수학교실 · 즐겁게 배우는 생각의 힘! 🎓</p>
      </footer>
    </div>
  );
}
