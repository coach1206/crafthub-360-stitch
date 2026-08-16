import React from "react";
import { useNavigate } from "react-router-dom";

/**
 * Canonical CraftHub 360 public landing.
 *
 * IMPORTANT: The old /public/crafthub-landing.png asset is the obsolete
 * blue/gold "LOADING / CONNECTED" CraftHub shell. It must never be used as
 * the public landing again.
 *
 * The approved owner landing is:
 * /public/assets/smokecraft/CRAFTHUB 360. VENUE TABLE EXPERIENCE.png
 * (1672×941). We render that exact composition and overlay transparent
 * touch targets so the approved visual remains intact while the screen is
 * functional.
 */
const LANDING_ASSET = "/assets/smokecraft/CRAFTHUB%20360.%20VENUE%20TABLE%20EXPERIENCE.png";

export default function CraftHub() {
  const navigate = useNavigate();
  const go = (route) => () => navigate(route);

  return (
    <main
      style={{
        minHeight: "100vh",
        margin: 0,
        background: "#f4eee4",
        overflowX: "hidden",
      }}
    >
      <div
        style={{
          position: "relative",
          width: "100%",
          maxWidth: 1672,
          margin: "0 auto",
          lineHeight: 0,
        }}
      >
        <img
          src={LANDING_ASSET}
          alt="CraftHub 360 Venue Table Experience"
          draggable={false}
          style={{
            display: "block",
            width: "100%",
            height: "auto",
            userSelect: "none",
          }}
        />

        {/* Header navigation */}
        <Hotspot label="Back to NOVEE OS" left="7.6%" top="3.4%" width="13.5%" height="5.4%" onClick={go("/boot")} />
        <Hotspot label="Home" left="21.4%" top="3.4%" width="8.0%" height="5.4%" onClick={go("/home")} />
        <Hotspot label="DayOne360 Travel" left="56.2%" top="3.4%" width="12.4%" height="5.4%" onClick={go("/dayone360-travel")} />
        <Hotspot label="Demo Mode" left="69.4%" top="3.4%" width="9.0%" height="5.4%" onClick={go("/smokecraft/welcome?demo=1")} />
        <Hotspot label="360 Passport Connections" left="79.2%" top="3.4%" width="16.2%" height="5.4%" onClick={go("/passport/connections")} />

        {/* Main experience cards */}
        <Hotspot label="Open SmokeCraft 360" left="6.5%" top="35.5%" width="15.6%" height="44.0%" onClick={go("/smokecraft/welcome")} />
        <Hotspot label="Open PourCraft 360" left="23.8%" top="35.5%" width="15.6%" height="44.0%" onClick={go("/pourcraft")} />
        <Hotspot label="Open WineCraft 360" left="40.9%" top="35.5%" width="15.6%" height="44.0%" onClick={go("/winecraft")} />
        <Hotspot label="Open BeerCraft 360" left="58.0%" top="35.5%" width="15.6%" height="44.0%" onClick={go("/beercraft")} />
        <Hotspot label="Open 360 Passport Connections" left="75.2%" top="35.5%" width="15.6%" height="44.0%" onClick={go("/passport/connections")} />

        {/* Footer actions */}
        <Hotspot label="Enter CraftHub" left="13.7%" top="86.4%" width="18.0%" height="7.6%" onClick={go("/smokecraft/welcome")} />
        <Hotspot label="Staff Handoff" left="33.25%" top="86.4%" width="18.0%" height="7.6%" onClick={go("/staff-handoff")} />
        <Hotspot label="360 Passport Connections" left="52.8%" top="86.4%" width="18.0%" height="7.6%" onClick={go("/passport/connections")} />
        <Hotspot label="DayOne360 Travel" left="72.4%" top="86.4%" width="18.0%" height="7.6%" onClick={go("/dayone360-travel")} />
      </div>
    </main>
  );
}

function Hotspot({ label, left, top, width, height, onClick }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      style={{
        position: "absolute",
        left,
        top,
        width,
        height,
        padding: 0,
        margin: 0,
        border: 0,
        background: "transparent",
        cursor: "pointer",
        touchAction: "manipulation",
        WebkitTapHighlightColor: "transparent",
      }}
    />
  );
}
