import { describe, it, expect, beforeEach, vi } from 'vitest';
import UserSession from '../UserSession';

describe('UserSession model', () => {
  let testSession: UserSession;

  beforeEach(() => {
    testSession = new UserSession({
      userId: 'user123',
      provider: 'google',
      accessToken: 'access-token-123',
      refreshToken: 'refresh-token-123',
      expiresAt: new Date(Date.now() + 3600000).toISOString() // 1 hour from now
    });
  });

  describe('constructor', () => {
    it('constructs with full payload', () => {
      const expiresAt = new Date(Date.now() + 1000);
      const session = new UserSession({
        userId: 'user456',
        provider: 'google',
        accessToken: 'token123',
        refreshToken: 'refresh123',
        expiresAt: expiresAt.toISOString()
      });

      expect(session.userId).toBe('user456');
      expect(session.provider).toBe('google');
      expect(session.accessToken).toBe('token123');
      expect(session.refreshToken).toBe('refresh123');
      expect(session.expiresAt).toEqual(expiresAt);
    });

    it('constructs with empty payload', () => {
      const session = new UserSession();

      expect(session.userId).toBeNull();
      expect(session.provider).toBeNull();
      expect(session.accessToken).toBeNull();
      expect(session.refreshToken).toBeNull();
      expect(session.expiresAt).toBeNull();
    });

    it('constructs with partial payload', () => {
      const session = new UserSession({
        accessToken: 'token-only'
      });

      expect(session.accessToken).toBe('token-only');
      expect(session.userId).toBeNull();
      expect(session.provider).toBeNull();
      expect(session.refreshToken).toBeNull();
      expect(session.expiresAt).toBeNull();
    });

    it('handles null values explicitly', () => {
      const session = new UserSession({
        userId: null,
        provider: null,
        accessToken: null,
        refreshToken: null,
        expiresAt: null
      });

      expect(session.userId).toBeNull();
      expect(session.provider).toBeNull();
      expect(session.accessToken).toBeNull();
      expect(session.refreshToken).toBeNull();
      expect(session.expiresAt).toBeNull();
    });
  });

  describe('fromJSON', () => {
    it('creates instance from JSON payload', () => {
      const payload = {
        userId: 'json-user',
        provider: 'github',
        accessToken: 'json-token',
        refreshToken: 'json-refresh',
        expiresAt: '2023-12-25T12:00:00.000Z'
      };

      const session = UserSession.fromJSON(payload);
      expect(session.userId).toBe('json-user');
      expect(session.provider).toBe('github');
      expect(session.accessToken).toBe('json-token');
      expect(session.refreshToken).toBe('json-refresh');
      expect(session.expiresAt).toEqual(new Date('2023-12-25T12:00:00.000Z'));
    });

    it('creates instance from empty/undefined payload', () => {
      const session1 = UserSession.fromJSON();
      const session2 = UserSession.fromJSON(undefined);

      expect(session1.userId).toBeNull();
      expect(session2.userId).toBeNull();
    });

    it('handles null expiresAt correctly', () => {
      const session = UserSession.fromJSON({
        accessToken: 'token',
        expiresAt: null
      });

      expect(session.expiresAt).toBeNull();
    });
  });

  describe('toJSON', () => {
    it('serializes all fields correctly', () => {
      const json = testSession.toJSON();

      expect(json.userId).toBe('user123');
      expect(json.provider).toBe('google');
      expect(json.accessToken).toBe('access-token-123');
      expect(json.refreshToken).toBe('refresh-token-123');
      expect(json.expiresAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });

    it('serializes null values correctly', () => {
      const session = new UserSession();
      const json = session.toJSON();

      expect(json.userId).toBeNull();
      expect(json.provider).toBeNull();
      expect(json.accessToken).toBeNull();
      expect(json.refreshToken).toBeNull();
      expect(json.expiresAt).toBeNull();
    });

    it('roundtrips correctly', () => {
      const json = testSession.toJSON();
      const restored = UserSession.fromJSON(json);

      expect(restored.userId).toBe(testSession.userId);
      expect(restored.provider).toBe(testSession.provider);
      expect(restored.accessToken).toBe(testSession.accessToken);
      expect(restored.refreshToken).toBe(testSession.refreshToken);
      expect(restored.expiresAt?.getTime()).toBe(testSession.expiresAt?.getTime());
    });
  });

  describe('isAuthenticated', () => {
    it('returns true for valid authenticated session', () => {
      expect(testSession.isAuthenticated()).toBe(true);
    });

    it('returns false when no access token', () => {
      const session = new UserSession({
        userId: 'user123',
        expiresAt: new Date(Date.now() + 1000).toISOString()
      });

      expect(session.isAuthenticated()).toBe(false);
    });

    it('returns false when access token is null', () => {
      const session = new UserSession({
        accessToken: null,
        expiresAt: new Date(Date.now() + 1000).toISOString()
      });

      expect(session.isAuthenticated()).toBe(false);
    });

    it('returns false when token is expired', () => {
      const session = new UserSession({
        accessToken: 'valid-token',
        expiresAt: new Date(Date.now() - 1000).toISOString() // 1 second ago
      });

      expect(session.isAuthenticated()).toBe(false);
    });

    it('returns true when no expiration date is set', () => {
      const session = new UserSession({
        accessToken: 'valid-token'
        // No expiresAt
      });

      expect(session.isAuthenticated()).toBe(true);
    });

    it('handles edge case of exactly expired token', () => {
      vi.useFakeTimers();
      const now = Date.now();
      vi.setSystemTime(now);

      const session = new UserSession({
        accessToken: 'valid-token',
        expiresAt: new Date(now).toISOString() // exactly now
      });

      // Token that expires exactly at current time is still valid (< not <=)
      expect(session.isAuthenticated()).toBe(true);

      // But 1ms later it should be expired
      vi.setSystemTime(now + 1);
      expect(session.isAuthenticated()).toBe(false);

      vi.useRealTimers();
    });
  });

  describe('clear', () => {
    it('resets all session fields to null', () => {
      expect(testSession.isAuthenticated()).toBe(true);

      testSession.clear();

      expect(testSession.userId).toBeNull();
      expect(testSession.provider).toBeNull();
      expect(testSession.accessToken).toBeNull();
      expect(testSession.refreshToken).toBeNull();
      expect(testSession.expiresAt).toBeNull();
      expect(testSession.isAuthenticated()).toBe(false);
    });

    it('can be called multiple times safely', () => {
      testSession.clear();
      testSession.clear(); // Should not throw

      expect(testSession.isAuthenticated()).toBe(false);
    });

    it('clears already empty session without issues', () => {
      const emptySession = new UserSession();
      emptySession.clear();

      expect(emptySession.isAuthenticated()).toBe(false);
    });
  });

  describe('provider support', () => {
    it('supports different provider types', () => {
      const providers = ['google', 'github', 'microsoft', 'custom'];

      providers.forEach(provider => {
        const session = new UserSession({
          provider,
          accessToken: 'token'
        });

        expect(session.provider).toBe(provider);
        expect(session.isAuthenticated()).toBe(true);
      });
    });
  });

  describe('token lifecycle', () => {
    it('handles token refresh scenario', () => {
      const session = new UserSession({
        userId: 'user123',
        provider: 'google',
        accessToken: 'old-token',
        refreshToken: 'refresh-token',
        expiresAt: new Date(Date.now() + 1000).toISOString()
      });

      // Simulate token refresh
      session.accessToken = 'new-token';
      session.expiresAt = new Date(Date.now() + 3600000); // 1 hour from now

      expect(session.accessToken).toBe('new-token');
      expect(session.isAuthenticated()).toBe(true);
    });
  });
});
