# NEUROX ESPORTS — Firestore Security Specification

## 1. Data Invariants
1. **PII Split-Collection Isolation**: Public player profiles in `/players/{userId}` never contain phone numbers or emails. Contact details (`contactValue`, `contactType`) are strictly isolated in `/user_vaults/{userId}` which is readable and writable ONLY by `request.auth.uid == userId`.
2. **Identity Integrity**: Every document creation in `/players/{userId}` and `/user_vaults/{userId}` requires `userId == request.auth.uid` and `incoming().uid == request.auth.uid` with verified email (`request.auth.token.email_verified == true`).
3. **Immutable Core Fields**: `uid`, `playerId`, and `createdAt` on `/players/{userId}` cannot be altered after creation.
4. **Room State Integrity**: A `/rooms/{roomId}` document can only be created by an authenticated verified host (`hostUid == request.auth.uid`), and once `status == 'completed'`, no further updates are permitted (Terminal State Locking).
5. **Direct Message Integrity**: A `/messages/{messageId}` document is immutable once created (`allow update, delete: if false`) and can only be read by `senderUid == request.auth.uid || receiverUid == request.auth.uid`.

## 2. The "Dirty Dozen" Payloads
1. **Unverified Email Write**: Attempt to create `/players/user1` with `email_verified: false` -> `PERMISSION_DENIED`.
2. **Identity Spoofing on Player Profile**: Authenticated as `user2`, attempt to create `/players/user1` -> `PERMISSION_DENIED`.
3. **Shadow Field Injection**: Attempt to create `/players/user1` with extra field `isAdmin: true` -> `PERMISSION_DENIED`.
4. **PII Leak Attempt**: Authenticated as `user2`, attempt `get(/user_vaults/user1)` -> `PERMISSION_DENIED`.
5. **ID Poisoning**: Attempt to create `/rooms/invalid$id!@#` -> `PERMISSION_DENIED`.
6. **Client Timestamp Forgery**: Attempt to create `/players/user1` with `createdAt` not matching `request.time` -> `PERMISSION_DENIED`.
7. **Immortal Field Mutation**: Attempt to update `playerId` or `createdAt` on `/players/user1` -> `PERMISSION_DENIED`.
8. **Value Poisoning on Score**: Attempt to update `monthlyPoints` on `/players/user1` with a string or negative number -> `PERMISSION_DENIED`.
9. **Terminal State Bypass on Room**: Attempt to update `/rooms/1234` when `existing().status == 'completed'` -> `PERMISSION_DENIED`.
10. **Unauthorized Room Modification**: Authenticated as `user3` (neither host nor guest), attempt to update `/rooms/1234` once guest slot is taken -> `PERMISSION_DENIED`.
11. **Message Tampering**: Attempt to update or delete an existing `/messages/msg1` document -> `PERMISSION_DENIED`.
12. **Unauthorized Message Snooping**: Authenticated as `user3`, attempt to list `/messages` where `user3` is neither sender nor receiver -> `PERMISSION_DENIED`.
