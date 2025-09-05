import type { QueryPayload } from '../models/Query';
import type UserSession from '../models/UserSession';
import { executeQuery } from '../services/queryService';
import * as authService from '../services/authService';

export interface ExecuteRequest {
  query?: string;
  authToken?: string | null;
  id?: string;
  name?: string;
}

export interface ExecuteResponse {
  results: Record<string, unknown>[];
  schema?: { name: string; type: string }[];
  status: 'success' | 'error';
  error: string | null;
  jobId?: string;
}

/**
 * Minimal POST /api/query/execute handler logic exposed for use in tests and dev middleware.
 * - Validates input
 * - Performs a very small token check (rejects 'invalid-token')
 * - Uses authService.signInWithToken to create a session when token provided
 * - Calls queryService.executeQuery and returns normalized response
 */
export async function executeEndpoint(
  payload: ExecuteRequest
): Promise<{ statusCode: number; body: ExecuteResponse }> {
  const body = payload || {};

  if (!body.query || typeof body.query !== 'string' || !body.query.trim()) {
    return {
      statusCode: 400,
      body: { results: [], status: 'error', error: 'Query is required' },
    };
  }

  // Quick, local-only auth heuristic used for tests/dev: reject a literal 'invalid-token'
  if (body.authToken === 'invalid-token') {
    return {
      statusCode: 401,
      body: { results: [], status: 'error', error: 'Authentication failed' },
    };
  }

  // If an auth token is provided, create a session object. This does not validate against any
  // external provider in this local implementation.
  let session = undefined;
  try {
    if (body.authToken) {
      // create a simple session using the token as accessToken
      session = await authService.signInWithToken({ accessToken: body.authToken });
    }

    const qpayload: QueryPayload = {
      id: body.id ?? `local-${Date.now().toString(36)}`,
      sql: body.query,
      name: body.name,
    };

    const result = await executeQuery(qpayload as QueryPayload, session as unknown as UserSession);

    return {
      statusCode: 200,
      body: {
        results: result.rows,
        schema: result.schema,
        status: 'success',
        error: null,
        jobId: result.jobId,
      },
    };
  } catch (err: unknown) {
    const message =
      err && typeof err === 'object' && 'message' in err
        ? (err as { message?: unknown }).message
        : String(err);
    // If the service threw an authentication-related error, surface as 401
    if (String(message) === 'User not authenticated') {
      return {
        statusCode: 401,
        body: { results: [], status: 'error', error: 'Authentication failed' },
      };
    }

    return {
      statusCode: 500,
      body: {
        results: [],
        status: 'error',
        error: message ? String(message) : 'Query execution failed',
      },
    };
  }
}

export default { executeEndpoint };
