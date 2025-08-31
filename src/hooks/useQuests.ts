"use client";

import { useQuery } from "@tanstack/react-query";
import { db } from "@/lib/firebase";
import { collection, getDocs, orderBy, query } from "firebase/firestore";

export type Quest = {
  id: string;
  title: string;
  description: string;
  tag: string;
};

export function useQuests() {
  return useQuery<Quest[]>({
    queryKey: ["quests"],
    queryFn: async () => {
      const q = query(collection(db, "quests"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      return snap.docs.map((doc) => ({ id: doc.id, ...(doc.data() as Omit<Quest,"id">) }));
    },
  });
}
