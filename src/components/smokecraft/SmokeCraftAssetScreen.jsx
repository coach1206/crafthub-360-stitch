import { useState } from "react";

export default function SmokeCraftAssetScreen({ src, alt = "SmokeCraft screen" }) {
  const [failed, setFailed] = useState(false);

  return (
    <main
      style={{
        position: "fixed",
        inset: 0,
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
        background: "#050505",
        margin: 0,
        padding: 0,
        touchAction: "manipulation",
      }}
    >
      {!failed && (
        <img
          src={src}
          alt=""
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            filter: "blur(26px)",
            transform: "scale(1.08)",
            opacity: 0.42,
            userSelect: "none",
            pointerEvents: "none",
          }}
        />
      )}

      {failed ? (
        <section
          style={{
            position: "absolute",
            inset: 0,
            display: "grid",
            placeItems: "center",
            color: "#f5d28a",
            background: "#050505",
            padding: 24,
            textAlign: "center",
          }}
        >
          <div
            style={{
              border: "1px solid rgba(212,175,55,0.6)",
              borderRadius: 20,
              padding: 28,
              background: "rgba(20,13,6,0.92)",
            }}
          >
            Image failed to load:
            <br />
            {src}
          </div>
        </section>
      ) : (
        <img
          src={src}
          alt={alt}
          onError={() => setFailed(true)}
          draggable={false}
          style={{
            position: "absolute",
            inset: 0,
            width: "100vw",
            height: "100vh",
            objectFit: "contain",
            objectPosition: "center center",
            display: "block",
            margin: 0,
            padding: 0,
            border: 0,
            borderRadius: 0,
            boxShadow: "none",
            userSelect: "none",
            WebkitUserSelect: "none",
            touchAction: "manipulation",
          }}
        />
      )}
    </main>
  );
}
