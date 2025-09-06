"use client";
import { useSearchParams, useRouter } from "next/navigation";
import { useState } from "react";
import { useCreatePost } from "@/hooks/usePosts";
import { useFetchActiveMyQuest } from "@/hooks/useMyQuests"; // 👈 追加

export default function PostForm() {
  const params = useSearchParams();
  const router = useRouter();
  const preQuest = params.get("questId") ?? undefined;
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [linkToMyQuest, setLinkToMyQuest] = useState(false); // 👈 追加
  const create = useCreatePost();
  const { data: activeQuest } = useFetchActiveMyQuest(); // 👈 追加

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() && !file) { alert("テキストか画像を入れてください"); return; }
    if (text.length > 300) { alert("300文字以内で入力してください"); return; }

    // 紐付ける場合はmyQuestIdを渡す
    const myQuestId = linkToMyQuest ? activeQuest?.id : undefined;
    await create.mutateAsync({ text, file, questId: preQuest, myQuestId });

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
        {/* activeQuestがある場合のみチェックボックスを表示 */}
        {activeQuest && (
          <label className="flex items-center gap-2 cursor-pointer">
            <input 
              type="checkbox"
              checked={linkToMyQuest}
              onChange={(e) => setLinkToMyQuest(e.target.checked)}
              className="rounded"
            />
            <span className="text-sm">今月のマイクエストへの進捗として記録する</span>
          </label>
        )}
        <label className="btn-ghost cursor-pointer">
          画像を追加
          <input type="file" accept="image/*" className="hidden" onChange={(e)=>setFile(e.target.files?.[0] ?? null)} />
        </label>
        <button className="btn-primary" type="submit" disabled={create.isPending}>
          {create.isPending ? "投稿中..." : "投稿"}
        </button>
        {err && <p className="text-red-600 text-sm">投稿に失敗しました：{err}</p>}
      </form>
    </div>
  );
}