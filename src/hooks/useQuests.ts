"use client";
import { useQuery } from "@tanstack/react-query";
import { db } from "@/lib/firebase";
import { collection, getDocs, query } from "firebase/firestore";

export type QuestCategory = "Life" | "Study" | "Physical" | "Social" | "Creative" | "Mental";

export type Quest = {
  id: string;
  title: string;
  description: string;
  tag: string;
  category: QuestCategory;
  createdAt?: any;
};

// 変更: useDailyQuestsCommon -> useDailyQuests
export function useDailyQuests(count = 3) {
  return useQuery<Quest[]>({
    // new Date().toDateString() をキーに含めることで、日付が変わると自動でデータを再取得する
    queryKey: ["daily-quests", count, new Date().toDateString()],
    queryFn: async () => {
      const q = query(collection(db, "quests"));
      const snap = await getDocs(q);
      const allQuests = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Quest, "id">) }));

      if (allQuests.length === 0) return [];

      // その日のためのシード値を作成
      const today = new Date();
      const seedStr = `${today.getFullYear()}${today.getMonth() + 1}${today.getDate()}`;
      
      // ジャンルごとにクエストをグループ化
      const questsByCategory = allQuests.reduce((acc, quest) => {
        const category = quest.category || "Life";
        if (!acc[category]) {
          acc[category] = [];
        }
        acc[category].push(quest);
        return acc;
      }, {} as Record<QuestCategory, Quest[]>);
      
      const categories = Object.keys(questsByCategory) as QuestCategory[];
      
      // 日付ベースのランダムシャッフルで、毎日違うカテゴリの組み合わせを選ぶ
      const shuffledCategories = shuffle(categories, seedStr);

      const selectedQuests: Quest[] = [];
      for (let i = 0; i < count; i++) {
        // カテゴリを循環させて偏りをなくす
        const category = shuffledCategories[i % shuffledCategories.length];
        const questsInCat = questsByCategory[category];
        if (questsInCat && questsInCat.length > 0) {
          // 各カテゴリ内でも日付ベースのランダムでクエストを1つ選ぶ
          const questSeed = `${seedStr}-${category}`;
          const selectedQuest = shuffle(questsInCat, questSeed)[0];
          selectedQuests.push(selectedQuest);
        }
      }
      
      return selectedQuests;
    },
    // staleTimeを長く設定し、同じ日はキャッシュを使うようにする
    staleTime: 60 * 60 * 1000, // 1時間
  });
}

// 文字列ベースのシードを使った決定論的シャッフル関数
function shuffle<T>(array: T[], seed: string): T[] {
  const arr = [...array];
  let m = arr.length;
  let t;
  let i;
  
  const rand = mulberry32(cyrb32(seed));

  while (m) {
    i = Math.floor(rand() * m--);
    t = arr[m];
    arr[m] = arr[i];
    arr[i] = t;
  }
  return arr;
}

// 文字列から32ビットのハッシュ値を生成
function cyrb32(str: string) {
  let h1 = 1779033703, h2 = 3144134277,
      h3 = 1013904242, h4 = 2773480762;
  for (let i = 0, k; i < str.length; i++) {
      k = str.charCodeAt(i);
      h1 = h2 ^ Math.imul(h1 ^ k, 597399067);
      h2 = h3 ^ Math.imul(h2 ^ k, 2869860233);
      h3 = h4 ^ Math.imul(h3 ^ k, 951274213);
      h4 = h1 ^ Math.imul(h4 ^ k, 2716044179);
  }
  h1 = Math.imul(h3 ^ (h1 >>> 18), 597399067);
  h2 = Math.imul(h4 ^ (h2 >>> 22), 2869860233);
  h3 = Math.imul(h1 ^ (h3 >>> 17), 951274213);
  h4 = Math.imul(h2 ^ (h4 >>> 19), 2716044179);
  return (h1^h2^h3^h4)>>>0;
}

// シード付き疑似乱数生成器
function mulberry32(a: number) {
  return function() {
    a |= 0; a = a + 1831565813 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }
}