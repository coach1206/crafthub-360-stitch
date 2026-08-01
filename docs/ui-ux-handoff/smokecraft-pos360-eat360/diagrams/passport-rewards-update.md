# Passport and Rewards Update (proven)

```mermaid
sequenceDiagram
    participant Guest
    participant Session as SmokeCraft session screen
    participant Server as Server (authoritative)
    participant Ledger as XP/Rank ledger
    participant Passport as Passport-360 (platform-wide)

    Guest->>Session: Completes session interaction
    Session->>Server: completeSessionOnServer(sessionId)
    Server->>Server: handleCompleteSession()\nlooks up XP from sessionRewardTable.js\n(never client-supplied)
    Server->>Ledger: Award XP, update rank (idempotent)
    Server-->>Session: Completion confirmed
    alt Session 23 (passport-stamp)
        Server->>Passport: Issue Passport-360 stamp\n(shared platform-wide)
    end
    Guest->>Session: Views /smokecraft/rewards
    Session->>Ledger: Read live XP/rank total (correct, proven)
    Session->>Session: Render itemized XP breakdown\n[KNOWN BUG: rows show 0 XP each\ndespite correct total]
```

Status: proven live and server-authoritative for the completion+XP
mechanism itself; the itemized breakdown display bug is a real, disclosed,
non-blocking limitation (see `17-KNOWN-LIMITATIONS...md`).
