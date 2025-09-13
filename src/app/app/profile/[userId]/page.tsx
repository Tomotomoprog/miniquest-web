"use client";
import { useUserProfile, UserProfile } from "@/hooks/useProfile";
import Image from "next/image";
import { useMemo, useState } from "react";
import { UserStats } from "@/utils/progression";
import { useFetchMyQuests, MyQuest } from "@/hooks/useMyQuests";
import { usePosts } from "@/hooks/usePosts";
import Link from "next/link";
import PostCard from "@/components/PostCard";
import { useParams } from "next/navigation";
import { useFriendsOfUser, useSendFriendRequest, UserWithFriendshipStatus } from "@/hooks/useFriends";
import { auth } from "@/lib/firebase";

// ProgressBar Component
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
};

// QuestListItem Component
const QuestListItem = ({ quest }: { quest: MyQuest }) => {
    const statusColor = quest.status === "active" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700";
    const statusText = quest.status === "active" ? "挑戦中" : "達成済み";
    return (
      <Link href={`/app/my-quest/${quest.id}`} className="block p-4 rounded-lg hover:bg-slate-50 border border-line transition-colors">
        <div className="flex justify-between items-center text-xs">
          <span className="font-semibold badge">{quest.category}</span>
          <span className={`font-semibold px-2 py-0.5 rounded-full ${statusColor}`}>{statusText}</span>
        </div>
        <h3 className="font-bold text-lg mt-2">{quest.title}</h3>
        <p className="text-sm text-dim mt-1">{quest.startDate} 〜 {quest.endDate}</p>
      </Link>
    )
};

// Friends Modal Component
const FriendsModal = ({ friends, onClose }: { friends: UserWithFriendshipStatus[], onClose: () => void }) => {
    const sendRequest = useSendFriendRequest();
  
    const ActionButton = ({ user }: { user: UserWithFriendshipStatus }) => {
      switch (user.friendshipStatus) {
        case "self": return <span className="text-sm text-dim">自分</span>;
        case "friends": return <span className="text-sm font-bold text-green-600">フレンド</span>;
        case "pending-sent": return <span className="text-sm text-dim">申請済み</span>;
        case "pending-received": return <button className="btn btn-ghost !py-1 !px-3 text-xs" disabled>承認待ち</button>;
        case "not-friends":
          return (
            <button
              onClick={() => sendRequest.mutate(user.uid)}
              disabled={sendRequest.isPending}
              className="btn btn-primary !py-1 !px-3 text-xs"
            >
              フレンド申請
            </button>
          );
        default: return null;
      }
    };
  
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="card w-full max-w-md p-5" onClick={e => e.stopPropagation()}>
                <h3 className="text-xl font-bold">フレンド一覧</h3>
                <div className="mt-4 space-y-2 max-h-96 overflow-y-auto">
                    {friends.length > 0 ? (
                        friends.map(friend => (
                            <div key={friend.uid} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50">
                                <Link href={`/app/profile/${friend.uid}`} className="h-10 w-10 rounded-full bg-gray-200 relative overflow-hidden">
                                    {friend.photoURL && <Image src={friend.photoURL} alt={friend.displayName || ""} fill sizes="40px" className="object-cover" />}
                                </Link>
                                <div className="flex-1">
                                    <Link href={`/app/profile/${friend.uid}`} className="font-bold hover:underline">{friend.username ?? friend.displayName}</Link>
                                </div>
                                <ActionButton user={friend} />
                            </div>
                        ))
                    ) : (
                        <p className="text-dim text-center py-4">まだフレンドがいません。</p>
                    )}
                </div>
                <button onClick={onClose} className="btn btn-ghost w-full mt-4">閉じる</button>
            </div>
        </div>
    );
};

export default function UserProfilePage() {
    const params = useParams();
    const userId = params.userId as string;
    const currentUser = auth.currentUser;
  
    const { data, isLoading, error } = useUserProfile(userId);
    const { data: quests } = useFetchMyQuests(userId);
    const { data: posts } = usePosts({ userId });
    const { data: friends } = useFriendsOfUser(userId);
  
    const [activeTab, setActiveTab] = useState<'posts' | 'my-quests' | 'stats'>('posts');
    const [isFriendsModalOpen, setIsFriendsModalOpen] = useState(false);
  
    const { activeQuests, completedQuests } = useMemo(() => {
        const active: MyQuest[] = [];
        const completed: MyQuest[] = [];
        (quests ?? []).forEach(q => {
            if (q.status === 'active') active.push(q);
            else completed.push(q);
        });
        return { activeQuests: active, completedQuests: completed };
    }, [quests]);

    const commonPosts = useMemo(() => posts?.filter(p => !p.myQuestId) ?? [], [posts]);
  
    if (isLoading) return <div className="card p-5 text-center">Loading Profile...</div>;
    if (error) return <div className="card p-5 text-center text-red-600">Error: {error.message}</div>;
  
    const categories: (keyof UserStats)[] = ["Life", "Study", "Physical", "Social", "Creative", "Mental"];
  
    return (
        <div className="space-y-6">
            {isFriendsModalOpen && friends && <FriendsModal friends={friends} onClose={() => setIsFriendsModalOpen(false)} />}
            
            {/* --- Profile Header Card --- */}
            <section className="card p-6 text-center">
                <div className="flex flex-col items-center">
                    <div className="h-24 w-24 rounded-full bg-gray-200 relative overflow-hidden ring-4 ring-white shadow-md">
                        {data?.profile.photoURL && <Image src={data.profile.photoURL} alt="profile" fill sizes="96px" priority className="object-cover" />}
                    </div>
                    <div className="mt-4">
                        <h2 className="text-2xl font-bold">{data?.profile.username ?? data?.profile.displayName ?? "ユーザー"}</h2>
                    </div>
                    <div className="mt-4 text-sm text-dim w-full max-w-sm">
                        <p className="whitespace-pre-wrap">{data?.profile.bio || "自己紹介が未設定です"}</p>
                    </div>
                </div>

                <div className="w-full border-t border-line my-6"></div>
                
                <div className="grid grid-cols-2 gap-4 text-left">
                    <div>
                        <p className="text-sm text-dim">レベル</p>
                        <p className="text-2xl font-bold">{data?.level ?? 1}</p>
                    </div>
                    <div>
                        <p className="text-sm text-dim">クラス</p>
                        <p className="text-xl font-semibold text-brand-600">{data?.classInfo.title ?? "未設定"}</p>
                    </div>
                </div>
                <div className="w-full mt-4">
                    {data?.xpProgress && <ProgressBar label="次のレベルまで" value={data.xpProgress.xpInCurrentLevel} max={data.xpProgress.xpNeededForNextLevel} colorClass="bg-amber-400" />}
                </div>
            </section>

             {/* --- Stats Summary & Friends Button --- */}
             <section className="grid grid-cols-3 gap-3">
                 <div className="card p-3 text-center">
                    <p className="font-bold text-xl">{posts?.length || 0}</p>
                    <p className="text-xs text-dim">投稿</p>
                 </div>
                 <div className="card p-3 text-center">
                    <p className="font-bold text-xl">{activeQuests.length || 0}</p>
                    <p className="text-xs text-dim">挑戦中クエスト</p>
                 </div>
                 <button onClick={() => setIsFriendsModalOpen(true)} className="card p-3 text-center hover:bg-slate-50">
                    <p className="font-bold text-xl">{friends?.length || 0}</p>
                    <p className="text-xs text-dim">フレンド</p>
                 </button>
            </section>

            {/* --- Tabbed Content --- */}
            <section>
                <div className="border-b border-line flex">
                    <button onClick={() => setActiveTab('posts')} className={`px-4 py-2 text-sm font-semibold ${activeTab === 'posts' ? "border-b-2 border-brand-500 text-brand-600" : "text-dim"}`}>投稿</button>
                    <button onClick={() => setActiveTab('my-quests')} className={`px-4 py-2 text-sm font-semibold ${activeTab === 'my-quests' ? "border-b-2 border-brand-500 text-brand-600" : "text-dim"}`}>マイクエスト</button>
                    <button onClick={() => setActiveTab('stats')} className={`px-4 py-2 text-sm font-semibold ${activeTab === 'stats' ? "border-b-2 border-brand-500 text-brand-600" : "text-dim"}`}>ステータス</button>
                </div>
                <div className="mt-4">
                    {activeTab === 'posts' && (
                        <div className="space-y-4">
                            {commonPosts.length > 0 ? commonPosts.map(p => <PostCard key={p.id} post={p} />) : <p className="text-dim text-center py-4">まだ投稿がありません。</p>}
                        </div>
                    )}
                    {activeTab === 'my-quests' && (
                        <div className="space-y-4">
                            {activeQuests.length > 0 && (
                                <div className="space-y-3">
                                    <h3 className="font-bold text-lg">挑戦中のマイクエスト</h3>
                                    {activeQuests.map(q => <QuestListItem key={q.id} quest={q} />)}
                                </div>
                            )}
                            {completedQuests.length > 0 && (
                                <div className="space-y-3">
                                    <h3 className="font-bold text-lg mt-4">達成済みのマイクエスト</h3>
                                    {completedQuests.map(q => <QuestListItem key={q.id} quest={q} />)}
                                </div>
                            )}
                             {quests?.length === 0 && <p className="text-dim text-center py-4">このユーザーはまだマイクエストを設定していません。</p>}
                        </div>
                    )}
                    {activeTab === 'stats' && (
                        <div className="card p-6 grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-6">
                             {categories.map((k) => {
                                const value = data?.profile.stats?.[k] ?? 0;
                                const nextMilestone = value === 0 ? 10 : Math.ceil(value / 10) * 10;
                                return <ProgressBar key={k} label={k} value={value} max={nextMilestone} colorClass="bg-sky-500" />;
                            })}
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}