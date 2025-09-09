"use client";
import { useFetchMyQuestById } from "@/hooks/useMyQuests";
import MyQuestDetailView from "../MyQuestDetailView";

export default function MyQuestDetailPage({ params }: { params: { myQuestId: string } }) {
  // paramsから直接myQuestIdを取得します
  const { myQuestId } = params;
  const { data: quest, isLoading } = useFetchMyQuestById(myQuestId);

  if (isLoading) {
    return <div className="card p-5 text-center text-dim">Loading...</div>;
  }
  
  if (!quest) {
    return <div className="card p-5 text-center text-red-600">Quest not found.</div>;
  }

  return <MyQuestDetailView quest={quest} />;
}