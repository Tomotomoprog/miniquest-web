"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { db, storage, auth } from "@/lib/firebase";
import {
  addDoc, collection, getDocs, orderBy, query, serverTimestamp,
  doc, getDoc, setDoc, deleteDoc, updateDoc, increment, collectionGroup, where, getDocsFromServer
} from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes, deleteObject } from "firebase/storage";
import { QuestCategory } from "./useQuests";
import { computeClass, computeLevel } from "@/utils/progression";

// Post型にpostDateを追加
export type Post = {
  id: string;
  uid: string;
  userName: string;
  userAvatar: string | null;
  userLevel: number;
  userClass: string;
  text: string;
  photoURL?: string | null;
  storagePath?: string | null; // Storageのパスを追加
  questId?: string | null;
  questTitle?: string | null;
  questCategory?: QuestCategory | null; // XP減算用にカテゴリを追加
  postDate: string; // YYYY-MM-DD形式の日付
  createdAt: any;
  likeCount?: number;
  commentCount?: number;
};

export type Comment = {
  id: string;
  uid: string;
  userName: string;
  userAvatar: string | null;
  text: string;
  createdAt: any;
};

// JST（日本標準時）のYYYY-MM-DD形式の日付を取得するヘルパー関数
const getJSTDateString = () => {
  const now = new Date();
  const jstOffset = 9 * 60; // JSTはUTC+9
  const jstNow = new Date(now.getTime() + (jstOffset + now.getTimezoneOffset()) * 60000);
  return jstNow.toISOString().split('T')[0];
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
      if (!uid) return new Set();
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

      const todayStr = getJSTDateString();

      // 同日・同クエストの投稿がないかチェック
      if (payload.questId) {
        const q = query(
          collection(db, "posts"),
          where("uid", "==", user.uid),
          where("questId", "==", payload.questId),
          where("postDate", "==", todayStr)
        );
        const existingPostSnap = await getDocsFromServer(q);
        if (!existingPostSnap.empty) {
          throw new Error("このクエストは今日すでに達成済みです。");
        }
      }
      
      const userDoc = await getDoc(doc(db, "users", user.uid));
      const userData = userDoc.data() || { xp: 0, stats: {} };
      const level = computeLevel(userData.xp || 0);
      const classInfo = computeClass(userData.stats || {}, level);

      let photoURL: string | undefined;
      let storagePath: string | undefined;
      if (payload.file) {
        storagePath = `posts/${user.uid}/${Date.now()}_${payload.file.name}`;
        const r = ref(storage, storagePath);
        await uploadBytes(r, payload.file);
        photoURL = await getDownloadURL(r);
      }

      let questTitle: string | null = null;
      let questCategory: QuestCategory | null = null;
      if (payload.questId) {
        const qDoc = await getDoc(doc(db, "quests", payload.questId));
        if (qDoc.exists()) {
          const data = qDoc.data() as { title?: string; category?: QuestCategory };
          questTitle = data?.title ?? null;
          questCategory = data?.category ?? null;
        }
      }

      const postData: Omit<Post, "id"> = {
        uid: user.uid,
        userName: user.displayName ?? "匿名",
        userAvatar: user.photoURL,
        userLevel: level,
        userClass: classInfo.title,
        text: payload.text,
        photoURL: photoURL ?? null,
        storagePath: storagePath ?? null,
        questId: payload.questId ?? null,
        questTitle,
        questCategory,
        postDate: todayStr, // 投稿日を記録
        likeCount: 0,
        commentCount: 0,
        createdAt: serverTimestamp(),
      };

      await addDoc(collection(db, "posts"), postData as any);

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
      const postRef = doc(db, "posts", pid);
      const liked = (await getDoc(likeRef)).exists();
      if (liked) {
        await deleteDoc(likeRef);
        await updateDoc(postRef, { likeCount: increment(-1) });
      } else {
        await setDoc(likeRef, { uid, createdAt: serverTimestamp() });
        await updateDoc(postRef, { likeCount: increment(1) });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["posts"] });
      qc.invalidateQueries({ queryKey: ["myLikes"] });
    },
  });
}

export function useComments(postId: string) {
  return useQuery<Comment[]>({
    queryKey: ["comments", postId],
    queryFn: async () => {
      const commentsRef = collection(db, "posts", postId, "comments");
      const q = query(commentsRef, orderBy("createdAt", "asc"));
      const snap = await getDocs(q);
      return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Comment));
    },
  });
}

export function useAddComment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ postId, text }: { postId: string; text: string }) => {
      const user = auth.currentUser;
      if (!user) throw new Error("Not authenticated");
      if (!text.trim()) throw new Error("Comment cannot be empty");

      const commentData = {
        uid: user.uid,
        userName: user.displayName ?? "匿名",
        userAvatar: user.photoURL,
        text: text,
        createdAt: serverTimestamp(),
      };
      
      const commentsRef = collection(db, "posts", postId, "comments");
      await addDoc(commentsRef, commentData);
      
      const postRef = doc(db, "posts", postId);
      await updateDoc(postRef, { commentCount: increment(1) });
    },
    onSuccess: (data, variables) => {
      qc.invalidateQueries({ queryKey: ["comments", variables.postId] });
      qc.invalidateQueries({ queryKey: ["posts"] });
    },
  });
}

// ======== 投稿削除フック（新規追加） ========
export function useDeletePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (post: Post) => {
      const user = auth.currentUser;
      if (!user || user.uid !== post.uid) throw new Error("Not authorized");

      // 1. Storageから画像を削除 (あれば)
      if (post.storagePath) {
        const imageRef = ref(storage, post.storagePath);
        await deleteObject(imageRef).catch(err => console.error("Image deletion failed:", err));
      }

      // 2. Firestoreから投稿ドキュメントを削除
      await deleteDoc(doc(db, "posts", post.id));

      // 3. ユーザーのXPとステータスを減算 (クエスト投稿の場合のみ)
      if (post.questId) {
        const userRef = doc(db, "users", user.uid);
        const dec: Record<string, unknown> = { xp: increment(-10) };
        if (post.questCategory) {
          dec[`stats.${post.questCategory}`] = increment(-1);
        }
        await setDoc(userRef, dec, { merge: true });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["posts"] });
      qc.invalidateQueries({ queryKey: ["profile-me"] });
    }
  });
}