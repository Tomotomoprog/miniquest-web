"use client";
import { useMyProfile, useUpdateProfile, useUpdateAvatar, UserProfile } from "@/hooks/useProfile";
import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useRef, useMemo } from "react";
import { UserStats } from "@/utils/progression";
import { auth } from "@/lib/firebase";
import { useFetchMyQuests, MyQuest } from "@/hooks/useMyQuests";
import { usePosts } from "@/hooks/usePosts";
import PostCard from "@/components/PostCard";
import { useFriends, useRemoveFriend } from "@/hooks/useFriends";

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
const FriendsModal = ({ friends, onRemove, onClose }: { friends: {profile: UserProfile, friendshipId: string}[], onRemove: (friendshipId: string) => void, onClose: () => void }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="card w-full max-w-md p-5" onClick={e => e.stopPropagation()}>
                <h3 className="text-xl font-bold">フレンド一覧</h3>
                <div className="mt-4 space-y-2 max-h-96 overflow-y-auto">
                    {friends.length > 0 ? (
                        friends.map(friend => (
                            <div key={friend.profile.uid} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50">
                                <Link href={`/app/profile/${friend.profile.uid}`} className="h-10 w-10 rounded-full bg-gray-200 relative overflow-hidden">
                                    {friend.profile.photoURL && <Image src={friend.profile.photoURL} alt={friend.profile.displayName || ""} fill sizes="40px" className="object-cover" />}
                                </Link>
                                <div className="flex-1">
                                    <Link href={`/app/profile/${friend.profile.uid}`} className="font-bold hover:underline">{friend.profile.username ?? friend.profile.displayName}</Link>
                                </div>
                                <button
                                    onClick={() => {
                                        if (window.confirm(`${friend.profile.username ?? friend.profile.displayName}さんをフレンドから削除しますか？`)) {
                                            onRemove(friend.friendshipId);
                                        }
                                    }}
                                    className="btn btn-ghost !py-1 !px-3 text-xs text-red-500"
                                >
                                    解除
                                </button>
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


export default function ProfilePage() {
    const { data, isLoading } = useMyProfile();
    const updateProfile = useUpdateProfile();
    const updateAvatar = useUpdateAvatar();
    const removeFriend = useRemoveFriend();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [isEditingName, setIsEditingName] = useState(false);
    const [displayName, setDisplayName] = useState("");
    const [isEditingBio, setIsEditingBio] = useState(false);
    const [bio, setBio] = useState("");
    const [error, setError] = useState<string | null>(null);

    const userId = auth.currentUser?.uid;
    const { data: quests } = useFetchMyQuests(userId);
    const { data: posts } = usePosts({ userId });
    const { data: friends, isLoading: isLoadingFriends } = useFriends();

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

    useEffect(() => {
        if (data) {
            setDisplayName(data.profile.displayName || "");
            setBio(data.profile.bio || "");
        }
    }, [data]);

    const handleSaveName = async () => {
        setError(null);
        if (displayName.trim() === data?.profile.displayName) {
            setIsEditingName(false);
            return;
        }

        if (window.confirm("30日間は変更できませんがこれで保存しますか？")) {
            try {
                await updateProfile.mutateAsync({ displayName });
                setIsEditingName(false);
            } catch (e: any) {
                setError(e.message.includes('once every 30 days') ? "名前の変更は30日に1回までです。" : "エラーが発生しました。");
            }
        }
    };

    const handleSaveBio = async () => {
        setError(null);
        if (bio.trim() === (data?.profile.bio || "")) {
            setIsEditingBio(false);
            return;
        }
        try {
            await updateProfile.mutateAsync({ bio: bio.trim() });
            setIsEditingBio(false);
        } catch (e: any) {
            setError("エラーが発生しました。");
        }
    };
    
    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) updateAvatar.mutate(file);
    };

    if (isLoading) return <div className="card p-5 text-center">Loading Profile...</div>;
    
    const categories: (keyof UserStats)[] = ["Life", "Study", "Physical", "Social", "Creative", "Mental"];

    return (
        <div className="space-y-6">
            {isFriendsModalOpen && friends && <FriendsModal friends={friends} onRemove={removeFriend.mutate} onClose={() => setIsFriendsModalOpen(false)} />}
            
            {/* --- Profile Header Card --- */}
            <section className="card p-6 text-center">
                <div className="flex flex-col items-center">
                    <input type="file" ref={fileInputRef} onChange={handleAvatarChange} className="hidden" accept="image/*" />
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="h-24 w-24 rounded-full bg-gray-200 relative overflow-hidden ring-4 ring-white shadow-md group"
                        disabled={updateAvatar.isPending}
                    >
                        {data?.profile.photoURL && <Image src={data.profile.photoURL} alt="profile" fill sizes="96px" priority className="object-cover" />}
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 flex items-center justify-center transition-opacity">
                            <span className="text-white text-xs opacity-0 group-hover:opacity-100">{updateAvatar.isPending ? 'Uploading...' : '変更'}</span>
                        </div>
                    </button>

                    {isEditingName ? (
                        <div className="mt-4 w-full max-w-xs flex flex-col gap-2">
                            <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="input text-center text-2xl font-bold" />
                            <div className="flex gap-2">
                                <button onClick={() => { setIsEditingName(false); setError(null); }} className="btn-ghost btn flex-1">キャンセル</button>
                                <button onClick={handleSaveName} disabled={updateProfile.isPending} className="btn-primary btn flex-1">{updateProfile.isPending ? '保存中...' : '保存'}</button>
                            </div>
                        </div>
                    ) : (
                        <div className="mt-4">
                            <h2 className="text-2xl font-bold">{data?.profile.username ?? data?.profile.displayName ?? "ユーザー"}</h2>
                            <button onClick={() => setIsEditingName(true)} className="text-sm text-brand-600 hover:underline">名前を編集</button>
                        </div>
                    )}

                    {isEditingBio ? (
                         <div className="mt-4 w-full max-w-sm flex flex-col gap-2">
                            <textarea value={bio} onChange={e => setBio(e.target.value)} className="textarea text-sm text-center" rows={3} placeholder="自己紹介 (160文字まで)" maxLength={160}></textarea>
                             <div className="flex gap-2">
                                 <button onClick={() => { setIsEditingBio(false); setError(null); }} className="btn-ghost btn flex-1">キャンセル</button>
                                 <button onClick={handleSaveBio} disabled={updateProfile.isPending} className="btn-primary btn flex-1">{updateProfile.isPending ? '保存中...' : '保存'}</button>
                             </div>
                         </div>
                    ) : (
                        <div className="mt-4 text-sm text-dim w-full max-w-sm">
                            <p className="whitespace-pre-wrap">{data?.profile.bio || "自己紹介が未設定です"}</p>
                            <button onClick={() => setIsEditingBio(true)} className="text-sm text-brand-600 hover:underline">自己紹介を編集</button>
                        </div>
                    )}
                    {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
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
                            {quests?.length === 0 && <p className="text-dim text-center py-4">マイクエストがまだありません。</p>}
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