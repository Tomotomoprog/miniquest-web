// src/app/page.tsx
import { redirect } from "next/navigation";

export default function Home() {
  redirect("/auth"); // ルートに来たら /auth へ
}
