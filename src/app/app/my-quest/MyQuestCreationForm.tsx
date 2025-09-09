"use client";
import { useState, useEffect } from "react"; // 👈 useEffectをインポート
import { useCreateMyQuest, useUpdateMyQuest, MyQuest } from "@/hooks/useMyQuests"; // 👈 useUpdateMyQuest, MyQuestをインポート
import { QuestCategory } from "@/hooks/useQuests";
import { useRouter } from "next/navigation";

const categories: QuestCategory[] = ["Life", "Study", "Physical", "Social", "Creative", "Mental"];

// フォームが新規作成と編集の両方で使えるように、initialQuestを受け取る
export default function MyQuestCreationForm({ initialQuest }: { initialQuest?: MyQuest }) {
  const [title, setTitle] = useState("");
  const [motivation, setMotivation] = useState("");
  const [category, setCategory] = useState<QuestCategory>("Life");
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState("");

  const createQuest = useCreateMyQuest();
  const updateQuest = useUpdateMyQuest(); // 👈 更新フックを呼び出す
  const router = useRouter();

  const isEditing = !!initialQuest; // 👈 編集モードかどうかを判定

  // 編集モードの場合、フォームに初期値をセットする
  useEffect(() => {
    if (isEditing) {
      setTitle(initialQuest.title);
      setMotivation(initialQuest.motivation);
      setCategory(initialQuest.category);
      setStartDate(initialQuest.startDate);
      setEndDate(initialQuest.endDate);
    }
  }, [initialQuest, isEditing]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !motivation.trim() || !startDate || !endDate) {
      alert("すべての項目を入力してください。");
      return;
    }
    if (new Date(startDate) > new Date(endDate)) {
      alert("終了日は開始日より後の日付に設定してください。");
      return;
    }

    if (isEditing) {
      // 編集モードの場合
      await updateQuest.mutateAsync({ 
        questId: initialQuest.id, 
        title, motivation, category, startDate, endDate 
      });
      router.push(`/app/my-quest/${initialQuest.id}`);
    } else {
      // 新規作成モードの場合
      await createQuest.mutateAsync({ title, motivation, category, startDate, endDate });
      router.push("/app/my-quest");
    }
  };
  
  const isPending = createQuest.isPending || updateQuest.isPending;

  return (
    <div className="card p-5">
      <h2 className="text-xl font-bold">{isEditing ? "マイクエストを編集" : "新しいマイクエストを設定"}</h2>
      <p className="text-dim text-sm mt-1">
        {isEditing ? "目標内容を更新できます。" : "期間を決めて、新しい目標に挑戦しよう！"}
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
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">開始日</label>
            <input 
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="input mt-1"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">終了日</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="input mt-1"
              required
            />
          </div>
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
          disabled={isPending}
        >
          {isPending ? (isEditing ? "更新中..." : "作成中...") : (isEditing ? "この内容で更新する" : "この目標で冒険を始める")}
        </button>
        {(createQuest.error || updateQuest.error) && (
          <p className="text-red-600 text-sm">
            エラー: {createQuest.error?.message || updateQuest.error?.message}
          </p>
        )}
      </form>
    </div>
  );
}