"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

export default function SettingsPage() {
  const [categories, setCategories] = useState("");
  const [keywords, setKeywords] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      const res = await api.get("/users/preferences");
      setCategories(res.data.preferred_categories || "");
      setKeywords(res.data.preferred_keywords || "");
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMessage("");
    try {
      await api.put("/users/preferences", {
        preferred_categories: categories,
        preferred_keywords: keywords,
      });
      setSuccessMessage("선호도가 성공적으로 저장되었습니다!");
    } catch (err) {
      console.error(err);
      alert("저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-black text-slate-900 dark:text-white">
          사용자 선호도 설정 ⚙️
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          관심 있는 카테고리나 키워드를 설정하여 맞춤형 뉴스 피드를 고도화하세요.
        </p>
      </div>

      {loading ? (
        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 animate-pulse h-64"></div>
      ) : (
        <form onSubmit={handleSave} className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
          {successMessage && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-emerald-600 dark:text-emerald-300 text-xs font-semibold text-center">
              {successMessage}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
              선호 카테고리 (쉼표로 구분, 예: IT/테크, 경제, 스타트업)
            </label>
            <input
              type="text"
              value={categories}
              onChange={(e) => setCategories(e.target.value)}
              placeholder="IT/테크, 경제"
              className="w-full px-4 py-3 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/40"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
              선호 키워드 (쉼표로 구분, 예: 인공지능, 반도체, 비트코인)
            </label>
            <input
              type="text"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder="인공지능, 반도체"
              className="w-full px-4 py-3 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/40"
            />
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="submit"
              disabled={saving}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-xs font-extrabold shadow-lg shadow-indigo-500/25 hover:opacity-95 transition-all"
            >
              {saving ? "저장 중..." : "설정 저장하기"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
