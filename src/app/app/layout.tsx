import Link from "next/link";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* 上部ナビ（HOME / TIMELINE / PROFILE） */}
      <header className="topbar">
        <div className="container h-12 flex items-center justify-between">
          <div className="text-[16px] font-semibold">MiniQuest</div>
          <nav className="flex items-center gap-2">
            <Link href="/app" className="btn-ghost">HOME</Link>
            <Link href="/app/timeline" className="btn-ghost">TIMELINE</Link>
            <Link href="/app/profile" className="btn-primary">PROFILE</Link>
          </nav>
        </div>
      </header>

      <main className="container flex-1 py-4">{children}</main>
    </div>
  );
}
