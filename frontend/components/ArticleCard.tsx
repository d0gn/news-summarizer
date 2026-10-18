"use client";

import { useState } from "react";
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
  tags?: unknown;
  category?: string;
}

interface ArticleCardProps {
  article: Article;
  onOpenModal: (article: Article) => void;
  onBookmark?: (id: number) => void;
  isBookmarked?: boolean;
}

const getTagsArray = (tags: unknown): string[] => {
  if (!tags) return [];
  if (Array.isArray(tags)) return tags as string[];
  if (typeof tags === "string") {
    try {
      const parsed = JSON.parse(tags);
      if (Array.isArray(parsed)) return parsed as string[];
    } catch {}
    return tags.split(",").map((t) => t.trim()).filter(Boolean);
  }
  return [];
};

export default function ArticleCard({ article, onOpenModal, onBookmark, isBookmarked = false }: ArticleCardProps) {
  const [bookmarked, setBookmarked] = useState(isBookmarked);
  const [loading, setLoading] = useState(false);

  const tagsList = getTagsArray(article.tags);
  const publisherName = article.publisher || article.source_name || "뉴스";

  const handleBookmarkClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
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
      onClick={() => onOpenModal(article)}
      className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-sm hover:shadow-xl hover:border-violet-500/35 transition-all flex flex-col justify-between group cursor-pointer"
    >
      <div>
        <div className="flex items-center justify-between mb-3">
          <span className="text-[11px] font-extrabold px-2.5 py-1 rounded-lg bg-violet-50 dark:bg-violet-950/50 text-violet-600 dark:text-violet-400 border border-violet-500/20">
            {publisherName}
          </span>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400">
              {article.published_at ? new Date(article.published_at).toLocaleDateString() : "최신"}
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
        </div>

        <h3 className="text-sm font-extrabold text-slate-900 dark:text-white line-clamp-2 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors mb-2">
          {article.title}
        </h3>

        {article.core_message && (
          <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-100 dark:border-slate-800 mb-3">
            <p className="text-xs font-bold text-violet-700 dark:text-violet-300">
              📌 {article.core_message}
            </p>
          </div>
        )}

        {article.summary && (
          <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-3 leading-relaxed mb-4">
            {article.summary}
          </p>
        )}
      </div>

      <div>
        {tagsList.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {tagsList.map((tag, idx) => (
              <span
                key={idx}
                className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
          <span className="text-xs font-bold text-violet-600 dark:text-violet-400 group-hover:underline flex items-center gap-1">
            <span>빠른 요약 보기</span>
            <span>→</span>
          </span>

          <a
            href={article.url || article.origin_url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-xs font-medium text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
          >
            원문 보기 ↗
          </a>
        </div>
      </div>
    </div>
  );
}
