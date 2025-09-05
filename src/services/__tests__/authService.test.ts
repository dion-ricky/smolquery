import { describe, it, expect, beforeEach, vi } from 'vitest';
import { signInWithToken, signOut, getSession, signInWithGoogle, signOutFromGoogle, isSignedInWithGoogle, getAuthToken } from '../authService';

// Mock Google API
const mockGoogleUser = {
  isSignedIn: vi.fn(),
  getAuthResponse: vi.fn(),
  getBasicProfile: vi.fn()
};

const mockAuthInstance = {
  signIn: vi.fn(),
  signOut: vi.fn()
};

// Global gapi mock
global.gapi = {
  load: vi.fn(),
  auth2: {
    init: vi.fn(),
    getAuthInstance: vi.fn()
  }
};

// Type definitions for test environment
interface LocalStorageMock {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
  clear: () => void;
}

interface GlobalWithStorage {
  localStorage: LocalStorageMock;
}

// Provide a simple in-memory localStorage shim for tests when running in Node
// Force override localStorage even if it exists to ensure our mock is used
(globalThis as GlobalWithStorage).localStorage = (function (): LocalStorageMock {
  let store: Record<string, string> = {};
  return {
    getItem(key: string) {
      return store[key] ?? null;
    },
    setItem(key: string, value: string) {
      store[key] = String(value);
    },
    removeItem(key: string) {
      delete store[key];
    },
    clear() {
      store = {};
    },
  };
})();

describe('authService', () => {
  beforeEach(() => {
    (globalThis as GlobalWithStorage).localStorage.clear();
    signOut();

    // Reset mocks
    vi.clearAllMocks();

    // Setup default mock behaviors
    global.gapi.load.mockImplementation((_api: string, options: { callback: () => void }) => {
      options.callback();
    });
    global.gapi.auth2.init.mockResolvedValue(undefined);
    global.gapi.auth2.getAuthInstance.mockReturnValue(mockAuthInstance);
  });

  describe('basic authentication', () => {
    it('signs in with token and persists session', async () => {
      const s = await signInWithToken({
        provider: 'test',
        userId: 'u1',
        accessToken: 'abc',
        expiresIn: 60,
      });
      expect(s.isAuthenticated()).toBeTruthy();

      const storedRaw = (globalThis as GlobalWithStorage).localStorage.getItem('smolquery.session');
      expect(storedRaw).toBeTruthy();

      const loaded = getSession();
      expect(loaded.accessToken).toBe('abc');
    });

    it('signs out and clears session', async () => {
      await signInWithToken({ accessToken: 'x' });
      expect(getSession().isAuthenticated()).toBeTruthy();
      signOut();
      expect(getSession().isAuthenticated()).toBeFalsy();
      const storedRaw = (globalThis as GlobalWithStorage).localStorage.getItem('smolquery.session');
      expect(storedRaw).toBeNull();
    });
  });

  describe('Google OAuth integration', () => {
    it('successfully signs in with Google', async () => {
      // Setup Google user mock
      mockGoogleUser.isSignedIn.mockReturnValue(true);
      mockGoogleUser.getAuthResponse.mockReturnValue({
        access_token: 'google-token',
        expires_in: 3600
      });
      mockGoogleUser.getBasicProfile.mockReturnValue({
        getId: () => 'google-user-123'
      });
      mockAuthInstance.signIn.mockResolvedValue(mockGoogleUser);

      const session = await signInWithGoogle();

      expect(session).toBeTruthy();
      expect(session?.provider).toBe('google');
      expect(session?.userId).toBe('google-user-123');
      expect(session?.accessToken).toBe('google-token');
      expect(global.gapi.load).toHaveBeenCalledWith('auth2', expect.any(Object));
      expect(global.gapi.auth2.init).toHaveBeenCalled();
      expect(mockAuthInstance.signIn).toHaveBeenCalled();
    });

    it('returns null when Google sign-in is cancelled', async () => {
      mockGoogleUser.isSignedIn.mockReturnValue(false);
      mockAuthInstance.signIn.mockResolvedValue(mockGoogleUser);

      const session = await signInWithGoogle();

      expect(session).toBeNull();
    });

    it('handles Google API initialization failure', async () => {
      global.gapi.auth2.init.mockRejectedValue(new Error('Init failed'));

      const session = await signInWithGoogle();

      expect(session).toBeNull();
    });

    it('signs out from Google and clears local session', async () => {
      // First sign in with Google
      mockGoogleUser.isSignedIn.mockReturnValue(true);
      mockGoogleUser.getAuthResponse.mockReturnValue({
        access_token: 'google-token',
        expires_in: 3600
      });
      mockGoogleUser.getBasicProfile.mockReturnValue({
        getId: () => 'google-user-123'
      });
      mockAuthInstance.signIn.mockResolvedValue(mockGoogleUser);

      await signInWithGoogle();
      expect(getSession().isAuthenticated()).toBeTruthy();

      // Then sign out
      await signOutFromGoogle();

      expect(getSession().isAuthenticated()).toBeFalsy();
      expect(mockAuthInstance.signOut).toHaveBeenCalled();
    });

    it('checks if user is signed in with Google', async () => {
      // Sign in with Google
      mockGoogleUser.isSignedIn.mockReturnValue(true);
      mockGoogleUser.getAuthResponse.mockReturnValue({
        access_token: 'google-token',
        expires_in: 3600
      });
      mockGoogleUser.getBasicProfile.mockReturnValue({
        getId: () => 'google-user-123'
      });
      mockAuthInstance.signIn.mockResolvedValue(mockGoogleUser);

      await signInWithGoogle();
      expect(isSignedInWithGoogle()).toBeTruthy();

      // Sign in with non-Google provider
      await signInWithToken({ provider: 'other', accessToken: 'other-token' });
      expect(isSignedInWithGoogle()).toBeFalsy();

      // Sign out completely
      signOut();
      expect(isSignedInWithGoogle()).toBeFalsy();
    });

    it('gets auth token from current session', async () => {
      // No session initially
      expect(getAuthToken()).toBeNull();

      // After signing in
      await signInWithToken({ accessToken: 'test-token' });
      expect(getAuthToken()).toBe('test-token');

      // After signing out
      signOut();
      expect(getAuthToken()).toBeNull();
    });
  });
});
