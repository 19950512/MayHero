# Security Review and Hardening Notes

## Scope
This document summarizes the security analysis of May Hero (web + API), attack vectors identified, and mitigations already implemented.

## Threat Model (Practical)
- Cheaters manipulating client payloads (`/hero/sync`) to gain gold/xp/stats/items.
- Bots brute-forcing auth and automating high-frequency calls.
- Market abuse by injecting forged inventory items and listing them in shop.
- Token theft risk if any XSS exists in the frontend.

## Findings (Before Hardening)

### 1) Client-authoritative progression (critical)
- `PATCH /hero/sync` accepted hero progression state from client with weak anti-cheat.
- Risk: forged gold/xp/skill points/stats and leaderboard pollution.

### 2) Inventory item forgery (critical)
- Inventory payload accepted arbitrary item JSON and persisted directly.
- Risk: minting fake items and listing them in market.

### 3) Shop listing trusted stored item JSON (high)
- Listing relied on `inventoryItem.itemData` without canonical re-validation.
- Risk: forged item data propagating to marketplace.

### 4) JWT secret fallback risk in production (high)
- Potential insecure default secret usage if env missing.

### 5) Rate limiting weak and bypassable (medium/high)
- In-memory, per-IP only, no persistence/distributed state.

### 6) Token storage in localStorage (high residual)
- Frontend stores JWT in localStorage, vulnerable under XSS scenarios.

## Implemented Hardening (This Iteration)

### A) Canonical game catalog and item validator (API)
Added `apps/api/src/game-catalog.ts`:
- Canonical hero classes and base stats.
- Canonical equipment catalog (ID, slot, rarity, bonuses, icon, requiredLevel).
- Utility functions:
  - `normalizeEquipmentItemData`
  - `sanitizeEquipmentRecord`
  - `sanitizeInventoryItems`
  - `xpCurve`

Outcome:
- Server now validates incoming inventory/equipment against canonical item definitions.
- Forged item JSON is rejected.

### B) Stronger `/hero/sync` anti-cheat validation
Updated `apps/api/src/routes/hero.ts`:
- Reject class changes via sync.
- Enforce xpToNext consistency with server `xpCurve(level)`.
- Enforce XP range for current level (`0 <= xp < xpToNext`).
- Reject level decreases.
- Bound skill point inflation using level delta.
- Cap extreme gold gains per sync.
- Validate kill delta bounds.
- Sanitize and canonicalize equipment + inventory before persisting.
- Cap inventory size.

Outcome:
- Major reduction in direct payload tampering effectiveness.
- Forged inventory and equipment no longer persist.

### C) Shop listing validation
Updated `apps/api/src/routes/shop.ts`:
- Re-validate inventory item with `normalizeEquipmentItemData` before creating listing.
- Store canonical item data in listing payload.

Outcome:
- Blocks forged inventory artifacts from entering market listings.

### D) JWT secret hardening
Updated `apps/api/src/server.ts`:
- In production, server now requires `JWT_SECRET` with minimum 32 characters.
- Fails fast at boot if invalid.

Outcome:
- Prevents insecure production startup with weak/default secret.

### E) Rate limiter moved to Redis with fallback
Updated `apps/api/src/server.ts`:
- Primary limiter now uses Redis keys per route bucket and minute window.
- Route-specific budgets added (`auth`, `sync`, `buy`, `default`).
- Fallback in-memory limiter retained for availability when Redis is down.
- Fingerprint key uses `IP + User-Agent`.

Outcome:
- Limiting is now distributed and survives multi-instance traffic while Redis is available.

### F) Authentication moved to HttpOnly cookie session
Updated:
- `apps/api/src/routes/auth.ts`
- `apps/api/src/server.ts`
- `apps/web/app/lib/api.ts`
- `apps/web/app/store/authStore.ts`

Changes:
- Login/register now set secure session cookie (`HttpOnly`, `SameSite=Lax`, `Secure` in production).
- New `POST /auth/logout` clears session cookie.
- API auth accepts Bearer token or cookie token (compat mode).
- Frontend now uses `credentials: include` and no longer reads/writes auth token in localStorage.

Outcome:
- Significant reduction in token theft surface under XSS compared to localStorage JWT.

### G) Account-level login throttling/lockout
Updated `apps/api/src/routes/auth.ts`:
- Tracks failed logins per account in Redis.
- Applies temporary lockout after repeated failures.

Outcome:
- Better resistance to credential stuffing and brute-force attacks.

### H) Server-authoritative victory rewards endpoint
Updated `apps/api/src/routes/hero.ts`:
- Added `POST /hero/battle/victory` to compute rewards server-side.
- Server validates enemy/zone constraints and boss cadence via server-side zone kill counters in Redis.
- XP/gold/level/skill points and equipment drops are persisted by the server transaction.
- Leaderboard is updated from server-authoritative state.

Outcome:
- Reward payout is no longer client-calculated for authenticated sessions.

### I) Sync no longer overwrites inventory
Updated `apps/api/src/routes/hero.ts`:
- Removed inventory replacement from `/hero/sync` payload handling.
- Inventory is now server-owned (battle rewards + shop transfers).

Outcome:
- Blocks inventory inflation via sync payload replay/tampering.

### J) Server-issued encounter token for online battles
Updated:
- `apps/api/src/routes/hero.ts`
- `apps/web/app/components/GameUI.tsx`
- `apps/web/app/store/gameStore.ts`
- `apps/web/app/lib/api.ts`

Changes:
- Added `POST /hero/battle/start` to issue an encounter (`encounterId` + `enemyId`) with short TTL.
- `POST /hero/battle/victory` now requires matching `encounterId` and rejects mismatched/expired encounters.
- Encounter is invalidated after successful reward resolution (one-time use).
- Frontend now requests battle start from server in online mode before simulating the fight.

Outcome:
- Reduces forged victory payloads and replay abuse where client invents enemy context.

## Residual Risks / Next Actions

### 1) Authoritative combat simulation still client-side (medium/high)
- Rewards/progression and encounter issuance are now server-authoritative for authenticated users.
- Remaining gap: turn-by-turn damage simulation still runs client-side.
- Recommendation: move full turn simulation (or server-validated action stream) to API.

### 2) CSRF hardening for cookie auth (medium)
- Cookie auth is now enabled, but explicit CSRF tokens/origin checks for state-changing routes are still recommended.

### 3) Fine-grained distributed policies (medium)
- Limiter is now Redis-backed, but can be improved with per-user quotas and adaptive risk scoring.

### 4) WebSocket auth/rate controls (medium)
- Recommendation: require JWT for `/ws` subscriptions and cap concurrent sockets per identity/IP.

### 5) Auth anti-bot depth (medium)
- Login lockout now exists.
- Recommendation: add captcha/challenge on suspicious behavior and step-up verification.

## Operational Checklist
- Set strong `JWT_SECRET` in production (>= 32 chars).
- Set `NODE_ENV=production` to enforce strict JWT checks.
- Configure `AUTH_COOKIE_NAME` if custom cookie naming is required.
- Monitor 4xx rates on `/hero/sync` for tampering attempts.
- Alert on spikes in rejected syncs and listing rejects.
