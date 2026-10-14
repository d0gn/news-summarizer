"use client";

import { useState } from "react";
import { useAuthStore } from "@/lib/store";
import { useRouter } from "next/navigation";

interface NavbarProps {
  searchQuery?: string;
  setSearchQuery?: (q: string) => void;
  onToggleSidebar?: () => void;
  isDark?: boolean;
  onToggleTheme?: () => void;
}

export default function Navbar({
  searchQuery = "",
  setSearchQuery = () => {},
  onToggleSidebar = () => {},
  isDark = false,
  onToggleTheme = () => {},
}: NavbarProps) {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const displayName = user?.full_name || (user?.email ? user.email.split("@")[0] : "사용자");

  return (
    <header className="h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-6 flex items-center justify-between sticky top-0 z-20">
      <div className="flex items-center gap-3 flex-1 max-w-md">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all flex items-center justify-center shrink-0"
          aria-label="Toggle Sidebar"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <div className="relative w-full">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="실시간 뉴스 키워드, AI 요약 검색..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/40 transition-all"
          />
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 text-xs">
            🔍
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3 relative">
        <button
          onClick={onToggleTheme}
          className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all flex items-center justify-center shrink-0 shadow-sm"
          aria-label="Toggle Theme"
          title="테마 변경"
        >
          {isDark ? "☀️" : "🌙"}
        </button>

        <div className="text-right hidden sm:block">
          <p className="text-xs font-bold text-slate-900 dark:text-white">
            {displayName}님
          </p>
          <p className="text-[10px] text-violet-600 dark:text-violet-400 font-semibold">
            {user?.is_superuser ? "관리자" : "Standard 회원"}
          </p>
        </div>

        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="w-10 h-10 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white font-bold flex items-center justify-center shadow-md shadow-indigo-500/20 hover:opacity-95 transition-all"
          >
            {displayName ? displayName.charAt(0).toUpperCase() : "U"}
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 py-1.5 z-30">
              <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-700">
                <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                  {user?.email}
                </p>
              </div>
              <button
                onClick={() => {
                  setDropdownOpen(false);
                  router.push("/settings");
                }}
                className="w-full text-left px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50"
              >
                ⚙️ 선호도 설정
              </button>
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30"
              >
                🚪 로그아웃
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
