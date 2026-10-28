"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import ArticleCard from "@/components/ArticleCard";
import ArticleModal from "@/components/ArticleModal";
import Link from "next/link";

interface Article {
  id: number;
  title: string;
  source_name?: string;
  publisher?: string;
  url: string;
  origin_url?: string;
  published_at?: string;
  summary?: string;
  core_message?: string;
  tags?: unknown;
  category?: string;
}

export default function CustomFeedPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [visibleCount, setVisibleCount] = useState(24);
  const token = useAuthStore((state) => state.token);
  const searchQuery = useAuthStore((state) => state.searchQuery);
  const hasToken = typeof window !== "undefined" && (token || localStorage.getItem("access_token"));

  const fetchCustomFeed = useCallback(async () => {
    if (!hasToken) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      // 1. Get user preferences to show active keywords
      const prefRes = await api.get("/users/preferences");
      const kwStr = prefRes.data.preferred_keywords || "";
      const kwList = kwStr.split(",").map((k: string) => k.trim()).filter(Boolean);
      setKeywords(kwList);

      // 2. Get personalized feed based on keywords
      const feedRes = await api.get("/users/feed?limit=200");
      setArticles(feedRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [hasToken]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchCustomFeed();
  }, [fetchCustomFeed]);

  const handleLoadMore = () => {
    setVisibleCount((prev) => prev + 24);
  };

  if (!hasToken) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center space-y-6">
        <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white text-2xl flex items-center justify-center mx-auto shadow-lg shadow-indigo-500/25">
          🎯
        </div>
        <h1 className="text-xl font-black text-slate-900 dark:text-white">
          로그인이 필요한 서비스입니다
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          맞춤 뉴스 피드를 이용하려면 로그인 후 키워드를 설정해 주세요.
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

  const filteredArticles = articles.filter((article) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const titleMatch = article.title?.toLowerCase().includes(q);
    const summaryMatch = article.summary?.toLowerCase().includes(q);
    const coreMatch = article.core_message?.toLowerCase().includes(q);
    const tagsMatch = Array.isArray(article.tags)
      ? article.tags.some((t) => String(t).toLowerCase().includes(q))
      : typeof article.tags === 'string'
        ? article.tags.toLowerCase().includes(q)
        : false;
    return titleMatch || summaryMatch || coreMatch || tagsMatch;
  });

  const displayedArticles = filteredArticles.slice(0, visibleCount);
  const hasMore = visibleCount < filteredArticles.length;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white">
            맞춤 뉴스 피드 🎯
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            설정한 관심 키워드와 매칭되는 최신 뉴스만 엄선하여 보여드립니다.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/settings"
            className="px-4 py-2 rounded-xl bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-300 border border-violet-200 dark:border-violet-900 text-xs font-bold hover:bg-violet-100 transition-all"
          >
            ⚙️ 키워드 설정 관리
          </Link>
        </div>
      </div>

      {keywords.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-extrabold text-slate-500 dark:text-slate-400 mr-2">
            활성 키워드:
          </span>
          {keywords.map((kw) => (
            <span
              key={kw}
              className="px-3 py-1 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-900 text-[11px] font-bold"
            >
              #{kw}
            </span>
          ))}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 h-64 animate-pulse flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="w-20 h-5 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
                <div className="w-full h-6 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
                <div className="w-3/4 h-6 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
              </div>
            </div>
          ))}
        </div>
      ) : keywords.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 p-12 rounded-3xl border border-slate-200 dark:border-slate-800 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 text-xl flex items-center justify-center mx-auto">
            💡
          </div>
          <h2 className="text-sm font-black text-slate-900 dark:text-white">
            등록된 선호 키워드가 없습니다
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            설정 페이지에서 관심 키워드를 등록하시면 해당 키워드가 포함된 맞춤 뉴스를 실시간으로 확인하실 수 있습니다.
          </p>
          <Link
            href="/settings"
            className="inline-block px-6 py-3 rounded-2xl bg-violet-600 text-white text-xs font-bold shadow-md shadow-violet-500/25 hover:opacity-95 transition-all"
          >
            키워드 설정하러 가기
          </Link>
        </div>
      ) : articles.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 p-12 rounded-3xl border border-slate-200 dark:border-slate-800 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-500 text-xl flex items-center justify-center mx-auto">
            📭
          </div>
          <h2 className="text-sm font-black text-slate-900 dark:text-white">
            일치하는 맞춤 뉴스가 없습니다
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            설정하신 키워드({keywords.join(", ")})와 매칭되는 최신 기사가 아직 수집되지 않았습니다. 잠시 후 다시 확인해 보세요.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayedArticles.map((article) => (
              <ArticleCard
                key={article.id}
                article={article}
                onOpenModal={setSelectedArticle}
              />
            ))}
          </div>

          {hasMore && (
            <div className="text-center pt-6">
              <button
                onClick={handleLoadMore}
                className="px-8 py-3.5 rounded-2xl bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 text-xs font-extrabold shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
              >
                더 보기 ({displayedArticles.length} / {filteredArticles.length})
              </button>
            </div>
          )}
        </div>
      )}

      {selectedArticle && (
        <ArticleModal
          article={selectedArticle}
          onClose={() => setSelectedArticle(null)}
        />
      )}
    </div>
  );
}
