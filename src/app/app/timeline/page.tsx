"use client";
import { usePosts, useToggleLike, useMyLikedPostIds } from "@/hooks/usePosts";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

export default function TimelinePage() {
  const params = useSearchParams();
  const questId = params.get("questId") ?? undefined;

  const { data: posts, isLoading, error } = usePosts(questId);
  const { data: likedSet } = useMyLikedPostIds();
  const toggleLike = useToggleLike();

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-[18px] font-semibold">タイムライン</h2>
        <div className="flex gap-2">
          <Link href="/app/timeline" className={`btn ${questId ? "btn-ghost" : "btn-primary"}`}>All</Link>
          {questId && <Link href="/app/timeline" className="btn-ghost">クリア</Link>}
        </div>
      </div>

      {isLoading && <div className="card p-4">Loading...</div>}
      {error && <div className="card p-4 text-red-600">Error loading posts</div>}

      {posts?.map((p) => {
        const liked = likedSet?.has(p.id);
        return (
          <article key={p.id} className="card p-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-gray-200" />
              <div className="text-[14px]">
                <div className="font-medium">{p.userName}</div>
                {p.questTitle && <div className="text-[12px] text-dim">🗺️ {p.questTitle}</div>}
              </div>
            </div>

            {p.text && <p className="text-[15px] leading-relaxed">{p.text}</p>}

            {p.photoURL && (
              <div className="relative w-full h-[60vh] media">
                <Image src={p.photoURL} alt="" fill className="object-cover" />
              </div>
            )}

            <div className="flex items-center gap-8">
              <button
                className={`btn-icon ${liked ? "bg-black text-white" : ""}`}
                onClick={() => toggleLike.mutate(p.id)}
                disabled={toggleLike.isPending}
                aria-pressed={liked}
                title="いいね"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill={liked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.6">
                  <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 1 0-7.8 7.8l1 1L12 22l7.8-8.6 1-1a5.5 5.5 0 0 0 0-7.8Z"/>
                </svg>
              </button>
              <span className="text-[13px] text-dim -ml-6">{p.likeCount ?? 0}</span>
            </div>
          </article>
        );
      })}

      {posts && posts.length === 0 && (
        <div className="card p-6 text-center text-dim">まだ投稿がありません。</div>
      )}
    </div>
  );
}
