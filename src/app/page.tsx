import { PlusCircle } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen font-jua bg-[#F8FBFE]">
      {/* 상단 헤더 */}
      <header className="flex items-center justify-between p-6 bg-white/60 backdrop-blur-md shadow-[0_8px_30px_rgba(181,234,215,0.3)] rounded-b-[2.5rem]">
        <h1 className="text-3xl text-[#FFB6C1] font-bold tracking-wider drop-shadow-sm">
          솜사탕 에듀
        </h1>
        <nav className="flex gap-4">
          <button className="px-8 py-3 bg-[#B5EAD7] text-white text-lg rounded-full hover:scale-105 transition-transform duration-200 shadow-[0_4px_15px_rgba(181,234,215,0.6)]">
            로그인
          </button>
        </nav>
      </header>

      {/* 메인 화면 (Hero Section) */}
      <main className="flex-grow flex flex-col items-center justify-center p-8 gap-8 text-center">
        <div className="flex flex-col gap-6 max-w-2xl bg-white p-12 rounded-[3.5rem] shadow-[0_12px_40px_rgba(199,206,234,0.4)]">
          <h2 className="text-[2.75rem] text-[#A2B5E2] font-bold drop-shadow-sm leading-tight">
            나만의 교육용 웹앱 만들기
          </h2>
          <p className="text-2xl text-[#8E9BAE] leading-relaxed">
            아이들을 위한 따뜻하고 부드러운 공간.
            <br />
            동글동글 귀여운 UI로 상상력을 키워보세요!
          </p>
          
          <div className="mt-8 flex justify-center">
            <button className="group flex items-center gap-4 px-10 py-5 bg-[#FFD1DC] text-white text-2xl rounded-full hover:scale-105 transition-transform duration-200 shadow-[0_8px_25px_rgba(255,209,220,0.7)]">
              <PlusCircle className="w-8 h-8 group-hover:rotate-90 transition-transform duration-300" />
              <span>새로운 기능 추가하기</span>
            </button>
          </div>
        </div>
      </main>

      {/* 하단 푸터 */}
      <footer className="p-8 text-center text-[#AFAFAF] bg-[#FFF5BA]/40 rounded-t-[2.5rem] text-lg">
        <p>&copy; {new Date().getFullYear()} 솜사탕 에듀. All rights reserved.</p>
      </footer>
    </div>
  );
}
