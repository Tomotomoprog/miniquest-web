import { HttpsError, onCall } from "firebase-functions/v2/https";
import { initializeApp } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

// Firebase Admin SDKを初期化
initializeApp();

// updateUserProfile という名前のCallable Functionを定義
export const updateUserProfile = onCall(async (request) => {
  // 認証されていないユーザーからの呼び出しは拒否
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "You must be logged in.");
  }

  const uid = request.auth.uid;
  const newDisplayName = request.data.displayName;

  // --- 入力値のバリデーション ---
  if (typeof newDisplayName !== "string" || newDisplayName.trim().length === 0 || newDisplayName.length > 20) {
    throw new HttpsError("invalid-argument", "Display name must be a non-empty string and less than 20 characters.");
  }

  const db = getFirestore();
  const auth = getAuth();
  const userDocRef = db.collection("users").doc(uid);

  // ▼▼▼▼▼ ここから修正 ▼▼▼▼▼
  const userDoc = await userDocRef.get();
  const userData = userDoc.data();

  // --- 前回の名前変更からの経過時間をチェック ---
  if (userData?.displayNameLastChanged) {
    const lastChanged = userData.displayNameLastChanged.toDate();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    if (lastChanged > thirtyDaysAgo) {
      throw new HttpsError("failed-precondition", "You can only change your name once every 30 days.");
    }
  }
  // ▲▲▲▲▲ 修正ここまで ▲▲▲▲▲

  let uniqueTag: string = "";
  let isUnique = false;
  let finalUsername = "";
  let attempts = 0;

  // 重複しないユーザー名が見つかるまで、または10回試行するまでループ
  while (!isUnique && attempts < 10) {
    uniqueTag = String(Math.floor(1000 + Math.random() * 9000));
    finalUsername = `${newDisplayName}#${uniqueTag}`;

    // usersコレクションから同じusernameを持つドキュメントを検索
    const snapshot = await db.collection("users").where("username", "==", finalUsername).limit(1).get();

    if (snapshot.empty) {
      isUnique = true;
    }
    attempts++;
  }

  if (!isUnique) {
    throw new HttpsError("internal", "Could not generate a unique username. Please try a different name.");
  }

  try {
    // Firestoreのユーザー情報を更新
    await userDocRef.set({
      displayName: newDisplayName,
      username: finalUsername,
      uniqueTag: uniqueTag,
      displayNameLastChanged: FieldValue.serverTimestamp(), // 👈 修正: この行を追加
    }, { merge: true });

    // Firebase Authenticationのプロフィールも更新
    await auth.updateUser(uid, {
      displayName: newDisplayName,
    });

    return { success: true, username: finalUsername };
  } catch (error) {
    console.error("Error updating profile:", error);
    throw new HttpsError("internal", "An error occurred while updating the profile.");
  }
});