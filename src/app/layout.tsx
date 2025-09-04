import "./globals.css";
import type { Metadata } from "next";
import QueryProvider from "@/components/providers/QueryProvider";

export const metadata: Metadata = {
  title: "MiniQuest",
  description: "日常を、冒険に。"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
