'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  getScoresByUnitAction,
  submitScoreAction,
  deleteScoreAdminAction,
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

// ─── 문제 데이터 (총 18개 단원 × 25문제 = 450문제) ─────────────────
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
        description: '소수, 합성수, 소인수분해, 최대공약수와 최소공배수!',
        questions: [
          { id: 1, question: '다음 중 소수(Prime Number)는 어느 것인가요?', options: ['1', '4', '7', '9'], answer: 2 },
          { id: 2, question: '12를 소인수분해하면 어떻게 되나요?', options: ['2 × 6', '2² × 3', '3 × 4', '2 × 3²'], answer: 1 },
          { id: 3, question: '36의 소인수분해 결과는 무엇인가요?', options: ['2² × 3²', '2³ × 3', '4 × 9', '6²'], answer: 0 },
          { id: 4, question: '다음 중 합성수(Composite Number)가 아닌 것은?', options: ['4', '6', '9', '11'], answer: 3 },
          { id: 5, question: '60의 소인수의 합은 얼마인가요?', options: ['5', '7', '10', '12'], answer: 2 },
          { id: 6, question: '2³ × 5의 값은 얼마인가요?', options: ['30', '40', '45', '50'], answer: 1 },
          { id: 7, question: '48을 소인수분해하면 어떻게 되나요?', options: ['2³ × 6', '2⁴ × 3', '4 × 12', '2 × 3 × 8'], answer: 1 },
          { id: 8, question: '소수가 아닌 1보다 큰 자연수를 무엇이라 하나요?', options: ['정수', '유리수', '합성수', '무리수'], answer: 2 },
          { id: 9, question: '100 이하의 소수의 개수는 몇 개인가요?', options: ['20개', '25개', '30개', '15개'], answer: 1 },
          { id: 10, question: '90의 소인수분해로 올바른 것은?', options: ['2 × 3² × 5', '2 × 45', '3 × 30', '2² × 3 × 5'], answer: 0 },
          { id: 11, question: '18과 24의 최대공약수는 얼마인가요?', options: ['3', '6', '12', '72'], answer: 1 },
          { id: 12, question: '12와 15의 최소공배수는 얼마인가요?', options: ['30', '45', '60', '90'], answer: 2 },
          { id: 13, question: '두 수 2² × 3과 2 × 3²의 최대공약수는?', options: ['2 × 3', '2² × 3', '2 × 3²', '2² × 3²'], answer: 0 },
          { id: 14, question: '두 수 2² × 3과 2 × 3²의 최소공배수는?', options: ['6', '18', '36', '72'], answer: 2 },
          { id: 15, question: '다음 중 서로소인 두 수의 쌍은?', options: ['4와 6', '8과 15', '9와 12', '14와 21'], answer: 1 },
          { id: 16, question: '72의 약수의 개수는 모두 몇 개인가요?', options: ['8개', '10개', '12개', '16개'], answer: 2 },
          { id: 17, question: '2³ × 3² × 5의 약수가 아닌 것은?', options: ['6', '15', '20', '32'], answer: 3 },
          { id: 18, question: '세 수 4, 6, 10의 최소공배수는?', options: ['20', '30', '60', '120'], answer: 2 },
          { id: 19, question: '어떤 수로 45와 60을 나누면 모두 떨어집니다. 이러한 수 중 가장 큰 수는?', options: ['5', '10', '15', '30'], answer: 2 },
          { id: 20, question: '가장 작은 소수는 얼마인가요?', options: ['0', '1', '2', '3'], answer: 2 },
          { id: 21, question: '짝수 중에서 유일한 소수는 무엇인가요?', options: ['2', '4', '6', '없다'], answer: 0 },
          { id: 22, question: '150을 소인수분해할 때 3의 지수는 얼마인가요?', options: ['1', '2', '3', '4'], answer: 0 },
          { id: 23, question: '84를 소인수분해하면 2^a × 3 × b 일 때, a + b의 값은?', options: ['7', '9', '11', '13'], answer: 1 },
          { id: 24, question: '두 자연수 A, B의 최대공약수가 6일 때, A와 B의 공약수가 아닌 것은?', options: ['1', '2', '3', '4'], answer: 3 },
          { id: 25, question: '소인수분해를 이용해 100의 약수의 개수를 구하면?', options: ['6개', '9개', '10개', '12개'], answer: 1 },
        ],
      },
      {
        id: 'mid1_unit2',
        name: '2단원: 정수와 유리수',
        emoji: '±️',
        description: '양수, 음수, 유리수의 덧셈·뺄셈·곱셈·나눗셈!',
        questions: [
          { id: 1, question: '(-3) + (+7) 의 값은 얼마일까요?', options: ['-4', '+4', '-10', '+10'], answer: 1 },
          { id: 2, question: '(-5) × (-4) 의 값은?', options: ['-20', '+20', '-9', '+9'], answer: 1 },
          { id: 3, question: '(-12) ÷ (+3) 의 값은?', options: ['+4', '-4', '+9', '-9'], answer: 1 },
          { id: 4, question: '절댓값 |−7| 의 값은?', options: ['-7', '0', '7', '1/7'], answer: 2 },
          { id: 5, question: '다음 중 유리수가 아닌 것은?', options: ['1/2', '0.3', '√2', '-5'], answer: 2 },
          { id: 6, question: '(-2)³ 의 값은?', options: ['8', '-8', '6', '-6'], answer: 1 },
          { id: 7, question: '+3보다 크지 않고 -3보다 작지 않은 정수의 개수는?', options: ['5개', '6개', '7개', '8개'], answer: 2 },
          { id: 8, question: '(-1/3) × (+9) 의 값은?', options: ['+3', '-3', '+27', '-27'], answer: 1 },
          { id: 9, question: '(-8) - (-3) 의 값은?', options: ['-11', '-5', '+5', '+11'], answer: 1 },
          { id: 10, question: '다음 중 가장 큰 수는?', options: ['-1/2', '-0.6', '-1', '-0.1'], answer: 3 },
          { id: 11, question: '(-1)의 100제곱(-1)¹⁰⁰ 의 값은?', options: ['-100', '-1', '+1', '+100'], answer: 2 },
          { id: 12, question: '(-1)의 101제곱(-1)¹⁰¹ 의 값은?', options: ['-101', '-1', '+1', '+101'], answer: 1 },
          { id: 13, question: '(-4/5)의 역수는 무엇인가요?', options: ['4/5', '-5/4', '5/4', '-4/5'], answer: 1 },
          { id: 14, question: '수직선에서 0을 나타내는 점을 무엇이라 하나요?', options: ['원점', '절댓값', '양수', '음수'], answer: 0 },
          { id: 15, question: '절댓값이 5인 정수는 모두 몇 개인가요?', options: ['1개', '2개', '3개', '없다'], answer: 1 },
          { id: 16, question: '(-15) ÷ (-3) × 2 의 값은?', options: ['-10', '10', '-2.5', '2.5'], answer: 1 },
          { id: 17, question: '(-2) + (+5) - (+8) 의 계산 결과는?', options: ['-5', '+5', '-11', '+11'], answer: 0 },
          { id: 18, question: '다음 중 계산 결과가 음수인 것은?', options: ['(-3)²', '(-2) × (-5)', '(-4) ÷ (+2)', '|-6|'], answer: 2 },
          { id: 19, question: '3/4 ÷ (-9/8) 의 계산 결과는?', options: ['-2/3', '-3/2', '2/3', '3/2'], answer: 0 },
          { id: 20, question: '(-3)² × (-1)³ 의 값은?', options: ['9', '-9', '6', '-6'], answer: 1 },
          { id: 21, question: 'a = -2 일 때, -a² 의 값은?', options: ['-4', '4', '-2', '2'], answer: 0 },
          { id: 22, question: '수직선에서 -3과 5 사이에 있는 정수의 개수는?', options: ['7개', '8개', '9개', '10개'], answer: 0 },
          { id: 23, question: '다음 중 가장 작은 수는?', options: ['|-5|', '(-2)⁴', '-(-3)', '(-2)³'], answer: 3 },
          { id: 24, question: '(-2) × (3 - 7) 의 값은?', options: ['-8', '8', '-20', '20'], answer: 1 },
          { id: 25, question: '두 유리수 a, b에 대하여 a < 0, b > 0 일 때, 항상 음수인 것은?', options: ['b - a', 'a × b', 'b ÷ (-a)', '|a| + b'], answer: 1 },
        ],
      },
      {
        id: 'mid1_unit3',
        name: '3단원: 일차방정식',
        emoji: '📏',
        description: '문자와 식, 일차방정식의 풀이와 활용!',
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
          { id: 11, question: '다음 중 문자를 사용한 식으로 올바른 것은? (한 자루에 x원인 연필 5자루의 가격)', options: ['x + 5원', '5x원', 'x/5원', '5/x원'], answer: 1 },
          { id: 12, question: 'x = -2 일 때, 3x + 10 의 값은?', options: ['4', '-4', '16', '-16'], answer: 0 },
          { id: 13, question: '다항식 2x² - 3x + 5 에서 x의 계수는?', options: ['2', '-3', '5', '3'], answer: 1 },
          { id: 14, question: '다음 중 동류항끼리 짝지어진 것은?', options: ['2x와 2y', '3x와 x²', '5a와 -2a', '4와 4x'], answer: 2 },
          { id: 15, question: '3(2x - 4) - 2(x - 1) 을 간단히 하면?', options: ['4x - 10', '4x - 14', '8x - 10', '4x - 2'], answer: 0 },
          { id: 16, question: '다음 중 등식이 아닌 것은?', options: ['3x = 6', '2 + 5 = 7', '4x - 1', 'x - 3 = 0'], answer: 2 },
          { id: 17, question: '다음 중 항등식인 것은?', options: ['2x = 4', 'x + 1 = 1 + x', '3x - 1 = 2', 'x = 0'], answer: 1 },
          { id: 18, question: '0.2x + 0.5 = 1.1 의 해는?', options: ['x = 1', 'x = 2', 'x = 3', 'x = 4'], answer: 2 },
          { id: 19, question: '(x - 1)/3 = (x + 1)/4 의 해는?', options: ['x = 5', 'x = 7', 'x = 9', 'x = 11'], answer: 1 },
          { id: 20, question: '현재 아버지의 나이는 40세, 아들의 나이는 10세이다. 아버지 나이가 아들 나이의 3배가 되는 것은 몇 년 후인가?', options: ['3년 후', '5년 후', '8년 후', '10년 후'], answer: 1 },
          { id: 21, question: '시속 60km로 x시간 동안 달린 거리를 식 나타내면?', options: ['60/x km', 'x/60 km', '60x km', '(60+x) km'], answer: 2 },
          { id: 22, question: '방정식 -3x = 12 의 해는?', options: ['x = 4', 'x = -4', 'x = 36', 'x = -36'], answer: 1 },
          { id: 23, question: 'x에 대한 일차방정식 ax + 6 = 0 의 해가 x = 2 일 때, a의 값은?', options: ['-3', '3', '-12', '12'], answer: 0 },
          { id: 24, question: '어떤 수 x에 5를 더하여 2배 한 값이 20일 때, x의 값은?', options: ['3', '5', '7', '9'], answer: 1 },
          { id: 25, question: '방정식 4 - (x - 2) = 3x 의 해는?', options: ['x = 1', 'x = 1.5', 'x = 2', 'x = 2.5'], answer: 1 },
        ],
      },
      {
        id: 'mid1_unit4',
        name: '4단원: 기본 도형과 작도',
        emoji: '📐',
        description: '점, 선, 면, 각과 평행선, 삼각형의 작도와 합동!',
        questions: [
          { id: 1, question: '두 직교하는 직선이 만날 때 생기는 각의 크기는?', options: ['45°', '60°', '90°', '180°'], answer: 2 },
          { id: 2, question: '맞꼭지각의 크기는 서로 어떠한가요?', options: ['항상 같다', '합이 90°이다', '합이 180°이다', '항상 다르다'], answer: 0 },
          { id: 3, question: '평행한 두 직선에서 동위각의 크기는 어떠한가요?', options: ['서로 같다', '합이 90°이다', '합이 360°이다', '알 수 없다'], answer: 0 },
          { id: 4, question: '평행선에서 엇각의 크기가 같을 조건은?', options: ['두 직선이 평행할 때', '항상', '두 직선이 만날 때', '직교할 때'], answer: 0 },
          { id: 5, question: '세 변의 길이가 주어졌을 때 삼각형의 합동 조건은?', options: ['SSS 합동', 'SAS 합동', 'ASA 합동', 'RHA 합동'], answer: 0 },
          { id: 6, question: '두 변의 길이와 그 낀각의 크기가 같을 때의 합동 조건은?', options: ['SSS 합동', 'SAS 합동', 'ASA 합동', 'RHS 합동'], answer: 1 },
          { id: 7, question: '한 변의 길이와 그 양 끝각의 크기가 같을 때의 합동 조건은?', options: ['SSS 합동', 'SAS 합동', 'ASA 합동', 'AAA 합동'], answer: 2 },
          { id: 8, question: '삼각형이 하나로 정해지기 위한 세 변의 길이 조건 중 옳은 것은?', options: ['가장 긴 변 < 나머지 두 변의 합', '가장 긴 변 = 나머지 두 변의 합', '가장 긴 변 > 나머지 두 변의 합', '상관없다'], answer: 0 },
          { id: 9, question: '세 변의 길이가 3cm, 4cm, x cm일 때 삼각형이 만들어지기 위한 x의 조건은?', options: ['1 < x < 7', 'x > 7', 'x < 1', 'x = 7'], answer: 0 },
          { id: 10, question: '작도에 사용되는 두 가지 도구는 무엇인가요?', options: ['눈금 없는 자와 컴퍼스', '각도기와 자', '삼각자와 컴퍼스', '눈금 있는 자와 각도기'], answer: 0 },
          { id: 11, question: '선분의 길이를 옮기거나 원을 그릴 때 사용하는 작도 도구는?', options: ['눈금 없는 자', '각도기', '컴퍼스', '삼각자'], answer: 2 },
          { id: 12, question: '직선을 긋거나 두 점을 이을 때 사용하는 작도 도구는?', options: ['컴퍼스', '눈금 없는 자', '각도기', '계산기'], answer: 1 },
          { id: 13, question: '평면에서 점 A와 점 B를 잇는 가장 짧은 선의 길이를 무엇이라 하나요?', options: ['두 점 사이의 거리', '선분의 중점', '수직이등분선', '접선'], answer: 0 },
          { id: 14, question: '선분 AB의 중점을 M이라 할 때, AB의 길이가 10cm이면 AM의 길이는?', options: ['2.5cm', '5cm', '7.5cm', '10cm'], answer: 1 },
          { id: 15, question: '평각의 크기는 몇 도인가요?', options: ['90°', '180°', '270°', '360°'], answer: 1 },
          { id: 16, question: '예각의 크기 범위로 올바른 것은?', options: ['0° 초과 90° 미만', '90°', '90° 초과 180° 미만', '180°'], answer: 0 },
          { id: 17, question: '둔각의 크기 범위로 올바른 것은?', options: ['0° 초과 90° 미만', '90°', '90° 초과 180° 미만', '360°'], answer: 2 },
          { id: 18, question: '각 AOB의 크기가 60°일 때, 이 각의 이등분선에 의해 나누어진 한 각의 크기는?', options: ['15°', '30°', '45°', '60°'], answer: 1 },
          { id: 19, question: '공간에서 두 직선이 만나지도 않고 평행하지도 않은 위치 관계를 무엇이라 하나요?', options: ['꼬인 위치', '평행', '일치', '수직'], answer: 0 },
          { id: 20, question: '한 평면 위에서 두 직선의 위치 관계가 아닌 것은?', options: ['한 점에서 만난다', '평행하다', '일치한다', '꼬인 위치에 있다'], answer: 3 },
          { id: 21, question: '다음 중 삼각형의 세 각의 크기만 주어진 경우 삼각형의 결정 상태는?', options: ['항상 하나로 결정된다', '모양이 무수히 많이 결정된다', '결정되지 않는다', '이등변삼각형만 된다'], answer: 1 },
          { id: 22, question: '△ABC ≡ △DEF 일 때, 점 A에 대응하는 점은?', options: ['점 D', '점 E', '점 F', '알 수 없음'], answer: 0 },
          { id: 23, question: '△ABC ≡ △DEF 이고 ∠A = 50°, ∠B = 60° 일 때, ∠F의 크기는?', options: ['50°', '60°', '70°', '80°'], answer: 2 },
          { id: 24, question: '두 직선 l과 m이 평행할 때(l // m), 동위각의 크기가 75°이면 엇각의 크기는?', options: ['75°', '105°', '180°', '15°'], answer: 0 },
          { id: 25, question: '선분 AB의 수직이등분선 위의 한 점에서 점 A와 점 B까지의 거리는?', options: ['서로 같다', 'A가 더 가깝다', 'B가 더 가깝다', '두 배이다'], answer: 0 },
        ],
      },
      {
        id: 'mid1_unit5',
        name: '5단원: 평면도형과 입체도형',
        emoji: '🧊',
        description: '다각형, 원과 부채꼴, 입체도형의 겉넓이와 부피!',
        questions: [
          { id: 1, question: 'n각형의 내각의 크기의 합을 구하는 공식은?', options: ['180° × (n - 2)', '360° × n', '180° × n', '90° × (n - 2)'], answer: 0 },
          { id: 2, question: '모든 다각형의 외각의 크기의 합은 얼마인가요?', options: ['180°', '270°', '360°', '540°'], answer: 2 },
          { id: 3, question: '정육각형의 한 내각의 크기는 얼마인가요?', options: ['108°', '120°', '135°', '140°'], answer: 1 },
          { id: 4, question: 'n각형의 한 꼭짓점에서 그을 수 있는 대각선의 개수는?', options: ['n - 1개', 'n - 2개', 'n - 3개', 'n(n - 3)/2 개'], answer: 2 },
          { id: 5, question: '오각형의 대각선의 총개수는 몇 개인가요?', options: ['5개', '6개', '8개', '10개'], answer: 0 },
          { id: 6, question: '반지름 r인 원의 넓이를 구하는 공식은?', options: ['2πr', 'πr²', '4πr²', '⅓πr²h'], answer: 1 },
          { id: 7, question: '반지름 r인 원의 둘레(원주)를 구하는 공식은?', options: ['πr', '2πr', 'πr²', '2πr²'], answer: 1 },
          { id: 8, question: '반지름이 6cm이고 중심각이 60°인 부채꼴의 호의 길이는?', options: ['2π cm', '3π cm', '4π cm', '6π cm'], answer: 0 },
          { id: 9, question: '반지름이 6cm이고 중심각이 60°인 부채꼴의 넓이는?', options: ['3π cm²', '6π cm²', '9π cm²', '12π cm²'], answer: 1 },
          { id: 10, question: '면의 개수가 가장 적은 입체도형(사면체)의 면의 수는?', options: ['3개', '4개', '5개', '6개'], answer: 1 },
          { id: 11, question: '정육면체의 꼭짓점의 개수는 몇 개인가요?', options: ['6개', '8개', '12개', '14개'], answer: 1 },
          { id: 12, question: '정팔면체의 면의 모양은 어떤 다각형인가요?', options: ['정삼각형', '정사각형', '정오각형', '정육각형'], answer: 0 },
          { id: 13, question: '입체도형에서 오일러 공식(V - E + F)의 값은 항상 얼마인가요?', options: ['0', '1', '2', '3'], answer: 2 },
          { id: 14, question: '밑면의 반지름이 3cm, 높이가 5cm인 원기둥의 부피는?', options: ['15π cm³', '30π cm³', '45π cm³', '90π cm³'], answer: 2 },
          { id: 15, question: '밑면의 넓이가 12cm², 높이가 6cm인 각뿔의 부피는?', options: ['24cm³', '36cm³', '72cm³', '144cm³'], answer: 0 },
          { id: 16, question: '반지름이 3cm인 구의 부피(V = ⁴/₃πr³)는?', options: ['12π cm³', '27π cm³', '36π cm³', '108π cm³'], answer: 2 },
          { id: 17, question: '반지름이 3cm인 구의 겉넓이(S = 4πr²)는?', options: ['12π cm²', '24π cm²', '36π cm²', '48π cm²'], answer: 2 },
          { id: 18, question: '직사각형을 한 변을 축으로 1회전시켰을 때 생기는 회전체는?', options: ['원뿔', '원기둥', '구', '원뿔대'], answer: 1 },
          { id: 19, question: '직각삼각형을 직각을 낀 한 변을 축으로 1회전시켰을 때 생기는 회전체는?', options: ['원뿔', '원기둥', '구', '각뿔'], answer: 0 },
          { id: 20, question: '회전체를 회전축에 수직인 평면으로 자른 단면의 모양은 항상 무엇인가요?', options: ['원', '삼각형', '직사각형', '사다리꼴'], answer: 0 },
          { id: 21, question: '육각기둥의 모서리의 개수는 몇 개인가요?', options: ['12개', '15개', '18개', '24개'], answer: 2 },
          { id: 22, question: '팔각뿔의 면의 개수는 몇 개인가요?', options: ['8개', '9개', '10개', '16개'], answer: 1 },
          { id: 23, question: '한 내각의 크기가 140°인 정다각형은 정몇각형인가요?', options: ['정팔각형', '정구각형', '정십각형', '정십이각형'], answer: 1 },
          { id: 24, question: '정다면체의 종류는 모두 몇 가지인가요?', options: ['3가지', '4가지', '5가지', '6가지'], answer: 2 },
          { id: 25, question: '부채꼴의 넓이 S를 반지름 r과 호의 길이 l로 나타내는 공식은?', options: ['S = ½rl', 'S = rl', 'S = 2rl', 'S = ½r²l'], answer: 0 },
        ],
      },
      {
        id: 'mid1_unit6',
        name: '6단원: 통계와 자료 해석',
        emoji: '📊',
        description: '줄기와 잎 그림, 도수분포표, 히스토그램과 상대도수!',
        questions: [
          { id: 1, question: '자료를 십의 자리 수와 일의 자리 수로 나누어 정리한 그림은?', options: ['줄기와 잎 그림', '도수분포표', '히스토그램', '꺾은선그래프'], answer: 0 },
          { id: 2, question: '자료를 나눈 구간을 무엇이라 하나요?', options: ['계급', '계급의 크기', '도수', '상대도수'], answer: 0 },
          { id: 3, question: '계급의 양 끝값의 차이를 무엇이라 하나요?', options: ['계급값', '계급의 크기', '도수', '총도수'], answer: 1 },
          { id: 4, question: '계급의 중앙값을 무엇이라 하나요?', options: ['계급값', '계급의 크기', '평균', '대표값'], answer: 0 },
          { id: 5, question: '계급 50 이상 60 미만의 계급값은 얼마인가요?', options: ['50', '55', '60', '10'], answer: 1 },
          { id: 6, question: '각 계급에 속하는 자료의 개수를 무엇이라 하나요?', options: ['계급값', '도수', '상대도수', '누적도수'], answer: 1 },
          { id: 7, question: '도수분포표에서 직사각형을 연속하여 그린 그래프는?', options: ['히스토그램', '줄기와 잎 그림', '원그래프', '산점도'], answer: 0 },
          { id: 8, question: '히스토그램에서 각 직사각형의 넓이의 합은 무엇과 같나요?', options: ['(계급의 크기) × (도수의 총합)', '도수의 총합', '계급의 크기', '상대도수'], answer: 0 },
          { id: 9, question: '전체 도수에 대한 각 계급의 도수의 비율을 무엇이라 하나요?', options: ['상대도수', '누적도수', '계급값', '평균'], answer: 0 },
          { id: 10, question: '모든 계급의 상대도수의 총합은 항상 얼마인가요?', options: ['0', '0.5', '1', '100'], answer: 2 },
          { id: 11, question: '도수의 총합이 50인 조사에서 어떤 계급의 도수가 10일 때, 상대도수는?', options: ['0.1', '0.2', '0.5', '2.0'], answer: 1 },
          { id: 12, question: '상대도수가 0.25이고 도수의 총합이 40일 때, 해당 계급의 도수는?', options: ['5', '8', '10', '12'], answer: 2 },
          { id: 13, question: '히스토그램의 각 직사각형의 상단의 중점을 연결하여 만든 다각형은?', options: ['도수분포다각형', '꺾은선그래프', '정다각형', '원그래프'], answer: 0 },
          { id: 14, question: '도수분포다각형과 가로축으로 둘러싸인 부분의 넓이는 히스토그램의 넓이와 어떠한가요?', options: ['같다', '더 크다', '더 작다', '알 수 없다'], answer: 0 },
          { id: 15, question: '상대도수를 사용하는 가장 큰 목적은 무엇인가요?', options: ['도수의 총합이 다른 두 집단을 비교하기 위해', '계급을 줄이기 위해', '평균을 정확히 구하기 위해', '그림을 예쁘게 그리려고'], answer: 0 },
          { id: 16, question: '줄기와 잎 그림에서 잎이 가장 많은 줄기는 무엇을 의미하나요?', options: ['자료가 가장 많이 몰려있는 구간', '가장 큰 값', '가장 작은 값', '평균값'], answer: 0 },
          { id: 17, question: '자료 12, 15, 18, 20, 25의 평균은 얼마인가요?', options: ['16', '17', '18', '20'], answer: 2 },
          { id: 18, question: '계급 70점 이상 80점 미만에 속하는 점수가 아닌 것은?', options: ['70점', '75점', '79점', '80점'], answer: 3 },
          { id: 19, question: '어떤 계급의 도수가 8이고 상대도수가 0.16일 때, 전체 도수는?', options: ['40', '50', '60', '80'], answer: 1 },
          { id: 20, question: '줄기가 3이고 잎이 2, 5, 8일 때 나타내는 자료의 값들이 아닌 것은?', options: ['32', '35', '38', '23'], answer: 3 },
          { id: 21, question: '도수분포표에서 변량의 총합을 구할 때 (계급값) × (도수) 의 합을 사용하는 이유는?', options: ['각 변량의 정확한 값을 알 수 없으므로 계급값을 대표로 이용', '계산이 쉬워서', '공식이 원래 그래서', '도수가 일정해서'], answer: 0 },
          { id: 22, question: '상대도수의 분포를 나타낸 그래프의 전체 넓이는 계급의 크기가 5일 때 얼마인가요?', options: ['1', '5', '10', '50'], answer: 1 },
          { id: 23, question: '전체 학생 수 200명 중 턱걸이 기록이 10회 이상인 학생이 30명일 때, 이 계급의 상대도수는?', options: ['0.05', '0.15', '0.3', '1.5'], answer: 1 },
          { id: 24, question: '자료의 개수가 총 20개일 때, 3번째 계급까지의 누적도수가 14이면 4번째 계급 이후의 도수의 합은?', options: ['4', '6', '8', '14'], answer: 1 },
          { id: 25, question: '다음 중 연속적인 양(키, 몸무게 등)을 표현하기에 가장 적절한 그래프는?', options: ['히스토그램', '줄기와 잎 그림', '픽토그램', '표'], answer: 0 },
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
        description: '유한소수, 순환소수, 분수의 소수 표현 마스터!',
        questions: [
          { id: 1, question: '분수 3/8 을 소수로 나타내면?', options: ['0.375 (유한소수)', '0.333... (순환소수)', '0.625 (유한소수)', '0.875 (유한소수)'], answer: 0 },
          { id: 2, question: '분수 1/3 을 소수로 나타내면?', options: ['0.333...', '0.3 (유한)', '0.133...', '3.0'], answer: 0 },
          { id: 3, question: '유한소수가 되는 분수는? (기약분수 기준)', options: ['1/7', '1/6', '3/8', '2/9'], answer: 2 },
          { id: 4, question: '0.333... 을 분수로 나타내면?', options: ['3/10', '1/3', '33/100', '1/30'], answer: 1 },
          { id: 5, question: '기약분수의 분모의 소인수가 2나 5뿐이면 어떤 소수가 되나요?', options: ['순환소수', '무리수', '유한소수', '정수'], answer: 2 },
          { id: 6, question: '0.272727... 을 기약분수로 나타내면?', options: ['3/11', '27/100', '3/10', '27/9'], answer: 0 },
          { id: 7, question: '5/12 는 어떤 소수인가요?', options: ['유한소수', '순환소수', '무리수', '정수'], answer: 1 },
          { id: 8, question: '유한소수와 순환소수를 합쳐서 부르는 수의 범위는?', options: ['실수', '무리수', '유리수', '복소수'], answer: 2 },
          { id: 9, question: '순환소수 0.666... 을 기약분수로 나타내면?', options: ['6/10', '2/3', '6/99', '3/5'], answer: 1 },
          { id: 10, question: '분수 7/20 를 소수로 나타내면?', options: ['0.35', '0.7', '0.37', '0.307'], answer: 0 },
          { id: 11, question: '소수점 아래 특정 마디가 끝없이 되풀이되는 무한소수를 무엇이라 하나요?', options: ['유한소수', '순환소수', '무리수', '정수'], answer: 1 },
          { id: 12, question: '순환소수 1.232323... 의 순환마디는?', options: ['1', '2', '23', '32'], answer: 2 },
          { id: 13, question: '순환소수 0.142857142857... 의 소수점 아래 100번째 자리의 숫자는?', options: ['1', '4', '2', '8'], answer: 3 },
          { id: 14, question: '다음 분수 중 유한소수로 나타낼 수 없는 것은?', options: ['3/15', '7/28', '9/24', '5/14'], answer: 3 },
          { id: 15, question: '분수 a/60 이 유한소수가 되도록 하는 가장 작은 자연수 a는?', options: ['2', '3', '5', '7'], answer: 1 },
          { id: 16, question: '0.15 (5위에 순환점) 를 분수로 나타내면?', options: ['15/99', '14/90', '15/90', '14/99'], answer: 1 },
          { id: 17, question: '다음 중 옳은 설명은?', options: ['모든 무한소수는 유리수이다', '유한소수로 나타낼 수 없는 분수는 순환소수이다', '순환소수는 유리수가 아니다', '0.999... 는 1보다 작은 수이다'], answer: 1 },
          { id: 18, question: '지수법칙: 2⁴ × 2³ 의 값은?', options: ['2⁷', '2¹²', '4⁷', '4¹²'], answer: 0 },
          { id: 19, question: '지수법칙: (a³)² 의 계산 결과는?', options: ['a⁵', 'a⁶', 'a⁸', 'a⁹'], answer: 1 },
          { id: 20, question: '순환소수 0.4545... 에 어떤 자연수 x를 곱하여 자연수가 되게 하려 한다. 가장 작은 x는?', options: ['9', '11', '99', '100'], answer: 1 },
          { id: 21, question: '지수법칙: a⁸ ÷ a² 의 계산 결과는?', options: ['a⁴', 'a⁶', 'a¹⁰', 'a¹⁶'], answer: 1 },
          { id: 22, question: '(2x²y³)³ 을 단항식으로 계산하면?', options: ['6x⁵y⁶', '8x⁶y⁹', '8x⁵y⁶', '6x⁶y⁹'], answer: 1 },
          { id: 23, question: '12a³b² ÷ (-4ab) 의 계산 결과는?', options: ['-3a²b', '3a²b', '-3ab²', '3ab²'], answer: 0 },
          { id: 24, question: '다항식 2x(x - 3y) 를 전개하면?', options: ['2x² - 3y', '2x² - 6xy', '2x² - 3xy', 'x² - 6xy'], answer: 1 },
          { id: 25, question: '(6x²y - 9xy²) ÷ 3xy 의 계산 결과는?', options: ['2x - 3y', '2x - 3', '3x - 2y', '2x² - 3y²'], answer: 0 },
        ],
      },
      {
        id: 'mid2_unit2',
        name: '2단원: 일차부등식과 연립방정식',
        emoji: '⚖️',
        description: '부등식의 성질, 일차부등식과 연립방정식 풀이!',
        questions: [
          { id: 1, question: '부등식 3x - 2 > 7 의 해는?', options: ['x > 3', 'x < 3', 'x > 5', 'x < 5'], answer: 0 },
          { id: 2, question: '부등식 2x + 4 ≤ 10 의 해는?', options: ['x ≤ 3', 'x ≥ 3', 'x ≤ 7', 'x ≥ 7'], answer: 0 },
          { id: 3, question: '-x > 2 를 풀면?', options: ['x > -2', 'x < -2', 'x > 2', 'x < 2'], answer: 1 },
          { id: 4, question: '3x - 5 < x + 3 의 해는?', options: ['x < 1', 'x > 1', 'x < 4', 'x > 4'], answer: 2 },
          { id: 5, question: '부등식의 양변에 음수를 곱하거나 나누면 부등호 방향은?', options: ['바뀐다', '바뀌지 않는다', '없어진다', '같아진다'], answer: 0 },
          { id: 6, question: '5x ≥ -15 의 해는?', options: ['x ≤ -3', 'x ≥ -3', 'x ≤ 3', 'x ≥ 3'], answer: 1 },
          { id: 7, question: '2(x - 1) > 4 의 해는?', options: ['x > 1', 'x > 2', 'x > 3', 'x > 4'], answer: 2 },
          { id: 8, question: 'x/(-3) < 2 를 풀면?', options: ['x > -6', 'x < -6', 'x > 6', 'x < 6'], answer: 0 },
          { id: 9, question: '어떤 수에 4를 더하면 10보다 작다. 이를 부등식으로 나타내면?', options: ['x + 4 > 10', 'x + 4 < 10', 'x - 4 < 10', '4x < 10'], answer: 1 },
          { id: 10, question: '-2x + 6 ≥ 2 의 해는?', options: ['x ≤ 2', 'x ≥ 2', 'x ≤ -2', 'x ≥ -2'], answer: 0 },
          { id: 11, question: '연립방정식 x + y = 5, x - y = 1 의 해 (x, y)는?', options: ['(3, 2)', '(2, 3)', '(4, 1)', '(3, 1)'], answer: 0 },
          { id: 12, question: '2x + y = 7, x = 2 일 때 y의 값은?', options: ['1', '3', '5', '7'], answer: 1 },
          { id: 13, question: '연립방정식을 풀 때 한 변수를 없애는 방법이 아닌 것은?', options: ['가감법', '대입법', '소거법', '인수분해법'], answer: 3 },
          { id: 14, question: '부등식 4x - 1 ≤ 3(x + 2) 의 해는?', options: ['x ≤ 7', 'x ≥ 7', 'x ≤ 5', 'x ≥ 5'], answer: 0 },
          { id: 15, question: 'a < b 일 때 다음 중 옳지 않은 것은?', options: ['a + 3 < b + 3', 'a - 5 < b - 5', '2a < 2b', '-3a < -3b'], answer: 3 },
          { id: 16, question: '자연수 x에 대하여 2x - 3 < 5 의 만족하는 x의 개수는?', options: ['1개', '2개', '3개', '4개'], answer: 2 },
          { id: 17, question: '연립방정식 3x + 2y = 12, y = x - 4 의 해 x의 값은?', options: ['2', '4', '6', '8'], answer: 1 },
          { id: 18, question: '연립방정식 2x + 3y = 8, 4x + 6y = 16 의 해의 개수는?', options: ['1개', '2개', '무수히 많다', '없다'], answer: 2 },
          { id: 19, question: '연립방정식 x + 2y = 3, 2x + 4y = 8 의 해의 개수는?', options: ['1개', '2개', '무수히 많다', '없다'], answer: 3 },
          { id: 20, question: '어머니와 아들의 나이의 합은 50세이고 나이의 차는 26세이다. 어머니의 나이는?', options: ['36세', '38세', '40세', '42세'], answer: 1 },
          { id: 21, question: '0.3x - 0.2 > 0.7 의 해는?', options: ['x > 3', 'x < 3', 'x > 1', 'x < 1'], answer: 0 },
          { id: 22, question: '부등식 2 < x + 1 ≤ 5 의 해의 범위는?', options: ['1 < x ≤ 4', '2 < x ≤ 5', '1 ≤ x < 4', '0 < x ≤ 3'], answer: 0 },
          { id: 23, question: '가감법으로 x를 소거하기 위해 2x+3y=5 와 3x-y=2 식에 각각 곱해야 할 수는?', options: ['첫째 식에 3, 둘째 식에 2', '첫째 식에 2, 둘째 식에 3', '첫째 식에 1, 둘째 식에 3', '필요 없음'], answer: 0 },
          { id: 24, question: '거리(d), 속력(v), 시간(t) 사이의 관계로 옳은 것은?', options: ['거리 = 속력 × 시간', '시간 = 거리 × 속력', '속력 = 거리 × 시간', '거리 = 속력 ÷ 시간'], answer: 0 },
          { id: 25, question: '농도가 10%인 소금물 200g에 들어있는 소금의 양은?', options: ['10g', '20g', '30g', '40g'], answer: 1 },
        ],
      },
      {
        id: 'mid2_unit3',
        name: '3단원: 일차함수',
        emoji: '📈',
        description: '기울기, y절편, 그래프 성질과 연립방정식의 관계!',
        questions: [
          { id: 1, question: '일차함수 y = 2x + 5 의 y절편은?', options: ['2', '5', '-5', '-2'], answer: 1 },
          { id: 2, question: 'y = 3x - 4 의 기울기(slope)는?', options: ['-4', '3', '-3', '4'], answer: 1 },
          { id: 3, question: 'y = -x + 2 가 x축과 만나는 점(x절편)의 x좌표는?', options: ['2', '-2', '0', '1'], answer: 0 },
          { id: 4, question: '기울기가 2, y절편이 -3인 일차함수 식은?', options: ['y = 2x - 3', 'y = -3x + 2', 'y = 2x + 3', 'y = 3x - 2'], answer: 0 },
          { id: 5, question: '두 점 (0,1), (2,5)를 지나는 직선의 기울기는?', options: ['1', '2', '3', '4'], answer: 1 },
          { id: 6, question: 'y = -2x + 6 에서 x = 3일 때 y값은?', options: ['0', '3', '-6', '12'], answer: 0 },
          { id: 7, question: '일차함수 y = x - 1 의 그래프가 지나지 않는 사분면은?', options: ['제1사분면', '제2사분면', '제3사분면', '제4사분면'], answer: 1 },
          { id: 8, question: 'y = -3x + 9 의 그래프에서 x가 증가하면 y는?', options: ['증가한다', '감소한다', '일정하다', '알 수 없다'], answer: 1 },
          { id: 9, question: '일차함수 y = 4x + b 가 점 (1, 7)을 지날 때 b의 값은?', options: ['1', '2', '3', '4'], answer: 2 },
          { id: 10, question: '기울기가 -1이고 점 (3, 0)을 지나는 직선의 식은?', options: ['y = -x + 3', 'y = x - 3', 'y = -x - 3', 'y = x + 3'], answer: 0 },
          { id: 11, question: '두 일차함수 y = 2x + 1 과 y = 2x - 5 의 그래프의 위치 관계는?', options: ['평행하다', '일치한다', '수직이다', '한 점에서 만난다'], answer: 0 },
          { id: 12, question: '일차함수 y = ax + b 의 그래프가 오른쪽 위로 향할 조건은?', options: ['a > 0', 'a < 0', 'b > 0', 'b < 0'], answer: 0 },
          { id: 13, question: 'x축에 평행하고 점 (2, 5)를 지나는 직선의 방정식은?', options: ['x = 2', 'y = 5', 'y = 2x', 'x = 5'], answer: 1 },
          { id: 14, question: 'y축에 평행하고 점 (4, -1)을 지나는 직선의 방정식은?', options: ['x = 4', 'y = -1', 'x = -1', 'y = 4'], answer: 0 },
          { id: 15, question: '두 일차방정식의 그래프의 교점의 좌표는 무엇과 같나요?', options: ['연립방정식의 해', 'y절편', 'x절편', '기울기'], answer: 0 },
          { id: 16, question: '일차함수 y = -½x + 4 의 x절편과 y절편의 합은?', options: ['4', '8', '12', '16'], answer: 2 },
          { id: 17, question: '점 (2, 3)을 지나고 기울기가 0인 직선의 방정식은?', options: ['x = 2', 'y = 3', 'y = 2x + 3', 'x + y = 5'], answer: 1 },
          { id: 18, question: 'y = 3x 의 그래프를 y축 방향으로 -2만큼 평행이동한 식은?', options: ['y = 3x - 2', 'y = 3(x - 2)', 'y = 3x + 2', 'y = -2x + 3'], answer: 0 },
          { id: 19, question: '두 점 (1, 4), (3, 10)을 지나는 일차함수의 기울기는?', options: ['2', '3', '4', '6'], answer: 1 },
          { id: 20, question: '일차함수 y = ax + 3 의 그래프가 점 (-2, 7)을 지날 때 a의 값은?', options: ['-2', '2', '-4', '4'], answer: 0 },
          { id: 21, question: '두 직선 y = mx + 2 와 y = 3x - 1 이 평행할 때 m의 값은?', options: ['1', '2', '3', '-1'], answer: 2 },
          { id: 22, question: 'y = 2x + 4 와 x축, y축으로 둘러싸인 삼각형의 넓이는?', options: ['2', '4', '8', '16'], answer: 1 },
          { id: 23, question: '연립방정식의 두 직선이 일치할 때 연립방정식의 해의 개수는?', options: ['0개', '1개', '2개', '무수히 많다'], answer: 3 },
          { id: 24, question: '기울기가 -2이고 y절편이 6인 일차함수가 지나지 않는 사분면은?', options: ['제1사분면', '제2사분면', '제3사분면', '제4사분면'], answer: 2 },
          { id: 25, question: 'x의 값이 2만큼 증가할 때 y의 값이 6만큼 증가하는 일차함수의 기울기는?', options: ['2', '3', '4', '6'], answer: 1 },
        ],
      },
      {
        id: 'mid2_unit4',
        name: '4단원: 삼각형과 사각형의 성질',
        emoji: '🔺',
        description: '이등변삼각형, 외심·내심, 사각형의 성질 완전 정복!',
        questions: [
          { id: 1, question: '이등변삼각형의 두 밑각의 크기는 어떠한가요?', options: ['서로 같다', '합이 90°이다', '합이 180°이다', '상관없다'], answer: 0 },
          { id: 2, question: '이등변삼각형의 꼭지각의 이등분선은 밑변을 어떻게 하나요?', options: ['수직이등분한다', '평행하게 지난다', '삼등분한다', '외접한다'], answer: 0 },
          { id: 3, question: '삼각형의 세 변의 수직이등분선의 교점을 무엇이라 하나요?', options: ['외심', '내심', '무게중심', '수심'], answer: 0 },
          { id: 4, question: '삼각형의 세 내각의 이등분선의 교점을 무엇이라 하나요?', options: ['외심', '내심', '무게중심', '수심'], answer: 1 },
          { id: 5, question: '직각삼각형의 외심은 어디에 위치하나요?', options: ['빗변의 중점', '삼각형의 내부', '삼각형의 외부', '직각인 꼭짓점'], answer: 0 },
          { id: 6, question: '삼각형의 외심에서 세 꼭짓점에 이르는 거리는 어떠한가요?', options: ['서로 같다', '모두 다르다', '합이 180°이다', '내심 거리의 2배이다'], answer: 0 },
          { id: 7, question: '삼각형의 내심에서 세 변에 이르는 거리는 어떠한가요?', options: ['서로 같다 (내접원 반지름)', '모두 다르다', '외심까지 거리와 같다', '알 수 없다'], answer: 0 },
          { id: 8, question: '두 쌍의 대변이 각각 평행한 사각형을 무엇이라 하나요?', options: ['평행사변형', '사다리꼴', '직사각형', '마름모'], answer: 0 },
          { id: 9, question: '평행사변형의 두 대각선은 서로를 어떻게 하나요?', options: ['이등분한다', '수직으로 만난다', '길이가 같다', '삼등분한다'], answer: 0 },
          { id: 10, question: '네 내각의 크기가 모두 같은 사각형은 무엇인가요?', options: ['직사각형', '마름모', '사다리꼴', '평행사변형'], answer: 0 },
          { id: 11, question: '네 변의 길이가 모두 같은 사각형은 무엇인가요?', options: ['마름모', '직사각형', '사다리꼴', '등각사각형'], answer: 0 },
          { id: 12, question: '두 대각선의 길이가 같고 서로를 수직이등분하는 사각형은?', options: ['정사각형', '마름모', '직사각형', '평행사변형'], answer: 0 },
          { id: 13, question: '마름모의 두 대각선은 서로 어떻게 만나나요?', options: ['수직으로 만난다', '평행하다', '길이가 같다', '60°로 만난다'], answer: 0 },
          { id: 14, question: '직사각형의 두 대각선의 길이는 어떠한가요?', options: ['서로 같다', '서로 수직이다', '한쪽이 2배 길다', '모두 다르다'], answer: 0 },
          { id: 15, question: '이등변삼각형 ABC에서 꼭지각 ∠A = 40°일 때 밑각 ∠B의 크기는?', options: ['40°', '70°', '80°', '100°'], answer: 1 },
          { id: 16, question: '삼각형 ABC의 내심을 I라 할 때, ∠BIC = 110°이면 ∠A의 크기는?', options: ['40°', '50°', '60°', '70°'], answer: 0 },
          { id: 17, question: '삼각형 ABC의 외심을 O라 할 때, ∠BOC = 100°이면 ∠A의 크기는?', options: ['40°', '50°', '60°', '80°'], answer: 1 },
          { id: 18, question: '한 쌍의 대변만 평행한 사각형을 무엇이라 하나요?', options: ['사다리꼴', '평행사변형', '마름모', '직사각형'], answer: 0 },
          { id: 19, question: '등변사다리꼴의 두 대각선의 길이는 어떠한가요?', options: ['서로 같다', '수직이다', '이등분한다', '다르다'], answer: 0 },
          { id: 20, question: '평행사변형이 마름모가 되기 위한 추가 조건은?', options: ['이웃하는 두 변의 길이가 같다', '한 내각이 직각이다', '두 대각선의 길이가 같다', '대변의 길이가 같다'], answer: 0 },
          { id: 21, question: '평행사변형이 직사각형이 되기 위한 추가 조건은?', options: ['한 내각이 직각이다', '이웃하는 두 변의 길이가 같다', '두 대각선이 수직이다', '네 변의 길이가 같다'], answer: 0 },
          { id: 22, question: '직각삼각형의 두 예각의 합은 항상 얼마인가요?', options: ['45°', '90°', '180°', '360°'], answer: 1 },
          { id: 23, question: 'RHS 직각삼각형 합동 조건에서 S가 의미하는 것은?', options: ['한 변의 길이', '한 예각의 크기', '빗변의 길이', '직각'], answer: 0 },
          { id: 24, question: 'RHA 직각삼각형 합동 조건에서 A가 의미하는 것은?', options: ['한 예각의 크기', '한 변의 길이', '빗변의 길이', '직각'], answer: 0 },
          { id: 25, question: '정삼각형의 외심과 내심과 무게중심의 위치는 어떠한가요?', options: ['모두 일치한다', '모두 다르다', '외심과 내심만 일치한다', '알 수 없다'], answer: 0 },
        ],
      },
      {
        id: 'mid2_unit5',
        name: '5단원: 도형의 닮음과 피타고라스',
        emoji: '📐',
        description: '닮음비, 삼각 닮음조건, 피타고라스 정리 정복!',
        questions: [
          { id: 1, question: '두 닮은 도형의 대응하는 변의 길이의 비율을 무엇이라 하나요?', options: ['닮음비', '합동비', '넓이비', '부피비'], answer: 0 },
          { id: 2, question: '두 닮은 평면도형의 넓이의 비는 닮음비가 m : n 일 때 얼마인가요?', options: ['m : n', 'm² : n²', 'm³ : n³', '2m : 2n'], answer: 1 },
          { id: 3, question: '두 입체도형의 부피의 비는 닮음비가 m : n 일 때 얼마인가요?', options: ['m : n', 'm² : n²', 'm³ : n³', '3m : 3n'], answer: 2 },
          { id: 4, question: '다음 중 삼각형의 닮음 조건이 아닌 것은?', options: ['SSS 닮음', 'SAS 닮음', 'AA 닮음', 'ASA 닮음'], answer: 3 },
          { id: 5, question: '두 삼각형에서 두 쌍의 대응각의 크기가 각각 같을 때의 닮음 조건은?', options: ['AA 닮음', 'SAS 닮음', 'SSS 닮음', 'ASA 닮음'], answer: 0 },
          { id: 6, question: '직각삼각형에서 직각을 낀 두 변의 길이가 a, b이고 빗변이 c일 때 성립하는 피타고라스 정리는?', options: ['a + b = c', 'a² + b² = c²', 'a² + b² = 2c', 'a³ + b³ = c³'], answer: 1 },
          { id: 7, question: '직각삼각형의 두 변의 길이가 3cm, 4cm일 때 빗변 c의 길이는?', options: ['5cm', '6cm', '7cm', '25cm'], answer: 0 },
          { id: 8, question: '직각삼각형의 빗변이 13cm이고 한 변이 5cm일 때 나머지 한 변의 길이는?', options: ['8cm', '10cm', '12cm', '14cm'], answer: 2 },
          { id: 9, question: '삼각형의 두 변의 중점을 연결한 선분은 세 번째 변과 어떠한가요?', options: ['평행하고 길이는 절반이다', '수직이고 길이는 같다', '평행하고 길이는 2배이다', '아무 관계없다'], answer: 0 },
          { id: 10, question: '삼각형의 세 중선의 교점을 무엇이라 하나요?', options: ['무게중심', '외심', '내심', '수심'], answer: 0 },
          { id: 11, question: '삼각형의 무게중심은 각 중선을 몇 대 몇으로 나누나요?', options: ['1 : 1', '2 : 1', '3 : 1', '3 : 2'], answer: 1 },
          { id: 12, question: '닮음비가 2 : 3인 두 도형의 넓이의 비는?', options: ['2 : 3', '4 : 6', '4 : 9', '8 : 27'], answer: 2 },
          { id: 13, question: '닮음비가 1 : 2인 두 구의 부피의 비는?', options: ['1 : 2', '1 : 4', '1 : 8', '1 : 16'], answer: 2 },
          { id: 14, question: '세 변의 길이가 6, 8, 10인 삼각형은 어떤 삼각형인가요?', options: ['예각삼각형', '직각삼각형', '둔각삼각형', '정삼각형'], answer: 1 },
          { id: 15, question: '세 변의 길이가 4, 5, 6인 삼각형은 어떤 삼각형인가요?', options: ['예각삼각형', '직각삼각형', '둔각삼각형', '이등변삼각형'], answer: 0 },
          { id: 16, question: '세 변의 길이가 3, 4, 6인 삼각형은 어떤 삼각형인가요?', options: ['예각삼각형', '직각삼각형', '둔각삼각형', '정삼각형'], answer: 2 },
          { id: 17, question: '△ABC에서 ∠A의 이등분선이 BC와 만나는 점 D일 때 성립하는 공식은?', options: ['AB : AC = BD : CD', 'AB : BD = AC : CD', 'AB × AC = BD × CD', 'AB + AC = BC'], answer: 0 },
          { id: 18, question: '직각삼각형 ABC에서 직각 꼭짓점 A에서 빗변 BC에 내린 수선의 발을 H라 할 때, AH² 의 값은?', options: ['BH × CH', 'AB × AC', 'BC × AH', 'BH² + CH²'], answer: 0 },
          { id: 19, question: '대각선의 길이가 10cm인 정사각형의 한 변의 길이는?', options: ['5cm', '5√2 cm', '10√2 cm', '25cm'], answer: 1 },
          { id: 20, question: '가로 6cm, 세로 8cm인 직사각형의 대각선의 길이는?', options: ['9cm', '10cm', '12cm', '14cm'], answer: 1 },
          { id: 21, question: '모든 정다각형은 항상 서로 닮음인가요?', options: ['변의 수가 같으면 항상 닮음이다', '항상 닮음이 아니다', '넓이가 같아야 닮음이다', '알 수 없다'], answer: 0 },
          { id: 22, question: '모든 원은 항상 서로 닮은 도형인가요?', options: ['네, 항상 닮음입니다', '아니요, 반지름이 다르면 아닙니다', '넓이가 같을 때만 닮음입니다', '알 수 없습니다'], answer: 0 },
          { id: 23, question: '높이가 10m인 나무의 그림자가 15m일 때, 높이 x인 건물의 그림자가 30m이면 건물 높이는?', options: ['15m', '20m', '25m', '30m'], answer: 1 },
          { id: 24, question: '삼각형의 세 중선에 의해 나누어지는 6개 소삼각형의 넓이는 어떠한가요?', options: ['모두 같다', '모두 다르다', '외심 위치에 따라 다르다', '2개씩 같다'], answer: 0 },
          { id: 25, question: '피타고라스 수(자연수 세 쌍)로 올바른 것은?', options: ['(3, 4, 5)', '(4, 5, 6)', '(5, 6, 7)', '(6, 7, 8)'], answer: 0 },
        ],
      },
      {
        id: 'mid2_unit6',
        name: '6단원: 확률과 그 계산',
        emoji: '🎲',
        description: '경우의 수, 확률의 정의와 곱셈/덧셈 정리!',
        questions: [
          { id: 1, question: '동전 1개를 던질 때 나올 수 있는 경우의 수는?', options: ['1가지', '2가지', '4가지', '6가지'], answer: 1 },
          { id: 2, question: '주사위 1개를 던질 때 짝수 눈이 나오는 경우의 수는?', options: ['2가지', '3가지', '4가지', '6가지'], answer: 1 },
          { id: 3, question: '주사위 2개를 동시에 던질 때 일어날 수 있는 모든 경우의 수는?', options: ['12가지', '24가지', '36가지', '48가지'], answer: 2 },
          { id: 4, question: '동전 2개를 동시에 던질 때 모두 앞면이 나올 확률은?', options: ['1/2', '1/3', '1/4', '3/4'], answer: 2 },
          { id: 5, question: '주사위 1개를 던질 때 7 이상의 눈이 나올 확률은?', options: ['0', '1/6', '1/2', '1'], answer: 0 },
          { id: 6, question: '주사위 1개를 던질 때 6 이하의 눈이 나올 확률은?', options: ['0', '1/6', '1/2', '1'], answer: 3 },
          { id: 7, question: '어떤 사건이 일어날 확률 p의 범위로 올바른 것은?', options: ['0 ≤ p ≤ 1', '0 < p < 1', '-1 ≤ p ≤ 1', 'p ≥ 1'], answer: 0 },
          { id: 8, question: '사건 A가 일어날 확률이 p일 때, 사건 A가 일어나지 않을 확률(여사건)은?', options: ['1 - p', 'p - 1', '1/p', '-p'], answer: 0 },
          { id: 9, question: '서로 다른 길 3개와 길 2개가 연결되어 있을 때, 출발지에서 목적지까지 가는 경우의 수(곱의 법칙)는?', options: ['5가지', '6가지', '8가지', '9가지'], answer: 1 },
          { id: 10, question: '4명의 학생 중에서 대표 2명을 순서 없이 뽑는 경우의 수는?', options: ['6가지', '8가지', '12가지', '24가지'], answer: 0 },
          { id: 11, question: '4명의 학생을 한 줄로 세우는 경우의 수는?', options: ['12가지', '16가지', '24가지', '32가지'], answer: 2 },
          { id: 12, question: '주사위 1개를 던질 때 2 이하 또는 5 이상의 눈이 나올 확률은?', options: ['1/3', '1/2', '2/3', '5/6'], answer: 2 },
          { id: 13, question: 'A가 명중할 확률 1/2, B가 명중할 확률 1/3일 때 두 사람 모두 명중할 확률은?', options: ['1/6', '5/6', '2/5', '1/5'], answer: 0 },
          { id: 14, question: '적어도 한 개는 앞면이 나올 확률을 구할 때 이용하는 개념은?', options: ['여사건의 확률 (1 - 모두 뒷면일 확률)', '합의 법칙', '평균', '순열'], answer: 0 },
          { id: 15, question: '흰 공 3개, 검은 공 2개가 들어있는 주머니에서 공 1개를 꺼낼 때 흰 공일 확률은?', options: ['2/5', '3/5', '1/3', '2/3'], answer: 1 },
          { id: 16, question: '뽑은 제비를 다시 넣고 꺼내는 경우(복원추출)에서 두 번째 당첨 확률은 첫 번째와 어떠한가요?', options: ['변함없이 같다', '줄어든다', '늘어난다', '0이 된다'], answer: 0 },
          { id: 17, question: '뽑은 제비를 다시 넣지 않고 꺼내는 경우(비복원추출) 전체 개수는 어떠해지나요?', options: ['1개 줄어든다', '변함없다', '1개 늘어난다', '알 수 없다'], answer: 0 },
          { id: 18, question: '주사위 2개를 던져 눈의 합이 4가 되는 경우의 수는?', options: ['2가지', '3가지', '4가지', '5가지'], answer: 1 },
          { id: 19, question: '주사위 2개를 던져 두 눈의 수의 차가 0인 경우의 수는?', options: ['4가지', '6가지', '8가지', '12가지'], answer: 1 },
          { id: 20, question: '5명의 후보 중 회장 1명, 부회장 1명을 뽑는 경우의 수는?', options: ['10가지', '15가지', '20가지', '25가지'], answer: 2 },
          { id: 21, question: '비가 올 확률이 30%일 때, 비가 오지 않을 확률은?', options: ['30%', '50%', '70%', '100%'], answer: 2 },
          { id: 22, question: '동전 3개를 동시에 던질 때 나오는 모든 경우의 수는?', options: ['6가지', '8가지', '9가지', '16가지'], answer: 1 },
          { id: 23, question: '윷놀이에서 윷가락 4개를 던질 때 나올 수 있는 경우의 수는?', options: ['8가지', '12가지', '16가지', '20가지'], answer: 2 },
          { id: 24, question: '1부터 10까지 숫자가 적힌 카드 중 3의 배수가 나올 확률은?', options: ['1/10', '3/10', '4/10', '1/3'], answer: 1 },
          { id: 25, question: '두 사건 A, B가 동시에 일어나지 않을 때 사용되는 확률 계산법은?', options: ['확률의 덧셈 정리', '확률의 곱셈 정리', '여사건의 법칙', '평균'], answer: 0 },
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
        description: '제곱근의 성질, 분모의 유리화, 무리수와 실수!',
        questions: [
          { id: 1, question: '√16 의 값은?', options: ['2', '4', '8', '16'], answer: 1 },
          { id: 2, question: '√2 는 어떤 수인가요?', options: ['유한소수', '순환소수', '무리수', '정수'], answer: 2 },
          { id: 3, question: '√49 를 간단히 하면?', options: ['√7', '7', '7²', '√7²'], answer: 1 },
          { id: 4, question: '√12 를 간단히 하면?', options: ['2√3', '3√2', '√6 × 2', '4√3'], answer: 0 },
          { id: 5, question: '√5 × √5 의 값은?', options: ['25', '5', '√25', '10'], answer: 1 },
          { id: 6, question: '실수에 포함되지 않는 수(허수) 예시는?', options: ['√2', '3/4', '-5', '√(-4)'], answer: 3 },
          { id: 7, question: '√18 을 간단히 하면?', options: ['3√2', '2√3', '6√3', '9√2'], answer: 0 },
          { id: 8, question: '√3 + √3 의 값은?', options: ['√6', '2√3', '3√2', '√9'], answer: 1 },
          { id: 9, question: '2√5 × 3√5 의 값은?', options: ['5√5', '6√25', '30', '6√5'], answer: 2 },
          { id: 10, question: '√50 ÷ √2 의 값은?', options: ['5', '√25', '√10', '√100'], answer: 0 },
          { id: 11, question: '분모의 유리화: 1/√2 의 분모를 유리화하면?', options: ['√2', '√2 / 2', '2 / √2', '1/2'], answer: 1 },
          { id: 12, question: '양수 a의 제곱근은 몇 개인가요?', options: ['0개', '1개', '2개 (양과 음)', '무수히 많다'], answer: 2 },
          { id: 13, question: '0의 제곱근은 무엇인가요?', options: ['없다', '0', '±0', '1'], answer: 1 },
          { id: 14, question: '음수의 제곱근은 실수 범위에서 몇 개인가요?', options: ['없다(0개)', '1개', '2개', '알 수 없다'], answer: 0 },
          { id: 15, question: '(-5)² 의 제곱근 중 양의 제곱근은?', options: ['-5', '5', '25', '√5'], answer: 1 },
          { id: 16, question: '√(a²) 에서 a < 0 일 때 값은?', options: ['a', '-a', 'a²', '0'], answer: 1 },
          { id: 17, question: '3√2 + 5√2 - 2√2 의 계산 결과는?', options: ['6', '6√2', '10√2', '6√6'], answer: 1 },
          { id: 18, question: '√27 - √12 의 계산 결과는?', options: ['√15', '√3', '2√3', '3√3'], answer: 1 },
          { id: 19, question: '√2 ≒ 1.414 일 때, √200 의 대략적인 값은?', options: ['14.14', '141.4', '1.414', '28.28'], answer: 0 },
          { id: 20, question: '유리수와 무리수를 통틀어 무엇이라 하나요?', options: ['정수', '실수', '복소수', '자연수'], answer: 1 },
          { id: 21, question: '다음 중 무리수가 아닌 것은?', options: ['π', '√3', '√9', '1 + √2'], answer: 2 },
          { id: 22, question: '수직선은 무엇으로 메울 수 있나요?', options: ['유리수만으로', '무리수만으로', '실수 전체로', '정수만으로'], answer: 2 },
          { id: 23, question: '2와 3 사이의 무리수인 것은?', options: ['√3', '√5', '√10', '1.5'], answer: 1 },
          { id: 24, question: '분모의 유리화: 6 / √3 의 값은?', options: ['2', '2√3', '3√3', '6√3'], answer: 1 },
          { id: 25, question: '(√5 + 2)(√5 - 2) 의 계산 결과(합차 공식)는?', options: ['1', '3', '5', '9'], answer: 0 },
        ],
      },
      {
        id: 'mid3_unit2',
        name: '2단원: 이차방정식',
        emoji: '🧮',
        description: '인수분해, 근의 공식, 판별식으로 이차방정식 풀기!',
        questions: [
          { id: 1, question: 'x² - 5x + 6 = 0 의 두 근은?', options: ['x = 1 또는 6', 'x = 2 또는 3', 'x = -2 또는 -3', 'x = 0 또는 5'], answer: 1 },
          { id: 2, question: 'x² - 9 = 0 의 해는?', options: ['x = ±3', 'x = 9', 'x = ±9', 'x = 3'], answer: 0 },
          { id: 3, question: '(x - 2)(x + 5) = 0 의 해는?', options: ['x = 2 또는 -5', 'x = -2 또는 5', 'x = 2 또는 5', 'x = -2 또는 -5'], answer: 0 },
          { id: 4, question: 'x² + 6x + 9 = 0 의 해는?', options: ['x = 3 (중근)', 'x = -3 (중근)', 'x = ±3', 'x = 6'], answer: 1 },
          { id: 5, question: 'x² - 4x = 0 의 해는?', options: ['x = 0 또는 4', 'x = 4', 'x = 0', 'x = 2'], answer: 0 },
          { id: 6, question: '2x² - 8 = 0 의 해는?', options: ['x = ±1', 'x = ±2', 'x = ±4', 'x = 2'], answer: 1 },
          { id: 7, question: 'x² + 3x - 10 = 0 의 해는?', options: ['x = 2 또는 -5', 'x = -2 또는 5', 'x = 2 또는 5', 'x = -2 또는 -5'], answer: 0 },
          { id: 8, question: '이차방정식의 판별식 D = b² - 4ac 에서 D > 0이면 근의 상태는?', options: ['서로 다른 두 실근', '중근(한 실근)', '실근이 없다', '허근 3개'], answer: 0 },
          { id: 9, question: 'x² - 2x - 15 = 0 의 두 근의 합은?', options: ['2', '-2', '15', '-15'], answer: 0 },
          { id: 10, question: 'x² - 2x - 15 = 0 의 두 근의 곱은?', options: ['2', '-2', '15', '-15'], answer: 3 },
          { id: 11, question: '근의 공식: ax² + bx + c = 0 (a ≠ 0) 의 해 x는?', options: ['(-b ± √(b²-4ac)) / 2a', '(b ± √(b²-4ac)) / 2a', '(-b ± √(b²+4ac)) / 2a', '-b / 2a'], answer: 0 },
          { id: 12, question: '이차방정식이 중근을 가질 조건(판별식 D의 값)은?', options: ['D > 0', 'D = 0', 'D < 0', 'D ≥ 1'], answer: 1 },
          { id: 13, question: 'x² + kx + 16 = 0 이 중근을 가질 때 양수 k의 값은?', options: ['4', '8', '12', '16'], answer: 1 },
          { id: 14, question: '(x + 3)² = 5 의 해는?', options: ['x = -3 ± √5', 'x = 3 ± √5', 'x = -5 ± √3', 'x = 2'], answer: 0 },
          { id: 15, question: 'x² - 6x + 2 = 0 을 완전제곱식 (x - p)² = q 꼴로 나타내면 p, q의 값은?', options: ['p = 3, q = 7', 'p = 3, q = 9', 'p = 6, q = 2', 'p = -3, q = 7'], answer: 0 },
          { id: 16, question: '두 근이 1과 4이고 x²의 계수가 1인 이차방정식은?', options: ['x² - 5x + 4 = 0', 'x² + 5x + 4 = 0', 'x² - 4x + 1 = 0', 'x² - 3x + 4 = 0'], answer: 0 },
          { id: 17, question: '어떤 양수를 제곱해야 할 것을 2배 하였더니 원래보다 15만큼 작았다. 이 양수는?', options: ['3', '5', '7', '9'], answer: 1 },
          { id: 18, question: '연속하는 두 자연수의 곱이 56일 때, 두 자연수의 합은?', options: ['13', '15', '17', '19'], answer: 1 },
          { id: 19, question: 'x = 2가 이차방정식 x² - ax + 6 = 0 의 한 근일 때, a의 값은?', options: ['3', '5', '7', '9'], answer: 1 },
          { id: 20, question: 'x² + 4x - 1 = 0 의 근은?', options: ['-2 ± √5', '2 ± √5', '-4 ± √5', '-2 ± √3'], answer: 0 },
          { id: 21, question: 'x² - 3x = 0 의 두 근의 합은?', options: ['0', '3', '-3', '6'], answer: 1 },
          { id: 22, question: '이차방정식 3x² - 5x + 1 = 0 의 판별식 D의 값은?', options: ['13', '37', '1', '-13'], answer: 0 },
          { id: 23, question: '인수분해 공식: a² - b² = ?', options: ['(a-b)²', '(a+b)²', '(a+b)(a-b)', 'a² - 2ab + b²'], answer: 2 },
          { id: 24, question: '인수분해: x² - 7x + 12 의 결과는?', options: ['(x-3)(x-4)', '(x+3)(x+4)', '(x-1)(x-12)', '(x+2)(x-6)'], answer: 0 },
          { id: 25, question: '이차방정식 ax² + bx + c = 0 이 실근을 가질 조건은?', options: ['D > 0', 'D ≥ 0', 'D = 0', 'D < 0'], answer: 1 },
        ],
      },
      {
        id: 'mid3_unit3',
        name: '3단원: 이차함수',
        emoji: '🌊',
        description: '포물선의 최고점·최저점, 꼭짓점과 그래프의 변환!',
        questions: [
          { id: 1, question: 'y = x² 의 그래프 모양은 무엇인가요?', options: ['직선', '포물선', '원', '타원'], answer: 1 },
          { id: 2, question: 'y = 2x² 의 꼭짓점의 좌표는?', options: ['(0, 0)', '(2, 0)', '(0, 2)', '(1, 2)'], answer: 0 },
          { id: 3, question: 'y = x² - 4 의 꼭짓점 y좌표는?', options: ['0', '-4', '4', '2'], answer: 1 },
          { id: 4, question: 'y = (x - 3)² 의 꼭짓점 좌표는?', options: ['(3, 0)', '(-3, 0)', '(0, 3)', '(0, -3)'], answer: 0 },
          { id: 5, question: 'y = -x² 의 그래프는 어느 방향으로 열려있나요?', options: ['위쪽 (아래로 볼록)', '아래쪽 (위로 볼록)', '오른쪽', '왼쪽'], answer: 1 },
          { id: 6, question: 'y = x² + 2x + 1 을 표준형으로 변환하면?', options: ['y = (x+1)²', 'y = (x-1)²', 'y = (x+2)²', 'y = (x-2)²'], answer: 0 },
          { id: 7, question: 'y = 2(x-1)² + 3 의 꼭짓점 좌표는?', options: ['(1, 3)', '(-1, 3)', '(1, -3)', '(-1, -3)'], answer: 0 },
          { id: 8, question: 'y = x² - 6x + 8 의 꼭짓점의 y좌표는?', options: ['-1', '0', '1', '-2'], answer: 0 },
          { id: 9, question: 'a > 0 일 때 y = ax² + q 의 그래프의 특징은?', options: ['아래로 볼록, 꼭짓점 (0,q)', '위로 볼록, 꼭짓점 (0,q)', '아래로 볼록, 꼭짓점 (q,0)', '위로 볼록, 꼭짓점 (q,0)'], answer: 0 },
          { id: 10, question: 'y = 3x² 와 y = (1/3)x² 의 그래프 폭을 비교하면?', options: ['y = 3x²가 더 좁다', 'y = (1/3)x²가 더 좁다', '폭이 같다', '방향이 반대다'], answer: 0 },
          { id: 11, question: 'y = a(x - p)² + q 의 축의 방정식은?', options: ['x = p', 'y = q', 'x = q', 'y = p'], answer: 0 },
          { id: 12, question: 'y = -2(x + 3)² - 5 의 축의 방정식은?', options: ['x = 3', 'x = -3', 'x = -5', 'y = -5'], answer: 1 },
          { id: 13, question: '이차함수 y = x² - 4x + 5 의 최솟값은?', options: ['1', '2', '5', '-1'], answer: 0 },
          { id: 14, question: '이차함수 y = -x² + 4x + 1 의 최댓값은?', options: ['3', '5', '7', '1'], answer: 1 },
          { id: 15, question: 'y = x² 의 그래프를 x축 방향으로 2만큼, y축 방향으로 3만큼 평행이동한 식은?', options: ['y = (x-2)² + 3', 'y = (x+2)² + 3', 'y = (x-2)² - 3', 'y = (x+2)² - 3'], answer: 0 },
          { id: 16, question: 'y = ax² + bx + c 의 y절편의 좌표는?', options: ['(0, c)', '(0, a)', '(0, b)', '(c, 0)'], answer: 0 },
          { id: 17, question: 'y = x² - 2x - 3 이 x축과 만나는 두 점의 x좌표는?', options: ['-1과 3', '1과 -3', '2와 3', '-2와 -3'], answer: 0 },
          { id: 18, question: 'y = 2x² 의 그래프와 x축에 대칭인 그래프의 식은?', options: ['y = -2x²', 'y = ½x²', 'y = -½x²', 'y = 2/x²'], answer: 0 },
          { id: 19, question: '이차함수의 최고차항 계수 a의 절댓값이 클수록 그래프의 폭은?', options: ['좁아진다', '넓어진다', '일정하다', '직선이 된다'], answer: 0 },
          { id: 20, question: '점 (0, 3)을 지나고 꼭짓점이 (1, 1)인 이차함수 식의 a값은?', options: ['1', '2', '3', '4'], answer: 1 },
          { id: 21, question: 'y = -3x² + 6x 의 꼭짓점 좌표는?', options: ['(1, 3)', '(-1, 3)', '(1, -3)', '(0, 0)'], answer: 0 },
          { id: 22, question: 'y = (x - 1)² - 4 의 그래프가 지나지 않는 사분면은?', options: ['제1사분면', '제2사분면', '제3사분면', '모든 사분면을 지난다'], answer: 3 },
          { id: 23, question: '포물선의 대칭축을 중심으로 좌우 모양은 어떠한가요?', options: ['선대칭이다', '점대칭이다', '비대칭이다', '알 수 없다'], answer: 0 },
          { id: 24, question: 'a < 0 일 때 이차함수의 최댓값은 어디에서 존재하나요?', options: ['꼭짓점의 y좌표', '꼭짓점의 x좌표', 'y절편', 'x절편'], answer: 0 },
          { id: 25, question: 'y = x² + kx + 9 의 그래프가 x축에 접할 때 양수 k의 값은?', options: ['3', '6', '9', '12'], answer: 1 },
        ],
      },
      {
        id: 'mid3_unit4',
        name: '4단원: 삼각비',
        emoji: '📐',
        description: 'sin, cos, tan 특수각 값과 높이·거리 구하기!',
        questions: [
          { id: 1, question: '직각삼각형에서 sin A 의 정의는?', options: ['높이 / 빗변', '밑변 / 빗변', '높이 / 밑변', '빗변 / 높이'], answer: 0 },
          { id: 2, question: '직각삼각형에서 cos A 의 정의는?', options: ['밑변 / 빗변', '높이 / 빗변', '높이 / 밑변', '빗변 / 밑변'], answer: 0 },
          { id: 3, question: '직각삼각형에서 tan A 의 정의는?', options: ['높이 / 밑변', '밑변 / 빗변', '높이 / 빗변', '밑변 / 높이'], answer: 0 },
          { id: 4, question: 'sin 30° 의 값은 얼마인가요?', options: ['1/2', '√2/2', '√3/2', '1'], answer: 0 },
          { id: 5, question: 'cos 60° 의 값은 얼마인가요?', options: ['1/2', '√2/2', '√3/2', '0'], answer: 0 },
          { id: 6, question: 'tan 45° 의 값은 얼마인가요?', options: ['1/2', '1', '√3', '1/√3'], answer: 1 },
          { id: 7, question: 'sin 45° 의 값은 얼마인가요?', options: ['1/2', '√2/2', '√3/2', '1'], answer: 1 },
          { id: 8, question: 'cos 30° 의 값은 얼마인가요?', options: ['1/2', '√2/2', '√3/2', '1'], answer: 2 },
          { id: 9, question: 'tan 60° 의 값은 얼마인가요?', options: ['1/√3', '1', '√3', '2'], answer: 2 },
          { id: 10, question: 'sin 90° 의 값은 얼마인가요?', options: ['0', '1/2', '1', '정의되지 않음'], answer: 2 },
          { id: 11, question: 'cos 0° 의 값은 얼마인가요?', options: ['0', '1/2', '1', '정의되지 않음'], answer: 2 },
          { id: 12, question: 'tan 0° 의 값은 얼마인가요?', options: ['0', '1/2', '1', '정의되지 않음'], answer: 0 },
          { id: 13, question: 'sin 0° 의 값은 얼마인가요?', options: ['0', '1/2', '1', '정의되지 않음'], answer: 0 },
          { id: 14, question: 'cos 90° 의 값은 얼마인가요?', options: ['0', '1/2', '1', '정의되지 않음'], answer: 0 },
          { id: 15, question: 'sin 30° + cos 60° 의 값은?', options: ['1/2', '1', '√3', '2'], answer: 1 },
          { id: 16, question: 'tan 30° 의 값은 얼마인가요?', options: ['√3 / 3', '1', '√3', '1/2'], answer: 0 },
          { id: 17, question: 'sin² 45° + cos² 45° 의 계산 결과는?', options: ['1/2', '1', '2', '√2'], answer: 1 },
          { id: 18, question: '0° < A < 90° 일 때, 각 A가 커질수록 sin A의 값은?', options: ['증가한다', '감소한다', '일정하다', '0이 된다'], answer: 0 },
          { id: 19, question: '0° < A < 90° 일 때, 각 A가 커질수록 cos A의 값은?', options: ['증가한다', '감소한다', '일정하다', '1이 된다'], answer: 1 },
          { id: 20, question: '빗변의 길이가 10m이고 경사각이 30°인 언덕의 높이는?', options: ['5m', '5√3 m', '10m', '10√3 m'], answer: 0 },
          { id: 21, question: '밑변이 10m이고 올려다본 각이 45°일 때 건물의 높이는?', options: ['5m', '10m', '10√2 m', '10√3 m'], answer: 1 },
          { id: 22, question: '삼각형의 두 변 a, b와 낀각 C가 주어졌을 때 넓이 공식 S는?', options: ['½ ab sin C', 'ab cos C', '½ ab tan C', 'ab sin C'], answer: 0 },
          { id: 23, question: '두 변이 4cm, 6cm이고 낀각이 30°인 삼각형의 넓이는?', options: ['6cm²', '12cm²', '6√3 cm²', '12√3 cm²'], answer: 0 },
          { id: 24, question: 'sin A = 3/5 일 때, tan A 의 값은? (A는 예각)', options: ['3/4', '4/5', '4/3', '5/3'], answer: 0 },
          { id: 25, question: '직각이등변삼각형의 세 변의 길이의 비는?', options: ['1 : 1 : √2', '1 : √3 : 2', '3 : 4 : 5', '1 : 2 : 3'], answer: 0 },
        ],
      },
      {
        id: 'mid3_unit5',
        name: '5단원: 원의 성질',
        emoji: '⭕',
        description: '원주각, 중심각, 원에 내접하는 사각형과 접선!',
        questions: [
          { id: 1, question: '한 호에 대한 원주각의 크기는 중심각 크기의 몇 배인가요?', options: ['1/2 배', '1 배', '2 배', '4 배'], answer: 0 },
          { id: 2, question: '한 호에 대한 원주각의 크기들은 서로 어떠한가요?', options: ['모두 같다', '위치마다 다르다', '중심을 지나야 같다', '합이 180°이다'], answer: 0 },
          { id: 3, question: '반원에 대한 원주각의 크기는 몇 도인가요?', options: ['45°', '60°', '90°', '180°'], answer: 2 },
          { id: 4, question: '원에 내접하는 사각형의 한 쌍의 대각의 크기의 합은?', options: ['90°', '180°', '270°', '360°'], answer: 1 },
          { id: 5, question: '원의 접선과 그 접점을 지나 현이 이루는 각의 크기는?', options: ['그 현에 대한 원주각과 같다', '90°이다', '중심각과 같다', '45°이다'], answer: 0 },
          { id: 6, question: '원의 중심에서 현에 내린 수선은 그 현을 어떻게 하나요?', options: ['이등분한다', '삼등분한다', '수직이 아니다', '외접한다'], answer: 0 },
          { id: 7, question: '원 밖의 한 점에서 그 원에 그은 두 접선의 길이는?', options: ['서로 같다', '모두 다르다', '반지름의 2배이다', '알 수 없다'], answer: 0 },
          { id: 8, question: '중심각의 크기가 120°일 때, 이 호에 대한 원주각의 크기는?', options: ['30°', '60°', '90°', '120°'], answer: 1 },
          { id: 9, question: '원주각의 크기가 40°일 때, 이 호에 대한 중심각의 크기는?', options: ['20°', '40°', '80°', '160°'], answer: 2 },
          { id: 10, question: '원에 내접하는 사각형 ABCD에서 ∠A = 80°일 때 대각 ∠C의 크기는?', options: ['80°', '100°', '120°', '160°'], answer: 1 },
          { id: 11, question: '원의 중심에서 같은 거리에 있는 두 현의 길이는?', options: ['서로 같다', '다르다', '반지름과 같다', '2배이다'], answer: 0 },
          { id: 12, question: '원의 반지름이 5cm이고 중심에서 현까지 거리가 3cm일 때 현의 길이는?', options: ['4cm', '6cm', '8cm', '10cm'], answer: 2 },
          { id: 13, question: '원 외접사각형에서 두 쌍의 대변의 길의 합은 서로 어떠한가요?', options: ['서로 같다', '다르다', '대각선과 같다', '알 수 없다'], answer: 0 },
          { id: 14, question: '원에 내접하지 않는 사각형은 무엇인가요?', options: ['직사각형', '등변사다리꼴', '정사각형', '일반 평행사변형'], answer: 3 },
          { id: 15, question: '길이가 같은 호에 대한 원주각의 크기는 어떠한가요?', options: ['서로 같다', '중심 위치에 따라 다르다', '반지름에 비례한다', '180°이다'], answer: 0 },
          { id: 16, question: '원주 전체에 대한 원주각의 크기의 총합은 몇 도인가요?', options: ['90°', '180°', '270°', '360°'], answer: 1 },
          { id: 17, question: '원주 전체에 대한 중심각의 크기의 총합은 몇 도인가요?', options: ['90°', '180°', '270°', '360°'], answer: 3 },
          { id: 18, question: '원 밖의 점 P에서 원에 그은 접선 PT와 할선 PAB에 대해 PT² 의 값은?', options: ['PA × PB', 'PA + PB', 'PA / PB', 'PB²'], answer: 0 },
          { id: 19, question: '두 현 AB와 CD가 원 내부의 점 P에서 만날 때 성립하는 호의 공식은?', options: ['PA × PB = PC × PD', 'PA + PB = PC + PD', 'PA × PC = PB × PD', 'PA = PB'], answer: 0 },
          { id: 20, question: '원의 접선과 접점을 지나는 반지름이 이루는 각은 몇 도인가요?', options: ['45°', '60°', '90°', '180°'], answer: 2 },
          { id: 21, question: '원주각이 90°인 현은 원의 무엇인가요?', options: ['지름', '반지름', '접선', '할선'], answer: 0 },
          { id: 22, question: '호의 길이가 원주의 1/6일 때, 이 호에 대한 원주각의 크기는?', options: ['15°', '30°', '45°', '60°'], answer: 1 },
          { id: 23, question: '원에 내접하는 사각형의 한 외각의 크기는 그 내대각의 크기와 어떠한가요?', options: ['서로 같다', '합이 180°이다', '2배이다', '알 수 없다'], answer: 0 },
          { id: 24, question: '반지름이 10cm인 원에서 12cm인 현의 중심까지의 거리는?', options: ['6cm', '8cm', '9cm', '10cm'], answer: 1 },
          { id: 25, question: '두 원이 만나지 않고 외부에 있을 때 공통접선의 개수는 모두 몇 개인가요?', options: ['1개', '2개', '3개', '4개'], answer: 3 },
        ],
      },
      {
        id: 'mid3_unit6',
        name: '6단원: 통계 (대표값과 산포도)',
        emoji: '📈',
        description: '평균·중앙값·최빈값, 편차·분산·표준편차 마스터!',
        questions: [
          { id: 1, question: '자료 전체의 특징을 하나의 수로 나타낸 값을 무엇이라 하나요?', options: ['대표값', '산포도', '편차', '도수'], answer: 0 },
          { id: 2, question: '자료를 크기 순으로 나열했을 때 한가운데 있는 값은?', options: ['평균', '중앙값', '최빈값', '분산'], answer: 1 },
          { id: 3, question: '자료 중에서 가장 자주 나타나는 값(가장 도수가 높은 값)은?', options: ['평균', '중앙값', '최빈값', '표준편차'], answer: 2 },
          { id: 4, question: '자료의 변량에서 평균을 뺀 값(변량 - 평균)을 무엇이라 하나요?', options: ['편차', '분산', '대표값', '산포도'], answer: 0 },
          { id: 5, question: '모든 편차의 합은 항상 얼마인가요?', options: ['-1', '0', '1', '평균값'], answer: 1 },
          { id: 6, question: '편차의 제곱의 평균을 무엇이라 하나요?', options: ['분산', '표준편차', '중앙값', '범위'], answer: 0 },
          { id: 7, question: '분산의 음이 아닌 제곱근(√분산)을 무엇이라 하나요?', options: ['표준편차', '편차', '최빈값', '평균'], answer: 0 },
          { id: 8, question: '자료 2, 4, 6, 8, 10 의 평균은 얼마인가요?', options: ['5', '6', '7', '8'], answer: 1 },
          { id: 9, question: '자료 3, 5, 7, 9, 11 의 중앙값은 얼마인가요?', options: ['5', '7', '9', '6'], answer: 1 },
          { id: 10, question: '자료 2, 3, 3, 4, 5, 5, 5, 6 의 최빈값은?', options: ['3', '4', '5', '6'], answer: 2 },
          { id: 11, question: '자료 1, 3, 5, 7 의 중앙값은 얼마인가요?', options: ['3', '4', '5', '3.5'], answer: 1 },
          { id: 12, question: '분산이 9일 때 표준편차는 얼마인가요?', options: ['3', '9', '18', '81'], answer: 0 },
          { id: 13, question: '표준편차가 4일 때 분산은 얼마인가요?', options: ['2', '8', '16', '64'], answer: 2 },
          { id: 14, question: '자료들이 평균을 중심으로 흩어져 있는 정도를 나타낸 수치를 무엇이라 하나요?', options: ['대표값', '산포도', '도수', '계급값'], answer: 1 },
          { id: 15, question: '표준편차가 작은 집단일수록 자료의 분포 상태는 어떠한가요?', options: ['평균 주변에 고르게 모여있다', '넓게 흩어져 있다', '대표값이 없다', '알 수 없다'], answer: 0 },
          { id: 16, question: '극단적인 값(아주 크거나 작은 값)의 영향을 가장 많이 받는 대표값은?', options: ['평균', '중앙값', '최빈값', '분산'], answer: 0 },
          { id: 17, question: '변량이 5, 7, x, 9 의 평균이 7일 때 x의 값은?', options: ['6', '7', '8', '9'], answer: 1 },
          { id: 18, question: '편차가 -2, 1, 3, x 일 때 x의 값은?', options: ['-2', '-1', '0', '2'], answer: 0 },
          { id: 19, question: '두 변량 x, y 사이의 관계를 좌표평면 위에 점으로 나타낸 그래프는?', options: ['산점도', '히스토그램', '줄기와 잎 그림', '꺾은선그래프'], answer: 0 },
          { id: 20, question: 'x가 증가함에 따라 y도 대체로 증가하는 관계를 무슨 상관관계라 하나요?', options: ['양의 상관관계', '음의 상관관계', '상관관계가 없다', '역상관관계'], answer: 0 },
          { id: 21, question: 'x가 증가함에 따라 y는 대체로 감소하는 관계를 무슨 상관관계라 하나요?', options: ['양의 상관관계', '음의 상관관계', '상관관계가 없다', '정상관관계'], answer: 1 },
          { id: 22, question: '다음 중 음의 상관관계를 보이는 변량의 쌍은?', options: ['키와 몸무게', '난방 온도와 난방비', '산의 높이와 기온', '공부 시간과 시험 점수'], answer: 2 },
          { id: 23, question: '다음 중 상관관계가 없는 두 변량의 쌍은?', options: ['여름철 기온과 청량음료 판매량', '신발 사이즈와 수학 점수', '자동차 속력과 목적지 도착 시간', '도시 인구수와 쓰레기 배출량'], answer: 1 },
          { id: 24, question: '자료 5개의 편차가 -1, 2, 0, -2, 1 일 때 분산은?', options: ['1.5', '2', '2.5', '10'], answer: 1 },
          { id: 25, question: '어떤 자료의 모든 변량에 각각 3을 더하면 평균과 표준편차는 어떻게 되나요?', options: ['평균은 3 증가, 표준편차는 그대로', '평균 3 증가, 표준편차 3 증가', '평균 그대로, 표준편차 3 증가', '둘 다 그대로'], answer: 0 },
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
  const [isGuest, setIsGuest] = useState(false);
  const [showPlayChoiceModal, setShowPlayChoiceModal] = useState(false);

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
    setIsGuest(false);
  };

  // 단원 변경
  const handleUnitChange = (unitId: string) => {
    setActiveUnitId(unitId);
    setViewMode('home');
    setIsScoreSubmitted(false);
    setIsGuest(false);
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
    setIsGuest(false);
    setViewMode('home');
    localStorage.removeItem('math_student_user');
  };

  const resetAuthForm = () => {
    setInputStudentId(''); setInputName(''); setInputPassword(''); setAuthError('');
  };

  // ── 퀴즈 ──
  // 실제 퀴즈 시작 (단원별 25문제 출제)
  const doStartQuiz = (asGuest = false) => {
    setIsGuest(asGuest);
    const countToPick = Math.min(activeUnit.questions.length, 25);
    const picked = pickRandom(activeUnit.questions, countToPick);
    setQuizQuestions(picked);
    setCurrentQuestionIndex(0);
    setSelectedAnswers([]);
    setIsScoreSubmitted(false);
    setSubmitError('');
    setViewMode('quiz');
    setShowPlayChoiceModal(false);
  };

  // 퀴즈 시작 버튼 핸들러
  const startQuiz = () => {
    if (!currentUser) {
      setShowPlayChoiceModal(true);
      return;
    }
    doStartQuiz(false);
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
    try {
      const score = calculateScore();
      const displayName = `${currentUser.name} (${currentUser.student_id})`;
      const res = await submitScoreAction(displayName, score, quizQuestions.length, activeUnitId);
      if (res.success) {
        setIsScoreSubmitted(true);
        setViewMode('leaderboard');
      } else {
        setSubmitError(res.error || '점수 저장에 실패했습니다.');
      }
    } catch (e) {
      console.error('Score submit error:', e);
      setSubmitError('네트워크 오류가 발생했습니다. 다시 시도해 주세요.');
    } finally {
      setIsSubmittingScore(false);
    }
  };

  // ── 명예의 전당 기록 삭제 (관리자 전용) ──
  const handleDeleteScore = async (scoreId: string) => {
    if (!currentUser || currentUser.student_id !== '10000') return;
    if (!confirm('이 기록을 삭제하시겠습니까?')) return;
    const res = await deleteScoreAdminAction(currentUser.student_id, scoreId);
    if (res.success) fetchLeaderboard();
    else alert(res.error || '삭제 실패');
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
              <p className="text-xs text-[#A2B5E2]">즐거운 중등 수학 탐구 공간 (1·2학기 25문항 풀세트)</p>
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
                    <span className="text-2xl font-black text-[#4B5563]">{activeUnit.questions.length}</span>
                    <span>출제 문항 수</span>
                  </div>
                  <div className="w-px bg-gray-100" />
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-2xl font-black text-[#4B5563]">{activeUnit.questions.length}</span>
                    <span>문제 풀에서 셔플</span>
                  </div>
                  <div className="w-px bg-gray-100" />
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-2xl font-black text-[#4B5563]">{activeUnit.questions.length}점</span>
                    <span>만점 기준</span>
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
                  퀴즈 시작하기! ({activeUnit.questions.length}문제)
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
                  <p className="font-bold text-[#4B5563]">도전자: <span style={{ color: activeGrade.color }}>{isGuest ? '게스트' : currentUser?.name}</span></p>
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
            <div className="bg-white rounded-[2.5rem] shadow-[0_12px_40px_rgba(199,206,234,0.3)] p-8 flex flex-col items-center gap-6 text-center">
              <div className="w-24 h-24 bg-gradient-to-br from-amber-300 to-orange-400 rounded-full flex items-center justify-center text-4xl shadow-xl animate-bounce">
                🏆
              </div>
              <div>
                <h2 className="text-3xl font-black text-[#2D3748] mb-1">
                  {isGuest ? '게스트' : currentUser?.name} 수고했어요!
                </h2>
                <p className="text-[#8E9BAE] text-sm">{activeGrade.name} · {activeUnit.name}</p>
                {isGuest && (
                  <span className="inline-block mt-1 px-3 py-0.5 bg-gray-100 text-gray-500 text-xs font-bold rounded-full">👤 게스트 모드</span>
                )}
              </div>

              {/* 점수 카드 */}
              <div className="w-full bg-gradient-to-br from-[#F8FBFE] to-[#F0F4FF] p-6 rounded-3xl flex flex-col items-center gap-3">
                <p className="text-[#8E9BAE] font-semibold">최종 점수</p>
                <div className="flex items-end gap-2">
                  <span className="text-5xl font-black" style={{ color: activeGrade.color }}>{calculateScore()}</span>
                  <span className="text-xl text-[#8E9BAE] mb-1">/ {quizQuestions.length}점</span>
                </div>
                {/* 문제별 O/X 목록 (25문항에 맞춰 flex-wrap 지원) */}
                <div className="flex flex-wrap gap-1.5 mt-2 justify-center max-w-md">
                  {quizQuestions.map((q, i) => (
                    <div
                      key={i}
                      title={`${i + 1}번: ${selectedAnswers[i] === q.answer ? '정답' : '오답'}`}
                      className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
                        selectedAnswers[i] === q.answer ? 'bg-green-100 text-green-600 border border-green-200' : 'bg-red-100 text-red-500 border border-red-200'
                      }`}
                    >
                      {i + 1}
                    </div>
                  ))}
                </div>
              </div>

              {/* 점수 제출 / 게스트 안내 */}
              <div className="flex flex-col gap-3 w-full">
                {isGuest ? (
                  <div className="w-full bg-amber-50 border border-amber-100 rounded-2xl p-4 flex flex-col gap-3">
                    <p className="text-sm text-amber-700 font-semibold">⚠️ 게스트 모드에서는 점수가 저장되지 않아요!</p>
                    <p className="text-xs text-amber-600">로그인하면 랭킹에 기록되고 명예의 전당에 올라갈 수 있어요 🏆</p>
                    <button
                      onClick={() => { resetAuthForm(); setShowAuthModal(true); }}
                      className="flex items-center justify-center gap-2 w-full py-3 text-white font-bold rounded-full transition-all hover:scale-105 shadow-md"
                      style={{ backgroundColor: activeGrade.color }}
                    >
                      <LogIn className="w-4 h-4" />
                      로그인 / 회원가입하기
                    </button>
                  </div>
                ) : !isScoreSubmitted ? (
                  <>
                    {submitError && (
                      <p className="text-red-400 text-sm bg-red-50 p-3 rounded-2xl w-full">{submitError}</p>
                    )}
                    <button
                      onClick={handleSubmitScore}
                      disabled={isSubmittingScore}
                      className="flex items-center justify-center gap-3 w-full py-4 text-white text-lg font-bold rounded-full hover:scale-105 disabled:opacity-50 transition-all shadow-xl"
                      style={{ backgroundColor: activeGrade.color, boxShadow: `0 8px 25px ${shadow}` }}
                    >
                      <Send className="w-5 h-5" />
                      {isSubmittingScore ? '저장 중...' : '점수 제출하고 랭킹 등록!'}
                    </button>
                  </>
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
                  onClick={() => doStartQuiz(isGuest)}
                  className="flex items-center justify-center gap-2 w-full py-3 text-[#8E9BAE] font-semibold rounded-full bg-[#F8FBFE] hover:bg-[#F0F4FF] transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                  다시 풀기 (25문항 셔플)
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
                  <h2 className="text-2xl font-black text-[#2D3748] flex items-center gap-2">
                    <Trophy className="w-6 h-6 text-amber-400" />
                    명예의 전당
                  </h2>
                </div>
                <button
                  onClick={() => setViewMode('home')}
                  className="px-4 py-2 bg-[#F8FBFE] hover:bg-[#F0F4FF] text-[#8E9BAE] font-semibold rounded-full text-sm transition-colors"
                >
                  ← 처음으로
                </button>
              </div>

              {isLoadingLeaderboard ? (
                <div className="py-12 flex justify-center text-[#8E9BAE] gap-2 font-medium">
                  <RefreshCw className="w-5 h-5 animate-spin" /> 불러오는 중...
                </div>
              ) : leaderboard.length === 0 ? (
                <div className="py-12 text-center text-[#8E9BAE]">
                  <Smile className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="font-semibold text-lg">아직 등록된 기록이 없어요!</p>
                  <p className="text-sm text-[#A2B5E2] mt-1">첫 번째 도전자가 되어보세요! 🚀</p>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {leaderboard.map((item, index) => {
                    const isTop3 = index < 3;
                    const medals = ['🥇', '🥈', '🥉'];
                    return (
                      <div
                        key={item.id || index}
                        className={`flex items-center justify-between p-4 rounded-2xl transition-all ${
                          isTop3 ? 'bg-gradient-to-r from-[#FFFBF0] to-[#FFF8E7] border border-amber-100 shadow-sm' : 'bg-[#F8FBFE]'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-8 text-center font-black text-lg text-[#8E9BAE]">
                            {isTop3 ? medals[index] : index + 1}
                          </span>
                          <span className="font-bold text-[#4B5563] text-base">{item.student_name}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-black text-xl text-amber-500">{item.score}점</span>
                          <span className="text-xs text-[#A2B5E2]">/ {item.total_questions || 25}점</span>
                          {currentUser?.student_id === '10000' && item.id && (
                            <button
                              onClick={() => handleDeleteScore(item.id!)}
                              className="p-1.5 text-gray-300 hover:text-red-500 transition-colors"
                              title="삭제"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <button
                onClick={startQuiz}
                className="w-full py-4 text-white text-lg font-bold rounded-full hover:scale-105 transition-all shadow-xl mt-2"
                style={{ backgroundColor: activeGrade.color, boxShadow: `0 8px 25px ${shadow}` }}
              >
                나도 도전하기! 🚀
              </button>
            </div>
          )}
        </div>
      </main>

      {/* ───── 모달: 로그인/비로그인 플레이 선택 ───── */}
      {showPlayChoiceModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-md w-full p-8 flex flex-col items-center gap-6 text-center">
            <div className="w-16 h-16 bg-[#F0F4FF] rounded-full flex items-center justify-center text-3xl">
              🎮
            </div>
            <div>
              <h3 className="text-2xl font-black text-[#2D3748] mb-2">어떻게 시작할까요?</h3>
              <p className="text-sm text-[#8E9BAE]">
                로그인하면 퀴즈 결과를 <strong>명예의 전당</strong>에 기록할 수 있어요!
              </p>
            </div>
            <div className="flex flex-col gap-3 w-full">
              <button
                onClick={() => { setShowPlayChoiceModal(false); resetAuthForm(); setShowAuthModal(true); }}
                className="flex items-center justify-center gap-2 w-full py-4 text-white text-base font-bold rounded-full shadow-lg transition-transform hover:scale-105"
                style={{ backgroundColor: activeGrade.color }}
              >
                <LogIn className="w-5 h-5" />
                학번 로그인하고 기록하기 🏆
              </button>
              <button
                onClick={() => doStartQuiz(true)}
                className="w-full py-3.5 bg-[#F8FBFE] hover:bg-[#F0F4FF] text-[#4B5563] text-base font-bold rounded-full transition-colors border border-gray-100"
              >
                게스트로 그냥 풀기 👤
              </button>
            </div>
            <button
              onClick={() => setShowPlayChoiceModal(false)}
              className="text-xs text-[#A2B5E2] hover:text-[#4B5563] underline"
            >
              닫기
            </button>
          </div>
        </div>
      )}

      {/* ───── 모달: 학번 로그인 / 회원가입 ───── */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-md w-full p-8 flex flex-col gap-6">
            {/* 탭 */}
            <div className="flex bg-[#F0F4FF] p-1 rounded-full">
              <button
                onClick={() => { setAuthMode('login'); setAuthError(''); }}
                className={`flex-1 py-2 rounded-full font-bold text-sm transition-all ${
                  authMode === 'login' ? 'bg-white text-[#4B5563] shadow-md' : 'text-[#8E9BAE]'
                }`}
              >
                로그인
              </button>
              <button
                onClick={() => { setAuthMode('register'); setAuthError(''); }}
                className={`flex-1 py-2 rounded-full font-bold text-sm transition-all ${
                  authMode === 'register' ? 'bg-white text-[#4B5563] shadow-md' : 'text-[#8E9BAE]'
                }`}
              >
                학생 회원가입
              </button>
            </div>

            <h3 className="text-xl font-black text-[#2D3748] text-center">
              {authMode === 'login' ? '🔑 학번으로 로그인' : '✏️ 학생 계정 등록'}
            </h3>

            {authError && (
              <div className="bg-red-50 text-red-500 text-sm p-3 rounded-2xl text-center">
                {authError}
              </div>
            )}

            <form onSubmit={authMode === 'login' ? handleLogin : handleRegister} className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-bold text-[#8E9BAE] ml-2 block mb-1">학번 (예: 10101)</label>
                <input
                  type="text"
                  required
                  placeholder="학번 입력"
                  value={inputStudentId}
                  onChange={(e) => setInputStudentId(e.target.value)}
                  className="w-full px-4 py-3 bg-[#F8FBFE] border border-gray-100 rounded-2xl focus:outline-none focus:border-[#A2B5E2] font-medium"
                />
              </div>

              {authMode === 'register' && (
                <div>
                  <label className="text-xs font-bold text-[#8E9BAE] ml-2 block mb-1">이름</label>
                  <input
                    type="text"
                    required
                    placeholder="이름 입력"
                    value={inputName}
                    onChange={(e) => setInputName(e.target.value)}
                    className="w-full px-4 py-3 bg-[#F8FBFE] border border-gray-100 rounded-2xl focus:outline-none focus:border-[#A2B5E2] font-medium"
                  />
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-[#8E9BAE] ml-2 block mb-1">비밀번호</label>
                <input
                  type="password"
                  required
                  placeholder="비밀번호 입력"
                  value={inputPassword}
                  onChange={(e) => setInputPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-[#F8FBFE] border border-gray-100 rounded-2xl focus:outline-none focus:border-[#A2B5E2] font-medium"
                />
              </div>

              <button
                type="submit"
                disabled={authLoading}
                className="w-full py-4 text-white text-base font-bold rounded-full shadow-lg transition-transform hover:scale-105 disabled:opacity-50 mt-2"
                style={{ backgroundColor: activeGrade.color }}
              >
                {authLoading ? '처리 중...' : authMode === 'login' ? '로그인하기 🚀' : '회원가입 완료 ✨'}
              </button>
            </form>

            <button
              onClick={() => setShowAuthModal(false)}
              className="text-xs text-[#A2B5E2] hover:text-[#4B5563] text-center underline"
            >
              취소 및 닫기
            </button>
          </div>
        </div>
      )}

      {/* ───── 모달: 관리자 학생 관리 ───── */}
      {showAdminModal && currentUser?.student_id === '10000' && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-2xl w-full p-8 flex flex-col gap-6 max-h-[85vh] overflow-hidden">
            <div className="flex items-center justify-between border-b pb-4">
              <h3 className="text-2xl font-black text-[#2D3748] flex items-center gap-2">
                <ShieldCheck className="w-6 h-6 text-[#FF85A1]" />
                학생 계정 관리 (관리자)
              </h3>
              <button onClick={() => setShowAdminModal(false)} className="p-2 hover:bg-gray-100 rounded-full">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="flex items-center gap-2 bg-[#F8FBFE] border border-gray-100 rounded-full px-4 py-2">
              <Search className="w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="학번 또는 이름으로 검색..."
                value={adminSearch}
                onChange={(e) => setAdminSearch(e.target.value)}
                className="bg-transparent border-none outline-none text-sm w-full font-medium"
              />
            </div>

            <div className="flex-grow overflow-y-auto pr-1 flex flex-col gap-2">
              {loadingAdminList ? (
                <p className="text-center py-8 text-gray-400">목록 불러오는 중...</p>
              ) : filteredAdminStudents.length === 0 ? (
                <p className="text-center py-8 text-gray-400">등록된 학생이 없거나 검색 결과가 없습니다.</p>
              ) : (
                filteredAdminStudents.map((st) => (
                  <div key={st.student_id} className="flex items-center justify-between bg-[#F8FBFE] p-4 rounded-2xl border border-gray-100">
                    {editingStudentId === st.student_id ? (
                      <div className="flex items-center gap-2 flex-grow mr-2">
                        <span className="font-bold text-xs text-gray-400 w-16">{st.student_id}</span>
                        <input
                          type="text"
                          value={editNameInput}
                          onChange={(e) => setEditNameInput(e.target.value)}
                          className="px-2 py-1 border rounded-lg text-sm w-24"
                          placeholder="이름"
                        />
                        <input
                          type="password"
                          value={editPasswordInput}
                          onChange={(e) => setEditPasswordInput(e.target.value)}
                          className="px-2 py-1 border rounded-lg text-sm w-28"
                          placeholder="새 비밀번호"
                        />
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-sm text-[#FF85A1] w-16">{st.student_id}</span>
                        <span className="font-bold text-sm text-gray-700">{st.name}</span>
                        <span className="text-xs text-gray-400">
                          ({st.created_at ? new Date(st.created_at).toLocaleDateString() : ''})
                        </span>
                      </div>
                    )}

                    <div className="flex items-center gap-1">
                      {editingStudentId === st.student_id ? (
                        <>
                          <button
                            onClick={() => handleSaveEdit(st.student_id)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-xl"
                            title="저장"
                          >
                            <Save className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setEditingStudentId(null)}
                            className="p-2 text-gray-400 hover:bg-gray-100 rounded-xl"
                            title="취소"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => handleStartEdit(st)}
                            className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-xl"
                            title="수정"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          {st.student_id !== '10000' && (
                            <button
                              onClick={() => handleDeleteStudent(st.student_id, st.name)}
                              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl"
                              title="삭제"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ───── 푸터 ───── */}
      <footer className="p-6 text-center text-xs text-[#A2B5E2] bg-white/40 backdrop-blur-md border-t border-white/60">
        <p>📐 중등 수학교실 · 1학년 2학년 3학년 (1학기 & 2학기 25문항 풀세트 지원)</p>
      </footer>
    </div>
  );
}
