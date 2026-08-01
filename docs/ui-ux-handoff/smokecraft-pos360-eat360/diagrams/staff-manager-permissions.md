# Staff and Manager Permissions

```mermaid
flowchart TD
    subgraph "Layer 1 — Route gate (real, enforced)"
    A[/pos3/* → requiredPermission=access_pos3_staff/]
    B[/eat/* → requiredPermission=access_eat_command/]
    end

    subgraph "Layer 2 — POS360 job roles (UI-only guardrail, NOT backend-enforced)"
    C[owner / venue_admin\nFULL_ACCESS]
    D[manager\nfloor, money, staff, reports]
    E[server\ntable/order/void/comp/refund/discount/transfer/split]
    F[bartender\nbar queue + drink status]
    G[kitchen\nkitchen queue + prep status]
    H[humidor_staff\nhumidor queue + fulfillment]
    I[host\nreservations/waitlist/holds/seating]
    J[support_runner\nassigned tasks + delivered status]
    end

    subgraph "E.A.T. 360 (no fine-grained job-role matrix found)"
    K[manager/admin/owner/founder_level_0\nvia allowedRoles on adjacent screens]
    end

    A --> C
    A --> D
    A --> E
    A --> F
    A --> G
    A --> H
    A --> I
    A --> J
    B --> K
```

Status: Layer 1 is real and enforced server/route-side. Layer 2 is real
code but explicitly self-documented as a UI-only guardrail requiring a
future backend-enforced staff-identity layer for production use. E.A.T.
360 has no equivalent fine-grained matrix in this codebase today.
