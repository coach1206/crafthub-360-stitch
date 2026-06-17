import React from "react";
import { Link } from "react-router-dom";

function CommandHub() {
  return (
    <main className="min-h-screen bg-[#050403] text-[#f5d37c]">
      <div className="border-b border-[#7b5a25]/40 bg-black/80 px-6 py-3 text-xs tracking-[0.3em] uppercase">
        Live Venue Ticker · E.A.T. Command Center · POS 3 · Staff Handoff · Table Sessions
      </div>

      <section className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <p className="text-sm tracking-[0.35em] uppercase text-[#c49a46]">
              CraftHub 360
            </p>
            <h1 className="mt-3 text-5xl md:text-7xl font-serif tracking-[0.18em]">
              CRAFTHUB 360
            </h1>
          </div>

          <Link
            to="/passport"
            className="rounded-xl border border-[#c49a46]/60 px-5 py-3 font-bold tracking-[0.2em]"
          >
            PASSPORT
          </Link>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
          <section className="rounded-3xl border border-[#7b5a25]/50 bg-black/60 p-8 shadow-2xl">
            <p className="text-sm tracking-[0.35em] uppercase text-[#c49a46]">
              Guest · Staff · POS 3 · E.A.T.
            </p>

            <h2 className="mt-6 text-4xl md:text-6xl font-serif text-[#f5d37c]">
              Venue Table Experience
            </h2>

            <p className="mt-6 max-w-3xl text-xl leading-relaxed text-white/80">
              CraftHub 360 runs the venue-facing experience: guests at tables, staff handoff,
              POS 3 transactions, E.A.T. manager operations, inventory signals, event ticker,
              and service flow.
            </p>

            <div className="mt-8 grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-[#7b5a25]/50 bg-[#100b06] p-5">
                <h3 className="text-2xl font-bold">Guest Table Session</h3>
                <p className="mt-2 text-white/70">
                  Guest enters CraftHub by table, QR, or venue link.
                </p>
              </div>

              <div className="rounded-2xl border border-[#7b5a25]/50 bg-[#100b06] p-5">
                <h3 className="text-2xl font-bold">Staff Handoff</h3>
                <p className="mt-2 text-white/70">
                  Staff claims the table and triggers the operational ripple.
                </p>
              </div>

              <div className="rounded-2xl border border-[#7b5a25]/50 bg-[#100b06] p-5">
                <h3 className="text-2xl font-bold">POS 3</h3>
                <p className="mt-2 text-white/70">
                  Orders, tabs, payments, inventory signals, and tickets.
                </p>
              </div>

              <div className="rounded-2xl border border-[#7b5a25]/50 bg-[#100b06] p-5">
                <h3 className="text-2xl font-bold">E.A.T. Command Hub</h3>
                <p className="mt-2 text-white/70">
                  Managers monitor POS systems, inventory, staff sections, and venue flow.
                </p>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap gap-4">
              <Link to="/crafthub" className="rounded-xl bg-[#f5d37c] px-6 py-4 font-bold text-black">
                ENTER CRAFTHUB
              </Link>
              <Link to="/eat-command" className="rounded-xl border border-[#f5d37c] px-6 py-4 font-bold">
                E.A.T. COMMAND HUB
              </Link>
              <Link to="/pos3" className="rounded-xl border border-[#f5d37c] px-6 py-4 font-bold">
                POS 3
              </Link>
            </div>
          </section>

          <aside className="grid gap-4">
            {[
              ["ACTIVE TABLES", "14", "Guest sessions live"],
              ["STAFF HANDOFFS", "8", "Tables claimed"],
              ["POS / INVENTORY", "Ready", "Protected staff access"],
              ["E.A.T. ALERTS", "3", "Kitchen, bar, humidor"],
              ["EVENT TICKER", "Live", "Specials and events broadcasting"],
            ].map(([label, value, detail]) => (
              <div key={label} className="rounded-2xl border border-[#7b5a25]/50 bg-black/70 p-5">
                <p className="text-xs tracking-[0.3em] text-[#c49a46]">{label}</p>
                <p className="mt-3 text-3xl font-bold text-white">{value}</p>
                <p className="mt-2 text-white/60">{detail}</p>
              </div>
            ))}
          </aside>
        </div>
      </section>
    </main>
  );
}

export { CommandHub };
export default CommandHub;
