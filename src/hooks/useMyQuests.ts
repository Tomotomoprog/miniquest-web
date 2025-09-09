"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { db, auth } from "@/lib/firebase";
import {
  addDoc,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp,
  doc,
  updateDoc,
  increment,
  limit,
  orderBy,
  getDoc,
  deleteDoc,
  QueryConstraint
} from "firebase/firestore";
import { QuestCategory } from "./useQuests";
import { Post } from "./usePosts";

// MyQuestの型定義
export type MyQuest = {
  id: string;
  uid: string;
  title: string;
  motivation: string;
  category: QuestCategory;
  status: "active" | "completed";
  startDate: string; // "YYYY-MM-DD"
  endDate: string;   // "YYYY-MM-DD"
  createdAt: any;
  completedAt?: any;
};

/**
 * 新しいマイクエストを作成するためのカスタムフック
 */
export function useCreateMyQuest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { title: string; motivation: string; category: QuestCategory; startDate: string; endDate: string }) => {
      const user = auth.currentUser;
      if (!user) throw new Error("認証されていません");

      const questData = {
        uid: user.uid,
        title: payload.title,
        motivation: payload.motivation,
        category: payload.category,
        startDate: payload.startDate,
        endDate: payload.endDate,
        status: "active" as const,
        createdAt: serverTimestamp(),
      };

      await addDoc(collection(db, "my_quests"), questData);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-quests"] });
    },
  });
}

/**
 * 指定したユーザーのマイクエストを全て取得するカスタムフック
 */
export function useFetchMyQuests(userId?: string) {
  const currentUser = auth.currentUser;
  const targetUid = userId || currentUser?.uid;

  return useQuery<MyQuest[]>({
    queryKey: ["my-quests", targetUid],
    enabled: !!targetUid,
    queryFn: async () => {
      if (!targetUid) return [];
      
      const q = query(
        collection(db, "my_quests"),
        where("uid", "==", targetUid)
      );
      const snap = await getDocs(q);
      if (snap.empty) return [];

      const quests = snap.docs.map(d => ({ id: d.id, ...d.data() } as MyQuest));

      quests.sort((a, b) => (b.createdAt?.toMillis() ?? 0) - (a.createdAt?.toMillis() ?? 0));
      
      return quests;
    },
  });
}


/**
 * IDを指定して単一のマイクエストを取得するカスタムフック
 */
export function useFetchMyQuestById(myQuestId?: string) {
    const uid = auth.currentUser?.uid;
    return useQuery<MyQuest | null>({
        queryKey: ["my-quest", myQuestId],
        enabled: !!myQuestId,
        queryFn: async () => {
            if (!myQuestId) return null;
            const docRef = doc(db, "my_quests", myQuestId);
            const snap = await getDoc(docRef);

            if (!snap.exists()) {
                return null;
            }
            return { id: snap.id, ...snap.data() } as MyQuest;
        }
    });
}


/**
 * 特定のMyQuestに関連する投稿を取得するカスタムフック (修正)
 */
export function usePostsForMyQuest(myQuestId?: string) {
  return useQuery<Post[]>({
    queryKey: ["posts", "for-my-quest", myQuestId],
    enabled: !!myQuestId,
    queryFn: async () => {
      if (!myQuestId) return [];
      
      // ▼▼▼▼▼ ここから修正 ▼▼▼▼▼
      // 並べ替え（orderBy）をクエリから削除
      const q = query(
        collection(db, "posts"),
        where("myQuestId", "==", myQuestId)
      );
      const snap = await getDocs(q);
      const posts = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Post, "id">) }));

      // クライアントサイドで並べ替え
      posts.sort((a, b) => (b.createdAt?.toMillis() ?? 0) - (a.createdAt?.toMillis() ?? 0));
      
      return posts;
      // ▲▲▲▲▲ 修正ここまで ▲▲▲▲▲
    },
  });
}

/**
 * マイクエストを完了させるためのカスタムフック
 */
export function useCompleteMyQuest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (quest: MyQuest) => {
      const user = auth.currentUser;
      if (!user || user.uid !== quest.uid) throw new Error("Not authorized");

      const questRef = doc(db, "my_quests", quest.id);
      await updateDoc(questRef, {
        status: "completed",
        completedAt: serverTimestamp(),
      });

      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        xp: increment(100),
        [`stats.${quest.category}`]: increment(5)
      });
    },
    onSuccess: (data, variables) => {
      qc.invalidateQueries({ queryKey: ["my-quests"] });
      qc.invalidateQueries({ queryKey: ["my-quest", variables.id] });
      qc.invalidateQueries({ queryKey: ["profile-me"] });
    }
  });
}

/**
 * マイクエストを更新するためのカスタムフック
 */
export function useUpdateMyQuest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { questId: string; title: string; motivation: string; category: QuestCategory; startDate: string; endDate: string }) => {
      const user = auth.currentUser;
      if (!user) throw new Error("認証されていません");

      const questRef = doc(db, "my_quests", payload.questId);
      const questSnap = await getDoc(questRef);
      if(!questSnap.exists() || questSnap.data().uid !== user.uid) {
        throw new Error("Not authorized");
      }
      
      await updateDoc(questRef, {
        title: payload.title,
        motivation: payload.motivation,
        category: payload.category,
        startDate: payload.startDate,
        endDate: payload.endDate,
      });
    },
    onSuccess: (data, variables) => {
      qc.invalidateQueries({ queryKey: ["my-quests"] });
      qc.invalidateQueries({ queryKey: ["my-quest", variables.questId] });
    },
  });
}

/**
 * マイクエストを削除するためのカスタムフック
 */
export function useDeleteMyQuest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (questId: string) => {
      const user = auth.currentUser;
      if (!user) throw new Error("認証されていません");

      const questRef = doc(db, "my_quests", questId);
      const questSnap = await getDoc(questRef);
      if(!questSnap.exists() || questSnap.data().uid !== user.uid) {
        throw new Error("Not authorized");
      }
      
      await deleteDoc(questRef);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-quests"] });
    },
  });
}