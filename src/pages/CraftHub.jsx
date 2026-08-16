import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDemoMode } from "../context/DemoModeContext.jsx";
import StaffHandoffButton from "../components/staffhandoff/StaffHandoffButton.jsx";

const GOLD = "#d8b35f";
const CREAM = "#f6efe1";

const APPROVED_ASSETS = {
  landing: "/assets/pos360-reference/candidates/candidate-09-crafthub-explained.png",
  explained: "/assets/pos360-reference/candidates/candidate-09-crafthub-explained.png",
  storyboard: "/assets/pos360-reference/candidates/candidate-11-crafthub-storyboard.png",
  pos: "/assets/pos3/cropped/POS 3.11.png",
  eat: "/assets/eat/cropped/EAT system  UPDATE.png",
  smoke: "/assets/smokecraft-reference/approved/smokecraft-guest-pass.png",
  passport: "/assets/smokecraft-reference/approved/smokecraft-passport-connection.png",
};

const SYSTEM_SPINE = [
  { label: "NOVEE OS", copy: "Intelligence layer", icon: "hub" },
  { label: "CraftHub 360", copy: "Venue table experience", icon: "chair" },
  { label: "SmokeCraft 360", copy: "Active MVP2 craft journey", icon: "local_fire_department" },
  { label: "Passport / Connections", copy: "Identity, stamps, relationships", icon: "language" },
];

const STAFF_SPINE = [
  { label: "Staff Handoff", copy: "PIN-gated bridge", icon: "badge" },
  { label: "POS3 / POS360", copy: "Tables, orders, checkout", icon: "point_of_sale" },
  { label: "E.A.T.", copy: "Operations and management sync", icon: "dashboard" },
];

export default function CraftHub() {
  const navigate = useNavigate();
  const { enterDemoMode } = useDemoMode();
  const [staffHandoffOpen, setStaffHandoffOpen] = useState(false);

  function startSmokeCraft() {
    navigate("/smokecraft/welcome");
  }

  function handleDemoMode() {
    enterDemoMode();
    navigate("/smokecraft/welcome");
  }

  return (
    <main style={{
      minHeight: "100vh",
      background: `linear-gradient(180deg, ${CREAM} 0%, #efe2ca 48%, #070504 48%, #070504 100%)`,
      color: "#201610",
      fontFamily: "Georgia, serif",
    }}>
      <header style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        minHeight: 76,
        borderBottom: "1px solid rgba(166,116,43,0.25)",
        background: "rgba(246,239,225,0.9)",
        backdropFilter: "blur(18px)",
      }}>
        <div style={{
          maxWidth: 1320,
          margin: "0 auto",
          padding: "16px 22px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          flexWrap: "wrap",
        }}>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button type="button" onClick={() => navigate("/boot")} style={navButton("blue")}>
              Back to NOVEE OS
            </button>
            <button type="button" onClick={() => navigate("/home")} style={navButton("blue")}>
              Home
            </button>
          </div>
          <div style={{
            color: "#8d5d1f",
            fontSize: 26,
            letterSpacing: "0.32em",
            textTransform: "uppercase",
            whiteSpace: "nowrap",
          }}>
            CraftHub 360
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "flex-end" }}>
            <button type="button" onClick={() => window.open("https://dayone360.com", "_blank", "noopener,noreferrer")} style={navButton()}>
              DayOne360 Travel
            </button>
            <button type="button" onClick={handleDemoMode} style={navButton()}>
              Demo Mode
            </button>
            <button type="button" onClick={() => navigate("/passport/connections")} style={navButton()}>
              360 Passport Connections
            </button>
          </div>
        </div>
      </header>

      {staffHandoffOpen && (
        <StaffHandoffButton
          startOpen
          allowedDestinations={["pos", "eat"]}
          onClose={() => setStaffHandoffOpen(false)}
        />
      )}

      <section style={{
        maxWidth: 1320,
        margin: "0 auto",
        padding: "34px 22px 42px",
        display: "grid",
        gridTemplateColumns: "minmax(0, 1.04fr) minmax(360px, 0.96fr)",
        gap: 26,
        alignItems: "stretch",
      }} className="crafthub-live-hero">
        <div style={{
          border: "1px solid rgba(166,116,43,0.22)",
          borderRadius: 24,
          minHeight: 610,
          overflow: "hidden",
          position: "relative",
          boxShadow: "0 24px 80px rgba(88,54,18,0.20)",
          background: "#120b06",
        }}>
          <img
            src={APPROVED_ASSETS.landing}
            alt="Approved CraftHub 360 system hierarchy visual"
            style={{ width: "100%", height: "100%", minHeight: 610, objectFit: "cover", display: "block" }}
          />
          <div style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(90deg, rgba(0,0,0,0.62), rgba(0,0,0,0.12) 48%, rgba(246,239,225,0.05))",
            pointerEvents: "none",
          }} />
          <div style={{ position: "absolute", left: 28, bottom: 28, maxWidth: 540 }}>
            <div style={eyebrowStyle}>Current Handoff Baseline</div>
            <h1 style={{ margin: "8px 0 10px", color: "#fff7dc", fontSize: 52, lineHeight: 1.02, letterSpacing: "0.06em", textTransform: "uppercase" }}>
              CraftHub 360
            </h1>
            <p style={{ margin: "0 0 20px", color: "rgba(255,247,220,0.82)", fontSize: 17, lineHeight: 1.6 }}>
              The live venue table layer that sends guests into SmokeCraft, then hands the session to POS360 and E.A.T. through staff access.
            </p>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <button type="button" onClick={startSmokeCraft} style={primaryButton}>
                Start SmokeCraft
              </button>
              <button type="button" onClick={() => setStaffHandoffOpen(true)} style={secondaryButton}>
                Staff Handoff
              </button>
            </div>
          </div>
        </div>

        <div style={{
          display: "grid",
          gridTemplateRows: "auto auto 1fr",
          gap: 14,
          minWidth: 0,
        }}>
          <section style={panelLight}>
            <div style={eyebrowDark}>System Hierarchy</div>
            <FlowRail items={SYSTEM_SPINE} />
          </section>
          <section style={panelDark}>
            <div style={eyebrowStyle}>Staff Operations Path</div>
            <FlowRail items={STAFF_SPINE} dark />
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 18 }}>
              <button type="button" onClick={() => setStaffHandoffOpen(true)} style={primaryButton}>Open POS3 / E.A.T.</button>
              <button type="button" onClick={() => navigate("/staff/pin")} style={secondaryButton}>Direct PIN Route</button>
            </div>
          </section>
          <section style={panelDark}>
            <div style={eyebrowStyle}>Approved Visual System</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 14 }}>
              <ImageRouteCard title="SmokeCraft 360" image={APPROVED_ASSETS.smoke} onClick={startSmokeCraft} />
              <ImageRouteCard title="Passport Connections" image={APPROVED_ASSETS.passport} onClick={() => navigate("/passport/connections")} />
              <ImageRouteCard title="POS360" image={APPROVED_ASSETS.pos} onClick={() => setStaffHandoffOpen(true)} />
              <ImageRouteCard title="E.A.T." image={APPROVED_ASSETS.eat} onClick={() => setStaffHandoffOpen(true)} />
            </div>
          </section>
        </div>
      </section>

      <section style={{
        background: "#070504",
        color: "#f7ead0",
        padding: "34px 22px 90px",
      }}>
        <div style={{ maxWidth: 1320, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 22 }} className="crafthub-proof-grid">
          <VisualReference
            title="NOVEE OS -> CraftHub -> SmokeCraft"
            copy="The hierarchy and craft journey storyboard are visible as reference imagery, while the buttons above remain live DOM controls."
            image={APPROVED_ASSETS.storyboard}
          />
          <VisualReference
            title="CraftHub System Explanation"
            copy="Current ecosystem positioning: NOVEE OS intelligence, CraftHub experience layer, POS360 transaction layer, and E.A.T. management layer."
            image={APPROVED_ASSETS.explained}
          />
        </div>
      </section>

      <style>{`
        @media (max-width: 980px) {
          .crafthub-live-hero { grid-template-columns: 1fr !important; }
          .crafthub-proof-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 620px) {
          .crafthub-live-hero { padding-left: 14px !important; padding-right: 14px !important; }
          .crafthub-live-hero h1 { font-size: 36px !important; }
          .crafthub-live-hero [data-flow-row] { grid-template-columns: 34px 1fr !important; }
        }
      `}</style>
    </main>
  );
}

function FlowRail({ items, dark = false }) {
  return (
    <div style={{ display: "grid", gap: 10, marginTop: 14 }}>
      {items.map((item, index) => (
        <div key={item.label} data-flow-row style={{ display: "grid", gridTemplateColumns: "42px 1fr 24px", gap: 10, alignItems: "center" }}>
          <div style={{
            width: 42,
            height: 42,
            borderRadius: "50%",
            border: `1px solid ${dark ? "rgba(216,179,95,0.5)" : "rgba(141,93,31,0.35)"}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: dark ? GOLD : "#8d5d1f",
            background: dark ? "rgba(216,179,95,0.08)" : "rgba(255,255,255,0.55)",
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>{item.icon}</span>
          </div>
          <div>
            <div style={{ fontWeight: 800, color: dark ? "#fff7dc" : "#26170c", fontSize: 15 }}>{item.label}</div>
            <div style={{ color: dark ? "rgba(255,247,220,0.62)" : "rgba(38,23,12,0.62)", fontSize: 12, marginTop: 2 }}>{item.copy}</div>
          </div>
          {index < items.length - 1 && (
            <span className="material-symbols-outlined" style={{ color: dark ? GOLD : "#8d5d1f", fontSize: 20 }}>arrow_forward</span>
          )}
        </div>
      ))}
    </div>
  );
}

function ImageRouteCard({ title, image, onClick }) {
  return (
    <button type="button" onClick={onClick} style={{
      padding: 0,
      border: "1px solid rgba(216,179,95,0.25)",
      borderRadius: 14,
      minHeight: 142,
      overflow: "hidden",
      background: "#100b06",
      color: "#fff7dc",
      cursor: "pointer",
      position: "relative",
      textAlign: "left",
    }}>
      <img src={image} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.68 }} />
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, transparent, rgba(0,0,0,0.82))" }} />
      <div style={{ position: "absolute", left: 12, right: 12, bottom: 12, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 14, fontWeight: 800 }}>{title}</span>
        <span className="material-symbols-outlined" style={{ color: GOLD, fontSize: 20 }}>arrow_forward</span>
      </div>
    </button>
  );
}

function VisualReference({ title, copy, image }) {
  return (
    <section style={{
      border: "1px solid rgba(216,179,95,0.24)",
      borderRadius: 22,
      background: "rgba(255,255,255,0.04)",
      overflow: "hidden",
      boxShadow: "0 20px 70px rgba(0,0,0,0.45)",
    }}>
      <img src={image} alt={title} style={{ width: "100%", aspectRatio: "16 / 10", objectFit: "cover", objectPosition: "top", display: "block" }} />
      <div style={{ padding: 18 }}>
        <div style={{ color: GOLD, fontSize: 12, letterSpacing: "0.22em", textTransform: "uppercase", fontWeight: 800 }}>{title}</div>
        <p style={{ margin: "8px 0 0", color: "rgba(247,234,208,0.72)", lineHeight: 1.6, fontSize: 14 }}>{copy}</p>
      </div>
    </section>
  );
}

function navButton(tone = "gold") {
  return {
    border: `1px solid ${tone === "blue" ? "rgba(73,115,166,0.38)" : "rgba(141,93,31,0.32)"}`,
    background: "rgba(255,255,255,0.42)",
    color: tone === "blue" ? "#355f8f" : "#7a4f18",
    borderRadius: 999,
    padding: "10px 16px",
    textTransform: "uppercase",
    letterSpacing: "0.12em",
    fontSize: 11,
    fontWeight: 800,
    cursor: "pointer",
  };
}

const eyebrowStyle = {
  color: GOLD,
  fontSize: 12,
  letterSpacing: "0.22em",
  textTransform: "uppercase",
  fontWeight: 800,
};

const eyebrowDark = {
  color: "#8d5d1f",
  fontSize: 12,
  letterSpacing: "0.22em",
  textTransform: "uppercase",
  fontWeight: 800,
};

const primaryButton = {
  border: "none",
  background: GOLD,
  color: "#130d06",
  borderRadius: 12,
  padding: "13px 18px",
  fontWeight: 900,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  fontSize: 12,
  cursor: "pointer",
};

const secondaryButton = {
  border: "1px solid rgba(216,179,95,0.46)",
  background: "rgba(0,0,0,0.22)",
  color: "#fff1c8",
  borderRadius: 12,
  padding: "12px 17px",
  fontWeight: 800,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  fontSize: 12,
  cursor: "pointer",
};

const panelLight = {
  border: "1px solid rgba(141,93,31,0.26)",
  borderRadius: 20,
  padding: 20,
  background: "rgba(255,255,255,0.64)",
  boxShadow: "0 18px 42px rgba(88,54,18,0.10)",
};

const panelDark = {
  border: "1px solid rgba(216,179,95,0.22)",
  borderRadius: 20,
  padding: 20,
  background: "linear-gradient(145deg, rgba(13,8,5,0.96), rgba(31,20,10,0.92))",
  color: "#fff7dc",
  boxShadow: "0 18px 42px rgba(0,0,0,0.25)",
};
