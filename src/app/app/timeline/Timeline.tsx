"use client";
import { usePosts } from "@/hooks/usePosts";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import PostCard from "@/components/PostCard"; // 👈 PostCardをインポート

export default function Timeline() {
  const params = useSearchParams();
  const questId = params.get("questId") ?? undefined;

  const { data: posts, isLoading, error } = usePosts({ questId });

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
        {posts?.map((p) => (
          <PostCard key={p.id} post={p} /> // 👈 ここを変更
        ))}

        {posts && posts.length === 0 && (
          <div className="card p-8 text-center text-dim">まだ投稿がありません。</div>
        )}
      </div>
    </div>
  );
}