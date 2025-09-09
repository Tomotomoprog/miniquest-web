"use client";
import { useUserProfile } from "@/hooks/useProfile";
import Image from "next/image";
import { useMemo } from "react";
import { UserStats } from "@/utils/progression";
import { useFetchMyQuests, MyQuest } from "@/hooks/useMyQuests";
import { usePosts } from "@/hooks/usePosts";
import Link from "next/link";
import PostCard from "@/components/PostCard"; // 👈 PostCardをインポート

// プログレスバーのコンポーネント
const ProgressBar = ({ value, max, label, colorClass }: { value: number, max: number, label: string, colorClass: string }) => {
  const percentage = max > 0 ? (value / max) * 100 : 0;
  return (
    <div>
      <div className="flex justify-between items-end mb-1">
        <span className="font-semibold text-sm">{label}</span>
        <span className="text-xs text-dim font-medium">{value} / {max}</span>
      </div>
      <div className="w-full bg-slate-200 rounded-full h-2.5">
        <div className={`${colorClass} h-2.5 rounded-full transition-all duration-500`} style={{ width: `${percentage}%` }}></div>
      </div>
    </div>
  );
}

// クエストリストのアイテム
const QuestListItem = ({ quest }: { quest: MyQuest }) => {
    return (
      <Link href={`/app/my-quest/${quest.id}`} className="block p-4 rounded-lg hover:bg-slate-50 border border-line transition-colors">
        <div className="flex justify-between items-center text-xs">
          <span className="font-semibold badge">{quest.category}</span>
        </div>
        <h3 className="font-bold text-lg mt-2">{quest.title}</h3>
        <p className="text-sm text-dim mt-1">{quest.startDate} 〜 {quest.endDate}</p>
      </Link>
    )
  };

export default function UserProfilePage({ params }: { params: { userId: string } }) {
  const { userId } = params;
  const { data, isLoading, error } = useUserProfile(userId);
  const { data: quests, isLoading: isLoadingQuests } = useFetchMyQuests(userId);
  const { data: posts, isLoading: isLoadingPosts } = usePosts({ userId });

  const activeQuests = useMemo(() => {
    return quests?.filter(q => q.status === 'active') ?? [];
  }, [quests]);

  // ▼▼▼▼▼ 共通クエストの投稿のみをフィルタリングするロジックを追加 ▼▼▼▼▼
  const commonPosts = useMemo(() => {
    return posts?.filter(p => !p.myQuestId) ?? [];
  }, [posts]);
  // ▲▲▲▲▲ 追加ここまで ▲▲▲▲▲

  if (isLoading) {
    return <div className="card p-5 text-center">Loading Profile...</div>;
  }

  if (error) {
    return <div className="card p-5 text-center text-red-600">Error: {error.message}</div>;
  }

  const categories: (keyof UserStats)[] = ["Life", "Study", "Physical", "Social", "Creative", "Mental"];

  return (
    <div className="space-y-6">
      <section className="card p-6 flex flex-col items-center text-center">
        <div className="h-24 w-24 rounded-full bg-gray-200 relative overflow-hidden ring-4 ring-white shadow-md">
          {data?.profile.photoURL && <Image src={data.profile.photoURL} alt="profile" fill className="object-cover" />}
        </div>

        <div className="mt-4 w-full max-w-xs">
          <div className="text-2xl font-bold">{data?.profile.username ?? data?.profile.displayName ?? "ユーザー"}</div>
        </div>

        <div className="w-full max-w-xs mt-6 space-y-1">
          <div className="text-base text-dim">
            Lv.{data?.level ?? 1}
          </div>
          <div className="text-lg font-semibold text-brand-600">{data?.classInfo.title ?? "未設定"}</div>
        </div>

        <div className="w-full max-w-xs mt-4">
          {data?.xpProgress && (
            <ProgressBar
              label="次のレベルまで"
              value={data.xpProgress.xpInCurrentLevel}
              max={data.xpProgress.xpNeededForNextLevel}
              colorClass="bg-amber-400"
            />
          )}
        </div>
      </section>

      <section className="card p-6">
        <h3 className="text-xl font-bold mb-4">ジャンル達成度</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-6">
          {categories.map((k) => {
            const value = data?.profile.stats?.[k] ?? 0;
            const nextMilestone = value === 0 ? 10 : Math.ceil(value / 10) * 10;
            return (
              <ProgressBar
                key={k}
                label={k}
                value={value}
                max={nextMilestone}
                colorClass="bg-sky-500"
              />
            );
          })}
        </div>
      </section>

      <section className="card p-6">
        <h3 className="text-xl font-bold">{data?.profile.displayName}の挑戦中のマイクエスト</h3>
        <div className="mt-4">
          {isLoadingQuests ? (
            <p className="text-dim text-center py-4">クエストを読み込み中...</p>
          ) : (
            activeQuests.length > 0 ? (
                <div className="space-y-3">
                    {activeQuests.map(q => <QuestListItem key={q.id} quest={q} />)}
                </div>
            ) : (
                <p className="text-dim text-center py-4">挑戦中のクエストはありません。</p>
            )
          )}
        </div>
      </section>
      
      {/* ▼▼▼▼▼ 共通クエストの投稿履歴セクションを追加 ▼▼▼▼▼ */}
      <section className="card p-6">
        <h3 className="text-xl font-bold">{data?.profile.displayName}の投稿履歴</h3>
        <div className="mt-4">
          {isLoadingPosts ? (
            <p className="text-dim text-center py-4">投稿を読み込み中...</p>
          ) : (
            commonPosts.length > 0 ? (
                <div className="space-y-4">
                    {commonPosts.map(p => <PostCard key={p.id} post={p} />)}
                </div>
            ) : (
                <p className="text-dim text-center py-4">まだ投稿がありません。</p>
            )
          )}
        </div>
      </section>
      {/* ▲▲▲▲▲ 追加ここまで ▲▲▲▲▲ */}
    </div>
  );
}