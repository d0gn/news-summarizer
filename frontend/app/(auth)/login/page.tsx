"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { useAuthStore } from "@/lib/store";

export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((state) => state.login);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window === "undefined") return false;
    const savedTheme = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const dark = savedTheme === "dark" || (!savedTheme && prefersDark);
    if (dark) document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
    return dark;
  });

  const toggleDarkMode = () => {
    const nextDark = !darkMode;
    setDarkMode(nextDark);
    if (nextDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email || !formData.password || isLoading) return;

    setIsLoading(true);
    setErrorMessage("");

    try {
      // OAuth2PasswordRequestForm expects URLSearchParams (username, password)
      const params = new URLSearchParams();
      params.append("username", formData.email);
      params.append("password", formData.password);

      const response = await api.post("/auth/login", params, {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      });

      const { access_token } = response.data;

      // Fetch current user profile
      const userRes = await api.get("/auth/me", {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      });

      login(access_token, userRes.data);
      router.push("/feed");
    } catch (err: unknown) {
      console.error(err);
      const errorObj = err as { response?: { data?: { detail?: string } } };
      setErrorMessage(
        errorObj.response?.data?.detail || "로그인에 실패했습니다. 이메일과 비밀번호를 확인해주세요."
      );
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden bg-slate-50 dark:bg-[#0B0F19] text-slate-800 dark:text-slate-100">
      <div className="w-full max-w-md relative z-10">
        {/* 다크모드 토글 버튼 */}
        <div className="flex justify-end mb-4">
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-xl bg-white/80 dark:bg-slate-800/80 backdrop-blur border border-slate-200/80 dark:border-slate-700/80 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-all shadow-sm"
            title="다크 모드 전환"
          >
            {darkMode ? "☀️" : "🌙"}
          </button>
        </div>

        {/* 메인 로그인 카드 */}
        <div className="relative bg-white/90 dark:bg-[#0F172A]/90 backdrop-blur-xl rounded-3xl border border-slate-200/80 dark:border-slate-800/80 p-8 shadow-2xl shadow-indigo-500/10 overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-violet-600 via-indigo-600 to-pink-500"></div>

          <div className="text-center mb-8">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/30 mx-auto mb-3.5 text-white font-bold">
              ✨
            </div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              다시 오신 것을 환영해요
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 font-medium">
              PulseFeed에 로그인하고 실시간 AI 요약을 확인하세요
            </p>
          </div>

          {errorMessage && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-300 text-xs font-semibold text-center">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                이메일 계정
              </label>
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="name@example.com"
                className="w-full px-4 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500 transition-all"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  비밀번호
                </label>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="비밀번호 입력"
                  className="w-full px-4 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500 transition-all pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs"
                >
                  {showPassword ? "숨김" : "보기"}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading || !formData.email || !formData.password}
                className={`w-full py-3 rounded-xl text-xs font-extrabold text-white flex items-center justify-center gap-2 shadow-lg transition-all duration-200 ${
                  !isLoading && formData.email && formData.password
                    ? "bg-gradient-to-r from-violet-600 via-indigo-600 to-pink-500 shadow-indigo-500/25 hover:opacity-95 hover:shadow-indigo-500/40 active:scale-[0.99] cursor-pointer"
                    : "bg-slate-300 dark:bg-slate-800 cursor-not-allowed opacity-60 shadow-none"
                }`}
              >
                {isLoading ? "인증 확인 중..." : "로그인 →"}
              </button>
            </div>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800/80 text-center">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              아직 PulseFeed 계정이 없으신가요?{" "}
              <Link href="/signup" className="font-bold text-violet-600 dark:text-violet-400 hover:underline">
                회원가입하기
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
