"use client";
import { useFetchActiveMyQuest } from "@/hooks/useMyQuests";
import MyQuestCreationForm from "./MyQuestCreationForm"; // 作成したコンポーネントをインポート
import MyQuestDetailView from "./MyQuestDetailView";   // 作成したコンポーネントをインポート

export default function MyQuestPage() {
  const { data: activeQuest, isLoading } = useFetchActiveMyQuest();

  if (isLoading) {
    return <div className="card p-5 text-center text-dim">Loading...</div>;
  }

  // activeQuest があれば詳細を、なければ作成フォームを表示
  return activeQuest 
    ? <MyQuestDetailView quest={activeQuest} /> 
    : <MyQuestCreationForm />;
}