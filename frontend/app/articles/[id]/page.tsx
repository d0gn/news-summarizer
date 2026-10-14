"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useParams } from "next/navigation";
import { api } from "@/lib/api";
import Link from "next/link";

function ArticleDetailContent() {
  const router = useRouter();
  const params = useParams();
  const articleId = params?.id as string;

  const [article, setArticle] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (articleId) {
      fetchDetail();
    }
  }, [articleId]);

  const fetchDetail = async () => {
    try {
      const res = await api.get(`/articles/${articleId}`);
      setArticle(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#0B0F19] flex items-center justify-center">
        <div className="text-xs text-slate-400">기사 상세 정보를 불러오는 중...</div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#0B0F19] flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-base font-black text-slate-900 dark:text-white mb-2">기사를 찾을 수 없습니다</h2>
        <button
          onClick={() => router.push("/feed")}
          className="px-4 py-2 rounded-xl bg-violet-600 text-white text-xs font-bold"
        >
          피드로 돌아가기
        </button>
      </div>
    );
  }

  const getTagsArray = (tags: any): string[] => {
    if (!tags) return [];
    if (Array.isArray(tags)) return tags;
    if (typeof tags === "string") {
      try {
        const parsed = JSON.parse(tags);
        if (Array.isArray(parsed)) return parsed;
      } catch {}
      return tags.split(",").map((t: string) => t.trim()).filter(Boolean);
    }
    return [];
  };

  const tagsList = getTagsArray(article?.tags);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B0F19] text-slate-800 dark:text-slate-100 py-10 px-4">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="text-xs font-bold text-violet-600 dark:text-violet-400 hover:underline"
          >
            ← 이전으로
          </button>
          <span className="text-xs font-extrabold px-3 py-1 rounded-xl bg-violet-50 dark:bg-violet-950/50 text-violet-600 dark:text-violet-400 border border-violet-500/20">
            {article.publisher || "뉴스"}
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-8 shadow-sm space-y-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-violet-600 via-indigo-600 to-pink-500"></div>

          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white leading-tight mb-3">
              {article.title}
            </h1>
            <p className="text-xs text-slate-400">
              발행일: {article.published_at ? new Date(article.published_at).toLocaleString() : "최신"}
            </p>
          </div>

          {article.core_message && (
            <div className="bg-violet-50 dark:bg-violet-950/40 p-4 rounded-2xl border border-violet-500/20">
              <h3 className="text-xs font-black text-violet-700 dark:text-violet-300 mb-1">
                📌 AI 한 줄 핵심
              </h3>
              <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                {article.core_message}
              </p>
            </div>
          )}

          {article.summary && (
            <div>
              <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                📝 Gemini 3줄 요약
              </h3>
              <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                {article.summary}
              </div>
            </div>
          )}

          {article.content_text && (
            <div>
              <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                📄 본문 요약 / 원문 내용
              </h3>
              <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                {article.content_text}
              </div>
            </div>
          )}

          {tagsList.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-2">
              {tagsList.map((tag: string, idx: number) => (
                <span
                  key={idx}
                  className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <Link
              href="/feed"
              className="text-xs font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white"
            >
              ← 피드로 돌아가기
            </Link>

            <a
              href={article.origin_url || article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-xs font-extrabold shadow-md shadow-indigo-500/20 hover:opacity-95 transition-all"
            >
              언론사 원문 기사 보기 ↗
            </a>
          </div>
        </div>

        {/* 관련 기사 리스트 */}
        {article.related_articles && article.related_articles.length > 0 && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-black text-slate-900 dark:text-white">
              🔗 같은 이슈의 관련 기사
            </h3>
            <div className="space-y-3">
              {article.related_articles.map((ra: { id: string | number; publisher?: string; title: string; origin_url?: string }) => (
                <div key={ra.id} className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-violet-600 dark:text-violet-400 mr-2">{ra.publisher}</span>
                    <Link href={`/articles/${ra.id}`} className="text-xs font-bold text-slate-900 dark:text-white hover:underline">
                      {ra.title}
                    </Link>
                  </div>
                  <a href={ra.origin_url} target="_blank" rel="noreferrer" className="text-[11px] text-slate-400 hover:underline">
                    원문 ↗
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ArticleDetailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 dark:bg-[#0B0F19] flex items-center justify-center">
        <div className="text-xs text-slate-400">기사 로딩 중...</div>
      </div>
    }>
      <ArticleDetailContent />
    </Suspense>
  );
}
