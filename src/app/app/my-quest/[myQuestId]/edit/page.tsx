"use client";
import { useFetchMyQuestById } from "@/hooks/useMyQuests";
import MyQuestCreationForm from "../../MyQuestCreationForm";

export default function EditMyQuestPage({ params }: { params: { myQuestId: string } }) {
  const { myQuestId } = params;
  const { data: quest, isLoading } = useFetchMyQuestById(myQuestId);

  if (isLoading) {
    return <div className="card p-5 text-center text-dim">Loading...</div>;
  }
  
  if (!quest) {
    return <div className="card p-5 text-center text-red-600">Quest not found.</div>;
  }

  // 既存のフォームコンポーネントに取得したクエストデータを渡す
  return <MyQuestCreationForm initialQuest={quest} />;
}