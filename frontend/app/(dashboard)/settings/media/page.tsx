"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import Link from "next/link";

interface FeedSource {
  id: number;
  name: string;
  url: string;
  category: string;
  is_active: boolean;
}

export default function MediaSettingsPage() {
  const [sources, setSources] = useState<FeedSource[]>([]);
  const [disabledIds, setDisabledIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [successMessage, setSuccessMessage] = useState("");

  const token = useAuthStore((state) => state.token);
  const hasToken = typeof window !== "undefined" && (token || localStorage.getItem("access_token"));

  const fetchData = useCallback(async () => {
    if (!hasToken) {
      setLoading(false);
      return;
    }
    try {
      const [sourcesRes, prefRes] = await Promise.all([
        api.get("/sources"),
        api.get("/users/preferences"),
      ]);
      setSources(sourcesRes.data || []);
      const disabledStr = prefRes.data.disabled_source_ids || "";
      const ids = disabledStr
        .split(",")
        .map((s: string) => parseInt(s.trim()))
        .filter((n: number) => !isNaN(n));
      setDisabledIds(ids);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [hasToken]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
  }, [fetchData]);

  const handleToggle = async (sourceId: number) => {
    const isCurrentlyDisabled = disabledIds.includes(sourceId);
    const updatedIds = isCurrentlyDisabled
      ? disabledIds.filter((id) => id !== sourceId)
      : [...disabledIds, sourceId];

    setDisabledIds(updatedIds);
    setSavingId(sourceId);
    setSuccessMessage("");

    try {
      await api.put("/users/preferences", {
        disabled_source_ids: updatedIds.join(","),
      });
      setSuccessMessage("매체 설정이 저장되었습니다. 피드에 즉시 반영됩니다.");
    } catch (err) {
      console.error(err);
      alert("설정 저장에 실패했습니다.");
      // Rollback
      setDisabledIds(disabledIds);
    } finally {
      setSavingId(null);
    }
  };

  if (!hasToken) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center space-y-6">
        <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white text-2xl flex items-center justify-center mx-auto shadow-lg shadow-indigo-500/25">
          📻
        </div>
        <h1 className="text-xl font-black text-slate-900 dark:text-white">
          로그인이 필요한 서비스입니다
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          원하는 뉴스 매체를 선택하고 나만의 맞춤 피드를 구성하려면 로그인해 주세요.
        </p>
        <div className="flex items-center justify-center gap-3 pt-2">
          <Link
            href="/login"
            className="px-6 py-3 rounded-2xl bg-violet-600 text-white text-xs font-bold shadow-md shadow-violet-500/25 hover:opacity-95 transition-all"
          >
            로그인하기
          </Link>
          <Link
            href="/signup"
            className="px-6 py-3 rounded-2xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-bold shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
          >
            회원가입
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-black text-slate-900 dark:text-white">
          뉴스 매체 설정 📻
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          구독하고 싶지 않은 언론사/매체를 끄고 켜서 나만의 맞춤 뉴스 피드를 완성하세요.
        </p>
      </div>

      {successMessage && (
        <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-emerald-600 dark:text-emerald-300 text-xs font-semibold text-center">
          {successMessage}
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 animate-pulse h-20"></div>
          ))}
        </div>
      ) : sources.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-12 text-center">
          <p className="text-3xl mb-3">📭</p>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            등록된 뉴스 소스가 없습니다
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            관리자가 RSS 소스를 등록하면 여기에 표시됩니다.
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
          {sources.map((source) => {
            const isDisabled = disabledIds.includes(source.id);
            const isSaving = savingId === source.id;

            return (
              <div key={source.id} className="p-5 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-all">
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5">
                    <span className="text-sm font-black text-slate-900 dark:text-white">
                      {source.name}
                    </span>
                    <span className="px-2 py-0.5 rounded-lg bg-violet-50 dark:bg-violet-950/50 text-violet-600 dark:text-violet-300 text-[10px] font-bold border border-violet-200/60 dark:border-violet-900">
                      {source.category}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 truncate max-w-md">
                    {source.url}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span className={`text-xs font-bold ${isDisabled ? "text-slate-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                    {isDisabled ? "구독 해제됨" : "구독 중"}
                  </span>
                  <button
                    onClick={() => handleToggle(source.id)}
                    disabled={isSaving}
                    className={`w-12 h-6 rounded-full transition-colors relative p-1 ${isDisabled ? "bg-slate-300 dark:bg-slate-700" : "bg-violet-600"}`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-white transition-transform ${isDisabled ? "translate-x-0" : "translate-x-6"}`} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
