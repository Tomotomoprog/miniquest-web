import { Suspense } from 'react';
import PostForm from './PostForm';

export default function PostPage() {
  return (
    // Suspenseでラップし、読み込み中の表示を指定
    <Suspense fallback={<div className="card p-5 text-center text-dim">Loading...</div>}>
      <PostForm />
    </Suspense>
  );
}