"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

interface Source {
  id: number | string;
  name: string;
  url: string;
  category: string;
  is_active: boolean;
}

export default function AdminSourcesPage() {
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(false);
  const [message, setMessage] = useState("");

  const [newSource, setNewSource] = useState({
    name: "",
    url: "",
    category: "IT/테크",
  });

  useEffect(() => {
    fetchSources();
  }, []);

  async function fetchSources() {
    try {
      const res = await api.get("/sources");
      setSources(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const handleAddSource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSource.name || !newSource.url) return;
    try {
      await api.post("/sources", newSource);
      setNewSource({ name: "", url: "", category: "IT/테크" });
      fetchSources();
      setMessage("RSS 소스가 추가되었습니다.");
    } catch (err) {
      console.error(err);
      alert("소스 추가에 실패했습니다.");
    }
  };

  const handleTriggerIngestion = async () => {
    setTriggering(true);
    setMessage("");
    try {
      const res = await api.post("/ingestion/trigger");
      setMessage(`수집 완료! 신규 기사 ${res.data.total_saved}건 저장됨`);
    } catch (err) {
      console.error(err);
      alert("수집 트리거에 실패했습니다.");
    } finally {
      setTriggering(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white">
            RSS 소스 및 수집 관리 🛠️
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            뉴스 RSS 소스를 관리하고 수집 파이프라인을 수동으로 트리거합니다.
          </p>
        </div>

        <button
          onClick={handleTriggerIngestion}
          disabled={triggering}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-extrabold shadow-lg shadow-emerald-500/20 hover:opacity-95 transition-all"
        >
          {triggering ? "수집 파이프라인 실행 중..." : "🚀 지금 수집 실행하기"}
        </button>
      </div>

      {message && (
        <div className="p-3 rounded-xl bg-violet-50 dark:bg-violet-950/40 border border-violet-200 dark:border-violet-900 text-violet-600 dark:text-violet-300 text-xs font-semibold text-center">
          {message}
        </div>
      )}

      {/* 소스 추가 폼 */}
      <form onSubmit={handleAddSource} className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <h2 className="text-sm font-black text-slate-900 dark:text-white">새 RSS 소스 등록</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input
            type="text"
            placeholder="언론사명 (예: GeekNews)"
            value={newSource.name}
            onChange={(e) => setNewSource({ ...newSource, name: e.target.value })}
            required
            className="px-4 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
          />
          <input
            type="url"
            placeholder="RSS URL (https://.../rss)"
            value={newSource.url}
            onChange={(e) => setNewSource({ ...newSource, url: e.target.value })}
            required
            className="px-4 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
          />
          <select
            value={newSource.category}
            onChange={(e) => setNewSource({ ...newSource, category: e.target.value })}
            className="px-4 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
          >
            <option value="IT/테크">IT/테크</option>
            <option value="경제">경제</option>
            <option value="정치">정치</option>
            <option value="세계">세계</option>
            <option value="문화">문화</option>
          </select>
        </div>
        <button
          type="submit"
          className="px-5 py-2.5 rounded-xl bg-violet-600 text-white text-xs font-bold hover:bg-violet-700 transition-all"
        >
          소스 추가하기
        </button>
      </form>

      {/* 등록된 소스 목록 */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <h2 className="text-sm font-black text-slate-900 dark:text-white">등록된 RSS 소스 목록</h2>
        {loading ? (
          <div className="animate-pulse h-32 bg-slate-100 dark:bg-slate-800 rounded-2xl"></div>
        ) : sources.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-6">등록된 RSS 소스가 없습니다.</p>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {sources.map((s) => (
              <div key={s.id} className="py-3 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">{s.name}</span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-violet-50 dark:bg-violet-950 text-violet-600 dark:text-violet-400">
                      {s.category}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 truncate max-w-md mt-0.5">{s.url}</p>
                </div>
                <span className={`text-[10px] font-bold px-2 py-1 rounded-lg ${s.is_active ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400' : 'bg-slate-100 text-slate-500'}`}>
                  {s.is_active ? '활성' : '비활성'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
