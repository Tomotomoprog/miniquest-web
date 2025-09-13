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
  const { displayName, bio } = request.data;

  const db = getFirestore();
  const auth = getAuth();
  const userDocRef = db.collection("users").doc(uid);

  const updates: { [key: string]: string | FieldValue } = {};
  let newUsername: string | undefined = undefined;

  // --- 表示名の更新処理 ---
  if (displayName !== undefined) {
    if (typeof displayName !== "string" || displayName.trim().length === 0 || displayName.length > 20) {
      throw new HttpsError("invalid-argument", "Display name must be a non-empty string and less than 20 characters.");
    }
    const newDisplayName = displayName.trim();

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

    let finalUsername: string | undefined = undefined;
    let uniqueTag = "";
    let isUnique = false;
    let attempts = 0;

    // 重複しないユーザー名が見つかるまで、または10回試行するまでループ
    while (!isUnique && attempts < 10) {
      uniqueTag = String(Math.floor(1000 + Math.random() * 9000));
      finalUsername = `${newDisplayName}#${uniqueTag}`;

      const snapshot = await db.collection("users").where("username", "==", finalUsername).limit(1).get();
      if (snapshot.empty) {
        isUnique = true;
      }
      attempts++;
    }

    if (isUnique && finalUsername) {
        updates.displayName = newDisplayName;
        updates.username = finalUsername;
        updates.uniqueTag = uniqueTag;
        updates.displayNameLastChanged = FieldValue.serverTimestamp();
        newUsername = finalUsername;
    } else {
        throw new HttpsError("internal", "Could not generate a unique username. Please try a different name.");
    }
  }

  // --- 自己紹介の更新処理 ---
  if (bio !== undefined) {
    if (typeof bio !== "string" || bio.length > 160) {
      throw new HttpsError("invalid-argument", "Bio must be a string and less than 160 characters.");
    }
    updates.bio = bio;
  }

  if (Object.keys(updates).length === 0) {
    throw new HttpsError("invalid-argument", "No fields to update were provided.");
  }
  
  try {
    // Firestoreのユーザー情報を更新
    await userDocRef.set(updates, { merge: true });

    // Firebase Authenticationのプロフィールも更新 (表示名が変更された場合のみ)
    if (updates.displayName) {
      await auth.updateUser(uid, {
        displayName: updates.displayName as string,
      });
    }

    return { success: true, username: newUsername };
  } catch (error) {
    console.error("Error updating profile:", error);
    throw new HttpsError("internal", "An error occurred while updating the profile.");
  }
});