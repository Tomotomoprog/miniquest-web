"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { auth, db, storage } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { computeClass, UserStats, ClassResult, computeXpProgress } from "@/utils/progression"; // 👈 computeXpProgress をインポート
import { updateProfile } from "firebase/auth";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export type UserProfile = {
  uid: string;
  displayName: string | null;
  photoURL: string | null;
  xp: number;
  stats: UserStats;
};

// useMyProfileが返すデータの型を拡張
type ProfileData = {
  profile: UserProfile;
  level: number;
  classInfo: ClassResult;
  xpProgress: ReturnType<typeof computeXpProgress>; // 👈 XP進捗の型を追加
};

export function useMyProfile() {
  const uid = auth.currentUser?.uid;
  return useQuery<ProfileData>({ // 👈 拡張した型を使用
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

      // XP進捗を計算して返すデータに追加
      const xpProgress = computeXpProgress(merged.xp);
      const classInfo = computeClass(merged.stats, xpProgress.level);

      return { profile: merged, level: xpProgress.level, classInfo, xpProgress };
    },
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { displayName: string }) => {
      const user = auth.currentUser;
      if (!user) throw new Error("Not authenticated");
      if (!payload.displayName.trim()) throw new Error("Display name cannot be empty");

      await updateProfile(user, {
        displayName: payload.displayName,
      });

      const userDocRef = doc(db, "users", user.uid);
      await setDoc(userDocRef, { 
        displayName: payload.displayName 
      }, { merge: true });

      return payload.displayName;
    },
    onSuccess: () => {
      return queryClient.invalidateQueries({ queryKey: ["profile-me"] });
    },
  });
}

export function useUpdateAvatar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (file: File) => {
      const user = auth.currentUser;
      if (!user) throw new Error("Not authenticated");
      if (!file) throw new Error("No file selected");

      const filePath = `avatars/${user.uid}/${Date.now()}_${file.name}`;
      const fileRef = ref(storage, filePath);
      await uploadBytes(fileRef, file);

      const photoURL = await getDownloadURL(fileRef);

      await updateProfile(user, { photoURL });

      const userDocRef = doc(db, "users", user.uid);
      await setDoc(userDocRef, { photoURL }, { merge: true });

      return photoURL;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile-me"] });
    },
  });
}