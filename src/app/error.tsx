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
    <html>
      <body style={{ padding: 16, fontFamily: "system-ui" }}>
        <h1>Something went wrong</h1>
        <pre style={{ whiteSpace: "pre-wrap", background: "#f6f6f6", padding: 12, borderRadius: 8 }}>
          {msg}
        </pre>
        <button onClick={() => reset()} style={{ marginTop: 8 }}>Retry</button>
      </body>
    </html>
  );
}

