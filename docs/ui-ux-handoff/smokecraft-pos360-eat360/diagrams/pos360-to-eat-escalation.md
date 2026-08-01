# POS360 → E.A.T. 360 Escalation

```mermaid
flowchart TD
    A[Staff action in POS360\ne.g. void, comp, refund, discount] --> B{Requires manager approval?}
    B -->|no| C[Action completes\nstaff_order_preview / staff_assisted_preview]
    B -->|yes| D[manager_approval_required]
    D --> E{Approval UI location}
    E -->|not conclusively located in repo| F[GAP: no confirmed\nmanager-approval screen]
    D -.proposed.-> G[/eat/pos-control or /eat/operations\nSPEC — recommended location/]
    G --> H{Manager decision}
    H -->|approve| I[manager_approved_preview]
    H -->|reject| J[manager_rejected_preview]
```

Status: the escalation *states* (`manager_approval_required`,
`manager_approved_preview`, `manager_rejected_preview`) are real, defined
in `StaffStatusBadge.jsx`. The concrete screen where a manager actually
approves/rejects was not conclusively located in this codebase during
this documentation pass — flagged as a real implementation gap, not
fabricated as existing.
