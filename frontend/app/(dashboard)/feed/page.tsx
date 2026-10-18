"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import ArticleCard from "@/components/ArticleCard";
import ArticleModal from "@/components/ArticleModal";

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

export default function FeedPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [visibleCount, setVisibleCount] = useState(24);

  const categories = ["all", "IT/테크", "경제", "정치", "세계", "문화"];

  const fetchFeed = useCallback(async (category: string) => {
    setLoading(true);
    try {
      const baseUrl =
        category === "all"
          ? "/articles"
          : `/articles?category=${encodeURIComponent(category)}`;
      const separator = baseUrl.includes("?") ? "&" : "?";
      const res = await api.get(`${baseUrl}${separator}limit=200`);
      setArticles(res.data.items || res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchFeed(selectedCategory);
  }, [selectedCategory, fetchFeed]);

  const handleCategoryChange = (cat: string) => {
    setSelectedCategory(cat);
    setVisibleCount(24);
  };

  const handleLoadMore = () => {
    setVisibleCount((prev) => prev + 24);
  };

  const displayedArticles = articles.slice(0, visibleCount);
  const hasMore = visibleCount < articles.length;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white">
            맞춤형 AI 뉴스 피드 📰
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Gemini AI가 실시간으로 수집·가공한 고밀도 요약 뉴스 스트림입니다.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => handleCategoryChange(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                selectedCategory === cat
                  ? "bg-violet-600 text-white shadow-md shadow-violet-500/25"
                  : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700"
              }`}
            >
              {cat === "all" ? "전체" : cat}
            </button>
          ))}
        </div>
      </div>

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
              <div className="w-full h-10 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
            </div>
          ))}
        </div>
      ) : articles.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-12 text-center">
          <p className="text-3xl mb-3">📭</p>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            등록된 기사가 없습니다
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            RSS 소스를 등록하거나 수집 파이프라인을 트리거해주세요.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
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
            <div className="flex justify-center pt-4">
              <button
                onClick={handleLoadMore}
                className="px-6 py-3 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm transition-all flex items-center gap-2"
              >
                <span>더 보기 ({displayedArticles.length} / {articles.length})</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
          )}
        </div>
      )}

      <ArticleModal
        article={selectedArticle}
        onClose={() => setSelectedArticle(null)}
      />
    </div>
  );
}
