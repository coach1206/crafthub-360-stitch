# Customer → POS360 Handoff

```mermaid
sequenceDiagram
    participant Guest
    participant VenueHumidor as Venue Humidor (proven)
    participant Bridge as smokecraftHandoffService.js
    participant POS360 as POS360 /pos3 (unverified)
    participant Staff

    Guest->>VenueHumidor: Checkout / place order
    VenueHumidor->>VenueHumidor: Order confirmed, stored (proven)
    VenueHumidor->>Bridge: createPOS360OrderIntent()
    Bridge->>POS360: POST /api/pos360/smokecraft/order-intent
    alt Bridge succeeds
        POS360-->>Bridge: order intent created
        Bridge-->>Staff: order visible in POS360 order lifecycle
    else Bridge fails / unreachable
        Bridge-->>Bridge: pos360LocalFallback()\norderStatus='local_fallback'
        Bridge-->>Staff: ManualPOS360HandoffPanel shown
        Staff->>Staff: "Create Manual POS360 Handoff"\n(manual_pos360_handoff · pos_sync_pending · not_persisted)
    end
    Staff->>Guest: Order fulfilled (via /pos3/fulfillment-kds, HumidorControl)
```

Status: real code on both sides; the bridge's live success path is
**not** proof-verified. The local-fallback/manual path is real, working,
and explicitly disclosed as non-persistent.
