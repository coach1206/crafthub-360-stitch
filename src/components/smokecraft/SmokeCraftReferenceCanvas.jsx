import { useState } from "react";

export default function SmokeCraftReferenceCanvas({ src, alt, title, children }) {
  const [failed, setFailed] = useState(false);

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#050505",
        color: "#f5d28a",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "0",
        margin: "0",
      }}
    >
      <section
        style={{
          width: "100%",
          maxWidth: "1440px",
          margin: "0 auto",
          padding: "0",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        {failed ? (
          <div
            style={{
              border: "1px solid #d4af37",
              padding: "30px",
              margin: "20px",
              color: "#f5d28a",
              background: "#140d06",
            }}
          >
            Image failed to load: {src}
          </div>
        ) : (
          <img
            src={src}
            alt={alt || title || "SmokeCraft visual"}
            onError={() => setFailed(true)}
            style={{
              display: "block",
              width: "auto",
              height: "auto",
              maxWidth: "100vw",
              maxHeight: "100vh",
              objectFit: "contain",
              margin: "0 auto",
              border: "0",
              borderRadius: "0",
              boxShadow: "none",
            }}
          />
        )}

        {children ? (
          <section
            style={{
              width: "100%",
              maxWidth: "1180px",
              margin: "24px auto",
              padding: "24px",
              border: "1px solid rgba(212,175,55,0.35)",
              borderRadius: "20px",
              background: "rgba(10,10,10,0.92)",
            }}
          >
            <h2
              style={{
                margin: "0 0 18px",
                fontSize: "18px",
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "#f5d28a",
              }}
            >
              Live Controls
            </h2>
            {children}
          </section>
        ) : null}
      </section>
    </main>
  );
}
