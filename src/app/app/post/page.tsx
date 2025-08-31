"use client";

import { useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCreatePost } from "@/hooks/usePosts";

export default function PostPage() {
  const params = useSearchParams();
  const preselectedQuestId = params.get("questId") || undefined;

  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const { mutateAsync, isPending, error } = useCreatePost();
  const router = useRouter();

  const questBadge = useMemo(() => {
    if (!preselectedQuestId) return null;
    return (
      <span className="inline-block text-xs rounded-full bg-gray-100 px-2 py-1">
        クエスト選択中: {preselectedQuestId}
      </span>
    );
  }, [preselectedQuestId]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() && !file) { alert("テキストか画像を入れてください"); return; }
    if (text.length > 300) { alert("300文字以内で入力してください"); return; }

    await mutateAsync({ text, file, questId: preselectedQuestId });
    setText(""); setFile(null);
    router.push("/app/timeline");
  };

  return (
    <div className="p-4 max-w-xl mx-auto space-y-3">
      <h2 className="text-xl font-semibold">達成報告を投稿</h2>
      {questBadge}
      <form onSubmit={submit} className="space-y-3">
        <textarea
          className="w-full rounded-xl border p-3"
          placeholder="今日の達成をひとことで…"
          rows={4}
          value={text}
          onChange={(e)=>setText(e.target.value)}
        />
        <input type="file" accept="image/*" onChange={(e)=>setFile(e.target.files?.[0] ?? null)} />
        <button type="submit" disabled={isPending} className="rounded-xl bg-black text-white px-4 py-2 disabled:opacity-60">
          {isPending ? "投稿中..." : "投稿する"}
        </button>
        {error && <p className="text-red-600 text-sm">投稿に失敗しました：{(error as any)?.message}</p>}
      </form>
    </div>
  );
}
