"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { db, storage, auth } from "@/lib/firebase";
import {
  addDoc, collection, getDocs, orderBy, query, serverTimestamp,
  doc, getDoc, setDoc, deleteDoc, updateDoc, increment, collectionGroup, where
} from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";

export type Post = {
  id: string;
  uid: string;
  userName: string;
  text: string;
  photoURL?: string;
  questId?: string | null;
  questTitle?: string | null;   // ← これを型にも追加
  createdAt: any;
  likeCount?: number;
};

// タイムライン取得
export function usePosts() {
  return useQuery<Post[]>({
    queryKey: ["posts"],
    queryFn: async () => {
      const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Post, "id">) }));
    },
  });
}

// 自分が「いいね」した投稿IDのセット
export function useMyLikedPostIds() {
  const uid = auth.currentUser?.uid;
  return useQuery<Set<string>>({
    queryKey: ["myLikes", uid],
    enabled: !!uid,
    queryFn: async () => {
      const q = query(collectionGroup(db, "likes"), where("uid", "==", uid));
      const snap = await getDocs(q);
      const set = new Set<string>();
      snap.forEach((docSnap) => {
        const postRef = docSnap.ref.parent.parent;
        if (postRef) set.add(postRef.id);
      });
      return set;
    },
    initialData: new Set(),
  });
}

// 投稿作成（questTitle を同時保存）
export function useCreatePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { text: string; file?: File | null; questId?: string }) => {
      const user = auth.currentUser;
      if (!user) throw new Error("not authed");

      // 画像アップロード
      let photoURL: string | undefined;
      if (payload.file) {
        const r = ref(storage, `posts/${user.uid}/${Date.now()}_${payload.file.name}`);
        await uploadBytes(r, payload.file);
        photoURL = await getDownloadURL(r);
      }

      // ← これが無いとエラーになります（必ず定義）
      let questTitle: string | null = null;
      if (payload.questId) {
        const qDoc = await getDoc(doc(db, "quests", payload.questId));
        if (qDoc.exists()) {
          questTitle = (qDoc.data() as any).title ?? null;
        }
      }

      await addDoc(collection(db, "posts"), {
        uid: user.uid,
        userName: user.displayName ?? "匿名",
        text: payload.text,
        photoURL,
        questId: payload.questId ?? null,
        questTitle,                 // ← ここは短縮プロパティでOK（上で定義済み）
        likeCount: 0,
        createdAt: serverTimestamp(),
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["posts"] });
    },
  });
}

// いいねのトグル
export function useToggleLike() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (pid: string) => {
      const uid = auth.currentUser?.uid;
      if (!uid) throw new Error("not authed");

      const likeRef = doc(db, "posts", pid, "likes", uid);
      const liked = (await getDoc(likeRef)).exists();

      if (liked) {
        await deleteDoc(likeRef);
        await updateDoc(doc(db, "posts", pid), { likeCount: increment(-1) });
        return false;
      } else {
        await setDoc(likeRef, { uid, createdAt: Date.now() });
        await updateDoc(doc(db, "posts", pid), { likeCount: increment(1) });
        return true;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["posts"] });
      qc.invalidateQueries({ queryKey: ["myLikes"] });
    },
  });
}
