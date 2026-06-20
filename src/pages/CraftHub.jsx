import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDemoMode } from "../context/DemoModeContext.jsx";
import StaffHandoffButton from "../components/staffhandoff/StaffHandoffButton.jsx";

// ROW 1 — public guest-facing craft modules + Passport Connections.
// POS 3 and E.A.T. System are intentionally excluded: they are staff/manager
// systems reached only through the Staff Handoff PIN flow (see ROW 2).
const ROW1_MODULES = [
  { id: "smokecraft", title: "SmokeCraft 360", desc: "Cigar pairing, mentor-guided tasting, flavor notes, score flow.", icon: "chair", action: "route", route: "/smokecraft", image: "/smokecraft.jpg" },
  { id: "pourcraft", title: "PourCraft 360", desc: "Cocktail discovery, bar specials, pairing moments, guest preference capture.", icon: "liquor", action: "route", route: "/pourcraft", image: "/pourcraft.jpg" },
  { id: "winecraft", title: "WineCraft 360", desc: "Wine flights, cellar signals, tasting notes, event pairing.", icon: "wine_bar", action: "route", route: "/winecraft", image: "/winecraft.jpg" },
  { id: "beercraft", title: "BeerCraft 360", desc: "Beer flights, taproom specials, style matching, score flow.", icon: "sports_bar", action: "route", route: "/beercraft", image: "/beercraft.jpg" },
  { id: "passport-connections", title: "360 Passport Connections", desc: "Guest identity, stamps, networking, experience history.", icon: "menu_book", action: "route", route: "/passport/connections", image: "/passport.jpg" },
];

// ROW 2 — Staff Handoff is the only bridge to POS 3 / E.A.T. System, and
// DayOne360 Travel opens the external site directly.
const ROW2_MODULES = [
  { id: "staff-handoff", title: "Staff Handoff", desc: "Staff PIN access into POS 3 or E.A.T. System.", icon: "badge", action: "staff-handoff", image: null },
  { id: "dayone360", title: "DayOne360 Travel", desc: "Travel placement, venue offers, destination experiences.", icon: "flight_takeoff", action: "external", route: "https://dayone360.com", image: "/crafthub-gold.jpg" },
];

const SIGNALS = [
  { label: "Active Tables", value: "12" },
  { label: "Staff Handoffs", value: "3" },
  { label: "POS / Inventory", value: "Nominal" },
  { label: "E.A.T. Alerts", value: "1" },
  { label: "Kitchen", value: "On Track" },
  { label: "Bar", value: "Stocked" },
  { label: "Humidor", value: "62°F / 70%" },
  { label: "Events", value: "2 Tonight" },
];

export default function CraftHub() {
  const navigate = useNavigate();
  const cardRefs = useRef([]);
  const { enterDemoMode } = useDemoMode();
  const [staffHandoffOpen, setStaffHandoffOpen] = useState(false);

  useEffect(() => {
    const onMove = (e) => {
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      const rx = (e.clientX - cx) / cx;
      const ry = (e.clientY - cy) / cy;
      cardRefs.current.forEach((card) => {
        if (!card) return;
        const img = card.querySelector(".parallax-bg");
        if (img) img.style.transform = `scale(1.1) translate(${rx * 10}px, ${ry * 10}px)`;
      });
    };
    document.addEventListener("mousemove", onMove);
    return () => document.removeEventListener("mousemove", onMove);
  }, []);

  function handleDemoMode() {
    enterDemoMode();
    navigate("/smokecraft");
  }

  function handleTileClick(mod) {
    if (mod.action === "staff-handoff") { setStaffHandoffOpen(true); return; }
    if (mod.action === "external") { window.open(mod.route, "_blank", "noopener,noreferrer"); return; }
    navigate(mod.route);
  }

  function renderTile(mod, idx) {
    return (
      <div
        key={mod.id}
        ref={(el) => (cardRefs.current[idx] = el)}
        onClick={() => handleTileClick(mod)}
        className="group relative h-[300px] cursor-pointer overflow-hidden rounded-2xl border border-[#d4af37]/15 shadow-2xl transition-all duration-500 hover:border-[#d4af37]/50"
      >
        <div className="absolute inset-0 z-0">
          {mod.image ? (
            <img
              src={mod.image}
              alt={mod.title}
              className="parallax-bg h-full w-full scale-110 object-cover transition-transform duration-700 group-hover:scale-125"
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-[#1a1410] via-[#0a0805] to-black" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
        </div>

        <div className="absolute bottom-0 left-0 z-10 flex w-full items-end justify-between gap-4 p-6">
          <div>
            <h3 className="text-xl font-bold text-[#d4af37]">{mod.title}</h3>
            <p className="mt-1 max-w-xs text-sm text-[#cbb98f]">{mod.desc}</p>
          </div>
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full border border-[#d4af37]/30 bg-black/40 transition-colors group-hover:bg-[#d4af37] group-hover:text-black">
            <span className="material-symbols-outlined text-[#d4af37] group-hover:text-black">{mod.icon}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0805] text-[#f1e6c8]">
      {/* ── Header ──────────────────────────────────────── */}
      <header className="sticky top-0 z-50 w-full border-b border-[#d4af37]/20 bg-[#0a0805]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/")}
              className="rounded-full border border-[#5b8fc9]/40 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-[#9cc2e8] transition hover:bg-[#5b8fc9]/10"
            >
              Back to NOVEE OS
            </button>
            <button
              onClick={() => navigate("/home")}
              className="rounded-full border border-[#5b8fc9]/40 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-[#9cc2e8] transition hover:bg-[#5b8fc9]/10"
            >
              Home
            </button>
          </div>
          <h1 className="text-2xl font-bold uppercase tracking-[0.25em] text-[#d4af37]">CraftHub 360</h1>
          <div className="flex items-center gap-4">
            <button
              onClick={() => window.open("https://dayone360.com", "_blank", "noopener,noreferrer")}
              className="hidden rounded-full border border-[#d4af37]/40 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-[#d4af37] transition hover:bg-[#d4af37]/10 sm:inline-block"
            >
              DayOne360 Travel
            </button>
            <button
              onClick={handleDemoMode}
              className="rounded-full border border-[#d4af37]/40 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-[#d4af37] transition hover:bg-[#d4af37]/10"
            >
              Demo Mode
            </button>
            <button
              onClick={() => navigate("/passport/connections")}
              className="rounded-full border border-[#d4af37]/40 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-[#d4af37] transition hover:bg-[#d4af37]/10"
            >
              360 Passport Connections
            </button>
          </div>
        </div>
      </header>

      {/* ── Hero ───────────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-6 py-12 text-center">
        <h2 className="text-4xl font-bold uppercase tracking-wide text-[#f1e6c8] sm:text-5xl">CraftHub 360</h2>
        <p className="mt-2 text-sm uppercase tracking-[0.3em] text-[#d4af37]">Venue Table Experience</p>
        <p className="mx-auto mt-6 max-w-2xl text-base text-[#cbb98f]">
          Guest craft experiences, Passport networking, staff handoff, and venue service flow.
        </p>
      </section>

      {staffHandoffOpen && (
        <StaffHandoffButton
          startOpen
          allowedDestinations={["pos", "eat"]}
          onClose={() => setStaffHandoffOpen(false)}
        />
      )}

      {/* ── Module cards ───────────────────────────────────── */}
      <main className="mx-auto max-w-7xl px-6 pb-20">
        {/* ROW 1 — guest-facing craft modules + Passport Connections */}
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-5">
          {ROW1_MODULES.map(renderTile)}
        </div>

        {/* ROW 2 — Staff Handoff bridge + DayOne360 Travel */}
        <div className="mx-auto mt-8 grid max-w-3xl grid-cols-1 gap-8 sm:grid-cols-2">
          {ROW2_MODULES.map((mod, idx) => renderTile(mod, ROW1_MODULES.length + idx))}
        </div>

        {/* ── Operational signals ────────────────────────────── */}
        <div className="mt-16">
          <h3 className="mb-6 text-center text-sm font-semibold uppercase tracking-[0.3em] text-[#d4af37]">
            Venue Signals
          </h3>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {SIGNALS.map((s) => (
              <div
                key={s.label}
                className="rounded-xl border border-[#d4af37]/15 bg-[#120f0a] p-4 text-center"
              >
                <p className="text-xs uppercase tracking-widest text-[#cbb98f]">{s.label}</p>
                <p className="mt-2 text-lg font-bold text-[#d4af37]">{s.value}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* ── Bottom action nav ──────────────────────────────── */}
      {/* Labels/routes match their actual destination — Staff Handoff opens
          the PIN-gated handoff picker, never the Passport route, and vice versa. */}
      <nav className="fixed bottom-0 z-50 w-full border-t border-[#d4af37]/20 bg-[#0a0805]/95 backdrop-blur-2xl">
        <div className="mx-auto flex h-[88px] max-w-4xl items-center justify-around px-4">
          <button
            onClick={() => navigate("/crafthub")}
            className="flex flex-col items-center gap-1 px-4 py-2 text-[#cbb98f] transition hover:text-[#d4af37]"
          >
            <span className="material-symbols-outlined">chair</span>
            <span className="text-[10px] font-semibold uppercase tracking-widest">Enter CraftHub</span>
          </button>
          <button
            onClick={() => setStaffHandoffOpen(true)}
            className="flex flex-col items-center gap-1 px-4 py-2 text-[#cbb98f] transition hover:text-[#d4af37]"
          >
            <span className="material-symbols-outlined">badge</span>
            <span className="text-[10px] font-semibold uppercase tracking-widest">Staff Handoff</span>
          </button>
          <button
            onClick={() => navigate("/passport/connections")}
            className="flex flex-col items-center gap-1 px-4 py-2 text-[#cbb98f] transition hover:text-[#d4af37]"
          >
            <span className="material-symbols-outlined">menu_book</span>
            <span className="text-[10px] font-semibold uppercase tracking-widest">360 Passport Connections</span>
          </button>
          <button
            onClick={() => window.open("https://dayone360.com", "_blank", "noopener,noreferrer")}
            className="flex flex-col items-center gap-1 px-4 py-2 text-[#cbb98f] transition hover:text-[#d4af37]"
          >
            <span className="material-symbols-outlined">flight_takeoff</span>
            <span className="text-[10px] font-semibold uppercase tracking-widest">DayOne360 Travel</span>
          </button>
        </div>
      </nav>

      <div className="h-[88px]" />
    </div>
  );
}
