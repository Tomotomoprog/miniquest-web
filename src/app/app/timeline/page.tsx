import { Suspense } from 'react';
import Timeline from './Timeline';

export default function TimelinePage() {
  return (
    <Suspense fallback={<div className="card p-5 text-center text-dim">Loading timeline...</div>}>
      <Timeline />
    </Suspense>
  );
}