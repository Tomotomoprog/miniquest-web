"use client";

import { usePosts, useToggleLike, useMyLikedPostIds } from "@/hooks/usePosts";
import Image from "next/image";

export default function TimelinePage() {
  const { data: posts, isLoading, error } = usePosts();
  const { data: likedSet } = useMyLikedPostIds();
  const toggleLike = useToggleLike();

  if (isLoading) return <p className="p-4">Loading timeline...</p>;
  if (error) return <p className="p-4 text-red-600">Error loading posts</p>;

  return (
    <div className="p-4 grid gap-3">
      <h2 className="text-xl font-semibold">タイムライン</h2>
      {posts?.map((p) => {
        const liked = likedSet?.has(p.id);
        return (
          <article key={p.id} className="rounded-2xl border p-4 space-y-3">
            <div className="text-xs opacity-60">{p.userName}</div>

            {/* クエスト紐づけ表示 */}
            {p.questTitle && (
              <div className="text-xs inline-block rounded-full bg-gray-100 px-2 py-1">
                🗺️ {p.questTitle}
              </div>
            )}

            <p className="whitespace-pre-wrap text-sm">{p.text}</p>

            {p.photoURL && (
              <div className="relative w-full h-80">
                <Image src={p.photoURL} alt="" fill className="object-cover rounded-xl" />
              </div>
            )}

            <div className="flex items-center gap-3">
              <button
                disabled={toggleLike.isPending}
                onClick={() => toggleLike.mutate(p.id)}
                className={`text-sm rounded-full px-3 py-1 border ${liked ? "bg-black text-white" : ""}`}
                aria-pressed={liked}
              >
                {liked ? "いいね中" : "いいね"} {p.likeCount ?? 0}
              </button>
            </div>
          </article>
        );
      })}
      {posts?.length === 0 && <p className="opacity-70">まだ投稿がありません。</p>}
    </div>
  );
}

