export interface UserSessionPayload {
  userId?: string | null;
  provider?: string | null;
  accessToken?: string | null;
  refreshToken?: string | null;
  expiresAt?: string | null;
}

export class UserSession {
  userId?: string | null;
  provider?: string | null;
  accessToken?: string | null;
  refreshToken?: string | null;
  expiresAt?: Date | null;

  constructor(payload?: UserSessionPayload) {
    this.userId = payload?.userId ?? null;
    this.provider = payload?.provider ?? null;
    this.accessToken = payload?.accessToken ?? null;
    this.refreshToken = payload?.refreshToken ?? null;
    this.expiresAt = payload?.expiresAt ? new Date(payload.expiresAt) : null;
  }

  static fromJSON(json?: UserSessionPayload) {
    return new UserSession(json);
  }

  toJSON(): UserSessionPayload {
    return {
      userId: this.userId ?? null,
      provider: this.provider ?? null,
      accessToken: this.accessToken ?? null,
      refreshToken: this.refreshToken ?? null,
      expiresAt: this.expiresAt ? this.expiresAt.toISOString() : null,
    };
  }

  isAuthenticated(): boolean {
    if (!this.accessToken) return false;
    if (this.expiresAt && this.expiresAt.getTime() < Date.now()) return false;
    return true;
  }

  clear() {
    this.userId = null;
    this.provider = null;
    this.accessToken = null;
    this.refreshToken = null;
    this.expiresAt = null;
  }
}

export default UserSession;
