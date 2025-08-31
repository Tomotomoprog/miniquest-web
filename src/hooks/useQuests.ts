"use client";

import { useQuery } from "@tanstack/react-query";
import { db } from "@/lib/firebase";
import { collection, getDocs, orderBy, query, limit } from "firebase/firestore";  // ← limit を直接import

export type Quest = {
  id: string;
  title: string;
  description: string;
  tag: string;
  isGlobal?: boolean;
  createdAt?: any;
};

/**
 * 共通の日替わりクエスト3件
 * - 日付だけをシードにするので全ユーザー共通
 * - 翌日0時に自動で入れ替わり
 */
export function useDailyQuestsCommon(count = 3) {
  return useQuery<Quest[]>({
    queryKey: ["daily-quests-common", count, new Date().toDateString()],
    queryFn: async () => {
      // プールを適度に確保（最新50件）
      const q = query(collection(db, "quests"), orderBy("createdAt", "desc"), limit(50));
      const snap = await getDocs(q);
      const all = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Quest, "id">) }));
      if (all.length <= count) return all;

      // 日付のみでシード（全ユーザー共通）
      const today = new Date();
      const seedStr = `${today.getFullYear()}${today.getMonth() + 1}${today.getDate()}`;
      let seed = hash(seedStr);

      const rand = () => {
        seed ^= seed << 13; seed |= 0;
        seed ^= seed >>> 17; seed |= 0;
        seed ^= seed << 5; seed |= 0;
        return ((seed >>> 0) % 1_000_000) / 1_000_000;
      };

      const arr = all.slice();
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(rand() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr.slice(0, count);
    },
    staleTime: 60_000, // 1分キャッシュ
  });
}

function hash(s: string) {
  let h = 5381;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) + h) + s.charCodeAt(i);
  }
  return h | 0;
}
