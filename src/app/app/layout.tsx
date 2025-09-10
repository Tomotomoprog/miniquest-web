"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  // ▼▼▼▼▼ ここから下を追記 ▼▼▼▼▼
  const [authStatus, setAuthStatus] = useState<"loading" | "authed" | "unauthed">("loading");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setAuthStatus("authed");
      } else {
        setAuthStatus("unauthed");
        router.replace("/auth");
      }
    });
    return () => unsubscribe();
  }, [router]);
  // ▲▲▲▲▲ ここまで追記 ▲▲▲▲▲

  const navLinks = [
    { href: "/app", label: "HOME" },
    { href: "/app/my-quest", label: "MY QUEST" },
    { href: "/app/timeline", label: "TIMELINE" },
    { href: "/app/friends", label: "FRIENDS" },
    { href: "/app/profile", label: "PROFILE" },
  ];

  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.replace("/auth");
    } catch (error) {
      console.error("Logout failed:", error);
      alert("ログアウトに失敗しました。");
    }
  };
  
  // ▼▼▼▼▼ 認証状態が "loading" の間はローディング画面を表示 ▼▼▼▼▼
  if (authStatus === "loading") {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-dim">読み込み中...</p>
      </div>
    );
  }
  
  // ▼▼▼▼▼ 認証済みのユーザーにのみコンテンツを表示 ▼▼▼▼▼
  if (authStatus === "authed") {
    return (
      <div className="min-h-screen bg-slate-50">
        <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-line">
          <div className="container h-16 flex items-center justify-between">
            <Link href="/app" className="text-xl font-bold text-brand-600">
              MiniQuest
            </Link>

            <nav className="hidden md:flex items-center gap-2">
              {navLinks.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className={`btn ${pathname === href ? "btn-primary" : "btn-ghost"}`}
                >
                  {label}
                </Link>
              ))}
              <button onClick={handleLogout} className="btn btn-ghost">
                ログアウト
              </button>
            </nav>

            <div className="md:hidden">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="btn-icon"
                aria-label="メニューを開く"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="3" y1="12" x2="21" y2="12"></line>
                  <line x1="3" y1="6" x2="21" y2="6"></line>
                  <line x1="3" y1="18" x2="21" y2="18"></line>
                </svg>
              </button>
            </div>
          </div>
        </header>

        {isMenuOpen && (
          <div className="md:hidden">
            <nav className="container py-4 flex flex-col gap-2">
              {navLinks.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className={`btn w-full ${pathname === href ? "btn-primary" : "btn-ghost"}`}
                >
                  {label}
                </Link>
              ))}
              <button onClick={handleLogout} className="btn btn-ghost w-full">
                ログアウト
              </button>
            </nav>
          </div>
        )}

        <main className="container py-8">{children}</main>
      </div>
    );
  }
  
  return null; // 未認証の場合はリダイレクトが走るため何も表示しない
}