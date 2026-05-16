# Security Specification - Eterna Wedding

## Data Invariants
1. A **Wedding** must have at least one owner (client).
2. **Tasks**, **Guests**, and **AI Chats** must belong to a valid Wedding.
3. Access to sub-resources (Tasks, Guests, AI Chats) is derived from the parent Wedding's `ownerIds` or `plannerIds`.
4. Users cannot modify their own `role` in their Profile once created (Tier 1 lock).
5. Wedding `budgetSpent` can only be updated by a confirmed action (e.g., booking confirmation).

## The "Dirty Dozen" Payloads (Red Team Test Cases)

1. **Identity Theft**: Update another user's profile role to 'planner'.
2. **Budget Poisoning**: Update `budgetSpent` with a negative number or extremely large string.
3. **Orphaned Task**: Create a task with a `weddingId` that doesn't exist.
4. **Guest Snooping**: A guest of Wedding A tries to read the guest list of Wedding B.
5. **Role Escalation**: A user creates a profile with `role: "admin"` (if admin existed) or tries to make themselves the owner of a wedding they didn't create.
6. **Immutable Breach**: Try to change the `createdAt` timestamp of a Wedding.
7. **Shadow Field**: Update a Wedding document with `isVerified: true` (a field not in schema).
8. **Path ID Injection**: Create a wedding with an ID that is a 1MB string of junk characters.
9. **Unverified Write**: Write to the database with a Guest account that has `email_verified: false`.
10. **State Shortcut**: Move a wedding status from 'planning' straight to 'archived' bypassing 'live' (if logic required sequence).
11. **PII Leak**: Read a user's private document (e.g., email) without being that user.
12. **Relationship Sync**: Add a task to a wedding without being in the `ownerIds` or `plannerIds` of that wedding.

## Test Runner (Draft)
```ts
// firestore.rules.test.ts
// ... test cases verifying PERMISSION_DENIED for above payloads ...
```
