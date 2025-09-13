"use client";
import { useSearchParams, useRouter } from "next/navigation";
import { useState, useMemo } from "react";
import { useCreatePost } from "@/hooks/usePosts";
import { useFetchMyQuests } from "@/hooks/useMyQuests"; // 👈 修正: useFetchMyQuestsをインポート

export default function PostForm() {
  const params = useSearchParams();
  const router = useRouter();
  const preQuest = params.get("questId") ?? undefined;
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [selectedMyQuestId, setSelectedMyQuestId] = useState(""); // 👈 修正: stateをID管理に変更
  const create = useCreatePost();
  const { data: myQuests } = useFetchMyQuests(); // 👈 修正: useFetchMyQuestsを呼び出す

  // 挑戦中のマイクエストのみをフィルタリング
  const activeQuests = useMemo(() => {
    return myQuests?.filter(q => q.status === 'active') ?? [];
  }, [myQuests]);


  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() && !file) { alert("テキストか画像を入れてください"); return; }
    if (text.length > 300) { alert("300文字以内で入力してください"); return; }

    await create.mutateAsync({ text, file, questId: preQuest, myQuestId: selectedMyQuestId || undefined });

    setText(""); setFile(null);
    router.push("/app/timeline");
  };

  const err = create.error ? (create.error instanceof Error ? create.error.message : String(create.error)) : null;

  return (
    <div className="card p-5 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-[18px] font-semibold">投稿を作成</h2>
        {preQuest && <span className="badge">🎯 Quest Target</span>}
      </div>
      <form onSubmit={submit} className="space-y-3">
        <textarea
          className="textarea"
          rows={4}
          placeholder="今日の達成や進捗をシェア..."
          value={text}
          onChange={(e)=>setText(e.target.value)}
        />
        
        {/* 挑戦中のクエストがある場合のみセレクトボックスを表示 */}
        {activeQuests.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-slate-700">マイクエストに進捗を記録</label>
            <select
              value={selectedMyQuestId}
              onChange={(e) => setSelectedMyQuestId(e.target.value)}
              className="input mt-1"
            >
              <option value="">（紐付けない）</option>
              {activeQuests.map(quest => (
                <option key={quest.id} value={quest.id}>
                  {quest.title}
                </option>
              ))}
            </select>
          </div>
        )}

        <label htmlFor="file-upload" className="btn-ghost cursor-pointer btn">
          画像を追加
        </label>
        <input id="file-upload" name="file-upload" type="file" className="sr-only" accept="image/jpeg, image/png, image/webp, image/gif" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        <button className="btn-primary" type="submit" disabled={create.isPending}>
          {create.isPending ? "投稿中..." : "投稿"}
        </button>
        {err && <p className="text-red-600 text-sm">投稿に失敗しました：{err}</p>}
      </form>
    </div>
  );
}