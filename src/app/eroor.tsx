"use client";

export default function GlobalError({ error, reset }: { error: any; reset: () => void }) {
  console.error("Global error boundary:", error);
  return (
    <html>
      <body style={{ padding: 16, fontFamily: "system-ui" }}>
        <h1>Something went wrong</h1>
        <pre style={{ whiteSpace: "pre-wrap", background: "#f6f6f6", padding: 12, borderRadius: 8 }}>
          {String(error?.message || error)}
        </pre>
        <button onClick={() => reset()} style={{ marginTop: 8 }}>
          Retry
        </button>
      </body>
    </html>
  );
}
