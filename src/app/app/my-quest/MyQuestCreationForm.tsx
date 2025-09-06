"use client";
import { useState } from "react";
import { useCreateMyQuest } from "@/hooks/useMyQuests";
import { QuestCategory } from "@/hooks/useQuests";

const categories: QuestCategory[] = ["Life", "Study", "Physical", "Social", "Creative", "Mental"];

export default function MyQuestCreationForm() {
  const [title, setTitle] = useState("");
  const [motivation, setMotivation] = useState("");
  const [category, setCategory] = useState<QuestCategory>("Life");
  const createQuest = useCreateMyQuest();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !motivation.trim()) {
      alert("目標と意気込みの両方を入力してください。");
      return;
    }
    await createQuest.mutateAsync({ title, motivation, category });
  };

  return (
    <div className="card p-5">
      <h2 className="text-xl font-bold">今月のマイクエストを設定</h2>
      <p className="text-dim text-sm mt-1">
        今月一番挑戦したい、大きな目標を立てて冒険を始めよう！
      </p>
      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700">
            クエスト名（目標）
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="例：基本情報技術者試験に合格する"
            className="input mt-1"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">
            カテゴリ
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as QuestCategory)}
            className="input mt-1"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">
            意気込み（なぜ挑戦する？）
          </label>
          <textarea
            value={motivation}
            onChange={(e) => setMotivation(e.target.value)}
            placeholder="例：スキルアップして、もっと面白いものを作りたいから！"
            className="textarea mt-1"
            rows={3}
            required
          />
        </div>
        <button
          type="submit"
          className="btn-primary btn w-full"
          disabled={createQuest.isPending}
        >
          {createQuest.isPending ? "作成中..." : "この目標で冒険を始める"}
        </button>
        {createQuest.error && (
          <p className="text-red-600 text-sm">
            エラー: {createQuest.error.message}
          </p>
        )}
      </form>
    </div>
  );
}