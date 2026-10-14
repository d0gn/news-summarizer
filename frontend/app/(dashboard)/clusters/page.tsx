"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import ArticleCard from "@/components/ArticleCard";
import ArticleModal from "@/components/ArticleModal";

export default function ClustersPage() {
  const [clusters, setClusters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedArticle, setSelectedArticle] = useState<any | null>(null);

  useEffect(() => {
    fetchClusters();
  }, []);

  const fetchClusters = async () => {
    try {
      const res = await api.get("/articles/clusters");
      setClusters(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-xl font-black text-slate-900 dark:text-white">
          실시간 이슈 클러스터 🔮
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          유사한 뉴스들을 AI가 자동으로 클러스터링하여 주요 이슈 트렌드를 제공합니다.
        </p>
      </div>

      {loading ? (
        <div className="space-y-6">
          {[1, 2].map((i) => (
            <div key={i} className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 animate-pulse h-48"></div>
          ))}
        </div>
      ) : clusters.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-12 text-center">
          <p className="text-3xl mb-3">📭</p>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            생성된 이슈 클러스터가 없습니다
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            기사가 수집되고 클러스터링 파이프라인이 실행되면 여기에 표시됩니다.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {clusters.map((cluster) => (
            <div
              key={cluster.id}
              className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm"
            >
              <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white font-bold flex items-center justify-center text-xs">
                    #
                  </span>
                  <div>
                    <h2 className="text-base font-black text-slate-900 dark:text-white">
                      {cluster.title}
                    </h2>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      관련 기사 {cluster.article_count || cluster.articles?.length || 0}건 · 생성일: {new Date(cluster.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {cluster.articles?.map((article: any) => (
                  <ArticleCard
                    key={article.id}
                    article={article}
                    onOpenModal={setSelectedArticle}
                  />
                ))}
              </div>
            </div>
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
