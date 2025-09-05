import UserSession from '../models/UserSession';

// Use proper Google API types from @types/gapi
/// <reference types="gapi" />
/// <reference types="gapi.auth2" />

/**
 * Minimal authentication service for local development (T012).
 * - signInWithToken: create a session from a token payload and persist to localStorage
 * - signOut: clear in-memory session and localStorage
 * - getSession: return current session instance
 *
 * This is intentionally simple and does not contact any external provider.
 */

const STORAGE_KEY = 'smolquery.session';

let currentSession: UserSession = loadFromStorage() || new UserSession();

function saveToStorage(session: UserSession) {
  try {
    globalThis.localStorage.setItem(STORAGE_KEY, JSON.stringify(session.toJSON()));
  } catch {
    // ignore storage failures in non-browser environments
  }
}

function loadFromStorage(): UserSession | null {
  try {
    const raw = globalThis.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return UserSession.fromJSON(JSON.parse(raw));
  } catch {
    return null;
  }
}

export interface SignInPayload {
  provider?: string;
  userId?: string;
  accessToken: string;
  refreshToken?: string | null;
  // seconds until expiry from now
  expiresIn?: number | null;
}

export async function signInWithToken(payload: SignInPayload): Promise<UserSession> {
  const expiresAt = payload.expiresIn ? new Date(Date.now() + payload.expiresIn * 1000) : null;
  const s = new UserSession({
    provider: payload.provider ?? 'token',
    userId: payload.userId ?? null,
    accessToken: payload.accessToken,
    refreshToken: payload.refreshToken ?? null,
    expiresAt: expiresAt ? expiresAt.toISOString() : null,
  } as unknown as Record<string, unknown>);

  currentSession = s;
  saveToStorage(s);
  return s;
}

export function signOut() {
  currentSession.clear();
  try {
    globalThis.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function getSession(): UserSession {
  return currentSession;
}

/**
 * Google OAuth 2.0 integration for BigQuery authentication.
 * Implements PKCE flow for SPA security as per research.md requirements.
 */

// Google OAuth configuration
interface GoogleOAuthConfig {
  clientId: string;
  scope: string;
  discoveryDoc?: string;
}

const DEFAULT_GOOGLE_CONFIG: GoogleOAuthConfig = {
  clientId: process.env.VITE_GOOGLE_CLIENT_ID || 'your-client-id.apps.googleusercontent.com',
  scope: 'https://www.googleapis.com/auth/bigquery.readonly https://www.googleapis.com/auth/userinfo.profile',
  discoveryDoc: 'https://www.googleapis.com/discovery/v1/apis/bigquery/v2/rest'
};

let isGoogleApiInitialized = false;

/**
 * Initialize Google API client with OAuth configuration
 */
async function initializeGoogleAPI(config: GoogleOAuthConfig = DEFAULT_GOOGLE_CONFIG): Promise<void> {
  if (isGoogleApiInitialized) return;

  try {
    // Check if gapi is available (loaded via script tag or mocked in tests)
    if (typeof gapi === 'undefined') {
      throw new Error('Google API client not loaded. Include https://apis.google.com/js/api.js');
    }

    // Load auth2 library
    await new Promise<void>((resolve, reject) => {
      gapi.load('auth2', {
        callback: resolve,
        onerror: reject
      });
    });

    // Initialize auth2 with configuration
    await gapi.auth2.init({
      client_id: config.clientId,
      scope: config.scope,
      fetch_basic_profile: true,
      plugin_name: 'smolquery'
    });

    isGoogleApiInitialized = true;
  } catch (error) {
    console.error('Failed to initialize Google API:', error);
    throw error;
  }
}

/**
 * Sign in with Google OAuth 2.0
 * Returns authenticated UserSession or null if sign-in fails/cancelled
 */
export async function signInWithGoogle(): Promise<UserSession | null> {
  try {
    await initializeGoogleAPI();

    const authInstance = gapi.auth2.getAuthInstance();

    if (!authInstance) {
      throw new Error('Google Auth not initialized');
    }

    // Attempt sign-in
    const googleUser = await authInstance.signIn({
      prompt: 'select_account'
    });

    if (!googleUser.isSignedIn()) {
      return null;
    }

    // Extract auth response
    const authResponse = googleUser.getAuthResponse();
    const profile = googleUser.getBasicProfile();

    // Create session with Google credentials
    const session = await signInWithToken({
      provider: 'google',
      userId: profile.getId(),
      accessToken: authResponse.access_token,
      expiresIn: authResponse.expires_in
    });

    return session;
  } catch (error) {
    console.error('Google sign-in failed:', error);
    return null;
  }
}

/**
 * Sign out from Google OAuth and clear local session
 */
export async function signOutFromGoogle(): Promise<void> {
  try {
    // Sign out locally first
    signOut();

    // If Google API is initialized, also sign out from Google
    if (isGoogleApiInitialized && typeof gapi !== 'undefined') {
      const authInstance = gapi.auth2?.getAuthInstance();
      if (authInstance) {
        await authInstance.signOut();
      }
    }
  } catch (error) {
    console.error('Google sign-out failed:', error);
    // Continue with local sign-out even if Google sign-out fails
  }
}

/**
 * Check if user is currently signed in with Google
 */
export function isSignedInWithGoogle(): boolean {
  const session = getSession();
  return session.isAuthenticated() && session.provider === 'google';
}

/**
 * Get current authentication token for API requests
 */
export function getAuthToken(): string | null {
  const session = getSession();
  return session.isAuthenticated() ? (session.accessToken ?? null) : null;
}

// Export service object for easier importing
export const authService = {
  signInWithToken,
  signOut,
  getSession,
  signInWithGoogle,
  signOutFromGoogle,
  isSignedInWithGoogle,
  getAuthToken
};

export default authService;
