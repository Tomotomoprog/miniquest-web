"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { auth, db, storage, functions } from "@/lib/firebase"; // 👈 functions をインポート
import { doc, getDoc, setDoc } from "firebase/firestore";
import { computeClass, UserStats, ClassResult, computeXpProgress } from "@/utils/progression";
import { updateProfile } from "firebase/auth";
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

// ▼▼▼▼▼ このフックを Cloud Function を呼び出すように変更 ▼▼▼▼▼
export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { displayName: string }) => {
      if (!auth.currentUser) throw new Error("Not authenticated");
      if (!payload.displayName.trim()) throw new Error("Display name cannot be empty");

      // "updateUserProfile" という名前のCloud Functionを呼び出す準備
      const updateUserProfileCallable = httpsCallable(functions, 'updateUserProfile');
      
      // Cloud Function に displayName を渡して実行
      const result = await updateUserProfileCallable({ displayName: payload.displayName.trim() });
      
      return result.data;
    },
    onSuccess: () => {
      // 関連するキャッシュを無効化してデータを再取得
      queryClient.invalidateQueries({ queryKey: ["profile-me"] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["friends"] });
    },
  });
}
// ▲▲▲▲▲ 修正ここまで ▲▲▲▲▲

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