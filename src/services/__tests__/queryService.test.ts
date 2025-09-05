import { describe, it, expect, vi, beforeEach } from 'vitest';
import Query from '../../models/Query';
import UserSession from '../../models/UserSession';
import { executeQuery } from '../queryService';

// Mock gapi globally
const mockGapi = {
  client: {
    bigquery: {
      jobs: {
        query: vi.fn()
      }
    },
    load: vi.fn()
  },
  load: vi.fn()
};

// Define global gapi mock
declare global {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  var gapi: any;
}

global.gapi = mockGapi;

describe('queryService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset gapi mocks
    mockGapi.load.mockImplementation((api: string, config: { callback: () => void; onerror: (error: unknown) => void }) => {
      if (api === 'client') {
        // Simulate successful client load
        config.callback();
      }
    });
    mockGapi.client.load = vi.fn().mockResolvedValue(undefined);
  });

  it('executes query with mock implementation when no session provided', async () => {
    const q = new Query({ id: 't1', sql: 'SELECT 1 as one' });
    const res = await executeQuery(q);
    expect(res.rows.length).toBeGreaterThan(0);
    expect(res.schema.some((s) => s.name === 'raw_sql')).toBeTruthy();
    expect(res.jobId).toContain('local-');
  });

  it('executes query with mock implementation when session is unauthenticated', async () => {
    const q = new Query({ id: 't2', sql: 'SELECT 1' });
    const s = new UserSession({ accessToken: null });
    const res = await executeQuery(q, s);
    expect(res.rows.length).toBeGreaterThan(0);
    expect(res.jobId).toContain('local-');
  });

  it('uses BigQuery API when session is authenticated', async () => {
    // Mock authenticated session
    const s = new UserSession({
      accessToken: 'valid-token',
      expiresAt: new Date(Date.now() + 3600000).toISOString() // 1 hour from now
    });

    // Mock BigQuery API response
    const mockResponse = {
      result: {
        jobReference: { jobId: 'bigquery-job-123' },
        schema: {
          fields: [
            { name: 'id', type: 'INTEGER' },
            { name: 'name', type: 'STRING' }
          ]
        },
        rows: [
          { f: [{ v: '1' }, { v: 'test' }] }
        ]
      }
    };

    mockGapi.client.bigquery.jobs.query.mockResolvedValue(mockResponse);

    const q = new Query({ id: 't3', sql: 'SELECT 1 as id, "test" as name' });
    const res = await executeQuery(q, s);

    expect(mockGapi.client.bigquery.jobs.query).toHaveBeenCalledWith({
      projectId: expect.any(String),
      resource: {
        query: 'SELECT 1 as id, "test" as name',
        useLegacySql: false,
        maxResults: 1000,
        timeoutMs: 30000
      }
    });

    expect(res.jobId).toBe('bigquery-job-123');
    expect(res.rows).toEqual([{ id: 1, name: 'test' }]);
    expect(res.schema).toEqual([
      { name: 'id', type: 'INTEGER' },
      { name: 'name', type: 'STRING' }
    ]);
  });

  it('handles BigQuery API errors gracefully', async () => {
    const s = new UserSession({
      accessToken: 'valid-token',
      expiresAt: new Date(Date.now() + 3600000).toISOString()
    });

    // Mock BigQuery API error
    const mockError = {
      result: {
        error: {
          message: 'Invalid query syntax'
        }
      }
    };

    mockGapi.client.bigquery.jobs.query.mockRejectedValue(mockError);

    const q = new Query({ id: 't4', sql: 'INVALID SQL' });

    await expect(executeQuery(q, s)).rejects.toThrow('BigQuery execution failed: Invalid query syntax');
  });

  it('returns mock rows for "from numbers" query pattern', async () => {
    const q = new Query({ id: 't5', sql: 'SELECT * FROM numbers' });
    const res = await executeQuery(q);

    expect(res.rows).toEqual([
      { n: 1 },
      { n: 2 },
      { n: 3 }
    ]);
    expect(res.schema.some((s) => s.name === 'n')).toBeTruthy();
  });
});
