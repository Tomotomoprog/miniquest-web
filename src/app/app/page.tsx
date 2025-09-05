"use client";
import Link from "next/link";
import { useDailyQuests } from "@/hooks/useQuests"; // 変更: useDailyQuestsCommon -> useDailyQuests

export default function HomeApp() {
  const { data: quests, isLoading, error } = useDailyQuests(3); // 変更

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold">今日のクエスト</h2>
        <p className="text-dim mt-1">好きなものから挑戦しよう</p>
      </div>

      {isLoading && <div className="card p-5 text-center text-dim">Loading...</div>}
      {error && <div className="card p-5 text-center text-red-600">Error loading quests</div>}

      <div className="grid gap-4">
        {quests?.map((q) => (
          <article key={q.id} className="card p-5">
            {/* 変更: q.hashtag -> q.tag */}
            <div className="text-[12px] font-medium text-brand-600">#{q.tag}</div>
            <h3 className="mt-1.5 text-xl font-semibold">{q.title}</h3>
            <p className="mt-2 text-slate-700">{q.description}</p>
            <div className="mt-4 flex gap-3">
              <Link href={`/app/post?questId=${q.id}`} className="btn-primary btn">達成を投稿</Link>
              <Link href={`/app/timeline?questId=${q.id}`} className="btn-ghost btn">このクエストの投稿</Link>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}