"use client";

import { useQuests } from "@/hooks/useQuests";

export default function QuestsPage() {
  const { data: quests, isLoading, error } = useQuests();

  if (isLoading) return <p className="p-4">Loading quests...</p>;
  if (error) return <p className="p-4 text-red-600">Error loading quests</p>;

  return (
    <div className="p-4 grid gap-3">
      <h2 className="text-xl font-semibold">今日のクエスト</h2>
      {quests?.map((q) => (
        <div key={q.id} className="rounded-2xl border p-4 shadow-sm">
          <div className="text-xs opacity-60">{q.tag}</div>
          <div className="text-lg font-medium">{q.title}</div>
          <p className="text-sm mt-1">{q.description}</p>
        </div>
      ))}
    </div>
  );
}
