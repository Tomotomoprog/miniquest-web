// scripts/seed-quests-admin.ts
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import fs from "fs";
import path from "path";

// サービスアカウントキーの読み込み
const keyPath = path.resolve(process.cwd(), "serviceAccountKey.json");
if (!fs.existsSync(keyPath)) {
  throw new Error("serviceAccountKey.json が見つかりません。プロジェクト直下に配置してください。");
}

initializeApp({
  credential: cert(keyPath),
});

const db = getFirestore();

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
  const batch = db.batch();
  const col = db.collection("quests");
  for (const q of quests) {
    const ref = col.doc(); // 自動ID
    batch.set(ref, { ...q, isGlobal: true, createdAt: FieldValue.serverTimestamp() });
  }
  await batch.commit();
  console.log("✅ Admin seeding done!");
}

main().catch((e) => {
  console.error("❌ Admin seeding failed:", e);
  process.exit(1);
});
