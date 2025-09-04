import Link from "next/link";
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-line">
        <div className="container h-12 flex items-center justify-between">
          <div className="text-[16px] font-semibold">MiniQuest</div>
          <nav className="flex items-center gap-2">
            <Link href="/app" className="btn-ghost">HOME</Link>
            <Link href="/app/timeline" className="btn-ghost">TIMELINE</Link>
            <Link href="/app/profile" className="btn-primary">PROFILE</Link>
          </nav>
        </div>
      </header>
      <main className="container py-4">{children}</main>
    </div>
  );
}
