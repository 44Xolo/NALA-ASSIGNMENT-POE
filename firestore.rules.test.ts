import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Verifies the structural security invariants of firestore.rules
 * against the Dirty Dozen threat model defined in security_spec.md.
 */
describe('firestore.rules security invariants', () => {
  const rulesPath = path.resolve(process.cwd(), 'firestore.rules');
  const rules = fs.existsSync(rulesPath) ? fs.readFileSync(rulesPath, 'utf8') : '';

  it('uses rules_version 2 and a default-deny catch-all rule', () => {
    expect(rules).toContain("rules_version = '2';");
    expect(rules).toContain('match /{document=**}');
    expect(rules).toContain('allow read, write: if false;');
  });

  it('enforces verified owner-only access and denies collection list on /users', () => {
    expect(rules).toContain('match /users/{userId}');
    expect(rules).toContain('allow get: if isVerifiedOwner(userId) && isValidId(userId);');
    expect(rules).toContain('allow list: if false;');
  });

  it('enforces validation blueprint, immutable fields, and server timestamps on /users', () => {
    expect(rules).toContain('request.auth.token.email_verified == true');
    expect(rules).toContain("data.authProvider in ['google', 'phone', 'email']");
    expect(rules).toContain('isValidUserProfile(incoming(), userId)');
    expect(rules).toContain('incoming().createdAt == request.time');
    expect(rules).toContain('incoming().updatedAt == request.time');
    expect(rules).toContain('incoming().uid == existing().uid');
    expect(rules).toContain('incoming().createdAt == existing().createdAt');
    expect(rules).toContain('incoming().authProvider == existing().authProvider');
    expect(rules).toContain('affectedKeys().hasOnly([');
  });

  it('enforces owner-scoped access, bounded items array, immutable totals, and terminal lock on /orders', () => {
    expect(rules).toContain('match /orders/{orderId}');
    expect(rules).toContain('allow list: if isVerifiedUser() && existing().userId == request.auth.uid;');
    expect(rules).toContain('isValidOrder(incoming(), orderId)');
    expect(rules).toContain('data.items.size() >= 1');
    expect(rules).toContain('data.items.size() <= 25');
    expect(rules).toContain("existing().status != 'completed'");
    expect(rules).toContain('incoming().total == existing().total');
    expect(rules).toContain('allow delete: if false;');
  });
});
