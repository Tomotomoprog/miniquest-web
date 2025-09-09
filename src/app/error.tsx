"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: unknown;
  reset: () => void;
}) {
  const msg = error instanceof Error ? error.message : String(error);
  console.error("Global error boundary:", error);
  return (
    // <html>と<body>を削除し、divで囲む
    <div style={{ padding: 16, fontFamily: "system-ui", color: "black", background: "white", minHeight: "100vh" }}>
      <h1>Something went wrong</h1>
      <pre style={{ whiteSpace: "pre-wrap", background: "#f6f6f6", padding: 12, borderRadius: 8 }}>
        {msg}
      </pre>
      <button onClick={() => reset()} style={{ marginTop: 8 }}>Retry</button>
    </div>
  );
}