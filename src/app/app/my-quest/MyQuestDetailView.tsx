"use client";
import { MyQuest, useCompleteMyQuest, usePostsForMyQuest, useDeleteMyQuest } from "@/hooks/useMyQuests";
import { auth } from "@/lib/firebase"; // 👈 authをインポート
import Link from "next/link";
import { useRouter } from "next/navigation";
import PostCard from "@/components/PostCard"; // 👈 PostCardをインポート

export default function MyQuestDetailView({ quest }: { quest: MyQuest }) {
  const { data: posts, isLoading: isLoadingPosts } = usePostsForMyQuest(quest.id);
  const completeQuest = useCompleteMyQuest();
  const deleteQuest = useDeleteMyQuest();
  const router = useRouter();
  const currentUser = auth.currentUser; // 👈 現在のユーザーを取得

  const handleComplete = async () => {
    if (window.confirm("この目標を完了しますか？素晴らしい冒険でした！完了するとボーナスXPが付与されます。")) {
      await completeQuest.mutateAsync(quest);
      router.push('/app/my-quest');
    }
  };

  const handleDelete = async () => {
    if (window.confirm("このクエストを本当に削除しますか？関連する投稿は削除されませんが、クエストとの紐付けは解除されます。")) {
      await deleteQuest.mutateAsync(quest.id);
      router.push('/app/my-quest');
    }
  };

  // 👈 このクエストが自分のものかどうかを判定
  const isMyQuest = currentUser?.uid === quest.uid;

  return (
    <div className="space-y-6">
      <div className="card p-5">
        <div className="flex justify-between items-start">
          <div>
            <span className="badge">{quest.category}</span>
            <span className="text-sm font-semibold ml-2">{quest.startDate} 〜 {quest.endDate}</span>
          </div>
          {/* ▼▼▼▼▼ isMyQuestがtrueの場合のみボタンを表示 ▼▼▼▼▼ */}
          {isMyQuest && quest.status === 'active' && (
            <div className="flex items-center gap-2">
              <Link href={`/app/my-quest/${quest.id}/edit`} className="btn-ghost btn !px-3 !py-1 text-xs">
                編集
              </Link>
              <button onClick={handleDelete} disabled={deleteQuest.isPending} className="btn-ghost btn !px-3 !py-1 text-xs text-red-600">
                削除
              </button>
            </div>
          )}
          {/* ▲▲▲▲▲ 変更ここまで ▲▲▲▲▲ */}
        </div>
        <h2 className="text-2xl font-bold mt-2">{quest.title}</h2>
        <p className="text-dim mt-2 whitespace-pre-wrap">{quest.motivation}</p>
        
        {/* ▼▼▼▼▼ isMyQuestがtrueの場合のみ完了ボタンを表示 ▼▼▼▼▼ */}
        {isMyQuest && quest.status === 'active' && (
          <button
            onClick={handleComplete}
            disabled={completeQuest.isPending}
            className="btn-primary btn w-full mt-4"
          >
            {completeQuest.isPending ? "処理中..." : "🎉 この目標を完了する"}
          </button>
        )}
         {quest.status === 'completed' && (
            <div className="mt-4 text-center font-bold text-green-600 bg-green-50 p-3 rounded-lg">
                🎉 達成おめでとうございます！ 🎉
            </div>
         )}
      </div>

      <div className="card p-5">
        <h3 className="text-xl font-bold">冒険の記録</h3>
        {/* ▼▼▼ isMyQuestがtrueの場合のみ投稿ボタンを表示 ▼▼▼ */}
        {isMyQuest &&
            <Link href="/app/post" className="text-sm text-brand-600 hover:underline">
                ＋ 今日の進捗を記録する
            </Link>
        }
        <div className="mt-4 space-y-4">
          {isLoadingPosts && <p className="text-dim">記録を読み込み中...</p>}
          {posts && posts.length > 0 ? (
            posts.map(post => <PostCard key={post.id} post={post} />)
          ) : (
            <p className="text-dim text-center py-4">まだ進捗の記録がありません。</p>
          )}
        </div>
      </div>
    </div>
  );
}