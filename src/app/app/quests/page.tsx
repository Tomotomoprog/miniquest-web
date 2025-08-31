"use client";

import { useDailyQuestsCommon } from "@/hooks/useQuests";
import Link from "next/link";

export default function QuestsPage() {
  const { data: quests, isLoading, error } = useDailyQuestsCommon(3);
  if (isLoading) return <p className="p-4">Loading quests...</p>;
  if (error) return <p className="p-4 text-red-600">Error loading quests</p>;

  return (
    <div className="p-4 grid gap-3">
      <h2 className="text-xl font-semibold">今日のクエスト（共通3件）</h2>
      {quests?.map((q) => (
        <div key={q.id} className="rounded-2xl border p-4 shadow-sm space-y-2">
          <div className="text-xs opacity-60">{q.tag}</div>
          <div className="text-lg font-medium">{q.title}</div>
          <p className="text-sm">{q.description}</p>
          <div>
            <Link
              href={`/app/post?questId=${q.id}`}
              className="inline-block text-sm rounded-xl border px-3 py-1 hover:bg-gray-50"
            >
              このクエストの達成を投稿
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}

