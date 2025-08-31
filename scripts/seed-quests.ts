// scripts/seed-quests.ts
import { config } from "dotenv";
import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local") }); // ← .env.local を明示読み込み

import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, serverTimestamp } from "firebase/firestore";

// 必須ENVチェック
const required = [
  "NEXT_PUBLIC_FIREBASE_API_KEY",
  "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
  "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
  "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
  "NEXT_PUBLIC_FIREBASE_APP_ID",
] as const;
for (const k of required) {
  if (!process.env[k]) throw new Error(`ENV missing: ${k}. Check your .env.local`);
}

const configFirebase = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
};

const app = initializeApp(configFirebase);
const db = getFirestore(app);

// デモクエスト
const quests = [
  { title: "朝の空を写真に撮ろう", description: "ちょっと外を見て、今日の空をシェアしよう！", tag: "日常" },
  { title: "水を一杯飲んでリフレッシュ", description: "朝イチでも夜でもOK！体も頭もシャキッと。", tag: "健康" },
  { title: "10回だけストレッチ or 筋トレ", description: "腕立て・スクワット・ストレッチ、好きなのを10回やってみよう。", tag: "運動" },
  { title: "今日のベスト瞬間を写真に残そう", description: "美味しいご飯、友達との時間、景色…なんでもOK！", tag: "ライフ" },
  { title: "誰かにありがとうを伝えよう", description: "メッセージでも口でもOK。ちょっと心が温かくなるクエスト。", tag: "人間関係" },
  { title: "机の上を2分だけ片付け", description: "小さな整理で、気分スッキリ！", tag: "整理整頓" },
  { title: "お気に入りの曲を1曲聴こう", description: "好きな音楽で気分を切り替えよう！", tag: "音楽" },
  { title: "今日をひとことで表現", description: "「最高」「眠い」「カレー」でもOK！投稿で気軽に共有しよう。", tag: "言葉" },
  { title: "身近な緑を探して写真に", description: "公園の木でも、道端の草花でも。自然を感じてみよう！", tag: "自然" },
  { title: "明日の自分にひとことメッセージ", description: "「がんばれ」「早起きしよう！」など。未来の自分に小さな応援。", tag: "自己成長" },
];

async function main() {
  const ref = collection(db, "quests");
  for (const q of quests) {
    await addDoc(ref, { ...q, isGlobal: true, createdAt: serverTimestamp() });
  }
  console.log("✅ Quests seeded successfully!");
}
main().catch((e) => {
  console.error("❌ Seeding failed:", e);
  process.exit(1);
});

