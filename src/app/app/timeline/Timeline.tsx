"use client";
import { usePosts, useToggleLike, useMyLikedPostIds, useComments, useAddComment, useDeletePost, Post } from "@/hooks/usePosts";
import { auth } from "@/lib/firebase";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useState } from "react";

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


export default function Timeline() {
  const params = useSearchParams();
  const questId = params.get("questId") ?? undefined;
  const [activeCommentBox, setActiveCommentBox] = useState<string | null>(null);
  const currentUser = auth.currentUser;

  const { data: posts, isLoading, error } = usePosts(questId);
  const { data: likedSet } = useMyLikedPostIds();
  const toggleLike = useToggleLike();
  const deletePost = useDeletePost();

  const handleDelete = (post: Post) => {
    if (window.confirm("この投稿を本当に削除しますか？付与されたXPもリセットされます。")) {
      deletePost.mutate(post);
    }
  }

  return (
    <div className="max-w-xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">タイムライン</h2>
        {questId && (
            <Link href="/app/timeline" className="text-sm font-medium text-brand-600 hover:underline">
              すべての投稿を表示
            </Link>
        )}
      </div>

      {isLoading && <div className="card p-5 text-center text-dim">Loading...</div>}
      {error && <div className="card p-5 text-center text-red-600">Error loading posts</div>}

      <div className="space-y-4">
        {posts?.map((p) => {
          const liked = likedSet?.has(p.id);
          const isCommentBoxOpen = activeCommentBox === p.id;
          const isMyPost = currentUser?.uid === p.uid;
          
          return (
            <article key={p.id} className="card p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gray-200 overflow-hidden relative">
                  {p.userAvatar && <Image src={p.userAvatar} alt={p.userName} fill className="object-cover" />}
                </div>
                <div className="text-sm">
                  <div className="font-bold">{p.userName}</div>
                  <div className="text-xs text-dim">Lv.{p.userLevel}・{p.userClass}</div>
                </div>
                {isMyPost && (
                  <button onClick={() => handleDelete(p)} className="ml-auto text-slate-400 hover:text-red-500" title="削除">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                  </button>
                )}
              </div>

              {p.questTitle && (
                <div className="text-xs text-dim bg-slate-50 p-2 rounded-md">🗺️ {p.questTitle}</div>
              )}

              {p.text && <p className="text-base leading-relaxed whitespace-pre-wrap">{p.text}</p>}

              {p.photoURL && (
                <div className="relative w-full aspect-[4/5] media">
                  <Image src={p.photoURL} alt="" fill className="object-cover" />
                </div>
              )}

              <div className="flex items-center gap-4 pt-2 border-t border-line">
                {/* Like Button */}
                <button
                  className={`flex items-center gap-2 text-sm font-medium transition ${liked ? "text-red-500" : "text-slate-500 hover:text-slate-800"}`}
                  onClick={() => toggleLike.mutate(p.id)}
                  disabled={toggleLike.isPending}
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill={liked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                  </svg>
                  <span>{p.likeCount ?? 0}</span>
                </button>
                {/* Comment Button */}
                <button
                  className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-800"
                  onClick={() => setActiveCommentBox(isCommentBoxOpen ? null : p.id)}
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                  </svg>
                  <span>{p.commentCount ?? 0}</span>
                </button>
              </div>
              
              {isCommentBoxOpen && <CommentSection postId={p.id} />}
            </article>
          );
        })}

        {posts && posts.length === 0 && (
          <div className="card p-8 text-center text-dim">まだ投稿がありません。</div>
        )}
      </div>
    </div>
  );
}