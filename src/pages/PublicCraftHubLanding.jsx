import React from "react";
import { Link } from "react-router-dom";

// Guest-safe system positioning screen. Explains how NOVEE OS, CraftHub,
// POS 3, E.A.T., and the craft modules relate. No staff tools, no
// reconciliation/audit/sync panels, no admin controls — every CTA routes
// to a real, already-existing destination.
const HIERARCHY = [
  {
    tier: "Intelligence Layer",
    title: "NOVEE OS",
    desc: "The system brain — command hub, module launcher, and venue intelligence layer that everything else runs on.",
    icon: "hub",
  },
  {
    tier: "Experience Platform",
    title: "CraftHub 360",
    desc: "The guest-facing venue experience platform — table sessions, craft modules, and Passport networking.",
    icon: "chair",
  },
  {
    tier: "Transaction Engine",
    title: "POS 3",
    desc: "Orders, tabs, payments, and inventory signals. Staff-access only, reached through Staff Handoff.",
    icon: "point_of_sale",
  },
  {
    tier: "Management Command",
    title: "E.A.T.",
    desc: "Manager command hub — operations, staff, reports, and venue settings. Staff-access only.",
    icon: "dashboard",
  },
];

const CRAFT_MODULES = [
  { title: "SmokeCraft 360", status: "Active", route: "/smokecraft" },
  { title: "PourCraft 360", status: "Coming Soon", route: "/pourcraft" },
  { title: "WineCraft 360", status: "Coming Soon", route: "/winecraft" },
  { title: "BeerCraft 360", status: "Coming Soon", route: "/beercraft" },
];

export default function PublicCraftHubLanding() {
  return (
    <main className="min-h-screen premium-novee-shell px-6 py-10">
      <section className="max-w-6xl mx-auto rounded-3xl border border-[#8b6a2f]/40 bg-black/70 p-8 shadow-2xl premium-novee-glow-card">
        <p className="tracking-[0.35em] text-sm text-[#d8b35f] uppercase">
          One Command Hub. Every System.
        </p>

        <h1 className="mt-6 text-5xl md:text-7xl font-serif tracking-[0.14em] text-[#f6d27a]">
          CRAFTHUB 360 ECOSYSTEM
        </h1>

        <p className="mt-6 text-xl text-white/85 max-w-3xl">
          NOVEE OS is the intelligence layer underneath every guest and staff
          experience in this venue. Here's how the pieces connect.
        </p>

        {/* ── System hierarchy ─────────────────────────────────── */}
        <div className="grid md:grid-cols-4 gap-4 mt-10">
          {HIERARCHY.map((h) => (
            <div key={h.title} className="rounded-2xl border border-[#8b6a2f]/50 p-5 bg-[#120d08] premium-novee-glow-card">
              <div className="flex items-center gap-2 mb-2">
                <span className="material-symbols-outlined text-[#d8b35f]">{h.icon}</span>
                <span className="text-[10px] uppercase tracking-[0.2em] text-[#d8b35f]/70">{h.tier}</span>
              </div>
              <h2 className="text-xl font-bold text-[#f6d27a]">{h.title}</h2>
              <p className="text-white/70 mt-2 text-sm leading-6">{h.desc}</p>
            </div>
          ))}
        </div>

        {/* ── Craft experience modules ─────────────────────────── */}
        <h3 className="mt-12 text-xs uppercase tracking-[0.3em] text-[#d8b35f]/70">Craft Experience Modules</h3>
        <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          {CRAFT_MODULES.map((m) => (
            <div key={m.title} className="rounded-xl border border-[#8b6a2f]/40 p-4 bg-[#0f0b06] flex items-center justify-between">
              <span className="font-semibold text-[#f6d27a]">{m.title}</span>
              <span
                className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full ${
                  m.status === "Active"
                    ? "bg-emerald-400/10 text-emerald-300 border border-emerald-400/30"
                    : "bg-[#8b6a2f]/10 text-[#d8b35f]/70 border border-[#8b6a2f]/30"
                }`}
              >
                {m.status}
              </span>
            </div>
          ))}
        </div>

        {/* ── CTAs — every link routes to a real existing destination ── */}
        <div className="flex flex-wrap gap-4 mt-10">
          <Link className="px-6 py-4 rounded-xl bg-[#d8b35f] text-black font-bold" to="/crafthub">
            Enter CraftHub
          </Link>
          <Link className="px-6 py-4 rounded-xl border border-[#d8b35f] text-[#d8b35f] font-bold" to="/smokecraft">
            Start SmokeCraft
          </Link>
          <Link className="px-6 py-4 rounded-xl border border-[#d8b35f] text-[#d8b35f] font-bold" to="/passport/connections">
            360 Passport Connections
          </Link>
        </div>
        <p className="mt-4 text-xs text-white/40 max-w-2xl">
          Staff and manager access (POS 3, E.A.T.) requires a staff PIN and is
          reached through the Staff Handoff flow inside CraftHub — it is not
          linked directly from this guest screen.
        </p>
      </section>
    </main>
  );
}
