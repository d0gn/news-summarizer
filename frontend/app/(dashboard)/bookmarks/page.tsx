"use client";

import { useEffect, useState } from "react";
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

interface Bookmark {
  id: number | string;
  article: Article;
}

export default function BookmarksPage() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const token = useAuthStore((state) => state.token);
  const hasToken = typeof window !== "undefined" && (token || localStorage.getItem("access_token"));

  async function fetchBookmarks() {
    if (!hasToken) {
      setLoading(false);
      return;
    }
    try {
      const res = await api.get("/users/bookmarks");
      setBookmarks(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchBookmarks();
  }, [hasToken]);

  const handleBookmarkToggle = () => {
    // Refresh list after bookmark removal
    fetchBookmarks();
  };

  if (!hasToken) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center space-y-6">
        <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white text-2xl flex items-center justify-center mx-auto shadow-lg shadow-indigo-500/25">
          🔖
        </div>
        <h1 className="text-xl font-black text-slate-900 dark:text-white">
          로그인이 필요한 서비스입니다
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          관심 있는 기사를 북마크하고 나만의 보관함에 저장하려면 로그인해 주세요.
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
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-black text-slate-900 dark:text-white">
          북마크 보관함 🔖
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          스크랩하여 저장한 기사들을 언제든지 다시 읽어보세요.
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 h-64 animate-pulse"></div>
          ))}
        </div>
      ) : bookmarks.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-12 text-center">
          <p className="text-3xl mb-3">📭</p>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            저장된 북마크가 없습니다
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            관심 있는 기사를 북마크하여 보관함에 추가해 보세요.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {bookmarks.map((b) => (
            <ArticleCard
              key={b.id}
              article={b.article}
              onOpenModal={setSelectedArticle}
              isBookmarked={true}
              onBookmark={handleBookmarkToggle}
            />
          ))}
        </div>
      )}

      <ArticleModal
        article={selectedArticle}
        onClose={() => setSelectedArticle(null)}
      />
    </div>
  );
}
