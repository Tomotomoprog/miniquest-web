"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { auth, db, storage, functions } from "@/lib/firebase"; // 👈 functions をインポート
import { doc, getDoc, setDoc } from "firebase/firestore";
import { computeClass, UserStats, ClassResult, computeXpProgress } from "@/utils/progression";
import { updateProfile as updateAuthProfile } from "firebase/auth";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { httpsCallable } from "firebase/functions"; // 👈 これを追加

export type UserProfile = {
  uid: string;
  displayName: string | null;
  photoURL: string | null;
  xp: number;
  stats: UserStats;
  username?: string; // 例: "Taro#1234"
  uniqueTag?: string; // 例: "1234"
};

type ProfileData = {
  profile: UserProfile;
  level: number;
  classInfo: ClassResult;
  xpProgress: ReturnType<typeof computeXpProgress>;
};

// ログインユーザー自身のプロフィールを取得するフック
export function useMyProfile() {
  const uid = auth.currentUser?.uid;
  return useQuery<ProfileData>({
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
        displayName: data.displayName ?? base.displayName,
        photoURL: data.photoURL ?? base.photoURL,
        username: data.username,
        uniqueTag: data.uniqueTag,
        xp: typeof data.xp === "number" ? data.xp : 0,
        stats: { ...base.stats, ...(data.stats ?? {}) },
      };

      const xpProgress = computeXpProgress(merged.xp);
      const classInfo = computeClass(merged.stats, xpProgress.level);

      return { profile: merged, level: xpProgress.level, classInfo, xpProgress };
    },
  });
}

// ▼▼▼▼▼ 新しく追加したフック ▼▼▼▼▼
// 指定したユーザーIDのプロフィールを取得するフック
export function useUserProfile(userId?: string) {
  return useQuery<ProfileData>({
    queryKey: ["profile", userId],
    enabled: !!userId,
    queryFn: async () => {
      if (!userId) throw new Error("User ID is required");
      const snap = await getDoc(doc(db, "users", userId));
      if (!snap.exists()) {
        throw new Error("User not found");
      }
      
      const data = snap.data() as Partial<UserProfile>;
      const profile: UserProfile = {
        uid: userId,
        displayName: data.displayName ?? null,
        photoURL: data.photoURL ?? null,
        username: data.username,
        uniqueTag: data.uniqueTag,
        xp: data.xp ?? 0,
        stats: data.stats ?? { Life: 0, Study: 0, Physical: 0, Social: 0, Creative: 0, Mental: 0 },
      };

      const xpProgress = computeXpProgress(profile.xp);
      const classInfo = computeClass(profile.stats, xpProgress.level);
      
      return { profile, level: xpProgress.level, classInfo, xpProgress };
    },
  });
}
// ▲▲▲▲▲ 追加ここまで ▲▲▲▲▲

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { displayName: string }) => {
      if (!auth.currentUser) throw new Error("Not authenticated");
      if (!payload.displayName.trim()) throw new Error("Display name cannot be empty");

      const updateUserProfileCallable = httpsCallable(functions, 'updateUserProfile');
      const result = await updateUserProfileCallable({ displayName: payload.displayName.trim() });
      
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile-me"] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["friends"] });
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

      await updateAuthProfile(user, { photoURL });
      const userDocRef = doc(db, "users", user.uid);
      await setDoc(userDocRef, { photoURL }, { merge: true });

      return photoURL;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile-me"] });
    },
  });
}