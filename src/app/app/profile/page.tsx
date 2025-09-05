"use client";
import { useMyProfile, useUpdateProfile, useUpdateAvatar } from "@/hooks/useProfile";
import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";

export default function ProfilePage() {
  const { data, isLoading } = useMyProfile();
  const updateProfile = useUpdateProfile();
  const updateAvatar = useUpdateAvatar();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState("");

  useEffect(() => {
    if (data?.profile.displayName) {
      setDisplayName(data.profile.displayName);
    }
  }, [data?.profile.displayName]);

  const handleSaveName = async () => {
    if (displayName.trim() === data?.profile.displayName) {
      setIsEditing(false);
      return;
    }
    await updateProfile.mutateAsync({ displayName });
    setIsEditing(false);
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      updateAvatar.mutate(file);
    }
  };

  const onAvatarClick = () => {
    fileInputRef.current?.click();
  };

  if (isLoading) {
    return <div className="card p-5 text-center">Loading Profile...</div>;
  }

  return (
    <div className="space-y-6">
      <section className="card p-6 flex flex-col items-center text-center">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleAvatarChange}
          className="hidden"
          accept="image/*"
        />
        <button
          onClick={onAvatarClick}
          className="h-24 w-24 rounded-full bg-gray-200 relative overflow-hidden ring-4 ring-white shadow-md group"
          disabled={updateAvatar.isPending}
        >
          {data?.profile.photoURL && <Image src={data.profile.photoURL} alt="profile" fill className="object-cover" />}
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 flex items-center justify-center transition-opacity">
            <span className="text-white text-xs opacity-0 group-hover:opacity-100">
              {updateAvatar.isPending ? 'Uploading...' : '変更'}
            </span>
          </div>
        </button>
        
        <div className="mt-4 w-full max-w-xs">
          {isEditing ? (
            <div className="flex flex-col gap-3">
              <input 
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="input text-center text-2xl font-bold"
                placeholder="新しい名前"
              />
              <div className="flex gap-2">
                <button onClick={() => setIsEditing(false)} className="btn-ghost btn flex-1">キャンセル</button>
                <button onClick={handleSaveName} disabled={updateProfile.isPending} className="btn-primary btn flex-1">
                  {updateProfile.isPending ? '保存中...' : '保存'}
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="text-2xl font-bold">{data?.profile.displayName ?? "ユーザー"}</div>
              <button onClick={() => setIsEditing(true)} className="text-sm text-brand-600 hover:underline mt-1">
                名前を編集
              </button>
            </>
          )}
        </div>

        <div className="mt-4">
          <div className="text-base text-dim">
            Lv.{data?.level ?? 1}
          </div>
           <div className="mt-2 text-lg font-semibold text-brand-600">{data?.classInfo.title ?? "未設定"}</div>
           <div className="text-sm text-dim">({data?.classInfo?.pair.join(" × ")})</div>
        </div>
        <Link href="/app/post" className="btn-primary btn mt-6 w-full max-w-xs">
          クエスト達成を投稿する
        </Link>
      </section>

      <section className="card p-6">
        <h3 className="text-xl font-bold mb-4">ジャンル達成度</h3>
        <ul className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
          {(["Life","Study","Physical","Social","Creative","Mental"] as const).map((k) => (
            <li key={k} className="flex items-center justify-between border border-line rounded-lg px-4 py-3 bg-gray-50">
              <span className="font-semibold">{k}</span>
              <span className="text-dim font-medium">{data?.profile.stats[k] ?? 0}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="card p-6">
        <h3 className="text-xl font-bold">あなたの投稿</h3>
        <p className="text-dim text-sm mt-2">※ ここにあなたの投稿が表示されます（現在開発中）</p>
      </section>
    </div>
  );
}