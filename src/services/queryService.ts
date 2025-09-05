import Query from '../models/Query';
import type { QueryPayload } from '../models/Query';
import UserSession from '../models/UserSession';

/// <reference types="gapi" />
/// <reference types="gapi.client" />
/// <reference types="gapi.client.bigquery-v2" />

// Define types for globals to ensure TypeScript recognizes gapi
declare global {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  var gapi: any;
}

// Simple interfaces for BigQuery API responses
interface BigQueryField {
  name?: string;
  type?: string;
}

interface BigQueryTableCell {
  v?: unknown;
}

interface BigQueryTableRow {
  f?: BigQueryTableCell[];
}

interface BigQueryQueryRequest {
  query: string;
  useLegacySql?: boolean;
  maxResults?: number;
  timeoutMs?: number;
}

export interface QueryResult {
  jobId?: string;
  rows: Record<string, unknown>[];
  schema: { name: string; type: string }[];
}

function isSelect(sql: string) {
  return /^\s*select\b/i.test(sql);
}

function fakeSchemaFromRows(rows: Record<string, unknown>[]) {
  if (!rows || rows.length === 0) return [];
  const keys = Object.keys(rows[0] as Record<string, unknown>);
  return keys.map((k) => ({ name: k, type: typeof (rows[0] as Record<string, unknown>)[k] }));
}

/**
 * Initialize BigQuery API client if not already initialized
 */
async function initializeBigQueryAPI(): Promise<void> {
  if (typeof gapi === 'undefined') {
    throw new Error('Google API client not loaded. Include https://apis.google.com/js/api.js');
  }

  // Load the BigQuery API if not already loaded
  if (!gapi.client.bigquery) {
    await new Promise<void>((resolve, reject) => {
      gapi.load('client', {
        callback: async () => {
          try {
            await gapi.client.load('bigquery', 'v2');
            resolve();
          } catch (error) {
            reject(error);
          }
        },
        onerror: reject
      });
    });
  }
}

/**
 * Convert BigQuery table field to our schema format
 */
function convertBigQuerySchema(fields: BigQueryField[] = []): { name: string; type: string }[] {
  return fields.map(field => ({
    name: field.name || 'unknown',
    type: field.type || 'unknown'
  }));
}

/**
 * Convert BigQuery table rows to our format
 */
function convertBigQueryRows(
  rows: BigQueryTableRow[] = [],
  schema: BigQueryField[] = []
): Record<string, unknown>[] {
  return rows.map(row => {
    const convertedRow: Record<string, unknown> = {};
    const values = row.f || [];

    schema.forEach((field, index) => {
      const fieldName = field.name || `field_${index}`;
      const value = values[index]?.v;

      // Convert BigQuery value based on type
      let convertedValue: unknown = value;
      if (value !== null && value !== undefined) {
        switch (field.type) {
          case 'INTEGER':
          case 'INT64':
            convertedValue = value ? parseInt(String(value), 10) : null;
            break;
          case 'FLOAT':
          case 'FLOAT64':
            convertedValue = value ? parseFloat(String(value)) : null;
            break;
          case 'BOOLEAN':
          case 'BOOL':
            convertedValue = value === 'true' || value === true;
            break;
          case 'TIMESTAMP':
            convertedValue = value ? new Date(Number(value) * 1000).toISOString() : null;
            break;
          default:
            convertedValue = value;
        }
      }

      convertedRow[fieldName] = convertedValue;
    });

    return convertedRow;
  });
}/**
 * Execute query using BigQuery API or fallback to mock for development
 */
async function executeBigQueryQuery(
  sql: string,
  projectId: string,
  _session: UserSession
): Promise<{ jobId: string; rows: Record<string, unknown>[]; schema: { name: string; type: string }[] }> {
  await initializeBigQueryAPI();

  // Create a query job
  const queryRequest: BigQueryQueryRequest = {
    query: sql,
    useLegacySql: false,
    maxResults: 1000, // Limit results for UI performance
    timeoutMs: 30000   // 30 second timeout
  };

  try {
    // Execute the query
    const response = await gapi.client.bigquery.jobs.query({
      projectId: projectId,
      resource: queryRequest
    });

    const queryResult = response.result;

    if (!queryResult) {
      throw new Error('No result returned from BigQuery');
    }

    const jobId = queryResult.jobReference?.jobId || 'unknown';
    const schema = convertBigQuerySchema(queryResult.schema?.fields);
    const rows = convertBigQueryRows(queryResult.rows, queryResult.schema?.fields);

    return { jobId, rows, schema };
  } catch (error: unknown) {
    console.error('BigQuery API error:', error);

    // Extract meaningful error message
    let errorMessage = 'Unknown BigQuery error';
    if (error && typeof error === 'object') {
      if ('result' in error && error.result && typeof error.result === 'object' && 'error' in error.result) {
        const apiError = (error.result as Record<string, unknown>).error;
        errorMessage = (apiError as Record<string, unknown>)?.message as string || (apiError as Record<string, unknown>)?.code as string || errorMessage;
      } else if ('message' in error) {
        errorMessage = String((error as { message: unknown }).message);
      }
    }

    throw new Error(`BigQuery execution failed: ${errorMessage}`);
  }
}

/**
 * Get BigQuery project ID from environment or user session
 */
function getBigQueryProjectId(_session?: UserSession): string {
  // Try to get from environment first
  const envProjectId = import.meta.env.VITE_BIGQUERY_PROJECT_ID;
  if (envProjectId) {
    return envProjectId;
  }

  // For now, use a default project ID - in production this should be configured
  // TODO: Allow users to configure their project ID in settings
  return 'your-bigquery-project-id';
}

/**
 * Query execution service with BigQuery API integration.
 * - Validates the Query model
 * - Uses BigQuery API for authenticated sessions
 * - Falls back to mock for unauthenticated sessions or development
 * - Updates query status throughout execution
 */
export async function executeQuery(
  query: Query | QueryPayload,
  session?: UserSession
): Promise<QueryResult> {
  // Normalize Query
  const q = query instanceof Query ? query : Query.fromJSON(query as QueryPayload);
  q.validate();

  // Check authentication for BigQuery API
  const isAuthenticated = session?.isAuthenticated() ?? false;

  q.status = 'running';
  q.updatedAt = new Date();

  try {
    // Use BigQuery API if authenticated, otherwise use mock
    if (isAuthenticated && session) {
      const projectId = getBigQueryProjectId(session);
      const result = await executeBigQueryQuery(q.sql, projectId, session);

      q.status = 'completed';
      q.updatedAt = new Date();

      return result;
    } else {
      // Fallback to mock implementation for development/unauthenticated users
      console.log('Using mock implementation - user not authenticated or session missing');

      // Simulate execution delay
      await new Promise((res) => setTimeout(res, 100));

      // For non-SELECT statements we return an empty result set but mark completed
      if (!isSelect(q.sql)) {
        q.status = 'completed';
        q.updatedAt = new Date();
        return { jobId: `local-${q.id}`, rows: [], schema: [] };
      }

      // Very small SQL heuristics to produce mock rows
      // if SQL contains 'from numbers' return numeric rows
      if (/from\s+numbers/i.test(q.sql)) {
        const rows = Array.from({ length: 3 }, (_, i) => ({ n: i + 1 }));
        q.status = 'completed';
        q.updatedAt = new Date();
        return { jobId: `local-${q.id}`, rows, schema: fakeSchemaFromRows(rows) };
      }

      // default mock: single row with raw_sql field
      const rows = [{ raw_sql: q.sql.trim(), ranAt: new Date().toISOString() }];
      q.status = 'completed';
      q.updatedAt = new Date();
      return { jobId: `local-${q.id}`, rows, schema: fakeSchemaFromRows(rows) };
    }
  } catch (err: unknown) {
    const message =
      err && typeof err === 'object' && 'message' in err
        ? (err as { message?: unknown }).message
        : String(err);
    q.status = 'failed';
    q.lastError = message ? String(message) : String(err);
    q.updatedAt = new Date();
    throw err;
  }
}

export default { executeQuery };
