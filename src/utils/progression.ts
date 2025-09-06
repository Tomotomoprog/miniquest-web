export type UserStats = {
  Life: number;
  Study: number;
  Physical: number;
  Social: number;
  Creative: number;
  Mental: number;
};

/**
 * 現在のXPからレベルを計算します。
 * @param xp 現在のXP
 * @returns レベル
 */
export function computeLevel(xp: number): number {
  // 100XPで1レベル上がる
  return Math.max(1, Math.floor(xp / 100) + 1);
}

/**
 * レベルアップに必要なXPの情報を計算します。
 * @param xp 現在のXP
 */
export function computeXpProgress(xp: number) {
  const level = computeLevel(xp);
  // 現レベルになるために必要なXP (Lv1は0, Lv2は100)
  const baseXpForCurrentLevel = (level - 1) * 100;
  // 次のレベルになるために必要なXP
  const xpForNextLevel = level * 100;

  // 現レベルで溜めたXP
  const xpInCurrentLevel = xp - baseXpForCurrentLevel;
  // 次のレベルまでに必要なXP量
  const xpNeededForNextLevel = 100;

  // 進捗率 (0〜100)
  const progressPercentage = Math.floor((xpInCurrentLevel / xpNeededForNextLevel) * 100);

  return {
    level,
    xpInCurrentLevel, // 現在のレベルで獲得したXP
    xpNeededForNextLevel, // 次のレベルアップまでに必要なXP (常に100)
    progressPercentage, // 次のレベルまでの進捗率 (%)
  };
}


export type ClassResult = { title: string; tier: "初級"|"中級"|"上級"; pair: [string, string] };

export function computeClass(stats: UserStats, level: number): ClassResult {
  const entries = Object.entries(stats) as [keyof UserStats, number][];
  const sorted = entries.sort((a,b) => b[1] - a[1]);
  const [p1, p2] = [sorted[0]?.[0] ?? "Life", sorted[1]?.[0] ?? "Study"];
  const tier: "初級"|"中級"|"上級" = level <= 30 ? "初級" : level <= 70 ? "中級" : "上級";
  const title = mapClassTitle(p1, p2, tier);
  return { title, tier, pair: [p1, p2] as [string, string] };
}

function mapClassTitle(a: keyof UserStats, b: keyof UserStats, tier: "初級"|"中級"|"上級"): string {
  const pair = orderPair(a,b);
  const T: Record<string, { 初級: string; 中級: string; 上級: string }> = {
    "Creative-Life": { 初級:"アイデア生活者", 中級:"ライフデザイナー", 上級:"革新ライフメーカー" },
    "Creative-Mental": { 初級:"夢見る人",         中級:"創造探求者",   上級:"哲学的クリエイター" },
    "Creative-Physical":{ 初級:"元気クリエイター", 中級:"身体表現者",   上級:"究極アーティスト" },
    "Creative-Social": { 初級:"おしゃべりクリエイター", 中級:"共感デザイナー", 上級:"インスパイアリーダー" },
    "Creative-Study": { 初級:"ひらめき学習者", 中級:"発明家",       上級:"革命的イノベーター" },
    "Life-Mental":  { 初級:"心整え人",   中級:"マインドガイド",   上級:"生活賢者" },
    "Life-Physical":{ 初級:"元気生活者", 中級:"健康探求者",     上級:"究極フィットライフ" },
    "Life-Social":  { 初級:"世話好きフレンド", 中級:"コミュニティ支援者", 上級:"暮らしのリーダー" },
    "Life-Study":   { 初級:"生活学習者", 中級:"知識実践家",     上級:"暮らしの賢者" },
    "Mental-Physical":  { 初級:"ストイック挑戦者", 中級:"精神戦士",     上級:"鉄人賢者" },
    "Mental-Social":   { 初級:"癒しフレンド",       中級:"心の相談役",   上級:"共感賢者" },
    "Mental-Study":   { 初級:"集中学習者", 中級:"思考探求者",       上級:"叡智の賢者" },
    "Physical-Social":  { 初級:"スポーツ仲間", 中級:"闘志リーダー",     上級:"闘魂カリスマ" },
    "Physical-Study": { 初級:"学習マッチョ", 中級:"筋肉教授",       上級:"最強博士" },
    "Social-Study":   { 初級:"勉強仲間",   中級:"知識シェアラー",   上級:"賢者リーダー" },
  };
  const key = `${pair[0]}-${pair[1]}`;
  return (T[key] ?? T["Life-Study"])[tier];
}

function orderPair(a: keyof UserStats, b: keyof UserStats): [keyof UserStats, keyof UserStats] {
  const order: (keyof UserStats)[] = ["Creative", "Life", "Mental", "Physical", "Social", "Study"];
  const sortedPair = [a, b].sort((val1, val2) => order.indexOf(val1) - order.indexOf(val2));
  return sortedPair as [keyof UserStats, keyof UserStats];
}