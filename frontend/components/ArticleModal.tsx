"use client";

import { useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";

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
  tags?: any;
  category?: string;
}

interface ArticleModalProps {
  article: Article | null;
  onClose: () => void;
  isBookmarked?: boolean;
  onBookmark?: (id: number) => void;
}

const getTagsArray = (tags: any): string[] => {
  if (!tags) return [];
  if (Array.isArray(tags)) return tags;
  if (typeof tags === "string") {
    try {
      const parsed = JSON.parse(tags);
      if (Array.isArray(parsed)) return parsed;
    } catch {}
    return tags.split(",").map((t) => t.trim()).filter(Boolean);
  }
  return [];
};

export default function ArticleModal({ article, onClose, isBookmarked = false, onBookmark }: ArticleModalProps) {
  const [bookmarked, setBookmarked] = useState(isBookmarked);
  const [loading, setLoading] = useState(false);

  if (!article) return null;

  const tagsList = getTagsArray(article.tags);
  const publisherName = article.publisher || article.source_name || "뉴스 요약";
  const articleUrl = article.url || article.origin_url;

  const handleBookmarkClick = async () => {
    if (loading) return;
    setLoading(true);
    try {
      if (bookmarked) {
        await api.delete(`/users/bookmarks/${article.id}`);
        setBookmarked(false);
      } else {
        await api.post("/users/bookmarks", { article_id: article.id });
        setBookmarked(true);
      }
      if (onBookmark) onBookmark(article.id);
    } catch (err) {
      console.error(err);
      alert("북마크 처리 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200 cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 relative overflow-hidden max-h-[90vh] flex flex-col cursor-default"
      >
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-violet-600 via-indigo-600 to-pink-500"></div>

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-extrabold px-3 py-1 rounded-xl bg-violet-50 dark:bg-violet-950/50 text-violet-600 dark:text-violet-400 border border-violet-500/20">
              {publisherName}
            </span>
            <button
              onClick={handleBookmarkClick}
              className={`p-1.5 rounded-xl transition-all ${
                bookmarked
                  ? "bg-violet-600 text-white shadow-md shadow-violet-500/25"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-white"
              }`}
              title={bookmarked ? "북마크 해제" : "북마크 하기"}
            >
              🔖
            </button>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center justify-center font-bold"
          >
            ✕
          </button>
        </div>

        <h2 className="text-lg font-black text-slate-900 dark:text-white mb-3">
          {article.title}
        </h2>

        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {article.core_message && (
            <div className="bg-violet-50 dark:bg-violet-950/30 p-4 rounded-2xl border border-violet-500/20">
              <h4 className="text-xs font-extrabold text-violet-700 dark:text-violet-300 mb-1">
                📌 AI 한 줄 핵심
              </h4>
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                {article.core_message}
              </p>
            </div>
          )}

          <div>
            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
              📝 Gemini 요약
            </h4>
            <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
              {article.summary || "요약 내용이 없습니다."}
            </div>
          </div>

          {tagsList.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {tagsList.map((tag, idx) => (
                <span
                  key={idx}
                  className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          {articleUrl && (
            <a
              href={articleUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white"
            >
              원문 기사 보기 ↗
            </a>
          )}

          <Link
            href={`/articles/${article.id}`}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-xs font-extrabold shadow-md shadow-indigo-500/20 hover:opacity-95 transition-all ml-auto"
          >
            독립형 상세 페이지 보기 →
          </Link>
        </div>
      </div>
    </div>
  );
}
