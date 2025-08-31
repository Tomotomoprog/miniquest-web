"use client";

import { ReactNode, useEffect, useState } from "react";
import Link from "next/link";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import QueryProvider from "@/components/QueryProvider";  // ← 追加

export default function AppLayout({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const router = useRouter();

  useEffect(() => onAuthStateChanged(auth, (u) => setUser(u ?? null)), []);
  if (user === undefined) return <div className="p-4">Loading...</div>;
  if (!user) { router.replace("/auth"); return null; }

  return (
    <QueryProvider>   {/* ← ここで包む */}
      <div className="max-w-3xl mx-auto p-4">
        <header className="flex items-center justify-between py-3">
          <nav className="flex gap-3 text-sm">
            <Link href="/app">Home</Link>
            <Link href="/app/quests">Quests</Link>
            <Link href="/app/post">Post</Link>
            <Link href="/app/timeline">Timeline</Link>
          </nav>
          <button
            className="text-sm underline"
            onClick={() => signOut(auth).then(() => router.replace("/auth"))}
          >
            ログアウト
          </button>
        </header>
        <main>{children}</main>
      </div>
    </QueryProvider>
  );
}
