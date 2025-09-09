"use client";
import { useFetchMyQuestById } from "@/hooks/useMyQuests";
import MyQuestDetailView from "../MyQuestDetailView";
import { useParams } from "next/navigation"; // 👈 useParamsをインポート

export default function MyQuestDetailPage() { // 👈 引数から params を削除
  const params = useParams(); // 👈 useParamsフックを使ってパラメータを取得
  const myQuestId = params.myQuestId as string; // 👈 取得したパラメータからIDを取り出す

  const { data: quest, isLoading } = useFetchMyQuestById(myQuestId);

  if (isLoading) {
    return <div className="card p-5 text-center text-dim">Loading...</div>;
  }
  
  if (!quest) {
    return <div className="card p-5 text-center text-red-600">Quest not found.</div>;
  }

  return <MyQuestDetailView quest={quest} />;
}