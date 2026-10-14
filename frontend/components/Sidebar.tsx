"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ isOpen = false, onClose = () => {} }: SidebarProps) {
  const pathname = usePathname();

  const navItems = [
    { name: "맞춤 뉴스 피드", href: "/feed", icon: "📰" },
    { name: "이슈 클러스터", href: "/clusters", icon: "🔮" },
    { name: "북마크 보관함", href: "/bookmarks", icon: "🔖" },
    { name: "선호도 설정", href: "/settings", icon: "⚙️" },
    { name: "RSS 소스 관리", href: "/admin/sources", icon: "🛠️" },
  ];

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden transition-opacity"
        />
      )}

      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col h-screen transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="p-6 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-pink-500 flex items-center justify-center text-white font-bold shadow-md shadow-indigo-500/20">
              ✨
            </div>
            <div>
              <h2 className="font-black text-slate-900 dark:text-white text-base tracking-tight">
                PulseFeed
              </h2>
              <p className="text-[10px] text-slate-400 font-semibold">AI News Summarizer</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            aria-label="Close Sidebar"
          >
            ✕
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`flex items-center gap-3 px-3.5 py-3 rounded-2xl text-xs font-bold transition-all ${
                  isActive
                    ? "bg-gradient-to-r from-violet-600/10 to-indigo-600/10 text-violet-600 dark:text-violet-400 border border-violet-500/20 shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <span className="text-base">{item.icon}</span>
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-100 dark:border-slate-800/80">
          <div className="bg-gradient-to-br from-violet-500/10 to-indigo-500/10 dark:from-violet-500/5 dark:to-indigo-500/5 p-3.5 rounded-2xl border border-violet-500/15">
            <p className="text-[11px] font-bold text-violet-700 dark:text-violet-300">
              💡 Pro 요약 엔진 활성화
            </p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              Gemini 2.5 플래시가 실시간으로 핵심 뉴스를 요약합니다.
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}
