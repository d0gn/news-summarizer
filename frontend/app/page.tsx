"use client";

import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B0F19] text-slate-800 dark:text-slate-100 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-xl text-center relative z-10 space-y-6">
        <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-pink-500 flex items-center justify-center text-white text-2xl shadow-xl shadow-indigo-500/30 mx-auto">
          ✨
        </div>

        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white">
          PulseFeed - 나만의 맞춤형 AI 뉴스 큐레이션
        </h1>

        <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-md mx-auto">
          매일 쏟아지는 뉴스 속에서 나에게 꼭 필요한 소식만 골라, AI가 핵심만 깔끔하게 정리해 드립니다. 로그인 없이 바로 뉴스 피드를 둘러보세요.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
          <Link
            href="/feed"
            className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-xs font-extrabold shadow-lg shadow-indigo-500/25 hover:opacity-95 transition-all"
          >
            🚀 로그인 없이 피드 둘러보기 →
          </Link>
          <Link
            href="/login"
            className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-bold shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
          >
            로그인
          </Link>
          <Link
            href="/signup"
            className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-bold shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
          >
            회원가입
          </Link>
        </div>
      </div>
    </div>
  );
}
