import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getFunctions } from "firebase/functions";

const cfg = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? ""
};

const app = getApps().length ? getApp() : initializeApp(cfg);

export const auth = getAuth(app);
export const db = getFirestore(app);

// ▼▼▼▼▼ この部分を修正しました ▼▼▼▼▼
// バケット名を直接指定するのをやめ、SDKに自動で検出させます。
// これにより、環境設定ファイルの値に左右されなくなります。
export const storage = getStorage(app);
// ▲▲▲▲▲ 修正ここまで ▲▲▲▲▲

export const functions = getFunctions(app);
export const provider = new GoogleAuthProvider();