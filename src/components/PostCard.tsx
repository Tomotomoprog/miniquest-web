"use client";
import { usePosts, useToggleLike, useMyLikedPostIds, useComments, useAddComment, useDeletePost, Post } from "@/hooks/usePosts";
import { auth } from "@/lib/firebase";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

// コメントセクションのコンポーネント
const CommentSection = ({ postId }: { postId: string }) => {
  const { data: comments, isLoading } = useComments(postId);
  const addComment = useAddComment();
  const [commentText, setCommentText] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    addComment.mutate({ postId, text: commentText });
    setCommentText("");
  };

  return (
    <div className="space-y-3 pt-3">
      {isLoading && <p className="text-sm text-dim">コメントを読み込み中...</p>}
      <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
        {comments?.map(comment => (
          <div key={comment.id} className="flex items-start gap-2 text-sm">
            <div className="flex-shrink-0 h-6 w-6 rounded-full bg-gray-200 relative overflow-hidden">
              {comment.userAvatar && <Image src={comment.userAvatar} alt={comment.userName} fill className="object-cover" />}
            </div>
            <div>
              <span className="font-bold mr-2">{comment.userName}</span>
              <span>{comment.text}</span>
            </div>
          </div>
        ))}
      </div>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          placeholder="コメントを追加..."
          className="input flex-1 !py-1.5"
        />
        <button type="submit" className="btn-primary btn !px-3 !py-1.5" disabled={addComment.isPending}>
          投稿
        </button>
      </form>
    </div>
  );
};

// 投稿カードのメインコンポーネント
export default function PostCard({ post }: { post: Post }) {
  const [isCommentBoxOpen, setCommentBoxOpen] = useState(false);
  const { data: likedSet } = useMyLikedPostIds();
  const toggleLike = useToggleLike();
  const deletePost = useDeletePost();

  const currentUser = auth.currentUser;
  const liked = likedSet?.has(post.id);
  const isMyPost = currentUser?.uid === post.uid;

  const handleDelete = () => {
    if (window.confirm("この投稿を本当に削除しますか？付与されたXPもリセットされます。")) {
      deletePost.mutate(post);
    }
  }

  return (
    <article className="card p-4 space-y-3">
      <div className="flex items-center gap-3">
        <Link href={`/app/profile/${post.uid}`} className="h-10 w-10 rounded-full bg-gray-200 overflow-hidden relative">
            {post.userAvatar && <Image src={post.userAvatar} alt={post.userName} fill className="object-cover" />}
        </Link>
        <div className="text-sm">
          <Link href={`/app/profile/${post.uid}`} className="font-bold hover:underline">{post.userName}</Link>
          <div className="text-xs text-dim">Lv.{post.userLevel}・{post.userClass}</div>
        </div>
        {isMyPost && (
          <button onClick={handleDelete} className="ml-auto text-slate-400 hover:text-red-500" title="削除">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
          </button>
        )}
      </div>

      {/* ▼▼▼▼▼ この部分を修正しました ▼▼▼▼▼ */}
      {post.questTitle && (
        <div className="text-xs text-dim bg-slate-50 p-2 rounded-md">
          <Link href={`/app/timeline?questId=${post.questId}`} className="hover:underline">
            🗺️ {post.questTitle}
          </Link>
        </div>
      )}
      {post.myQuestTitle && (
        <div className="text-xs text-dim bg-slate-50 p-2 rounded-md">
          <Link href={`/app/my-quest/${post.myQuestId}`} className="hover:underline">
            🚀 {post.myQuestTitle}
          </Link>
        </div>
      )}
      {/* ▲▲▲▲▲ 修正ここまで ▲▲▲▲▲ */}

      {post.text && <p className="text-base leading-relaxed whitespace-pre-wrap">{post.text}</p>}

      {post.photoURL && (
        <div className="relative w-full aspect-video media bg-gray-100">
          <Image src={post.photoURL} alt="投稿画像" fill style={{ objectFit: 'contain' }} />
        </div>
      )}

      <div className="flex items-center gap-4 pt-2 border-t border-line">
        <button
          className={`flex items-center gap-2 text-sm font-medium transition ${liked ? "text-red-500" : "text-slate-500 hover:text-slate-800"}`}
          onClick={() => toggleLike.mutate(post.id)}
          disabled={toggleLike.isPending}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill={liked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
          <span>{post.likeCount ?? 0}</span>
        </button>
        <button
          className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-800"
          onClick={() => setCommentBoxOpen(!isCommentBoxOpen)}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
          <span>{post.commentCount ?? 0}</span>
        </button>
      </div>
      
      {isCommentBoxOpen && <CommentSection postId={post.id} />}
    </article>
  );
}