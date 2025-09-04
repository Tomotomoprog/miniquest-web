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
  photoURL?: string | null;
  questId?: string | null;
  questTitle?: string | null;
  createdAt: any;
  likeCount?: number;
};

export function usePosts(questId?: string) {
  return useQuery<Post[]>({
    queryKey: ["posts", questId ?? "all"],
    queryFn: async () => {
      const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      let list = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Post, "id">) }));
      if (questId) list = list.filter((p) => p.questId === questId);
      return list;
    },
  });
}

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

export function useCreatePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { text: string; file?: File | null; questId?: string }) => {
      const user = auth.currentUser;
      if (!user) throw new Error("not authed");

      let photoURL: string | undefined;
      if (payload.file) {
        const r = ref(storage, `posts/${user.uid}/${Date.now()}_${payload.file.name}`);
        await uploadBytes(r, payload.file);
        photoURL = await getDownloadURL(r);
      }

      let questTitle: string | null = null;
      let questCategory: string | null = null;
      if (payload.questId) {
        const qDoc = await getDoc(doc(db, "quests", payload.questId));
        if (qDoc.exists()) {
          const data = qDoc.data() as { title?: string; category?: string } | undefined;
          questTitle = data?.title ?? null;
          questCategory = data?.category ?? null;
        }
      }

      const data: Record<string, unknown> = {
        uid: user.uid,
        userName: user.displayName ?? "匿名",
        text: payload.text,
        questId: payload.questId ?? null,
        questTitle,
        likeCount: 0,
        createdAt: serverTimestamp(),
      };
      if (photoURL) data.photoURL = photoURL;

      await addDoc(collection(db, "posts"), data);

      // 🎯 クライアント側で簡易XP付与（10XP）
      const userRef = doc(db, "users", user.uid);
      const inc: Record<string, unknown> = { xp: increment(10) };
      if (questCategory) inc[`stats.${questCategory}`] = increment(1);
      await setDoc(userRef, inc, { merge: true });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["posts"] });
      qc.invalidateQueries({ queryKey: ["profile-me"] });
    },
  });
}

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
