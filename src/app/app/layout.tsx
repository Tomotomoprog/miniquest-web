"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navLinks = [
    { href: "/app", label: "HOME" },
    { href: "/app/my-quest", label: "MY QUEST" },
    { href: "/app/timeline", label: "TIMELINE" },
    { href: "/app/friends", label: "FRIENDS" }, // 👈 この行を追加
    { href: "/app/profile", label: "PROFILE" },
  ];

  // ページ遷移時にメニューを閉じる
  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-line">
        <div className="container h-16 flex items-center justify-between">
          <Link href="/app" className="text-xl font-bold text-brand-600">
            MiniQuest
          </Link>

          {/* PC用のナビゲーション (md以上で表示) */}
          <nav className="hidden md:flex items-center gap-2">
            {navLinks.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={`btn ${
                  pathname === href ? "btn-primary" : "btn-ghost"
                }`}
              >
                {label}
              </Link>
            ))}
          </nav>

          {/* ハンバーガーボタン (md未満で表示) */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="btn-icon"
              aria-label="メニューを開く"
            >
              {/* ハンバーガーアイコン (SVG) */}
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* モバイル用のメニュー (開閉状態で表示を切り替え) */}
      {isMenuOpen && (
        <div className="md:hidden">
          <nav className="container py-4 flex flex-col gap-2">
            {navLinks.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={`btn w-full ${
                  pathname === href ? "btn-primary" : "btn-ghost"
                }`}
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>
      )}

      <main className="container py-8">{children}</main>
    </div>
  );
}