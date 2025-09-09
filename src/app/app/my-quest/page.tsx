"use client";
import { useFetchMyQuests, MyQuest } from "@/hooks/useMyQuests";
import Link from "next/link";
import { useMemo } from "react";

const QuestListItem = ({ quest }: { quest: MyQuest }) => {
  const statusColor = quest.status === "active" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700";
  const statusText = quest.status === "active" ? "挑戦中" : "達成済み";

  return (
    <Link href={`/app/my-quest/${quest.id}`} className="block p-4 rounded-lg hover:bg-slate-50 border border-line transition-colors">
      <div className="flex justify-between items-center text-xs">
        <span className="font-semibold badge">{quest.category}</span>
        <span className={`font-semibold px-2 py-0.5 rounded-full ${statusColor}`}>{statusText}</span>
      </div>
      <h3 className="font-bold text-lg mt-2">{quest.title}</h3>
      <p className="text-sm text-dim mt-1">{quest.startDate} 〜 {quest.endDate}</p>
    </Link>
  )
};

export default function MyQuestListPage() {
  const { data: quests, isLoading } = useFetchMyQuests();
  
  const { activeQuests, completedQuests } = useMemo(() => {
    const active: MyQuest[] = [];
    const completed: MyQuest[] = [];
    (quests ?? []).forEach(q => {
      if (q.status === 'active') active.push(q);
      else completed.push(q);
    });
    return { activeQuests: active, completedQuests: completed };
  }, [quests]);

  if (isLoading) {
    return <div className="card p-5 text-center text-dim">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
            <h2 className="text-2xl font-bold">マイクエスト一覧</h2>
            <p className="text-dim mt-1 text-sm">あなたの挑戦の記録</p>
        </div>
        <Link href="/app/my-quest/new" className="btn-primary btn">新しい目標を立てる</Link>
      </div>

      {!quests || quests.length === 0 ? (
        <div className="card p-8 text-center text-dim">
          <p>まだマイクエストがありません。</p>
          <p>新しい目標を立てて、冒険を始めましょう！</p>
        </div>
      ) : (
        <div className="space-y-4">
          {activeQuests.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-bold text-lg">挑戦中のクエスト</h3>
              {activeQuests.map(q => <QuestListItem key={q.id} quest={q} />)}
            </div>
          )}
          {completedQuests.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-bold text-lg">達成済みのクエスト</h3>
              {completedQuests.map(q => <QuestListItem key={q.id} quest={q} />)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}