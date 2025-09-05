"use client"; // Add this line
import Link from "next/link";
import { usePathname } from "next/navigation"; // Import usePathname

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname(); // Get current path

  const navLinks = [
    { href: "/app", label: "HOME" },
    { href: "/app/timeline", label: "TIMELINE" },
    { href: "/app/profile", label: "PROFILE" },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-line">
        <div className="container h-16 flex items-center justify-between">
          <Link href="/app" className="text-xl font-bold text-brand-600">
            MiniQuest
          </Link>
          <nav className="flex items-center gap-2">
            {navLinks.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={`btn ${pathname === href ? "btn-primary" : "btn-ghost"}`}
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main className="container py-8">{children}</main>
    </div>
  );
}