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

// --- 全クエストリスト ---
// tag を category と同じ値に統一
const quests = [
  // Life
  { title: "朝一番の空を撮る", description: "今日の始まりを写真に収めよう。", tag: "Life", category: "Life" },
  { title: "水を1.5リットル飲む", description: "体を内側から潤してリフレッシュ。", tag: "Life", category: "Life" },
  { title: "ベッドメイキングをする", description: "一日の始まりと終わりを気持ちよく。", tag: "Life", category: "Life" },
  { title: "作った料理を写真に撮る", description: "今日の美味しい瞬間を記録しよう。", tag: "Life", category: "Life" },
  { title: "近所の知らない道を歩く", description: "新しいお店や景色が見つかるかも。", tag: "Life", category: "Life" },
  { title: "靴を磨く", description: "足元がきれいだと気分も引き締まる。", tag: "Life", category: "Life" },
  { title: "部屋の植物に水をあげる", description: "小さな命の成長を感じよう。", tag: "Life", category: "Life" },
  { title: "寝る前に10分間ストレッチ", description: "今日の疲れをリセット。", tag: "Life", category: "Life" },
  { title: "冷蔵庫の中のものを一つ使い切る", description: "フードロス削減に貢献！", tag: "Life", category: "Life" },
  { title: "窓を一枚だけ拭いてみる", description: "外の景色がクリアに見えるように。", tag: "Life", category: "Life" },
  { title: "プレイリストを作る", description: "今の気分に合う曲を集めてみよう。", tag: "Life", category: "Life" },
  { title: "カフェで一息つく", description: "いつもと違う場所でリラックス。", tag: "Life", category: "Life" },
  { title: "夕日の写真を撮る", description: "一日の終わりの美しい瞬間をシェア。", tag: "Life", category: "Life" },
  { title: "旬の野菜か果物を食べる", description: "季節の味を楽しもう。", tag: "Life", category: "Life" },
  { title: "部屋に花を飾る", description: "一輪だけでも空間が華やぐ。", tag: "Life", category: "Life" },
  { title: "お気に入りのマグカップを見せる", description: "あなたの「好き」を共有しよう。", tag: "Life", category: "Life" },
  { title: "エコバッグを持って買い物に行く", description: "地球にちょっといいことを。", tag: "Life", category: "Life" },
  { title: "寝る1時間前はスマホを見ない", description: "デジタルデトックスで質の良い睡眠を。", tag: "Life", category: "Life" },
  { title: "玄関の掃除をする", description: "幸運の入り口をきれいに。", tag: "Life", category: "Life" },
  { title: "今日の「小さな幸せ」を3つ書く", description: "感謝の気持ちを再確認。", tag: "Life", category: "Life" },
  // Study
  { title: "新しい英単語を3つ覚える", description: "小さな一歩が大きな力に。", tag: "Study", category: "Study" },
  { title: "ニュース記事を1つ読んで要約する", description: "世の中の動きを知ろう。", tag: "Study", category: "Study" },
  { title: "気になった言葉を辞書で引く", description: "言葉の世界を冒険しよう。", tag: "Study", category: "Study" },
  { title: "Wikipediaで興味のある項目を読みふける", description: "知識の迷路を楽しもう。", tag: "Study", category: "Study" },
  { title: "見た映画や読んだ本の感想を一行で書く", description: "心に残ったことを言葉に。", tag: "Study", category: "Study" },
  { title: "YouTubeで5分間の学習系動画を見る", description: "スキマ時間で賢くなろう。", tag: "Study", category: "Study" },
  { title: "ツールのショートカットを1つ覚える", description: "未来の自分の作業が少し楽になる。", tag: "Study", category: "Study" },
  { title: "15分間だけ集中して読書する", description: "物語や知識の世界にダイブ。", tag: "Study", category: "Study" },
  { title: "今日学んだことを誰かに話す", description: "アウトプットで記憶が定着する。", tag: "Study", category: "Study" },
  { title: "「これはどうして？」と思ったことを調べる", description: "好奇心は成長のエンジン。", tag: "Study", category: "Study" },
  { title: "専門分野に関する記事を1つ読む", description: "知識をアップデートしよう。", tag: "Study", category: "Study" },
  { title: "使っている文房具を見せる", description: "あなたの学習のお供を紹介。", tag: "Study", category: "Study" },
  { title: "ポッドキャストを1エピソード聴く", description: "耳から新しい情報をインプット。", tag: "Study", category: "Study" },
  { title: "オンライン展示を見る", description: "家にいながら芸術や歴史に触れる。", tag: "Study", category: "Study" },
  { title: "1日のやることリストを作る", description: "頭の中を整理して効率アップ。", tag: "Study", category: "Study" },
  { title: "尊敬する人の名言を1つ見つける", description: "偉人の言葉からヒントをもらおう。", tag: "Study", category: "Study" },
  { title: "PCのデスクトップを整理する", description: "デジタル空間もきれいに。", tag: "Study", category: "Study" },
  { title: "見たことのないドキュメンタリーを観る", description: "新しい世界を覗いてみよう。", tag: "Study", category: "Study" },
  { title: "5分間タイピング練習をする", description: "速く正確な入力を目指して。", tag: "Study", category: "Study" },
  { title: "新しいスキルに関する本を探す", description: "次への投資をしよう。", tag: "Study", category: "Study" },
  // Physical
  { title: "一駅手前で降りて歩く", description: "いつもの帰り道を小さなフィットネスに。", tag: "Physical", category: "Physical" },
  { title: "ラジオ体操をやってみる", description: "懐かしい動きで全身をほぐそう。", tag: "Physical", category: "Physical" },
  { title: "15分間のウォーキング", description: "音楽を聴きながら気分転換。", tag: "Physical", category: "Physical" },
  { title: "スクワットを20回やる", description: "下半身を鍛えて代謝アップ。", tag: "Physical", category: "Physical" },
  { title: "階段を使う", description: "エレベーターやエスカレーターの代わりに。", tag: "Physical", category: "Physical" },
  { title: "今日の歩数を見せて", description: "どれだけ歩いたかシェアしよう！", tag: "Physical", category: "Physical" },
  { title: "寝る前のプランク30秒チャレンジ", description: "体幹を鍛えよう。", tag: "Physical", category: "Physical" },
  { title: "健康的なおやつを食べる", description: "ナッツやヨーグルトで小腹を満たそう。", tag: "Physical", category: "Physical" },
  { title: "スポーツの写真を撮る", description: "アクティブな瞬間を共有。", tag: "Physical", category: "Physical" },
  { title: "今日のヘルシーな食事を見せる", description: "健康を意識した一品は？", tag: "Physical", category: "Physical" },
  { title: "肩甲骨ストレッチをする", description: "デスクワークの疲れを解消。", tag: "Physical", category: "Physical" },
  { title: "背筋を伸ばして1分間キープ", description: "姿勢を意識してみよう。", tag: "Physical", category: "Physical" },
  { title: "縄跳びを1分間跳んでみる", description: "童心に返って有酸素運動。", tag: "Physical", category: "Physical" },
  { title: "お気に入りのスポーツウェアを見せる", description: "形から入るのも大事！", tag: "Physical", category: "Physical" },
  { title: "腹式呼吸を10回する", description: "深い呼吸でリラックス。", tag: "Physical", category: "Physical" },
  { title: "近所の公園で懸垂に挑戦", description: "1回できなくてもOK！", tag: "Physical", category: "Physical" },
  { title: "ダンス動画で1曲踊ってみる", description: "楽しみながらカロリー消費。", tag: "Physical", category: "Physical" },
  { title: "体重や体脂肪を記録する", description: "自分の体と向き合う習慣。", tag: "Physical", category: "Physical" },
  { title: "高タンパクな食事を摂る", description: "体づくりの基本。", tag: "Physical", category: "Physical" },
  { title: "フォームローラーで体をほぐす", description: "一日の終わりにセルフケア。", tag: "Physical", category: "Physical" },
  // Social
  { title: "友達や家族に「ありがとう」と伝える", description: "感謝の気持ちを言葉にしよう。", tag: "Social", category: "Social" },
  { title: "誰かの良いところを一つ見つけて褒める", description: "ポジティブな空気を広げよう。", tag: "Social", category: "Social" },
  { title: "旧友にメッセージを送る", description: "「元気？」の一言から。", tag: "Social", category: "Social" },
  { title: "店員さんに「ありがとう」と目を見て言う", description: "小さな交流を大切に。", tag: "Social", category: "Social" },
  { title: "SNSで誰かにポジティブなコメントをする", description: "応援の気持ちを伝えよう。", tag: "Social", category: "Social" },
  { title: "家族と10分間話す", description: "今日の出来事を話してみよう。", tag: "Social", category: "Social" },
  { title: "地域のイベント情報を調べる", description: "あなたの街で何が起きているか見てみよう。", tag: "Social", category: "Social" },
  { title: "おすすめのお店を誰かに教える", description: "お気に入りをシェアしよう。", tag: "Social", category: "Social" },
  { title: "ボランティア活動について調べる", description: "自分にできる貢献を探してみよう。", tag: "Social", category: "Social" },
  { title: "誰かに小さなプレゼントをする", description: "お菓子一つでも嬉しいもの。", tag: "Social", category: "Social" },
  { title: "ランチに誰かを誘ってみる", description: "一緒に食事をすると会話も弾む。", tag: "Social", category: "Social" },
  { title: "自分の「推し」を布教する", description: "あなたの「好き」を熱く語ろう！", tag: "Social", category: "Social" },
  { title: "エレベーターで「開」ボタンを押して待つ", description: "周りの人への小さな親切。", tag: "Social", category: "Social" },
  { title: "地元の店で買い物をする", description: "地域経済を応援しよう。", tag: "Social", category: "Social" },
  { title: "誰かの相談にのる", description: "ただ話を聞くだけでも力になる。", tag: "Social", category: "Social" },
  { title: "面白い投稿をシェアする", description: "笑いや発見を共有しよう。", tag: "Social", category: "Social" },
  { title: "誰かに手伝いを申し出る", description: "「何か手伝おうか？」と声をかけてみよう。", tag: "Social", category: "Social" },
  { title: "公共の場所をきれいに使う", description: "次に使う人のことを考えて。", tag: "Social", category: "Social" },
  { title: "恩師や先輩に近況報告をする", description: "懐かしい繋がりを思い出そう。", tag: "Social", category: "Social" },
  { title: "新しいコミュニティを探してみる", description: "新しい出会いの一歩。", tag: "Social", category: "Social" },
  // Creative
  { title: "身の回りの「面白い形」を撮る", description: "普段見過ごしているデザインを探そう。", tag: "Creative", category: "Creative" },
  { title: "5分間ドローイング", description: "目の前にあるものをスケッチしてみよう。", tag: "Creative", category: "Creative" },
  { title: "今日の出来事を一句詠む（5・7・5）", description: "日常を言葉で切り取ってみよう。", tag: "Creative", category: "Creative" },
  { title: "好きな曲の歌詞を書き写す", description: "言葉の響きや意味を味わおう。", tag: "Creative", category: "Creative" },
  { title: "写真をアーティスティックに加工する", description: "フィルターや編集で遊んでみよう。", tag: "Creative", category: "Creative" },
  { title: "折り紙を一つ折ってみる", description: "指先を使うと脳が活性化する。", tag: "Creative", category: "Creative" },
  { title: "新しいレシピに挑戦する", description: "いつもの食卓に変化を。", tag: "Creative", category: "Creative" },
  { title: "鼻歌で即興の曲を作ってみる", description: "あなただけのメロディー。", tag: "Creative", category: "Creative" },
  { title: "部屋の模様替えを少しだけする", description: "小物の配置を変えるだけでも新鮮。", tag: "Creative", category: "Creative" },
  { title: "「もしも〜だったら」で物語を考える", description: "想像力を羽ばたかせよう。", tag: "Creative", category: "Creative" },
  { title: "自分の好きな色を集めて写真を撮る", description: "あなたのテーマカラーは何？", tag: "Creative", category: "Creative" },
  { title: "新しいコーディネートを組む", description: "ファッションは自己表現。", tag: "Creative", category: "Creative" },
  { title: "粘土やブロックで何か作ってみる", description: "立体的な創作を楽しもう。", tag: "Creative", category: "Creative" },
  { title: "観葉植物の鉢をデコレーションする", description: "あなたのグリーンを個性的に。", tag: "Creative", category: "Creative" },
  { title: "自分の名前であいうえお作文を作る", description: "自己紹介をクリエイティブに。", tag: "Creative", category: "Creative" },
  { title: "オリジナルのキャラクターを描いてみる", description: "上手い下手は関係ない！", tag: "Creative", category: "Creative" },
  { title: "楽器に触れてみる", description: "家に眠っている楽器を鳴らしてみよう。", tag: "Creative", category: "Creative" },
  { title: "最近作ったものを見せて", description: "料理、DIY、作品…なんでもOK！", tag: "Creative", category: "Creative" },
  { title: "塗り絵をする", description: "無心で色を塗ってリラックス。", tag: "Creative", category: "Creative" },
  { title: "ブログやSNSに短い文章を投稿する", description: "自分の考えを発信してみよう。", tag: "Creative", category: "Creative" },
  // Mental
  { title: "3分間、目を閉じて深呼吸する", description: "心を落ち着かせて今に集中。", tag: "Mental", category: "Mental" },
  { title: "今日できたことを3つ褒める", description: "小さな成功体験を認めよう。", tag: "Mental", category: "Mental" },
  { title: "スマホの通知を1時間オフにする", description: "情報から離れる時間を作ろう。", tag: "Mental", category: "Mental" },
  { title: "鏡の自分に「お疲れ様」と言う", description: "一番の味方は自分自身。", tag: "Mental", category: "Mental" },
  { title: "自然の音に耳を澄ます", description: "心を癒すサウンドスケープ。", tag: "Mental", category: "Mental" },
  { title: "考え事を紙に書き出す", description: "頭の中を整理して客観的に見つめる。", tag: "Mental", category: "Mental" },
  { title: "リラックスできる音楽を聴く", description: "心安らぐメロディーに身を任せよう。", tag: "Mental", category: "Mental" },
  { title: "ぼーっとする時間を作る", description: "何もしない贅沢を味わおう。", tag: "Mental", category: "Mental" },
  { title: "感謝していることを思い浮かべる", description: "ポジティブな気持ちで心を満たそう。", tag: "Mental", category: "Mental" },
  { title: "「まあ、いっか」と口に出してみる", description: "完璧主義を少しだけ手放そう。", tag: "Mental", category: "Mental" },
  { title: "目標を小さなステップに分解する", description: "大きな山も一歩から。", tag: "Mental", category: "Mental" },
  { title: "好きな香りを嗅ぐ", description: "アロマやお香でリラックス。", tag: "Mental", category: "Mental" },
  { title: "朝日を5分間浴びる", description: "体内時計をリセットして気分を前向きに。", tag: "Mental", category: "Mental" },
  { title: "ポジティブな言葉を声に出して読む", description: "言葉の力で自己肯定感を高める。", tag: "Mental", category: "Mental" },
  { title: "昔の楽しかった思い出に浸る", description: "アルバムを見返すのも良い。", tag: "Mental", category: "Mental" },
  { title: "やりたくないことを一つ断る", description: "自分の心の負担を軽くしよう。", tag: "Mental", category: "Mental" },
  { title: "感動した作品について思いを馳せる", description: "心を揺さぶられた瞬間をもう一度。", tag: "Mental", category: "Mental" },
  { title: "自分の長所を一つ見つける", description: "自分自身の良いところに目を向けよう。", tag: "Mental", category: "Mental" },
  { title: "温かい飲み物をゆっくり味わう", description: "体と心を温めよう。", tag: "Mental", category: "Mental" },
  { title: "寝る前に今日あった良いことを思い出す", description: "穏やかな気持ちで一日を締めくくる。", tag: "Mental", category: "Mental" },
];

async function main() {
  const batch = db.batch();
  const col = db.collection("quests");

  quests.forEach((q) => {
    const ref = col.doc(); // 自動ID
    batch.set(ref, {
      ...q,
      isGlobal: true,
      createdAt: FieldValue.serverTimestamp(),
    });
  });

  await batch.commit();
  console.log(`✅ Seed completed: ${quests.length} quests inserted.`);
}

main().catch((e) => {
  console.error("❌ Seeding failed:", e);
  process.exit(1);
});