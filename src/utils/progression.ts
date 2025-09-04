export type UserStats = {
  Life: number;
  Study: number;
  Physical: number;
  Social: number;
  Creative: number;
  Mental: number;
};

export function computeLevel(xp: number): number {
  // 100XPで1レベル上がる簡易式（例：300XP => Lv.3）
  return Math.max(1, Math.floor(xp / 100) + 1);
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
    "Life-Study":   { 初級:"生活学習者", 中級:"知識実践家",     上級:"暮らしの賢者" },
    "Life-Physical":{ 初級:"元気生活者", 中級:"健康探求者",     上級:"究極フィットライフ" },
    "Life-Social":  { 初級:"世話好きフレンド", 中級:"コミュニティ支援者", 上級:"暮らしのリーダー" },
    "Life-Creative":{ 初級:"アイデア生活者", 中級:"ライフデザイナー", 上級:"革新ライフメーカー" },
    "Life-Mental":  { 初級:"心整え人",   中級:"マインドガイド",   上級:"生活賢者" },

    "Study-Physical": { 初級:"学習マッチョ", 中級:"筋肉教授",       上級:"最強博士" },
    "Study-Social":   { 初級:"勉強仲間",   中級:"知識シェアラー",   上級:"賢者リーダー" },
    "Study-Creative": { 初級:"ひらめき学習者", 中級:"発明家",       上級:"革命的イノベーター" },
    "Study-Mental":   { 初級:"集中学習者", 中級:"思考探求者",       上級:"叡智の賢者" },

    "Physical-Social":  { 初級:"スポーツ仲間", 中級:"闘志リーダー",     上級:"闘魂カリスマ" },
    "Physical-Creative":{ 初級:"元気クリエイター", 中級:"身体表現者",   上級:"究極アーティスト" },
    "Physical-Mental":  { 初級:"ストイック挑戦者", 中級:"精神戦士",     上級:"鉄人賢者" },

    "Social-Creative": { 初級:"おしゃべりクリエイター", 中級:"共感デザイナー", 上級:"インスパイアリーダー" },
    "Social-Mental":   { 初級:"癒しフレンド",       中級:"心の相談役",   上級:"共感賢者" },
    "Creative-Mental": { 初級:"夢見る人",         中級:"創造探求者",   上級:"哲学的クリエイター" },
  };
  const key = `${pair[0]}-${pair[1]}`;
  return (T[key] ?? T["Life-Study"])[tier];
}

function orderPair(a: keyof UserStats, b: keyof UserStats): [keyof UserStats, keyof UserStats] {
  const arr: [keyof UserStats, keyof UserStats] = a < b ? [a,b] : [b,a];
  return arr;
}
