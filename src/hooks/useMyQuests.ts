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
  orderBy
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
  yearMonth: string; // "YYYY-MM"形式
  createdAt: any;
  completedAt?: any;
};

/**
 * 新しい月間目標を作成するためのカスタムフック
 */
export function useCreateMyQuest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { title: string; motivation: string; category: QuestCategory }) => {
      const user = auth.currentUser;
      if (!user) throw new Error("認証されていません");

      const yearMonth = new Date().toISOString().slice(0, 7); // "YYYY-MM"形式

      // 同じ月に既にアクティブなクエストがないかチェック
      const q = query(
        collection(db, "my_quests"),
        where("uid", "==", user.uid),
        where("yearMonth", "==", yearMonth),
        where("status", "==", "active"),
        limit(1)
      );
      const existingQuestSnap = await getDocs(q);
      if (!existingQuestSnap.empty) {
        throw new Error("今月のアクティブなクエストが既に存在します。");
      }

      const questData = {
        uid: user.uid,
        title: payload.title,
        motivation: payload.motivation,
        category: payload.category,
        status: "active" as const,
        yearMonth,
        createdAt: serverTimestamp(),
      };

      await addDoc(collection(db, "my_quests"), questData);
    },
    onSuccess: () => {
      // キャッシュを無効化して、最新のデータを再取得させる
      qc.invalidateQueries({ queryKey: ["my-quest", "active"] });
    },
  });
}

/**
 * 現在アクティブな月間目標を取得するカスタムフック
 */
export function useFetchActiveMyQuest() {
  const uid = auth.currentUser?.uid;
  return useQuery<MyQuest | null>({
    queryKey: ["my-quest", "active", uid],
    enabled: !!uid,
    queryFn: async () => {
      if (!uid) return null;
      const yearMonth = new Date().toISOString().slice(0, 7);
      const q = query(
        collection(db, "my_quests"),
        where("uid", "==", uid),
        where("yearMonth", "==", yearMonth),
        where("status", "==", "active"),
        limit(1)
      );
      const snap = await getDocs(q);
      if (snap.empty) return null;
      const doc = snap.docs[0];
      return { id: doc.id, ...doc.data() } as MyQuest;
    },
  });
}

/**
 * 特定のMyQuestに関連する投稿を取得するカスタムフック
 */
export function usePostsForMyQuest(myQuestId?: string) {
  return useQuery<Post[]>({
    queryKey: ["posts", "for-my-quest", myQuestId],
    enabled: !!myQuestId,
    queryFn: async () => {
      if (!myQuestId) return [];
      const q = query(
        collection(db, "posts"),
        where("myQuestId", "==", myQuestId),
        orderBy("createdAt", "desc")
      );
      const snap = await getDocs(q);
      // 修正点： Omit<Post, "id'> の最後の ' を > に修正
      return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Post, "id">) }));
    },
  });
}

/**
 * 月間目標を完了させるためのカスタムフック
 */
export function useCompleteMyQuest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (quest: MyQuest) => {
      const user = auth.currentUser;
      if (!user || user.uid !== quest.uid) throw new Error("Not authorized");

      // 1. my_quests ドキュメントを更新
      const questRef = doc(db, "my_quests", quest.id);
      await updateDoc(questRef, {
        status: "completed",
        completedAt: serverTimestamp(),
      });

      // 2. ユーザーにボーナスXPを付与
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        xp: increment(100), // ボーナスXP
        [`stats.${quest.category}`]: increment(5) // カテゴリへのボーナス
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-quest", "active"] });
      qc.invalidateQueries({ queryKey: ["profile-me"] });
    }
  });
}