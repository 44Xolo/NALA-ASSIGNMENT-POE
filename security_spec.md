# Security Specification (Phase 0)

## Data Invariants

1. **Authentication & Verification**: Only authenticated users with a verified email (`email_verified == true`) or a verified Phone number (`sign_in_provider == 'phone'` and valid `phone_number`) can access `/users/{userId}` and `/orders/{orderId}`.
2. **PII Isolation & Ownership**:
   - `/users/{userId}` stores `contactEmail` and `contactPhone`. Both `get` and `write` are strictly limited to the matching owner (`request.auth.uid == userId`). Collection-wide `list` queries on `/users` are denied (`allow list: if false`).
   - `/orders/{orderId}` stores `customerName`, `customerPhone`, and `tableOrAddress`. Single-doc `get` and `list` queries are strictly bound to `resource.data.userId == request.auth.uid` (no blanket `isSignedIn()` reads).
3. **Immutable Identity, Financials & Timestamps**:
   - On `/users/{userId}`, `uid`, `authProvider`, and `createdAt` cannot change after creation; `createdAt` and `updatedAt` must equal `request.time`.
   - On `/orders/{orderId}`, `id`, `orderNumber`, `userId`, `items`, `subtotal`, `serviceFee`, `tip`, `total`, `paymentMethod`, `paymentLast4`, `createdAtMs`, and `createdAt` are immutable after creation; updates may only transition `status` / `paymentStatus` / `updatedAt` and are permanently locked once `status == 'completed'`. Deletion of orders is forbidden (`allow delete: if false`).
4. **Strict Schema & Bounded Arrays**:
   - Unknown shadow fields are rejected via `hasAll`/`hasOnly` on create and `affectedKeys().hasOnly(...)` on update.
   - `items` on `/orders/{orderId}` is bounded (`1 <= size <= 25`) with first-element map shape verification (`hasAll`/`hasOnly` on `menuItemId`, `name`, `course`, `unitPrice`, `quantity`, `lineTotal`).

## Dirty Dozen Adversarial Payloads

1. Unauthenticated `get` on `/users/chef1` or `/orders/ord1` -> `PERMISSION_DENIED`
2. Cross-user `get` on `/users/chef2` or `/orders/ord2` owned by another UID -> `PERMISSION_DENIED`
3. Unverified email user (`email_verified: false`) `create` on `/users/chef1` or `/orders/ord1` -> `PERMISSION_DENIED`
4. Collection `list` on `/users`, or unfiltered `list` on `/orders` without `userId == request.auth.uid` -> `PERMISSION_DENIED`
5. Identity spoofing `create` on `/users/chef1` with `uid: "chef2"` or `/orders/ord1` with `userId: "other"` -> `PERMISSION_DENIED`
6. Shadow field `create` on `/users/chef1` or `/orders/ord1` with `{ ..., isAdmin: true }` -> `PERMISSION_DENIED`
7. Oversized `displayName` (>80 chars), `tableOrAddress` (>120 chars), or `items` (>25 entries) -> `PERMISSION_DENIED`
8. Invalid enum values (`authProvider: "password"` or `paymentMethod: "crypto"` or `status: "refunded"`) -> `PERMISSION_DENIED`
9. Client-forged `createdAt` not equal to `request.time` on `create` -> `PERMISSION_DENIED`
10. Mutating immutable fields (`uid`/`createdAt` on `/users`, or `total`/`items`/`userId` on `/orders`) -> `PERMISSION_DENIED`
11. Updating a completed order (`existing().status == 'completed'`) or deleting any `/orders/{orderId}` -> `PERMISSION_DENIED`
12. Malformed path ID (>128 chars or invalid characters) or negative/zero `total` -> `PERMISSION_DENIED`
