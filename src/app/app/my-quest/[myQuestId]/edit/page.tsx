"use client";
import { useFetchMyQuestById } from "@/hooks/useMyQuests";
import MyQuestCreationForm from "../../MyQuestCreationForm";
import { useParams } from "next/navigation"; // 👈 useParamsをインポート

// ページコンポーネントの引数からparamsを削除
export default function EditMyQuestPage() {
  const params = useParams(); // 👈 useParamsフックを使ってパラメータを取得
  const myQuestId = params.myQuestId as string; // 👈 取得したパラメータからIDを取り出す

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