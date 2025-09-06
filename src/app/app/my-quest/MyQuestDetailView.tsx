"use client";
import { MyQuest, useCompleteMyQuest, usePostsForMyQuest } from "@/hooks/useMyQuests";
import { Post } from "@/hooks/usePosts";
import Image from "next/image";
import Link from "next/link";

// 投稿をリスト表示するためのサブコンポーネント
const PostItem = ({ post }: { post: Post }) => (
  <div className="border-t border-line py-4">
    <p className="whitespace-pre-wrap text-sm">{post.text}</p>
    {post.photoURL && (
      <div className="relative mt-2 w-full aspect-video rounded-lg overflow-hidden">
        <Image src={post.photoURL} alt="投稿画像" fill className="object-cover" />
      </div>
    )}
    <p className="text-xs text-dim mt-2">
      {new Date(post.createdAt?.toDate()).toLocaleString('ja-JP')}
    </p>
  </div>
);

export default function MyQuestDetailView({ quest }: { quest: MyQuest }) {
  const { data: posts, isLoading: isLoadingPosts } = usePostsForMyQuest(quest.id);
  const completeQuest = useCompleteMyQuest();

  const handleComplete = () => {
    if (window.confirm("この目標を完了しますか？素晴らしい冒険でした！完了するとボーナスXPが付与されます。")) {
      completeQuest.mutate(quest);
    }
  };

  return (
    <div className="space-y-6">
      {/* 目標詳細カード */}
      <div className="card p-5">
        <span className="badge">{quest.category}</span>
        <h2 className="text-2xl font-bold mt-2">{quest.title}</h2>
        <p className="text-dim mt-2 whitespace-pre-wrap">{quest.motivation}</p>
        <button
          onClick={handleComplete}
          disabled={completeQuest.isPending}
          className="btn-primary btn w-full mt-4"
        >
          {completeQuest.isPending ? "処理中..." : "🎉 この目標を完了する"}
        </button>
      </div>

      {/* 冒険の記録（進捗タイムライン） */}
      <div className="card p-5">
        <h3 className="text-xl font-bold">冒険の記録</h3>
        <Link href="/app/post" className="text-sm text-brand-600 hover:underline">
          ＋ 今日の進捗を記録する
        </Link>
        <div className="mt-4">
          {isLoadingPosts && <p className="text-dim">記録を読み込み中...</p>}
          {posts && posts.length > 0 ? (
            posts.map(post => <PostItem key={post.id} post={post} />)
          ) : (
            <p className="text-dim text-center py-4">まだ進捗の記録がありません。</p>
          )}
        </div>
      </div>
    </div>
  );
}