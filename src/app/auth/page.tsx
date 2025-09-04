"use client";

import { auth, provider } from "@/lib/firebase";
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { useRouter } from "next/navigation";

export default function AuthPage() {
  const router = useRouter();

  const login = async () => {
    await signInWithPopup(auth, provider as GoogleAuthProvider);
    router.replace("/app"); // ログイン後は自動遷移
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center text-center px-6"
      style={{
        background:
          "linear-gradient(180deg, #e6f3ff 0%, #ffffff 40%, #cfe8ff 100%)",
      }}
    >
      <div className="w-full max-w-sm">
        <div className="mb-10">
          <div className="text-2xl font-bold">MiniQuest</div>
          <div className="text-dim mt-1">日常を、冒険に。</div>
        </div>

        <button onClick={login} className="btn btn-primary w-full">
          Googleでログイン
        </button>
      </div>
    </div>
  );
}
