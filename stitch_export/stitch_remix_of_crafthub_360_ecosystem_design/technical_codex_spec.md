# CraftHub 360 Technical Codex & API Specifications

## 1. Interaction Standard: Founder Level 0
All UI elements must adhere to the following tactile requirements:
- **Touch Targets**: Minimum 72px x 72px for all primary action buttons.
- **Feedback**: 
  - `HAPTIC_SUCCESS`: Single pulse (15ms).
  - `HAPTIC_CONFIRM`: Dual pulse (30ms).
  - `HAPTIC_WARNING`: Long pulse (100ms).
- **Triggers**: Critical actions (Ordering, Transfers, Vault Access) utilize "Hold-to-Activate" progress circles.

## 2. Global State Management (Novee OS)
The system maintains a unified context across all modules:
- `active_guest_id`: Set via Passport scan.
- `venue_status`: [Nominal, High Velocity, Alert, Maintenance].
- `haptic_level`: [Subtle, Standard, Heavy].

## 3. Module API Hooks

### 3.1 360 Passport
- `GET /api/passport/profile/:id`: Returns guest tier, stamps, and sensory preferences.
- `POST /api/passport/award-stamp`: Triggers on POS 3 confirmation or participation event.

### 3.2 POS 3 Integration
- `POST /api/pos/transaction`: Initiates order.
- `ON_CONFIRM`: Triggers `inventory_decrement()` and `stamp_check()`.

### 3.3 E.A.T. Sensors
- `WS /stream/sensors`: Real-time telemetry for humidity, noise, and occupancy.
- `ALERT_THRESHOLD`: Triggers AI Help Coach overlay on staff terminals.

## 4. Design System Tokens
- **Primary**: `#c5a059` (Gold Foil)
- **Surface**: `#131314` (Obsidian)
- **Surface-Bright**: `#39393a`
- **Blur**: `20px` (Glass-morphism standard)
- **Font**: `Playfair Display` (Headlines), `Inter` (UI/Body)
