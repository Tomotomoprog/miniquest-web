"use client";
import Link from "next/link";
import { useDailyQuestsCommon } from "@/hooks/useQuests";

export default function HomeApp() {
  const { data: quests, isLoading, error } = useDailyQuestsCommon(3);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-[22px] font-semibold">今日のクエスト</h2>
        <p className="text-[13px] text-dim">好きなものから挑戦しよう</p>
      </div>

      {isLoading && <div className="card p-4">Loading...</div>}
      {error && <div className="card p-4 text-red-600">Error loading quests</div>}

      <div className="grid gap-3">
        {quests?.map((q) => (
          <article key={q.id} className="card p-5">
            <div className="text-[12px] text-dim">#{q.hashtag}</div>
            <h3 className="mt-1 text-[18px] font-semibold">{q.title}</h3>
            <p className="mt-1 text-[14px] text-slate-700">{q.description}</p>
            <div className="mt-3 flex gap-2">
              <Link href={`/app/post?questId=${q.id}`} className="btn-primary btn">達成を投稿</Link>
              <Link href={`/app/timeline?questId=${q.id}`} className="btn-ghost btn">このクエストの投稿</Link>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

