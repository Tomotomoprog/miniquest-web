"use client";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link"; // 👈 Linkをインポート
import { useAcceptFriendRequest, useDeclineFriendRequest, useFriendRequests, useFriends, useRemoveFriend, useSendFriendRequest, useUsers, UserWithFriendshipStatus } from "@/hooks/useFriends";
import { useDebounce } from "@/hooks/useDebounce";

// =================================================================
// ユーザー検索タブのコンポーネント
// =================================================================
const UserSearch = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const { data: users, isLoading } = useUsers(debouncedSearchTerm);
  const sendRequest = useSendFriendRequest();

  const ActionButton = ({ user }: { user: UserWithFriendshipStatus }) => {
    switch (user.friendshipStatus) {
      case "self":
        return <span className="text-sm text-dim">自分</span>;
      case "friends":
        return <span className="text-sm font-bold text-green-600">フレンド</span>;
      case "pending-sent":
        return <span className="text-sm text-dim">申請済み</span>;
      case "pending-received":
        return <button className="btn btn-ghost !py-1 !px-3 text-xs" disabled>承認待ち</button>;
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
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      <input
        type="text"
        placeholder="ユーザー名で検索..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="input"
      />
      <div className="space-y-3">
        {isLoading && <p className="text-dim text-center">検索中...</p>}
        {users?.map(user => (
          <div key={user.uid} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50">
            <div className="h-10 w-10 rounded-full bg-gray-200 relative overflow-hidden">
              {user.photoURL && <Image src={user.photoURL} alt={user.displayName || ""} fill className="object-cover" />}
            </div>
            <div className="flex-1">
              <p className="font-bold">{user.username ?? user.displayName}</p>
            </div>
            <ActionButton user={user} />
          </div>
        ))}
        {debouncedSearchTerm && !isLoading && users?.length === 0 && (
          <p className="text-dim text-center py-4">ユーザーが見つかりません。</p>
        )}
      </div>
    </div>
  );
};

// =================================================================
// 友達申請タブのコンポーネント
// =================================================================
const FriendRequests = () => {
  const { data: requests, isLoading } = useFriendRequests();
  const accept = useAcceptFriendRequest();
  const decline = useDeclineFriendRequest();

  if (isLoading) return <p className="text-dim text-center">読み込み中...</p>;
  if (!requests || requests.length === 0) return <p className="text-dim text-center py-4">保留中の申請はありません。</p>;

  return (
    <div className="space-y-3">
      {requests.map(({ friendship, requesterProfile }) => (
        <div key={friendship.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50">
          <div className="h-10 w-10 rounded-full bg-gray-200 relative overflow-hidden">
            {requesterProfile.photoURL && <Image src={requesterProfile.photoURL} alt={requesterProfile.displayName || ""} fill className="object-cover" />}
          </div>
          <div className="flex-1">
            <p className="font-bold">{requesterProfile.username ?? requesterProfile.displayName}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => decline.mutate(friendship.id)}
              disabled={decline.isPending}
              className="btn btn-ghost !py-1 !px-3 text-xs"
            >
              拒否
            </button>
            <button
              onClick={() => accept.mutate(friendship.id)}
              disabled={accept.isPending}
              className="btn btn-primary !py-1 !px-3 text-xs"
            >
              承認
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

// =================================================================
// 友達一覧タブのコンポーネント
// =================================================================
const FriendList = () => {
  const { data: friends, isLoading } = useFriends();
  const remove = useRemoveFriend();

  if (isLoading) return <p className="text-dim text-center">読み込み中...</p>;
  if (!friends || friends.length === 0) return <p className="text-dim text-center py-4">まだフレンドがいません。</p>;

  return (
    <div className="space-y-3">
      {friends.map(({ profile, friendshipId }) => (
        // ▼▼▼▼▼ Linkコンポーネントでラップする ▼▼▼▼▼
        <Link href={`/app/profile/${profile.uid}`} key={profile.uid} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors">
          <div className="h-10 w-10 rounded-full bg-gray-200 relative overflow-hidden">
            {profile.photoURL && <Image src={profile.photoURL} alt={profile.displayName || ""} fill className="object-cover" />}
          </div>
          <div className="flex-1">
            <p className="font-bold">{profile.username ?? profile.displayName}</p>
          </div>
          {/* Linkコンポーネントの内側でインタラクティブな要素(button)を使う場合、
            クリックイベントの伝播を止める(stopPropagation)必要があります。
            これにより、ボタンを押したときにページ遷移が起きるのを防ぎます。
           */}
          <button
            onClick={(e) => {
              e.preventDefault(); 
              e.stopPropagation();
              if (window.confirm(`${profile.username ?? profile.displayName}さんをフレンドから削除しますか？`)) {
                remove.mutate(friendshipId);
              }
            }}
            disabled={remove.isPending}
            className="btn btn-ghost !py-1 !px-3 text-xs text-red-500"
          >
            解除
          </button>
        </Link>
        // ▲▲▲▲▲ 変更ここまで ▲▲▲▲▲
      ))}
    </div>
  );
};

// =================================================================
// メインコンポーネント（タブ切り替え）
// =================================================================
export default function FriendsPageClient() {
  const [activeTab, setActiveTab] = useState<"list" | "requests" | "search">("list");

  const tabs = [
    { id: "list", label: "フレンド一覧" },
    { id: "requests", label: "届いた申請" },
    { id: "search", label: "フレンドを探す" },
  ];

  return (
    <div className="space-y-6">
      <div className="border-b border-line flex">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 text-sm font-semibold ${activeTab === tab.id ? "border-b-2 border-brand-500 text-brand-600" : "text-dim"}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="card p-5">
        {activeTab === 'list' && <FriendList />}
        {activeTab === 'requests' && <FriendRequests />}
        {activeTab === 'search' && <UserSearch />}
      </div>
    </div>
  );
}