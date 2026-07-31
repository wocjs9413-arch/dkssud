'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  getScoresAction,
  submitScoreAction,
  loginStudentAction,
  registerStudentAction,
  ScoreRecord,
  StudentUser,
} from '@/app/actions';
import {
  Trophy,
  Sparkles,
  CheckCircle2,
  RefreshCw,
  User,
  Play,
  Send,
  Medal,
  Star,
  Lock,
  LogOut,
  LogIn,
  BookOpen,
  Calculator,
  Smile,
  GraduationCap,
} from 'lucide-react';

interface Question {
  id: number;
  question: string;
  options: string[];
  answer: number;
}

// 중1 수학 퀴즈 문제
const MID1_QUIZ_QUESTIONS: Question[] = [
  {
    id: 1,
    question: "(-3) + (+7) 의 값은 얼마일까요? 🧮",
    options: ["-4", "+4", "-10", "+10"],
    answer: 1,
  },
  {
    id: 2,
    question: "다음 보기 중 가장 작은 소수(Prime Number)는 무엇일까요? 🔢",
    options: ["1", "2", "3", "5"],
    answer: 1,
  },
  {
    id: 3,
    question: "문자식 표현: '한 자루에 x원 하는 연필 3자루의 가격'은? ✏️",
    options: ["x + 3", "3x", "x / 3", "x - 3"],
    answer: 1,
  },
  {
    id: 4,
    question: "일차방정식 2x + 4 = 10 의 해(x의 값)는? 📐",
    options: ["x = 2", "x = 3", "x = 4", "x = 5"],
    answer: 1,
  },
  {
    id: 5,
    question: "좌표평면 위 점 P(3, -5)는 제 몇 사분면에 있을까요? 🧭",
    options: ["제1사분면", "제2사분면", "제3사분면", "제4사분면"],
    answer: 3,
  },
];

// 중2 수학 퀴즈 문제
const MID2_QUIZ_QUESTIONS: Question[] = [
  {
    id: 1,
    question: "분수 3/8 을 소수로 나타내면 어떤 소수가 될까요? 🔢",
    options: ["유한소수 (0.375)", "무한순환소수", "무리수", "정수"],
    answer: 0,
  },
  {
    id: 2,
    question: "부등식 3x - 2 > 7 의 해는 무엇일까요? ⚖️",
    options: ["x > 3", "x < 3", "x > 5", "x < 5"],
    answer: 0,
  },
  {
    id: 3,
    question: "일차함수 y = 2x + 5 의 y절편은 얼마일까요? 📈",
    options: ["2", "5", "-5", "-2"],
    answer: 1,
  },
];

// 중3 수학 퀴즈 문제
const MID3_QUIZ_QUESTIONS: Question[] = [
  {
    id: 1,
    question: "√16 의 값은 얼마일까요? 📐",
    options: ["2", "4", "8", "16"],
    answer: 1,
  },
  {
    id: 2,
    question: "이차방정식 x² - 5x + 6 = 0 의 두 근은? 🧮",
    options: ["x = 1 또는 6", "x = 2 또는 3", "x = -2 또는 -3", "x = 0 또는 5"],
    answer: 1,
  },
];

type NavTab = 'mid1' | 'mid2' | 'mid3' | 'leaderboard';

export default function Home() {
  const [activeTab, setActiveTab] = useState<NavTab>('mid1');
  const [currentUser, setCurrentUser] = useState<StudentUser | null>(null);

  // Auth Modal State
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [inputStudentId, setInputStudentId] = useState('');
  const [inputName, setInputName] = useState('');
  const [inputPassword, setInputPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Quiz State
  const [quizStage, setQuizStage] = useState<'start' | 'quiz' | 'result'>('start');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [isSubmittingScore, setIsSubmittingScore] = useState(false);
  const [isScoreSubmitted, setIsScoreSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Leaderboard State
  const [leaderboard, setLeaderboard] = useState<ScoreRecord[]>([]);
  const [isLoadingLeaderboard, setIsLoadingLeaderboard] = useState(false);

  // 저장된 학생 정보 로드
  useEffect(() => {
    const saved = localStorage.getItem('math_student_user');
    if (saved) {
      try {
        setCurrentUser(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  // 리더보드 데이터 로드
  const fetchLeaderboard = useCallback(async () => {
    setIsLoadingLeaderboard(true);
    const res = await getScoresAction();
    if (res.success && res.data) {
      setLeaderboard(res.data);
    }
    setIsLoadingLeaderboard(false);
  }, []);

  useEffect(() => {
    if (activeTab === 'leaderboard') {
      fetchLeaderboard();
    }
  }, [activeTab, fetchLeaderboard]);

  // 학번 로그인 처리
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

  // 학생 회원가입 처리
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
    setInputStudentId('');
    setInputName('');
    setInputPassword('');
    setAuthError('');
  };

  // 퀴즈 진행 제어
  const getCurrentQuestions = () => {
    if (activeTab === 'mid2') return MID2_QUIZ_QUESTIONS;
    if (activeTab === 'mid3') return MID3_QUIZ_QUESTIONS;
    return MID1_QUIZ_QUESTIONS;
  };

  const startQuiz = () => {
    if (!currentUser) {
      setShowAuthModal(true);
      return;
    }
    setCurrentQuestionIndex(0);
    setSelectedAnswers([]);
    setIsScoreSubmitted(false);
    setSubmitError('');
    setQuizStage('quiz');
  };

  const handleSelectOption = (idx: number) => {
    const newAnswers = [...selectedAnswers];
    newAnswers[currentQuestionIndex] = idx;
    setSelectedAnswers(newAnswers);
  };

  const questions = getCurrentQuestions();

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    } else {
      setQuizStage('result');
    }
  };

  const calculateScore = () => {
    return selectedAnswers.reduce((score, answer, index) => {
      return answer === questions[index].answer ? score + 1 : score;
    }, 0);
  };

  const handleSubmitScore = async () => {
    if (!currentUser || isScoreSubmitted) return;
    setIsSubmittingScore(true);
    setSubmitError('');

    const score = calculateScore();
    const displayName = `${currentUser.name} (${currentUser.student_id})`;

    const res = await submitScoreAction(displayName, score, questions.length);
    if (res.success) {
      setIsScoreSubmitted(true);
      setActiveTab('leaderboard');
    } else {
      setSubmitError(res.error || '점수 저장에 실패했습니다.');
    }
    setIsSubmittingScore(false);
  };

  return (
    <div className="flex flex-col min-h-screen font-jua bg-[#F8FBFE] text-[#4B5563]">
      {/* 상단 헤더 & 서비스 로고 */}
      <header className="flex flex-col sm:flex-row items-center justify-between p-6 bg-white/70 backdrop-blur-md shadow-[0_8px_30px_rgba(181,234,215,0.3)] rounded-b-[2.5rem] gap-4">
        {/* 서비스 이름: 수학교실 */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('mid1')}>
          <div className="w-12 h-12 bg-[#FFD1DC]/50 rounded-2xl flex items-center justify-center shadow-[0_4px_15px_rgba(255,209,220,0.6)]">
            <Calculator className="w-7 h-7 text-[#FF85A1]" />
          </div>
          <div>
            <h1 className="text-3xl text-[#FFB6C1] font-bold tracking-wider drop-shadow-sm flex items-center gap-2">
              수학교실 📐
            </h1>
            <p className="text-xs text-[#A2B5E2]">즐거운 중등 수학 탐구 공간</p>
          </div>
        </div>

        {/* 네비게이션 바: 중1, 중2, 중3, 명예의 전당 */}
        <nav className="flex items-center gap-2 bg-[#F0F8FF] p-2 rounded-full shadow-inner">
          <button
            onClick={() => { setActiveTab('mid1'); setQuizStage('start'); }}
            className={`px-5 py-2.5 rounded-full text-lg transition-all duration-200 ${
              activeTab === 'mid1'
                ? 'bg-[#FFD1DC] text-white font-bold shadow-[0_4px_15px_rgba(255,209,220,0.7)] scale-105'
                : 'text-[#8E9BAE] hover:text-[#4B5563]'
            }`}
          >
            중1
          </button>
          <button
            onClick={() => { setActiveTab('mid2'); setQuizStage('start'); }}
            className={`px-5 py-2.5 rounded-full text-lg transition-all duration-200 ${
              activeTab === 'mid2'
                ? 'bg-[#B5EAD7] text-white font-bold shadow-[0_4px_15px_rgba(181,234,215,0.7)] scale-105'
                : 'text-[#8E9BAE] hover:text-[#4B5563]'
            }`}
          >
            중2
          </button>
          <button
            onClick={() => { setActiveTab('mid3'); setQuizStage('start'); }}
            className={`px-5 py-2.5 rounded-full text-lg transition-all duration-200 ${
              activeTab === 'mid3'
                ? 'bg-[#C7CEEA] text-white font-bold shadow-[0_4px_15px_rgba(199,206,234,0.7)] scale-105'
                : 'text-[#8E9BAE] hover:text-[#4B5563]'
            }`}
          >
            중3
          </button>
          <button
            onClick={() => setActiveTab('leaderboard')}
            className={`flex items-center gap-1.5 px-5 py-2.5 rounded-full text-lg transition-all duration-200 ${
              activeTab === 'leaderboard'
                ? 'bg-[#FFF5BA] text-[#8E9BAE] font-bold shadow-[0_4px_15px_rgba(255,245,186,0.8)] scale-105'
                : 'text-[#8E9BAE] hover:text-[#4B5563]'
            }`}
          >
            <Trophy className="w-5 h-5 text-yellow-500" />
            <span>명예의 전당</span>
          </button>
        </nav>

        {/* 학생 로그인 / 회원 정보 영역 */}
        <div>
          {currentUser ? (
            <div className="flex items-center gap-3 bg-[#FFF5BA]/60 px-5 py-2.5 rounded-full shadow-sm">
              <GraduationCap className="w-6 h-6 text-[#A2B5E2]" />
              <div className="text-sm">
                <span className="font-bold text-[#4B5563]">{currentUser.name}</span>
                <span className="text-xs text-[#8E9BAE] ml-1">({currentUser.student_id})</span>
              </div>
              <button
                onClick={handleLogout}
                title="로그아웃"
                className="p-1.5 hover:bg-white/50 rounded-full transition-colors text-gray-400 hover:text-red-400 ml-1"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => { resetAuthForm(); setShowAuthModal(true); }}
              className="flex items-center gap-2 px-6 py-2.5 bg-[#B5EAD7] text-white text-lg rounded-full hover:scale-105 transition-transform duration-200 shadow-[0_4px_15px_rgba(181,234,215,0.6)]"
            >
              <LogIn className="w-5 h-5" />
              <span>학번 로그인</span>
            </button>
          )}
        </div>
      </header>

      {/* 메인 화면 영역 */}
      <main className="flex-grow flex flex-col items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-xl bg-white p-8 sm:p-12 rounded-[3.5rem] shadow-[0_12px_40px_rgba(199,206,234,0.4)] border-none">
          
          {/* 중1 수학교실 */}
          {activeTab === 'mid1' && (
            <div>
              {quizStage === 'start' && (
                <div className="flex flex-col items-center gap-6 text-center">
                  <div className="w-20 h-20 bg-[#FFD1DC]/40 rounded-full flex items-center justify-center text-4xl shadow-[0_6px_20px_rgba(255,209,220,0.5)]">
                    📐
                  </div>
                  <h2 className="text-3xl sm:text-4xl text-[#A2B5E2] font-bold drop-shadow-sm">
                    중1 수학교실
                  </h2>
                  <p className="text-xl text-[#8E9BAE]">
                    정수와 유리수, 일차방정식 개념 문제 풀기 챌린지!
                  </p>

                  {!currentUser && (
                    <div className="bg-[#FFF5BA]/50 p-4 rounded-2xl text-sm text-[#8E9BAE] w-full">
                      💡 <strong>안내:</strong> 점수를 저장하려면 먼저 상단 <strong>[학번 로그인]</strong>을 해주세요!
                    </div>
                  )}

                  <button
                    onClick={startQuiz}
                    className="group flex items-center justify-center gap-3 w-full py-4 mt-2 bg-[#FFD1DC] text-white text-2xl rounded-full hover:scale-105 transition-transform duration-200 shadow-[0_8px_25px_rgba(255,209,220,0.7)]"
                  >
                    <span>중1 수학 퀴즈 풀기!</span>
                    <Play className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              )}

              {quizStage === 'quiz' && (
                <div className="flex flex-col gap-6">
                  <div className="flex items-center justify-between text-lg text-[#8E9BAE]">
                    <span>도전 학생: <strong className="text-[#A2B5E2]">{currentUser?.name}</strong></span>
                    <span>문제 {currentQuestionIndex + 1} / {questions.length}</span>
                  </div>

                  <div className="w-full h-3 bg-[#F0F8FF] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#FFD1DC] transition-all duration-300 rounded-full"
                      style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
                    />
                  </div>

                  <div className="bg-[#FFF5BA]/30 p-6 rounded-3xl text-center my-2">
                    <h3 className="text-2xl sm:text-3xl text-[#4B5563] font-bold leading-relaxed">
                      {questions[currentQuestionIndex].question}
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    {questions[currentQuestionIndex].options.map((option, idx) => {
                      const isSelected = selectedAnswers[currentQuestionIndex] === idx;
                      return (
                        <button
                          key={idx}
                          onClick={() => handleSelectOption(idx)}
                          className={`w-full py-4 px-6 text-xl text-left rounded-full transition-all duration-200 flex items-center justify-between shadow-[0_4px_15px_rgba(0,0,0,0.03)] ${
                            isSelected
                              ? 'bg-[#FFD1DC] text-white scale-[1.02] shadow-[0_6px_20px_rgba(255,209,220,0.6)] font-bold'
                              : 'bg-[#F8FBFE] text-[#4B5563] hover:bg-[#FFD1DC]/30'
                          }`}
                        >
                          <span>{idx + 1}. {option}</span>
                          {isSelected && <CheckCircle2 className="w-6 h-6 text-white" />}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={handleNextQuestion}
                    disabled={selectedAnswers[currentQuestionIndex] === undefined}
                    className="w-full mt-4 py-4 bg-[#B5EAD7] text-white text-2xl rounded-full hover:scale-105 disabled:opacity-40 disabled:hover:scale-100 transition-transform duration-200 shadow-[0_8px_20px_rgba(181,234,215,0.6)]"
                  >
                    {currentQuestionIndex < questions.length - 1 ? '다음 문제 ➡️' : '결과 보기 🎉'}
                  </button>
                </div>
              )}

              {quizStage === 'result' && (
                <div className="flex flex-col items-center gap-6 text-center">
                  <div className="w-24 h-24 bg-[#FFF5BA] rounded-full flex items-center justify-center text-5xl shadow-[0_8px_25px_rgba(255,245,186,0.8)] animate-bounce">
                    🏆
                  </div>

                  <h2 className="text-3xl text-[#A2B5E2] font-bold">
                    {currentUser?.name} 학생 수고했어요!
                  </h2>

                  <div className="bg-[#F8FBFE] w-full p-6 rounded-3xl flex flex-col items-center justify-center gap-2 shadow-inner">
                    <span className="text-lg text-[#8E9BAE]">중1 수학 최종 점수</span>
                    <span className="text-5xl font-bold text-[#FFB6C1]">
                      {calculateScore()}점 / {questions.length}점
                    </span>
                  </div>

                  {submitError && (
                    <p className="text-red-400 text-sm bg-red-50 p-3 rounded-2xl w-full">
                      {submitError}
                    </p>
                  )}

                  {!isScoreSubmitted ? (
                    <button
                      onClick={handleSubmitScore}
                      disabled={isSubmittingScore}
                      className="flex items-center justify-center gap-3 w-full py-4 bg-[#FFD1DC] text-white text-2xl rounded-full hover:scale-105 disabled:opacity-50 transition-transform duration-200 shadow-[0_8px_25px_rgba(255,209,220,0.7)]"
                    >
                      <Send className="w-6 h-6" />
                      <span>{isSubmittingScore ? '저장 중...' : '점수 제출하고 랭킹 등록하기!'}</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => setActiveTab('leaderboard')}
                      className="w-full py-4 bg-[#B5EAD7] text-white text-2xl rounded-full hover:scale-105 transition-transform duration-200 shadow-[0_8px_20px_rgba(181,234,215,0.6)]"
                    >
                      명예의 전당 이동 🏆
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 중2 수학교실 */}
          {activeTab === 'mid2' && (
            <div>
              {quizStage === 'start' && (
                <div className="flex flex-col items-center gap-6 text-center">
                  <div className="w-20 h-20 bg-[#B5EAD7]/40 rounded-full flex items-center justify-center text-4xl shadow-[0_6px_20px_rgba(181,234,215,0.5)]">
                    📊
                  </div>
                  <h2 className="text-3xl sm:text-4xl text-[#A2B5E2] font-bold drop-shadow-sm">
                    중2 수학교실
                  </h2>
                  <p className="text-xl text-[#8E9BAE]">
                    유리수와 순환소수, 일차부등식 챌린지!
                  </p>

                  <button
                    onClick={startQuiz}
                    className="group flex items-center justify-center gap-3 w-full py-4 mt-2 bg-[#B5EAD7] text-white text-2xl rounded-full hover:scale-105 transition-transform duration-200 shadow-[0_8px_25px_rgba(181,234,215,0.7)]"
                  >
                    <span>중2 수학 퀴즈 시작!</span>
                    <Play className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              )}

              {quizStage === 'quiz' && (
                <div className="flex flex-col gap-6">
                  <div className="flex items-center justify-between text-lg text-[#8E9BAE]">
                    <span>학생: <strong className="text-[#A2B5E2]">{currentUser?.name}</strong></span>
                    <span>문제 {currentQuestionIndex + 1} / {questions.length}</span>
                  </div>

                  <div className="bg-[#FFF5BA]/30 p-6 rounded-3xl text-center my-2">
                    <h3 className="text-2xl sm:text-3xl text-[#4B5563] font-bold leading-relaxed">
                      {questions[currentQuestionIndex].question}
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    {questions[currentQuestionIndex].options.map((option, idx) => {
                      const isSelected = selectedAnswers[currentQuestionIndex] === idx;
                      return (
                        <button
                          key={idx}
                          onClick={() => handleSelectOption(idx)}
                          className={`w-full py-4 px-6 text-xl text-left rounded-full transition-all duration-200 flex items-center justify-between shadow-[0_4px_15px_rgba(0,0,0,0.03)] ${
                            isSelected
                              ? 'bg-[#B5EAD7] text-white scale-[1.02] font-bold'
                              : 'bg-[#F8FBFE] text-[#4B5563] hover:bg-[#B5EAD7]/30'
                          }`}
                        >
                          <span>{idx + 1}. {option}</span>
                          {isSelected && <CheckCircle2 className="w-6 h-6 text-white" />}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={handleNextQuestion}
                    disabled={selectedAnswers[currentQuestionIndex] === undefined}
                    className="w-full mt-4 py-4 bg-[#B5EAD7] text-white text-2xl rounded-full hover:scale-105 disabled:opacity-40 transition-transform duration-200"
                  >
                    {currentQuestionIndex < questions.length - 1 ? '다음 문제 ➡️' : '결과 보기 🎉'}
                  </button>
                </div>
              )}

              {quizStage === 'result' && (
                <div className="flex flex-col items-center gap-6 text-center">
                  <div className="w-24 h-24 bg-[#FFF5BA] rounded-full flex items-center justify-center text-5xl shadow-bounce">
                    🏆
                  </div>
                  <h2 className="text-3xl text-[#A2B5E2] font-bold">{currentUser?.name} 학생 축하합니다!</h2>
                  <div className="bg-[#F8FBFE] w-full p-6 rounded-3xl flex flex-col items-center">
                    <span className="text-5xl font-bold text-[#B5EAD7]">{calculateScore()}점 / {questions.length}점</span>
                  </div>
                  <button
                    onClick={handleSubmitScore}
                    disabled={isSubmittingScore || isScoreSubmitted}
                    className="w-full py-4 bg-[#B5EAD7] text-white text-2xl rounded-full hover:scale-105 shadow-md"
                  >
                    {isScoreSubmitted ? '제출 완료!' : '점수 제출하기'}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* 중3 수학교실 */}
          {activeTab === 'mid3' && (
            <div>
              {quizStage === 'start' && (
                <div className="flex flex-col items-center gap-6 text-center">
                  <div className="w-20 h-20 bg-[#C7CEEA]/40 rounded-full flex items-center justify-center text-4xl shadow-[0_6px_20px_rgba(199,206,234,0.5)]">
                    📈
                  </div>
                  <h2 className="text-3xl sm:text-4xl text-[#A2B5E2] font-bold drop-shadow-sm">
                    중3 수학교실
                  </h2>
                  <p className="text-xl text-[#8E9BAE]">
                    제곱근과 실수, 이차방정식 도전 문제!
                  </p>

                  <button
                    onClick={startQuiz}
                    className="group flex items-center justify-center gap-3 w-full py-4 mt-2 bg-[#C7CEEA] text-white text-2xl rounded-full hover:scale-105 transition-transform duration-200 shadow-[0_8px_25px_rgba(199,206,234,0.7)]"
                  >
                    <span>중3 수학 퀴즈 시작!</span>
                    <Play className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              )}

              {quizStage === 'quiz' && (
                <div className="flex flex-col gap-6">
                  <div className="flex items-center justify-between text-lg text-[#8E9BAE]">
                    <span>학생: <strong className="text-[#A2B5E2]">{currentUser?.name}</strong></span>
                    <span>문제 {currentQuestionIndex + 1} / {questions.length}</span>
                  </div>

                  <div className="bg-[#FFF5BA]/30 p-6 rounded-3xl text-center my-2">
                    <h3 className="text-2xl sm:text-3xl text-[#4B5563] font-bold leading-relaxed">
                      {questions[currentQuestionIndex].question}
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    {questions[currentQuestionIndex].options.map((option, idx) => {
                      const isSelected = selectedAnswers[currentQuestionIndex] === idx;
                      return (
                        <button
                          key={idx}
                          onClick={() => handleSelectOption(idx)}
                          className={`w-full py-4 px-6 text-xl text-left rounded-full transition-all duration-200 flex items-center justify-between ${
                            isSelected
                              ? 'bg-[#C7CEEA] text-white scale-[1.02] font-bold'
                              : 'bg-[#F8FBFE] text-[#4B5563] hover:bg-[#C7CEEA]/30'
                          }`}
                        >
                          <span>{idx + 1}. {option}</span>
                          {isSelected && <CheckCircle2 className="w-6 h-6 text-white" />}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={handleNextQuestion}
                    disabled={selectedAnswers[currentQuestionIndex] === undefined}
                    className="w-full mt-4 py-4 bg-[#C7CEEA] text-white text-2xl rounded-full hover:scale-105 disabled:opacity-40 transition-transform duration-200"
                  >
                    {currentQuestionIndex < questions.length - 1 ? '다음 문제 ➡️' : '결과 보기 🎉'}
                  </button>
                </div>
              )}

              {quizStage === 'result' && (
                <div className="flex flex-col items-center gap-6 text-center">
                  <h2 className="text-3xl text-[#A2B5E2] font-bold">{currentUser?.name} 학생 수고했습니다!</h2>
                  <div className="bg-[#F8FBFE] w-full p-6 rounded-3xl flex flex-col items-center">
                    <span className="text-5xl font-bold text-[#C7CEEA]">{calculateScore()}점 / {questions.length}점</span>
                  </div>
                  <button
                    onClick={handleSubmitScore}
                    disabled={isSubmittingScore || isScoreSubmitted}
                    className="w-full py-4 bg-[#C7CEEA] text-white text-2xl rounded-full hover:scale-105 shadow-md"
                  >
                    {isScoreSubmitted ? '제출 완료!' : '점수 제출하기'}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* 명예의 전당 */}
          {activeTab === 'leaderboard' && (
            <div className="flex flex-col gap-6">
              <div className="flex items-center justify-between border-b pb-4 border-[#F0F8FF]">
                <div className="flex items-center gap-3">
                  <Trophy className="w-8 h-8 text-[#FFD1DC]" />
                  <h2 className="text-3xl text-[#A2B5E2] font-bold">수학교실 명예의 전당</h2>
                </div>
                <button
                  onClick={fetchLeaderboard}
                  title="새로고침"
                  className="p-3 bg-[#F0F8FF] rounded-full hover:rotate-180 transition-transform duration-500 text-[#A2B5E2]"
                >
                  <RefreshCw className="w-5 h-5" />
                </button>
              </div>

              {isLoadingLeaderboard ? (
                <div className="py-12 text-center text-[#8E9BAE]">
                  랭킹 정보를 불러오는 중입니다... ✨
                </div>
              ) : leaderboard.length === 0 ? (
                <div className="py-12 text-center text-[#8E9BAE] flex flex-col items-center gap-3">
                  <Star className="w-10 h-10 text-[#FFF5BA]" />
                  <p className="text-xl">첫 번째 퀴즈왕에 도전해 보세요!</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3 max-h-[350px] overflow-y-auto pr-1">
                  {leaderboard.map((item, index) => {
                    let rankBadge = null;
                    if (index === 0) rankBadge = <Medal className="w-7 h-7 text-yellow-400" />;
                    else if (index === 1) rankBadge = <Medal className="w-7 h-7 text-gray-300" />;
                    else if (index === 2) rankBadge = <Medal className="w-7 h-7 text-amber-600" />;

                    return (
                      <div
                        key={item.id || index}
                        className={`flex items-center justify-between p-4 rounded-3xl transition-all ${
                          index === 0
                            ? 'bg-[#FFF5BA]/50 shadow-[0_4px_15px_rgba(255,245,186,0.6)] font-bold text-xl'
                            : 'bg-[#F8FBFE] text-lg'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-8 text-center text-[#A2B5E2] font-bold">
                            {rankBadge || `#${index + 1}`}
                          </span>
                          <span className="text-[#4B5563]">{item.student_name}</span>
                        </div>
                        <div className="flex items-center gap-1 text-[#FFB6C1] font-bold">
                          <span>{item.score}점</span>
                          <span className="text-xs text-[#8E9BAE]">/ {item.total_questions}점</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <button
                onClick={() => { setActiveTab('mid1'); setQuizStage('start'); }}
                className="w-full mt-4 py-4 bg-[#FFD1DC] text-white text-2xl rounded-full hover:scale-105 transition-transform duration-200 shadow-[0_8px_25px_rgba(255,209,220,0.7)]"
              >
                중1 수학 퀴즈 도전하기 🚀
              </button>
            </div>
          )}

        </div>
      </main>

      {/* 학번 로그인 / 회원가입 모달 */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white w-full max-w-md p-8 rounded-[3rem] shadow-2xl flex flex-col gap-6 relative animate-in fade-in zoom-in duration-200">
            <button
              onClick={() => setShowAuthModal(false)}
              className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 text-2xl"
            >
              ✕
            </button>

            <div className="text-center">
              <div className="w-16 h-16 bg-[#B5EAD7]/40 rounded-full flex items-center justify-center mx-auto mb-3">
                <Smile className="w-8 h-8 text-[#A2B5E2]" />
              </div>
              <h3 className="text-2xl font-bold text-[#4B5563]">
                {authMode === 'login' ? '학생 학번 로그인' : '학생 회원가입'}
              </h3>
              <p className="text-sm text-[#8E9BAE] mt-1">
                {authMode === 'login'
                  ? '학번과 비밀번호를 입력해 주세요.'
                  : '학번, 이름, 비밀번호를 등록해 주세요.'}
              </p>
            </div>

            <form
              onSubmit={authMode === 'login' ? handleLogin : handleRegister}
              className="flex flex-col gap-4"
            >
              {/* 학번 입력 */}
              <div className="relative">
                <GraduationCap className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#A2B5E2]" />
                <input
                  type="text"
                  required
                  placeholder="학번 (예: 10101)"
                  value={inputStudentId}
                  onChange={(e) => setInputStudentId(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-[#F8FBFE] text-lg rounded-full outline-none focus:ring-2 focus:ring-[#B5EAD7]"
                />
              </div>

              {/* 이름 입력 (회원가입 시) */}
              {authMode === 'register' && (
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#A2B5E2]" />
                  <input
                    type="text"
                    required
                    placeholder="이름 (예: 홍길동)"
                    value={inputName}
                    onChange={(e) => setInputName(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 bg-[#F8FBFE] text-lg rounded-full outline-none focus:ring-2 focus:ring-[#B5EAD7]"
                  />
                </div>
              )}

              {/* 비밀번호 입력 */}
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#A2B5E2]" />
                <input
                  type="password"
                  required
                  placeholder="비밀번호"
                  value={inputPassword}
                  onChange={(e) => setInputPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-[#F8FBFE] text-lg rounded-full outline-none focus:ring-2 focus:ring-[#B5EAD7]"
                />
              </div>

              {authError && (
                <p className="text-red-400 text-sm text-center bg-red-50 p-2.5 rounded-xl">
                  {authError}
                </p>
              )}

              <button
                type="submit"
                disabled={authLoading}
                className="w-full py-4 bg-[#B5EAD7] text-white text-xl rounded-full hover:scale-105 transition-transform duration-200 shadow-md font-bold mt-2"
              >
                {authLoading
                  ? '처리 중...'
                  : authMode === 'login'
                  ? '로그인하기'
                  : '회원가입 완료하기'}
              </button>
            </form>

            <div className="text-center text-sm text-[#8E9BAE] pt-2 border-t border-gray-100">
              {authMode === 'login' ? (
                <p>
                  처음 방문하셨나요?{' '}
                  <button
                    onClick={() => { resetAuthForm(); setAuthMode('register'); }}
                    className="text-[#A2B5E2] font-bold underline ml-1"
                  >
                    회원가입 하기
                  </button>
                </p>
              ) : (
                <p>
                  이미 계정이 있으신가요?{' '}
                  <button
                    onClick={() => { resetAuthForm(); setAuthMode('login'); }}
                    className="text-[#A2B5E2] font-bold underline ml-1"
                  >
                    로그인 하기
                  </button>
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 하단 푸터 */}
      <footer className="p-6 text-center text-[#AFAFAF] bg-[#FFF5BA]/40 rounded-t-[2.5rem] text-lg">
        <p>&copy; {new Date().getFullYear()} 솜사탕 수학교실. 즐겁게 배우는 생각의 힘!</p>
      </footer>
    </div>
  );
}
