"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { auth, db } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  limit,
  startAt,
  endAt,
  orderBy,
  doc,
  addDoc,
  serverTimestamp,
  updateDoc,
  deleteDoc,
  getDoc,
  or,
} from "firebase/firestore";
import { UserProfile } from "./useProfile";

// Friendshipの型定義
export type Friendship = {
  id: string;
  userIds: [string, string];
  requesterId: string;
  recipientId: string;
  status: "pending" | "accepted" | "declined";
  createdAt: any;
  acceptedAt?: any;
};

// ユーザー情報にフレンド状況を追加した型
export type UserWithFriendshipStatus = UserProfile & {
  friendshipStatus: "friends" | "pending-sent" | "pending-received" | "not-friends" | "self";
  friendshipId?: string;
};

/**
 * ユーザーを検索するためのカスタムフック
 */
export function useUsers(searchTerm: string) {
  const currentUser = auth.currentUser;
  return useQuery<UserWithFriendshipStatus[]>({
    queryKey: ["users", searchTerm],
    enabled: searchTerm.trim().length > 0,
    queryFn: async () => {
      if (!currentUser) return [];

      // 1. ユーザー名でユーザーを検索
      const usersRef = collection(db, "users");
      const q = query(
        usersRef,
        orderBy("displayName"),
        startAt(searchTerm),
        endAt(searchTerm + "\uf8ff"),
        limit(10)
      );
      const userSnap = await getDocs(q);
      const users = userSnap.docs.map(d => ({ ...d.data(), uid: d.id } as UserProfile));

      if (users.length === 0) return [];
      
      const userIds = users.map(u => u.uid);

      // 2. 検索結果ユーザーと自分とのフレンド関係を取得
      const friendshipsRef = collection(db, "friendships");
      const friendshipQuery = query(
        friendshipsRef,
        where("userIds", "array-contains", currentUser.uid)
      );
      const friendshipSnap = await getDocs(friendshipQuery);
      const friendships = friendshipSnap.docs.map(d => ({ id: d.id, ...d.data() } as Friendship));
      
      // 3. ユーザーごとにフレンド状況を判定
      const result = users.map(user => {
        if (user.uid === currentUser.uid) {
          return { ...user, friendshipStatus: "self" } as UserWithFriendshipStatus;
        }

        const friendship = friendships.find(f => f.userIds.includes(user.uid));

        if (friendship) {
          if (friendship.status === "accepted") {
            return { ...user, friendshipStatus: "friends", friendshipId: friendship.id } as UserWithFriendshipStatus;
          }
          if (friendship.status === "pending") {
            if (friendship.requesterId === currentUser.uid) {
              return { ...user, friendshipStatus: "pending-sent", friendshipId: friendship.id } as UserWithFriendshipStatus;
            } else {
              return { ...user, friendshipStatus: "pending-received", friendshipId: friendship.id } as UserWithFriendshipStatus;
            }
          }
        }
        return { ...user, friendshipStatus: "not-friends" } as UserWithFriendshipStatus;
      });

      return result;
    },
  });
}

/**
 * 友達申請を送るためのカスタムフック
 */
export function useSendFriendRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (recipientId: string) => {
      const user = auth.currentUser;
      if (!user) throw new Error("認証されていません");
      if (user.uid === recipientId) throw new Error("自分自身に申請は送れません");

      const friendshipData = {
        userIds: [user.uid, recipientId].sort(), // IDをソートして一意性を担保
        requesterId: user.uid,
        recipientId: recipientId,
        status: "pending" as const,
        createdAt: serverTimestamp(),
      };
      await addDoc(collection(db, "friendships"), friendshipData);
    },
    onSuccess: () => {
      // ユーザー検索結果を再取得してボタン表示を更新
      qc.invalidateQueries({ queryKey: ["users"] });
    },
  });
}

/**
 * 自分宛の友達申請一覧を取得するためのカスタムフック (修正版)
 */
export function useFriendRequests() {
  const uid = auth.currentUser?.uid;
  return useQuery<{ friendship: Friendship; requesterProfile: UserProfile }[]>({
    queryKey: ["friend-requests", uid],
    enabled: !!uid,
    queryFn: async () => {
      if (!uid) return [];
      
      // ▼▼▼▼▼ クエリを修正 ▼▼▼▼▼
      const q = query(
        collection(db, "friendships"),
        where("userIds", "array-contains", uid), // userIdsに自分を含むもので絞り込み
        where("status", "==", "pending")      // statusがpendingのものに絞り込み
      );
      const snap = await getDocs(q);
      if (snap.empty) return [];

      // クライアント側で、自分が受け取った申請のみをフィルタリング
      const requests = snap.docs
        .map(d => ({ id: d.id, ...d.data() } as Friendship))
        .filter(f => f.recipientId === uid);
      // ▲▲▲▲▲ 修正ここまで ▲▲▲▲▲

      // 申請者のプロフィール情報を取得
      const profiles: { friendship: Friendship; requesterProfile: UserProfile }[] = [];
      for (const req of requests) {
        // usersコレクションから displayName と photoURL を取得
        const userSnap = await getDoc(doc(db, "users", req.requesterId));
        const userData = userSnap.data() as Partial<UserProfile> | undefined;

        profiles.push({
          friendship: req,
          requesterProfile: {
            uid: req.requesterId,
            displayName: userData?.displayName || "ユーザー",
            photoURL: userData?.photoURL || null,
            xp: userData?.xp || 0,
            stats: userData?.stats || { Life: 0, Study: 0, Physical: 0, Social: 0, Creative: 0, Mental: 0 },
          },
        });
      }
      return profiles;
    },
  });
}

/**
 * 友達申請を承認するためのカスタムフック
 */
export function useAcceptFriendRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (friendshipId: string) => {
      const ref = doc(db, "friendships", friendshipId);
      await updateDoc(ref, {
        status: "accepted",
        acceptedAt: serverTimestamp(),
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["friend-requests"] });
      qc.invalidateQueries({ queryKey: ["friends"] });
    },
  });
}

/**
 * 友達申請を拒否するためのカスタムフック
 */
export function useDeclineFriendRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (friendshipId: string) => {
      const ref = doc(db, "friendships", friendshipId);
      // declinedにするか、ドキュメントごと削除するかは仕様による。今回は削除する。
      await deleteDoc(ref);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["friend-requests"] });
    },
  });
}

/**
 * 友達一覧を取得するためのカスタムフック
 */
export function useFriends() {
  const uid = auth.currentUser?.uid;
  return useQuery<{ profile: UserProfile; friendshipId: string }[]>({ // 戻り値の型を変更
    queryKey: ["friends", uid],
    enabled: !!uid,
    queryFn: async () => {
      if (!uid) return [];
      
      const q = query(
        collection(db, "friendships"),
        where("userIds", "array-contains", uid),
        where("status", "==", "accepted")
      );
      const snap = await getDocs(q);
      if (snap.empty) return [];
      
      const friendships = snap.docs.map(d => ({ id: d.id, ...d.data() } as Friendship));
      const friendIds = friendships.map(f => f.userIds.find(id => id !== uid)!);

      if (friendIds.length === 0) return [];
      
      const friends: { profile: UserProfile; friendshipId: string }[] = [];
      
      for (const f of friendships) {
        const friendId = f.userIds.find(id => id !== uid)!;
        const userSnap = await getDoc(doc(db, "users", friendId));
        if (userSnap.exists()) {
          friends.push({
            profile: { uid: userSnap.id, ...userSnap.data() } as UserProfile,
            friendshipId: f.id, // friendshipIdを追加
          });
        }
      }
      
      return friends;
    },
  });
}

/**
 * 友達を削除するためのカスタムフック
 */
export function useRemoveFriend() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (friendshipId: string) => {
      await deleteDoc(doc(db, "friendships", friendshipId));
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["friends"] });
      qc.invalidateQueries({ queryKey: ["users"] });
    },
  });
}