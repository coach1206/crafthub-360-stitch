# SmokeCraft Customer Journey (proven)

```mermaid
flowchart TD
    A[/smokecraft/welcome/] --> B[/smokecraft/enroll/]
    B --> C[/smokecraft/venue-select/]
    C --> D[/smokecraft/mentor-selection/]
    D --> E[21 curriculum sessions\n27-session / 7-phase spine]
    E --> F[/smokecraft/scorecard/]
    F --> G[/smokecraft/passport-stamp/]
    G --> H[/smokecraft/rewards/]
    H --> I{Order a cigar?}
    I -->|yes| J[/smokecraft/venue-humidor/]
    J --> K[Checkout]
    K --> L[Order Confirmation]
    I -->|no| M[/smokecraft/golden-box/]
    H --> M
    M --> N[Golden Box Competitions]
    N --> O[Judge Review]
    O --> P[Results / Award]
    L --> Q[/smokecraft/session-complete/]
    P --> Q
```

Status: proven live, server-verified, screenshot-covered
(`public/proof/smokecraft-final-gameplay-acceptance/`).
