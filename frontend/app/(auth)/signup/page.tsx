"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";

export default function SignupPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    passwordConfirm: "",
    full_name: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const dark = savedTheme === "dark" || (!savedTheme && prefersDark);
    setDarkMode(dark);
    if (dark) document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  }, []);

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

  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email);
  const isPasswordValid = formData.password.length >= 6;
  const isPasswordMatch = formData.password === formData.passwordConfirm && formData.passwordConfirm.length > 0;
  const canSubmit = isEmailValid && isPasswordValid && isPasswordMatch && !isLoading;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setIsLoading(true);
    setErrorMessage("");

    try {
      await api.post("/auth/register", {
        email: formData.email,
        password: formData.password,
        full_name: formData.full_name || undefined,
      });

      setIsLoading(false);
      setIsSuccess(true);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(
        err.response?.data?.detail || "회원가입에 실패했습니다. 다시 시도해주세요."
      );
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden bg-slate-50 dark:bg-[#0B0F19] text-slate-800 dark:text-slate-100">
      <div className="w-full max-w-md relative z-10">
        <div className="flex justify-end mb-4">
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-xl bg-white/80 dark:bg-slate-800/80 backdrop-blur border border-slate-200/80 dark:border-slate-700/80 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-all shadow-sm"
            title="다크 모드 전환"
          >
            {darkMode ? "☀️" : "🌙"}
          </button>
        </div>

        <div className="relative bg-white/90 dark:bg-[#0F172A]/90 backdrop-blur-xl rounded-3xl border border-slate-200/80 dark:border-slate-800/80 p-8 shadow-2xl shadow-indigo-500/10 overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-violet-600 via-indigo-600 to-pink-500"></div>

          {!isSuccess ? (
            <div>
              <div className="text-center mb-6">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/30 mx-auto mb-3.5 text-white font-bold">
                  ✨
                </div>
                <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                  PulseFeed 시작하기
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 font-medium">
                  Gemini AI가 엄선한 고밀도 맞춤 뉴스를 만나보세요
                </p>
              </div>

              {errorMessage && (
                <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-300 text-xs font-semibold text-center">
                  {errorMessage}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    이름 (선택)
                  </label>
                  <input
                    type="text"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleChange}
                    placeholder="홍길동"
                    className="w-full px-4 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
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
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    비밀번호 (6자 이상)
                  </label>
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="비밀번호 입력"
                    className="w-full px-4 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    비밀번호 확인
                  </label>
                  <input
                    type={showPassword ? "text" : "password"}
                    name="passwordConfirm"
                    required
                    value={formData.passwordConfirm}
                    onChange={handleChange}
                    placeholder="비밀번호 재입력"
                    className="w-full px-4 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500 transition-all"
                  />
                </div>

                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={showPassword}
                      onChange={() => setShowPassword(!showPassword)}
                      className="w-4 h-4 rounded text-violet-600 focus:ring-violet-500 border-slate-300 dark:border-slate-700 dark:bg-slate-800"
                    />
                    <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                      비밀번호 표시
                    </span>
                  </label>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={!canSubmit}
                    className={`w-full py-3 rounded-xl text-xs font-extrabold text-white flex items-center justify-center gap-2 shadow-lg transition-all duration-200 ${
                      canSubmit
                        ? "bg-gradient-to-r from-violet-600 via-indigo-600 to-pink-500 shadow-indigo-500/25 hover:opacity-95 hover:shadow-indigo-500/40 active:scale-[0.99] cursor-pointer"
                        : "bg-slate-300 dark:bg-slate-800 cursor-not-allowed opacity-60 shadow-none"
                    }`}
                  >
                    {isLoading ? "계정 생성 중..." : "가입 완료하기 →"}
                  </button>
                </div>
              </form>

              <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800/80 text-center">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  이미 계정이 있으신가요?{" "}
                  <Link href="/login" className="font-bold text-violet-600 dark:text-violet-400 hover:underline">
                    로그인하기
                  </Link>
                </p>
              </div>
            </div>
          ) : (
            <div className="py-6 text-center">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-xl shadow-emerald-500/25 mx-auto mb-4 font-bold text-xl">
                ✓
              </div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white">
                회원가입 완료!
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                <strong className="text-slate-900 dark:text-white">{formData.email}</strong> 계정이 성공적으로 생성되었습니다.
              </p>
              <div className="mt-6">
                <button
                  onClick={() => router.push("/login")}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-xs font-bold shadow-md shadow-indigo-500/20 hover:opacity-95 transition-all"
                >
                  로그인하러 가기 →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
