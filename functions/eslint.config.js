import globals from "globals";
import tseslint from "typescript-eslint";

export default [
  // ビルド後のファイルはチェック対象外にする
  {
    ignores: ["lib/**"],
  },
  // 推奨ルールセットを適用
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      // Node.jsのグローバル変数を有効にする
      globals: {
        ...globals.node,
      },
    },
    // 必要に応じて個別のルールを追記
    rules: {
      "quotes": ["error", "double"],
      "import/no-unresolved": "off",
      "@typescript-eslint/no-unused-vars": "warn",
    },
  },
];