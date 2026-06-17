import React from "react";
import { Link } from "react-router-dom";

export default function PublicCraftHubLanding() {
  return (
    <main className="min-h-screen bg-[#070604] text-[#f6d27a] px-6 py-8">
      <section className="max-w-6xl mx-auto rounded-3xl border border-[#8b6a2f]/40 bg-black/70 p-8 shadow-2xl">
        <p className="tracking-[0.35em] text-sm text-[#d8b35f] uppercase">
          CraftHub 360 Venue Experience
        </p>

        <h1 className="mt-6 text-6xl md:text-8xl font-serif tracking-[0.18em]">
          CRAFTHUB 360
        </h1>

        <p className="mt-6 text-2xl text-white">
          Guest table sessions, staff handoff, POS 3 transactions, and E.A.T. manager operations.
        </p>

        <div className="grid md:grid-cols-4 gap-4 mt-10">
          <div className="rounded-2xl border border-[#8b6a2f]/50 p-5 bg-[#120d08]">
            <h2 className="text-xl font-bold">Guest</h2>
            <p className="text-white/70 mt-2">Starts CraftHub table experience.</p>
          </div>

          <div className="rounded-2xl border border-[#8b6a2f]/50 p-5 bg-[#120d08]">
            <h2 className="text-xl font-bold">Staff</h2>
            <p className="text-white/70 mt-2">Claims table and triggers handoff.</p>
          </div>

          <div className="rounded-2xl border border-[#8b6a2f]/50 p-5 bg-[#120d08]">
            <h2 className="text-xl font-bold">POS 3</h2>
            <p className="text-white/70 mt-2">Orders, tabs, payments, inventory signals.</p>
          </div>

          <div className="rounded-2xl border border-[#8b6a2f]/50 p-5 bg-[#120d08]">
            <h2 className="text-xl font-bold">E.A.T.</h2>
            <p className="text-white/70 mt-2">Manager command hub and operations.</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-4 mt-10">
          <Link className="px-6 py-4 rounded-xl bg-[#d8b35f] text-black font-bold" to="/crafthub">
            Enter CraftHub
          </Link>
          <Link className="px-6 py-4 rounded-xl border border-[#d8b35f] text-[#d8b35f] font-bold" to="/eat-command">
            E.A.T. Command Hub
          </Link>
          <Link className="px-6 py-4 rounded-xl border border-[#d8b35f] text-[#d8b35f] font-bold" to="/pos3">
            POS 3
          </Link>
        </div>
      </section>
    </main>
  );
}
