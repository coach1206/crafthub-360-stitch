import React from "react";
import { useNavigate } from "react-router-dom";

/**
 * Canonical CraftHub 360 public landing.
 * Uses the approved 1672×941 landing artwork already committed at
 * /public/crafthub-landing.png and overlays transparent touch targets so the
 * approved visual remains unchanged while the screen is functional.
 */
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
          src="/crafthub-landing.png"
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
        <Hotspot label="Back to NOVEE OS" left="7.0%" top="2.6%" width="13.4%" height="6.0%" onClick={go("/boot")} />
        <Hotspot label="Home" left="21.3%" top="2.6%" width="8.2%" height="6.0%" onClick={go("/home")} />
        <Hotspot label="DayOne360 Travel" left="56.2%" top="2.6%" width="12.4%" height="6.0%" onClick={go("/dayone360")} />
        <Hotspot label="Demo Mode" left="69.4%" top="2.6%" width="9.0%" height="6.0%" onClick={go("/smokecraft/welcome?demo=1")} />
        <Hotspot label="360 Passport Connections" left="79.2%" top="2.6%" width="16.2%" height="6.0%" onClick={go("/passport/connections")} />

        {/* Main experience cards */}
        <Hotspot label="Open SmokeCraft 360" left="6.4%" top="34.9%" width="16.6%" height="44.0%" onClick={go("/smokecraft/welcome")} />
        <Hotspot label="Open PourCraft 360" left="23.6%" top="34.9%" width="16.6%" height="44.0%" onClick={go("/pourcraft")} />
        <Hotspot label="Open WineCraft 360" left="40.8%" top="34.9%" width="16.6%" height="44.0%" onClick={go("/winecraft")} />
        <Hotspot label="Open BeerCraft 360" left="58.0%" top="34.9%" width="16.6%" height="44.0%" onClick={go("/beercraft")} />
        <Hotspot label="Open 360 Passport Connections" left="75.2%" top="34.9%" width="16.6%" height="44.0%" onClick={go("/passport/connections")} />

        {/* Footer actions */}
        <Hotspot label="Enter CraftHub" left="10.4%" top="84.5%" width="19.7%" height="10.0%" onClick={go("/smokecraft/welcome")} />
        <Hotspot label="Staff Handoff" left="30.5%" top="84.5%" width="18.6%" height="10.0%" onClick={go("/staff-handoff")} />
        <Hotspot label="360 Passport Connections" left="49.2%" top="84.5%" width="20.2%" height="10.0%" onClick={go("/passport/connections")} />
        <Hotspot label="DayOne360 Travel" left="69.4%" top="84.5%" width="20.8%" height="10.0%" onClick={go("/dayone360")} />
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
      }}
    />
  );
}
