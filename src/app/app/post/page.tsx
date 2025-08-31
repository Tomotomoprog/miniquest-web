"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCreatePost } from "@/hooks/usePosts";

export default function PostPage() {
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const { mutateAsync, isPending, error } = useCreatePost();
  const router = useRouter();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    // 送信前バリデーション
    if (!text.trim() && !file) { alert("テキストか画像を入れてください"); return; }
    if (text.length > 300) { alert("300文字以内で入力してください"); return; }
    if (!text.trim() && !file) return;
    await mutateAsync({ text, file });
    setText("");
    setFile(null);
    router.push("/app/timeline");
  };

  return (
    <div className="p-4 max-w-xl mx-auto">
      <h2 className="text-xl font-semibold mb-3">達成報告を投稿</h2>
      <form onSubmit={submit} className="space-y-3">
        <textarea
          className="w-full rounded-xl border p-3"
          placeholder="今日の達成をひとことで…"
          rows={4}
          value={text}
          onChange={(e)=>setText(e.target.value)}
        />
        <input
          type="file"
          accept="image/*"
          onChange={(e)=>setFile(e.target.files?.[0] ?? null)}
          className="block"
        />
        <button
          type="submit"
          disabled={isPending}
          className="rounded-xl bg-black text-white px-4 py-2 disabled:opacity-60"
        >
          {isPending ? "投稿中..." : "投稿する"}
        </button>
        {error && <p className="text-red-600 text-sm">投稿に失敗しました：{(error as any)?.message}</p>}
      </form>
    </div>
  );
}
