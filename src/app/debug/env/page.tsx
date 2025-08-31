"use client";
export default function EnvDebug() {
  return (
    <pre style={{ padding: 16 }}>
{`PROJECT_ID=${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}
AUTH_DOMAIN=${process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN}
BUCKET=${process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET}
`}
    </pre>
  );
}
