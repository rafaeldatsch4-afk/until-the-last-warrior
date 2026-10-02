# Security Specification

## Public leaderboard trust boundary
- Public reads remain enabled.
- Authenticated players may create or update only their own `leaderboard_public` entry.
- New entries start from the ranking baseline; result updates may advance only one match at a time, add at most one win, and change Elo by at most 25 points.
- Large score jumps and writes to another player's entry are rejected by Firestore rules.
- Client-side validation reduces casual tampering but is not fully authoritative; a trusted backend is still required for strong competitive integrity.
- See `docs/RANKING_SECURITY.md` for behavior, limitations and emulator tests.

## Data Invariants
- A user's profile can only be created, read, or modified by the user themselves.
- The `matches`, `wins`, and `losses` fields must be numbers.
- The `achievements` field must be an array of strings.
- The `lastLogin` field must be a timestamp.

## The "Dirty Dozen" Payloads
1. Incorrect UID: Trying to set `userId` to another user's UID.
2. Missing UID: Trying to create a user profile without being authenticated.
3. Wrong type for `matches` (e.g., string instead of number).
4. Wrong type for `wins` (e.g., boolean instead of number).
5. Wrong type for `losses`.
6. Wrong type for `achievements` (e.g., object instead of array).
7. Non-string items inside `achievements` array.
8. Incorrect `lastLogin` type (e.g., string instead of timestamp).
9. Updating someone else's profile.
10. Reading someone else's profile.
11. Extra ghost field (e.g., `isAdmin: true`).
12. Huge string in `username` (Denial of Wallet).
