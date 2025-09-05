import { describe, it, expect, vi, beforeEach } from 'vitest';
import { executeEndpoint } from '../query';

// Mock gapi globally for API tests
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

describe('executeEndpoint', () => {
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

  it('returns 400 when query missing', async () => {
    const res = await executeEndpoint({ authToken: 'token' });
    expect(res.statusCode).toBe(400);
    expect(res.body.status).toBe('error');
  });

  it('returns 401 for invalid token', async () => {
    const res = await executeEndpoint({ query: 'SELECT 1', authToken: 'invalid-token' });
    expect(res.statusCode).toBe(401);
    expect(res.body.status).toBe('error');
  });

  it('returns success for valid query', async () => {
    // Mock BigQuery API response
    const mockResponse = {
      result: {
        jobReference: { jobId: 'bigquery-job-123' },
        schema: {
          fields: [
            { name: 'result', type: 'INTEGER' }
          ]
        },
        rows: [
          { f: [{ v: '1' }] }
        ]
      }
    };

    mockGapi.client.bigquery.jobs.query.mockResolvedValue(mockResponse);

    const res = await executeEndpoint({ query: 'SELECT 1', authToken: 'valid-token' });
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('success');
    expect(Array.isArray(res.body.results)).toBe(true);
    expect(res.body.results).toEqual([{ result: 1 }]);
    expect(res.body.jobId).toBe('bigquery-job-123');
  });
});
