// scripts/seed-quests-admin.ts

import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import fs from "fs";
import path from "path";

// --- 安全チェック：鍵パスの存在確認 ---
const keyPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
if (!keyPath) {
  throw new Error(
    "環境変数 GOOGLE_APPLICATION_CREDENTIALS が未設定です。serviceAccountKey.json への絶対パスを設定してください。"
  );
}
const resolvedKeyPath = path.resolve(keyPath);
if (!fs.existsSync(resolvedKeyPath)) {
  throw new Error(`鍵ファイルが見つかりません: ${resolvedKeyPath}`);
}

// --- Admin SDK 初期化 ---
initializeApp({
  credential: cert(resolvedKeyPath),
});
const db = getFirestore();

// --- デモ用クエスト ---
const quests: Array<{ title: string; description: string; tag: string }> = [
  { title: "朝の空を写真に撮ろう", description: "ちょっと外を見て、今日の空をシェアしよう！", tag: "日常" },
  { title: "水を一杯飲んでリフレッシュ", description: "朝イチでも夜でもOK！体も頭もシャキッと。", tag: "健康" },
  { title: "10回だけストレッチ or 筋トレ", description: "腕立て・スクワット・ストレッチ、好きなのを10回やってみよう。", tag: "運動" },
  { title: "今日のベスト瞬間を写真に残そう", description: "美味しいご飯、友達との時間、景色…なんでもOK！", tag: "ライフ" },
  { title: "誰かにありがとうを伝えよう", description: "メッセでも口でもOK。ちょっと心が温かくなるクエスト。", tag: "人間関係" },
  { title: "机の上を2分だけ片付け", description: "小さな整理で、気分スッキリ！", tag: "整理整頓" },
  { title: "お気に入りの曲を1曲聴こう", description: "好きな音楽で気分を切り替えよう！", tag: "音楽" },
  { title: "今日をひとことで表現", description: "「最高」「眠い」「カレー」でもOK！投稿で気軽に共有しよう。", tag: "言葉" },
  { title: "身近な緑を探して写真に", description: "公園の木でも、道端の草花でも。自然を感じてみよう！", tag: "自然" },
  { title: "明日の自分にひとことメッセージ", description: "「がんばれ」「早起きしよう！」など。未来の自分に小さな応援。", tag: "自己成長" },
];

async function main() {
  const batch = db.batch();
  const col = db.collection("quests");

  quests.forEach((q) => {
    const ref = col.doc(); // 自動ID
    batch.set(ref, {
      ...q,
      isGlobal: true,
      createdAt: FieldValue.serverTimestamp(), // ← 修正
    });
  });

  await batch.commit();
  console.log(`✅ Seed completed: ${quests.length} quests inserted.`);
}

main().catch((e) => {
  console.error("❌ Seeding failed:", e);
  process.exit(1);
});
