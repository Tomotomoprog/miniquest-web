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
    <div className="max-w-xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">タイムライン</h2>
        {questId && (
            <Link href="/app/timeline" className="text-sm font-medium text-brand-600 hover:underline">
              すべての投稿を表示
            </Link>
        )}
      </div>

      {isLoading && <div className="card p-5 text-center text-dim">Loading...</div>}
      {error && <div className="card p-5 text-center text-red-600">Error loading posts</div>}

      <div className="space-y-4">
        {posts?.map((p) => {
          const liked = likedSet?.has(p.id);
          return (
            <article key={p.id} className="card p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gray-200 overflow-hidden relative">
                  {p.photoURL && <Image src={p.photoURL} alt={p.userName} fill className="object-cover" />}
                </div>
                <div className="text-sm">
                  <div className="font-bold">{p.userName}</div>
                  {p.questTitle && <div className="text-xs text-dim">🗺️ {p.questTitle}</div>}
                </div>
              </div>

              {p.text && <p className="text-base leading-relaxed whitespace-pre-wrap">{p.text}</p>}

              {p.photoURL && (
                <div className="relative w-full aspect-[4/5] media">
                  <Image src={p.photoURL} alt="" fill className="object-cover" />
                </div>
              )}

              <div className="flex items-center gap-3 pt-1">
                <button
                  className={`flex items-center gap-2 text-sm font-medium transition ${liked ? "text-red-500" : "text-slate-500 hover:text-slate-800"}`}
                  onClick={() => toggleLike.mutate(p.id)}
                  disabled={toggleLike.isPending}
                  aria-pressed={liked}
                  title="いいね"
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill={liked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                  </svg>
                  <span>{p.likeCount ?? 0}</span>
                </button>
              </div>
            </article>
          );
        })}

        {posts && posts.length === 0 && (
          <div className="card p-8 text-center text-dim">まだ投稿がありません。</div>
        )}
      </div>
    </div>
  );
}