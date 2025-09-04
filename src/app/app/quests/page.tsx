"use client";

import { useDailyQuestsCommon } from "@/hooks/useQuests";
import Link from "next/link";

export default function QuestsPage() {
  const { data: quests, isLoading, error } = useDailyQuestsCommon(3);

  if (isLoading) return <p>Loading quests...</p>;
  if (error) return <p className="text-red-600">Error loading quests</p>;

  return (
    <div className="space-y-4">
      {/* ストーリーズ風のヘッダ（BeReal/IGの軽い帯） */}
      <div className="card p-4 flex items-center justify-between">
        <div>
          <h2 className="text-[18px] font-semibold">今日のクエスト</h2>
          <p className="text-[13px] text-dim">全員共通の3件。好きなものから挑戦！</p>
        </div>
        <Link href="/app/timeline" className="btn-ghost">タイムライン</Link>
      </div>

      <div className="space-y-3">
        {quests?.map((q, i) => (
          <article key={q.id} className="card p-5">
            <div className="flex items-center justify-between text-[12px]">
              <span className="badge">#{q.tag}</span>
              <span className="text-dim">Quest {i + 1}</span>
            </div>
            <h3 className="mt-2 text-[18px] font-semibold">{q.title}</h3>
            <p className="mt-1 text-[14px] text-slate-700">{q.description}</p>
            <div className="mt-3 flex gap-2">
              <Link href={`/app/post?questId=${q.id}`} className="btn-primary btn">
                達成を投稿
              </Link>
              <Link href="/app/timeline" className="btn-ghost btn">みんなの達成</Link>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

