"use client";
import { useMyProfile } from "@/hooks/useProfile";
import Link from "next/link";

export default function ProfilePage() {
  const { data } = useMyProfile();

  return (
    <div className="space-y-4">
      <section className="card p-5 flex items-center gap-4">
        <div className="h-14 w-14 rounded-full bg-gray-200" />
        <div>
          <div className="text-[16px] font-semibold">{data?.profile.displayName ?? "ユーザー"}</div>
          <div className="text-[12px] text-dim">
            Lv.{data?.level ?? 1} ・ {data?.classInfo.title ?? "未設定"}（{data?.classInfo?.pair.join(" × ")}）
          </div>
        </div>
        <div className="ml-auto">
          <Link href="/app/post" className="btn-primary btn">投稿</Link>
        </div>
      </section>

      <section className="card p-5">
        <h3 className="text-[16px] font-semibold mb-2">ジャンル達成度</h3>
        <ul className="grid grid-cols-2 gap-2 text-[14px]">
          {(["Life","Study","Physical","Social","Creative","Mental"] as const).map((k) => (
            <li key={k} className="flex items-center justify-between border border-line rounded-lg px-3 py-2">
              <span>{k}</span>
              <span className="text-dim">{data?.profile.stats[k] ?? 0}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="card p-5">
        <h3 className="text-[16px] font-semibold">あなたの投稿</h3>
        <p className="text-dim text-[14px] mt-1">※ 投稿一覧は今後サムネイル表示対応（MVPでは省略）</p>
      </section>
    </div>
  );
}
