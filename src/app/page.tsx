'use client';

import { useState, useEffect, useCallback } from 'react';
import { getScoresAction, submitScoreAction, ScoreRecord } from '@/app/actions';
import { Trophy, Sparkles, CheckCircle2, RefreshCw, User, Play, Send, Medal, Star } from 'lucide-react';

interface Question {
  id: number;
  question: string;
  options: string[];
  answer: number;
}

const QUIZ_QUESTIONS: Question[] = [
  {
    id: 1,
    question: "3 + 5 는 얼마일까요? 🧮",
    options: ["6", "7", "8", "9"],
    answer: 2,
  },
  {
    id: 2,
    question: "지구에서 가장 넓은 바다는 어디일까요? 🌊",
    options: ["대서양", "태평양", "인도양", "북극해"],
    answer: 1,
  },
  {
    id: 3,
    question: "다음 중 사계절(봄·여름·가을·겨울)에 포함되지 않는 것은? 🌸",
    options: ["봄", "여름", "장마", "겨울"],
    answer: 2,
  },
  {
    id: 4,
    question: "식물이 햇빛을 받아 영양분을 만드는 작용은? 🌿",
    options: ["광합성", "소화작용", "호흡작용", "증산작용"],
    answer: 0,
  },
  {
    id: 5,
    question: "대한민국의 수도는 어디일까요? 🏛️",
    options: ["부산", "인천", "서울", "제주"],
    answer: 2,
  },
];

export default function Home() {
  const [stage, setStage] = useState<'start' | 'quiz' | 'result' | 'leaderboard'>('start');
  const [studentName, setStudentName] = useState('');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [leaderboard, setLeaderboard] = useState<ScoreRecord[]>([]);
  const [isLoadingLeaderboard, setIsLoadingLeaderboard] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Server Action을 통한 리더보드 불러오기 (브라우저 차단 완벽 회피)
  const fetchLeaderboard = useCallback(async () => {
    setIsLoadingLeaderboard(true);
    setErrorMessage('');
    const res = await getScoresAction();
    if (res.success && res.data) {
      setLeaderboard(res.data);
    } else {
      setErrorMessage(res.error || '리더보드를 불러오는 중 오류가 발생했습니다.');
    }
    setIsLoadingLeaderboard(false);
  }, []);

  useEffect(() => {
    if (stage === 'leaderboard') {
      fetchLeaderboard();
    }
  }, [stage, fetchLeaderboard]);

  const handleStartQuiz = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName.trim()) return;
    setCurrentQuestionIndex(0);
    setSelectedAnswers([]);
    setIsSubmitted(false);
    setStage('quiz');
  };

  const handleSelectOption = (optionIndex: number) => {
    const newAnswers = [...selectedAnswers];
    newAnswers[currentQuestionIndex] = optionIndex;
    setSelectedAnswers(newAnswers);
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < QUIZ_QUESTIONS.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    } else {
      setStage('result');
    }
  };

  const calculateScore = () => {
    return selectedAnswers.reduce((score, answer, index) => {
      return answer === QUIZ_QUESTIONS[index].answer ? score + 1 : score;
    }, 0);
  };

  // Server Action을 통한 점수 제출 (네트워크/CORS 차단 방지)
  const handleSubmitScore = async () => {
    if (isSubmitted) return;
    setIsSubmitting(true);
    setErrorMessage('');

    const finalScore = calculateScore();
    const res = await submitScoreAction(studentName, finalScore, QUIZ_QUESTIONS.length);

    if (res.success) {
      setIsSubmitted(true);
      setStage('leaderboard');
    } else {
      setErrorMessage(res.error || '점수 저장에 실패했습니다.');
    }
    setIsSubmitting(false);
  };

  const handleRestart = () => {
    setStudentName('');
    setSelectedAnswers([]);
    setCurrentQuestionIndex(0);
    setIsSubmitted(false);
    setStage('start');
  };

  return (
    <div className="flex flex-col min-h-screen font-jua bg-[#F8FBFE] text-[#4B5563]">
      {/* 상단 헤더 */}
      <header className="flex items-center justify-between p-6 bg-white/70 backdrop-blur-md shadow-[0_8px_30px_rgba(181,234,215,0.3)] rounded-b-[2.5rem]">
        <div className="flex items-center gap-2 cursor-pointer" onClick={handleRestart}>
          <Sparkles className="w-8 h-8 text-[#FFB6C1]" />
          <h1 className="text-3xl text-[#FFB6C1] font-bold tracking-wider drop-shadow-sm">
            솜사탕 퀴즈왕 👑
          </h1>
        </div>
        <nav className="flex gap-3">
          <button
            onClick={() => setStage('leaderboard')}
            className="flex items-center gap-2 px-6 py-2.5 bg-[#B5EAD7] text-white text-lg rounded-full hover:scale-105 transition-transform duration-200 shadow-[0_4px_15px_rgba(181,234,215,0.6)]"
          >
            <Trophy className="w-5 h-5" />
            <span>전체 명예의 전당</span>
          </button>
        </nav>
      </header>

      {/* 메인 콘텐츠 메인 박스 */}
      <main className="flex-grow flex flex-col items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-xl bg-white p-8 sm:p-12 rounded-[3.5rem] shadow-[0_12px_40px_rgba(199,206,234,0.4)] border-none">
          
          {/* 1단계: 학생 이름 입력 */}
          {stage === 'start' && (
            <div className="flex flex-col items-center gap-6 text-center">
              <div className="w-20 h-20 bg-[#FFD1DC]/40 rounded-full flex items-center justify-center text-4xl shadow-[0_6px_20px_rgba(255,209,220,0.5)]">
                🦄
              </div>
              <h2 className="text-3xl sm:text-4xl text-[#A2B5E2] font-bold drop-shadow-sm">
                반가워요! 이름이 무엇인가요?
              </h2>
              <p className="text-xl text-[#8E9BAE]">
                퀴즈를 풀고 친구들과 함께 점수를 겨뤄보세요!
              </p>

              <form onSubmit={handleStartQuiz} className="w-full flex flex-col gap-5 mt-4">
                <div className="relative w-full">
                  <User className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-[#A2B5E2]" />
                  <input
                    type="text"
                    required
                    placeholder="이름 또는 닉네임을 입력해 주세요"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    className="w-full pl-14 pr-6 py-4 bg-[#F0F8FF] text-xl text-[#4B5563] placeholder-[#A2B5E2]/70 rounded-full outline-none border-2 border-transparent focus:border-[#C7CEEA] transition-all shadow-inner"
                  />
                </div>

                <button
                  type="submit"
                  disabled={!studentName.trim()}
                  className="group flex items-center justify-center gap-3 w-full py-4 bg-[#FFD1DC] text-white text-2xl rounded-full hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 transition-transform duration-200 shadow-[0_8px_25px_rgba(255,209,220,0.7)]"
                >
                  <span>퀴즈 시작하기!</span>
                  <Play className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                </button>
              </form>
            </div>
          )}

          {/* 2단계: 퀴즈 풀기 */}
          {stage === 'quiz' && (
            <div className="flex flex-col gap-6">
              <div className="flex items-center justify-between text-lg text-[#8E9BAE]">
                <span>학생: <strong className="text-[#A2B5E2]">{studentName}</strong></span>
                <span>문제 {currentQuestionIndex + 1} / {QUIZ_QUESTIONS.length}</span>
              </div>

              <div className="w-full h-3 bg-[#F0F8FF] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#B5EAD7] transition-all duration-300 rounded-full"
                  style={{
                    width: `${((currentQuestionIndex + 1) / QUIZ_QUESTIONS.length) * 100}%`,
                  }}
                />
              </div>

              <div className="bg-[#FFF5BA]/30 p-6 rounded-3xl text-center my-2">
                <h3 className="text-2xl sm:text-3xl text-[#4B5563] font-bold leading-relaxed">
                  {QUIZ_QUESTIONS[currentQuestionIndex].question}
                </h3>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {QUIZ_QUESTIONS[currentQuestionIndex].options.map((option, idx) => {
                  const isSelected = selectedAnswers[currentQuestionIndex] === idx;
                  return (
                    <button
                      key={idx}
                      onClick={() => handleSelectOption(idx)}
                      className={`w-full py-4 px-6 text-xl text-left rounded-full transition-all duration-200 flex items-center justify-between shadow-[0_4px_15px_rgba(0,0,0,0.03)] ${
                        isSelected
                          ? 'bg-[#C7CEEA] text-white scale-[1.02] shadow-[0_6px_20px_rgba(199,206,234,0.6)] font-bold'
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
                {currentQuestionIndex < QUIZ_QUESTIONS.length - 1 ? '다음 문제 ➡️' : '결과 보기 🎉'}
              </button>
            </div>
          )}

          {/* 3단계: 점수 확인 및 제출 */}
          {stage === 'result' && (
            <div className="flex flex-col items-center gap-6 text-center">
              <div className="w-24 h-24 bg-[#FFF5BA] rounded-full flex items-center justify-center text-5xl shadow-[0_8px_25px_rgba(255,245,186,0.8)] animate-bounce">
                🏆
              </div>

              <h2 className="text-3xl text-[#A2B5E2] font-bold">
                {studentName} 학생 수고했어요!
              </h2>

              <div className="bg-[#F8FBFE] w-full p-6 rounded-3xl flex flex-col items-center justify-center gap-2 shadow-inner">
                <span className="text-lg text-[#8E9BAE]">최종 점수</span>
                <span className="text-5xl font-bold text-[#FFB6C1]">
                  {calculateScore()}점 / {QUIZ_QUESTIONS.length}점
                </span>
                <p className="text-sm text-[#A2B5E2] mt-2">
                  (문제당 1점씩 계산되었습니다)
                </p>
              </div>

              {errorMessage && (
                <p className="text-red-400 text-sm bg-red-50 p-3 rounded-2xl w-full">
                  {errorMessage}
                </p>
              )}

              {!isSubmitted ? (
                <button
                  onClick={handleSubmitScore}
                  disabled={isSubmitting}
                  className="flex items-center justify-center gap-3 w-full py-4 bg-[#FFD1DC] text-white text-2xl rounded-full hover:scale-105 disabled:opacity-50 transition-transform duration-200 shadow-[0_8px_25px_rgba(255,209,220,0.7)]"
                >
                  <Send className="w-6 h-6" />
                  <span>{isSubmitting ? '저장 중...' : '점수 제출하고 랭킹 등록하기!'}</span>
                </button>
              ) : (
                <button
                  onClick={() => setStage('leaderboard')}
                  className="w-full py-4 bg-[#B5EAD7] text-white text-2xl rounded-full hover:scale-105 transition-transform duration-200 shadow-[0_8px_20px_rgba(181,234,215,0.6)]"
                >
                  전체 명예의 전당 보기 🏆
                </button>
              )}

              <button
                onClick={handleRestart}
                className="text-lg text-[#8E9BAE] hover:underline mt-2"
              >
                다시 시작하기
              </button>
            </div>
          )}

          {/* 4단계: 명예의 전당 (리더보드) */}
          {stage === 'leaderboard' && (
            <div className="flex flex-col gap-6">
              <div className="flex items-center justify-between border-b pb-4 border-[#F0F8FF]">
                <div className="flex items-center gap-3">
                  <Trophy className="w-8 h-8 text-[#FFD1DC]" />
                  <h2 className="text-3xl text-[#A2B5E2] font-bold">명예의 전당</h2>
                </div>
                <button
                  onClick={fetchLeaderboard}
                  title="새로고침"
                  className="p-3 bg-[#F0F8FF] rounded-full hover:rotate-180 transition-transform duration-500 text-[#A2B5E2]"
                >
                  <RefreshCw className="w-5 h-5" />
                </button>
              </div>

              {errorMessage && (
                <div className="text-sm bg-red-50 p-4 rounded-2xl text-red-500">
                  {errorMessage}
                </div>
              )}

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
                onClick={handleRestart}
                className="w-full mt-4 py-4 bg-[#FFD1DC] text-white text-2xl rounded-full hover:scale-105 transition-transform duration-200 shadow-[0_8px_25px_rgba(255,209,220,0.7)]"
              >
                나도 퀴즈 풀기 🚀
              </button>
            </div>
          )}

        </div>
      </main>

      {/* 하단 푸터 */}
      <footer className="p-6 text-center text-[#AFAFAF] bg-[#FFF5BA]/40 rounded-t-[2.5rem] text-lg">
        <p>&copy; {new Date().getFullYear()} 솜사탕 퀴즈왕. 모든 학생들의 꿈을 응원합니다!</p>
      </footer>
    </div>
  );
}
