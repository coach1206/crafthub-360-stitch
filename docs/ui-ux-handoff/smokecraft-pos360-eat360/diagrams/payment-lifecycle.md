# Payment Lifecycle (high-level, non-invasive)

```mermaid
flowchart TD
    A[VenueHumidorCheckout] --> B[Payment intent created]
    B --> C{Payment result}
    C -->|success| D[Order confirmed\nVenueHumidorOrderConfirmation]
    C -->|failure| E[Checkout error state\nretry]
    D --> F[Payments ledger\nVenueHumidorAdminPayments]
    F --> G[Payments closeout\nPOS360 /pos3/payments-closeout\nSPEC/unverified]
```

Note: this diagram deliberately stays at the UI-flow level. Payment
gateway internals are out of scope for this documentation pass — a
concurrent agent may be implementing real payment-gateway integration in
this same repo/branch, and payment logic was explicitly excluded from
this task's scope.
