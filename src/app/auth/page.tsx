// src/app/auth/page.tsx
"use client";

import { auth, googleProvider } from "@/lib/firebase";
import { signInWithPopup } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function AuthPage() {
  const router = useRouter();
  const [err, setErr] = useState<string | null>(null);

  const googleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      router.push("/app");
    } catch (e: any) {
      setErr(e.message ?? "Login failed");
    }
  };

  return (
    <main className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">Mini Quest にログイン</h1>
      <button onClick={googleLogin} className="rounded-xl border p-3 hover:bg-gray-100">
        Googleでログイン
      </button>
      {err && <p className="text-red-600 text-sm">{err}</p>}
    </main>
  );
}

