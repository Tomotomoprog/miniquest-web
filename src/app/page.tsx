"use client";
import { useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
export default function IndexRedirect() {
  const r = useRouter();
  useEffect(() => {
    const un = onAuthStateChanged(auth, u => r.replace(u ? "/app" : "/auth"));
    return () => un();
  }, [r]);
  return null;
}
