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
 * 特定のユーザーのフレンド一覧を、現在のユーザーとの関係性付きで取得するカスタムフック
 */
export function useFriendsOfUser(targetUserId?: string) {
    const currentUser = auth.currentUser;
    return useQuery<UserWithFriendshipStatus[]>({
        queryKey: ["friends-of", targetUserId, currentUser?.uid],
        enabled: !!targetUserId && !!currentUser,
        queryFn: async () => {
            if (!targetUserId || !currentUser) return [];

            // 1. 対象ユーザーのフレンドのIDリストを取得
            const friendsQuery = query(
                collection(db, "friendships"),
                where("userIds", "array-contains", targetUserId),
                where("status", "==", "accepted")
            );
            const friendsSnap = await getDocs(friendsQuery);
            if (friendsSnap.empty) return [];
            
            const friendIds = friendsSnap.docs
                .map(doc => doc.data().userIds.find((id: string) => id !== targetUserId))
                .filter((id): id is string => !!id);
            
            if (friendIds.length === 0) return [];

            // 2. フレンドのプロフィール情報を取得
            const friendProfilesQuery = query(collection(db, "users"), where("__name__", "in", friendIds));
            const friendProfilesSnap = await getDocs(friendProfilesQuery);
            const friendProfiles = friendProfilesSnap.docs.map(d => ({ ...d.data(), uid: d.id } as UserProfile));

            // 3. 現在のユーザーのフレンドシップ情報をすべて取得
            const currentUserFriendshipsQuery = query(
                collection(db, "friendships"),
                where("userIds", "array-contains", currentUser.uid)
            );
            const currentUserFriendshipsSnap = await getDocs(currentUserFriendshipsQuery);
            const currentUserFriendships = currentUserFriendshipsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Friendship));
            
            // 4. プロフィールとフレンドシップ情報をマージして、最終的なステータスを決定
            return friendProfiles.map(profile => {
                if (profile.uid === currentUser.uid) {
                    return { ...profile, friendshipStatus: "self" } as UserWithFriendshipStatus
                }

                const friendship = currentUserFriendships.find(f => f.userIds.includes(profile.uid));
                
                if (friendship) {
                    if (friendship.status === "accepted") {
                        return { ...profile, friendshipStatus: "friends", friendshipId: friendship.id } as UserWithFriendshipStatus;
                    }
                    if (friendship.status === "pending") {
                        return friendship.requesterId === currentUser.uid
                            ? { ...profile, friendshipStatus: "pending-sent", friendshipId: friendship.id } as UserWithFriendshipStatus
                            : { ...profile, friendshipStatus: "pending-received", friendshipId: friendship.id } as UserWithFriendshipStatus;
                    }
                }
                return { ...profile, friendshipStatus: "not-friends" } as UserWithFriendshipStatus;
            });
        }
    });
}

/**
 * おすすめユーザー（ランダム）を取得するためのカスタムフック
 */
export function useSuggestedUsers(count = 5) {
  const currentUser = auth.currentUser;
  return useQuery<UserWithFriendshipStatus[]>({
    queryKey: ["suggested-users", currentUser?.uid],
    enabled: !!currentUser,
    queryFn: async () => {
      if (!currentUser) return [];

      const randomId = doc(collection(db, "users")).id;
      const q = query(
        collection(db, "users"),
        where("__name__", ">=", randomId),
        limit(count)
      );
      const userSnap = await getDocs(q);
      
      let users = userSnap.docs.map(d => ({ ...d.data(), uid: d.id } as UserProfile))
        .filter(u => u.uid !== currentUser.uid);

      if (users.length < count) {
        const q2 = query(
            collection(db, "users"),
            where("__name__", "<", randomId),
            limit(count - users.length)
        );
        const userSnap2 = await getDocs(q2);
        const moreUsers = userSnap2.docs.map(d => ({ ...d.data(), uid: d.id } as UserProfile))
          .filter(u => u.uid !== currentUser.uid);
        users = [...users, ...moreUsers];
      }

      const friendshipsRef = collection(db, "friendships");
      const friendshipQuery = query(
        friendshipsRef,
        where("userIds", "array-contains", currentUser.uid)
      );
      const friendshipSnap = await getDocs(friendshipQuery);
      const friendships = friendshipSnap.docs.map(d => ({ id: d.id, ...d.data() } as Friendship));
      
      const result = users.map(user => {
        const friendship = friendships.find(f => f.userIds.includes(user.uid));
        if (friendship) {
          if (friendship.status === "accepted") {
            return { ...user, friendshipStatus: "friends", friendshipId: friendship.id } as UserWithFriendshipStatus;
          }
          if (friendship.status === "pending") {
            return friendship.requesterId === currentUser.uid
              ? { ...user, friendshipStatus: "pending-sent", friendshipId: friendship.id } as UserWithFriendshipStatus
              : { ...user, friendshipStatus: "pending-received", friendshipId: friendship.id } as UserWithFriendshipStatus;
          }
        }
        return { ...user, friendshipStatus: "not-friends" } as UserWithFriendshipStatus;
      });

      return result;
    },
    staleTime: 5 * 60 * 1000,
  });
}

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
      
      const friendshipsRef = collection(db, "friendships");
      const friendshipQuery = query(
        friendshipsRef,
        where("userIds", "array-contains", currentUser.uid)
      );
      const friendshipSnap = await getDocs(friendshipQuery);
      const friendships = friendshipSnap.docs.map(d => ({ id: d.id, ...d.data() } as Friendship));
      
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
            return friendship.requesterId === currentUser.uid 
              ? { ...user, friendshipStatus: "pending-sent", friendshipId: friendship.id } as UserWithFriendshipStatus
              : { ...user, friendshipStatus: "pending-received", friendshipId: friendship.id } as UserWithFriendshipStatus;
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
        userIds: [user.uid, recipientId].sort(),
        requesterId: user.uid,
        recipientId: recipientId,
        status: "pending" as const,
        createdAt: serverTimestamp(),
      };
      await addDoc(collection(db, "friendships"), friendshipData);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users"] });
      qc.invalidateQueries({ queryKey: ["suggested-users"] });
      qc.invalidateQueries({ queryKey: ["friends-of"] });
    },
  });
}

/**
 * 自分宛の友達申請一覧を取得するためのカスタムフック
 */
export function useFriendRequests() {
  const uid = auth.currentUser?.uid;
  return useQuery<{ friendship: Friendship; requesterProfile: UserProfile }[]>({
    queryKey: ["friend-requests", uid],
    enabled: !!uid,
    queryFn: async () => {
      if (!uid) return [];
      
      const q = query(
        collection(db, "friendships"),
        where("userIds", "array-contains", uid),
        where("status", "==", "pending")
      );
      const snap = await getDocs(q);
      if (snap.empty) return [];

      const requests = snap.docs
        .map(d => ({ id: d.id, ...d.data() } as Friendship))
        .filter(f => f.recipientId === uid);

      const profiles: { friendship: Friendship; requesterProfile: UserProfile }[] = [];
      for (const req of requests) {
        const userSnap = await getDoc(doc(db, "users", req.requesterId));
        const userData = userSnap.data() as Partial<UserProfile> | undefined;

        profiles.push({
          friendship: req,
          requesterProfile: {
            uid: req.requesterId,
            displayName: userData?.displayName || "ユーザー",
            photoURL: userData?.photoURL || null,
            username: userData?.username,
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
  return useQuery<{ profile: UserProfile; friendshipId: string }[]>({
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
      
      const friends: { profile: UserProfile; friendshipId: string }[] = [];
      
      for (const f of friendships) {
        const friendId = f.userIds.find(id => id !== uid)!;
        const userSnap = await getDoc(doc(db, "users", friendId));
        if (userSnap.exists()) {
          friends.push({
            profile: { uid: userSnap.id, ...userSnap.data() } as UserProfile,
            friendshipId: f.id,
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
      qc.invalidateQueries({ queryKey: ["friends-of"] });
    },
  });
}