"use client";
import { useQuery } from "@tanstack/react-query";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { computeLevel, computeClass, UserStats, ClassResult } from "@/utils/progression";

export type UserProfile = {
  uid: string;
  displayName: string | null;
  photoURL: string | null;
  xp: number;
  stats: UserStats;
};

export function useMyProfile() {
  const uid = auth.currentUser?.uid;
  return useQuery<{ profile: UserProfile; level: number; classInfo: ClassResult }>({
    queryKey: ["profile-me", uid],
    enabled: !!uid,
    queryFn: async () => {
      if (!uid) throw new Error("not authed");
      const snap = await getDoc(doc(db, "users", uid));
      const base: UserProfile = {
        uid,
        displayName: auth.currentUser?.displayName ?? null,
        photoURL: auth.currentUser?.photoURL ?? null,
        xp: 0,
        stats: { Life: 0, Study: 0, Physical: 0, Social: 0, Creative: 0, Mental: 0 },
      };
      const data = snap.exists() ? (snap.data() as Partial<UserProfile>) : {};
      const merged: UserProfile = {
        ...base,
        xp: typeof data.xp === "number" ? data.xp : 0,
        stats: { ...base.stats, ...(data.stats ?? {}) },
      };
      const level = computeLevel(merged.xp);
      const classInfo = computeClass(merged.stats, level);
      return { profile: merged, level, classInfo };
    },
    initialData: undefined,
  });
}
