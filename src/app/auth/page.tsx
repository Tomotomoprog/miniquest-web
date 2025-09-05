"use client";

import { auth, provider } from "@/lib/firebase";
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { useRouter } from "next/navigation";

export default function AuthPage() {
  const router = useRouter();

  const login = async () => {
    try {
      await signInWithPopup(auth, provider as GoogleAuthProvider);
      router.replace("/app"); // ログイン後は自動遷移
    } catch (error) {
      console.error("Login failed:", error);
      // You can add user-facing error handling here
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center text-center px-6"
      style={{
        background:
          "linear-gradient(180deg, #e0f2fe 0%, #ffffff 100%)", // Updated gradient
      }}
    >
      <div className="w-full max-w-sm">
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-brand-600">MiniQuest</h1>
          <p className="text-slate-600 mt-2">日常を、冒険に。</p>
        </div>

        <button onClick={login} className="btn btn-primary w-full shadow-lg">
          Googleでログイン
        </button>
      </div>
    </div>
  );
}