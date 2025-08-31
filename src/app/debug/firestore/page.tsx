"use client";
import { db } from "@/lib/firebase";
import { collection, getDocs, limit, query } from "firebase/firestore";
import { useEffect, useState } from "react";

export default function FirestoreDebug() {
  const [out, setOut] = useState<string>("running...");

  useEffect(() => {
    (async () => {
      try {
        const q = query(collection(db, "quests"), limit(3));
        const snap = await getDocs(q);
        setOut(JSON.stringify(snap.docs.map(d=>({id:d.id, ...d.data()})), null, 2));
      } catch (e: any) {
        console.error("Firestore debug error:", e);
        setOut(`ERROR: ${e?.code || ""} ${e?.message || e}`);
      }
    })();
  }, []);

  return <pre style={{ padding: 16, whiteSpace: "pre-wrap" }}>{out}</pre>;
}
