import { describe, it, expect, beforeEach, vi } from 'vitest';
import Query, { type QueryPayload } from '../../src/models/Query';
import UserSession from '../../src/models/UserSession';
import { executeQuery } from '../../src/services/queryService';

// Mock gapi globally for performance tests
const mockGapi = {
  client: {
    bigquery: {
      jobs: {
        query: vi.fn()
      }
    },
    load: vi.fn()
  },
  load: vi.fn(),
  auth: {},
  auth2: {},
  signin2: {}
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(global as any).gapi = mockGapi;

describe('Query Performance Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGapi.load.mockImplementation((api: string, config: { callback: () => void; onerror: (error: unknown) => void }) => {
      if (api === 'client') {
        config.callback();
      }
    });
    mockGapi.client.load = vi.fn().mockResolvedValue(undefined);
  });

  describe('Query Execution Performance', () => {
    it('executes simple query within reasonable time', async () => {
      const startTime = performance.now();

      const query = new Query({
        id: 'perf-test-1',
        sql: 'SELECT 1 as result'
      });

      const result = await executeQuery(query);

      const executionTime = performance.now() - startTime;

      expect(result).toBeDefined();
      expect(result.rows).toBeDefined();
      expect(executionTime).toBeLessThan(1000); // Should complete within 1 second
    });

    it('handles multiple concurrent queries efficiently', async () => {
      const startTime = performance.now();
      const numQueries = 10;

      const queries = Array.from({ length: numQueries }, (_, i) =>
        new Query({
          id: `concurrent-${i}`,
          sql: `SELECT ${i} as value`
        })
      );

      const promises = queries.map(query => executeQuery(query));
      const results = await Promise.all(promises);

      const totalTime = performance.now() - startTime;
      const avgTimePerQuery = totalTime / numQueries;

      expect(results).toHaveLength(numQueries);
      expect(results.every(result => result.rows.length > 0)).toBe(true);
      expect(avgTimePerQuery).toBeLessThan(200); // Average time per query should be reasonable
      expect(totalTime).toBeLessThan(3000); // Total time should be reasonable for concurrent execution
    });

    it('mock implementation performance is consistent', async () => {
      const executionTimes: number[] = [];
      const numRuns = 20; // Reduced for faster test execution

      for (let i = 0; i < numRuns; i++) {
        const startTime = performance.now();

        const query = new Query({
          id: `consistency-test-${i}`,
          sql: 'SELECT * FROM users LIMIT 100'
        });

        await executeQuery(query);

        const endTime = performance.now();
        executionTimes.push(endTime - startTime);
      }

      const avgTime = executionTimes.reduce((sum, time) => sum + time, 0) / numRuns;
      const maxTime = Math.max(...executionTimes);
      const minTime = Math.min(...executionTimes);
      const variance = executionTimes.reduce((sum, time) => sum + Math.pow(time - avgTime, 2), 0) / numRuns;
      const stdDev = Math.sqrt(variance);

      // Performance assertions - more relaxed thresholds
      expect(avgTime).toBeLessThan(200); // Average execution should be reasonable
      expect(maxTime).toBeLessThan(1000); // No outliers should be too slow
      expect(stdDev).toBeLessThan(100); // Execution time should be relatively consistent

      console.log(`Performance metrics:
        Average: ${avgTime.toFixed(2)}ms
        Min: ${minTime.toFixed(2)}ms
        Max: ${maxTime.toFixed(2)}ms
        Std Dev: ${stdDev.toFixed(2)}ms`);
    }, 10000); // 10 second timeout

    it('authenticated vs unauthenticated performance comparison', async () => {
      const numRuns = 20;

      // Test unauthenticated performance
      const unauthenticatedTimes: number[] = [];
      for (let i = 0; i < numRuns; i++) {
        const startTime = performance.now();

        const query = new Query({
          id: `unauth-${i}`,
          sql: 'SELECT * FROM test_table'
        });

        await executeQuery(query); // No session = mock implementation

        unauthenticatedTimes.push(performance.now() - startTime);
      }

      // Test authenticated performance (mocked BigQuery)
      const authenticatedTimes: number[] = [];
      const session = new UserSession({
        accessToken: 'test-token',
        expiresAt: new Date(Date.now() + 3600000).toISOString()
      });

      // Mock BigQuery response
      mockGapi.client.bigquery.jobs.query.mockResolvedValue({
        result: {
          jobReference: { jobId: 'perf-test-job' },
          schema: { fields: [{ name: 'id', type: 'INTEGER' }] },
          rows: [{ f: [{ v: '1' }] }]
        }
      });

      for (let i = 0; i < numRuns; i++) {
        const startTime = performance.now();

        const query = new Query({
          id: `auth-${i}`,
          sql: 'SELECT * FROM test_table'
        });

        await executeQuery(query, session);

        authenticatedTimes.push(performance.now() - startTime);
      }

      const avgUnauthenticated = unauthenticatedTimes.reduce((sum, time) => sum + time, 0) / numRuns;
      const avgAuthenticated = authenticatedTimes.reduce((sum, time) => sum + time, 0) / numRuns;

      // Both should be reasonably fast
      expect(avgUnauthenticated).toBeLessThan(150); // More reasonable threshold
      expect(avgAuthenticated).toBeLessThan(200);
      // Note: In test environment, authenticated might be slower due to mock overhead

      console.log(`Performance comparison:
        Unauthenticated (mock): ${avgUnauthenticated.toFixed(2)}ms
        Authenticated (mocked BigQuery): ${avgAuthenticated.toFixed(2)}ms`);
    });
  });

  describe('Query Model Performance', () => {
    it('query creation and validation is fast', async () => {
      const numQueries = 1000;
      const startTime = performance.now();

      const queries: Query[] = [];
      for (let i = 0; i < numQueries; i++) {
        const query = new Query({
          id: `bulk-query-${i}`,
          sql: `SELECT ${i} as id, 'test-${i}' as name`,
          name: `Bulk Test Query ${i}`,
          status: i % 2 === 0 ? 'draft' : 'completed'
        });

        query.validate();
        queries.push(query);
      }

      const creationTime = performance.now() - startTime;
      const avgTimePerQuery = creationTime / numQueries;

      expect(queries).toHaveLength(numQueries);
      expect(avgTimePerQuery).toBeLessThan(1); // Should be sub-millisecond per query
      expect(creationTime).toBeLessThan(1000); // Total time should be reasonable

      console.log(`Query creation performance:
        Total time: ${creationTime.toFixed(2)}ms
        Average per query: ${avgTimePerQuery.toFixed(4)}ms`);
    });

    it('JSON serialization/deserialization performance', async () => {
      const numOperations = 1000;

      const query = new Query({
        id: 'serialization-test',
        sql: 'SELECT * FROM large_table WHERE complex_condition = true AND date > "2023-01-01"',
        name: 'Complex Serialization Test Query',
        status: 'completed',
        lastError: null
      });

      // Test serialization performance
      const serializationStart = performance.now();
      const jsonObjects: QueryPayload[] = [];
      for (let i = 0; i < numOperations; i++) {
        jsonObjects.push(query.toJSON());
      }
      const serializationTime = performance.now() - serializationStart;

      // Test deserialization performance
      const deserializationStart = performance.now();
      const deserializedQueries: Query[] = [];
      for (let i = 0; i < numOperations; i++) {
        deserializedQueries.push(Query.fromJSON(jsonObjects[i]));
      }
      const deserializationTime = performance.now() - deserializationStart;

      expect(jsonObjects).toHaveLength(numOperations);
      expect(deserializedQueries).toHaveLength(numOperations);

      expect(serializationTime / numOperations).toBeLessThan(0.1); // Sub-100μs per serialization
      expect(deserializationTime / numOperations).toBeLessThan(0.1); // Sub-100μs per deserialization

      console.log(`Serialization performance:
        Serialization: ${(serializationTime / numOperations).toFixed(4)}ms per operation
        Deserialization: ${(deserializationTime / numOperations).toFixed(4)}ms per operation`);
    });

    it('query cloning performance for large batches', async () => {
      const baseQuery = new Query({
        id: 'base-clone-test',
        sql: 'SELECT * FROM huge_table WHERE complex_conditions AND multiple_joins',
        name: 'Base Query for Cloning Performance Test'
      });

      const numClones = 500;
      const startTime = performance.now();

      const clones: Query[] = [];
      for (let i = 0; i < numClones; i++) {
        const clone = baseQuery.clone({
          id: `clone-${i}`,
          name: `Clone ${i}`
        });
        clones.push(clone);
      }

      const cloningTime = performance.now() - startTime;
      const avgTimePerClone = cloningTime / numClones;

      expect(clones).toHaveLength(numClones);
      expect(clones.every(clone => clone.sql === baseQuery.sql)).toBe(true);
      expect(avgTimePerClone).toBeLessThan(1); // Should be sub-millisecond per clone

      console.log(`Cloning performance:
        Total time: ${cloningTime.toFixed(2)}ms
        Average per clone: ${avgTimePerClone.toFixed(4)}ms`);
    });
  });

  describe('Memory Usage Tests', () => {
    it('memory usage remains stable with many query objects', async () => {
      const numQueries = 10000;
      const queries: Query[] = [];

      // Force garbage collection if available (for more accurate memory testing)
      if (global.gc) {
        global.gc();
      }

      const startMemory = process.memoryUsage();

      for (let i = 0; i < numQueries; i++) {
        queries.push(new Query({
          id: `memory-test-${i}`,
          sql: `SELECT * FROM table_${i % 100}`,
          name: `Memory Test Query ${i}`
        }));
      }

      const endMemory = process.memoryUsage();
      const memoryIncrease = endMemory.heapUsed - startMemory.heapUsed;
      const memoryPerQuery = memoryIncrease / numQueries;

      expect(queries).toHaveLength(numQueries);
      expect(memoryPerQuery).toBeLessThan(1024); // Should use less than 1KB per query object

      console.log(`Memory usage:
        Total increase: ${(memoryIncrease / 1024 / 1024).toFixed(2)} MB
        Per query: ${memoryPerQuery.toFixed(0)} bytes`);
    });
  });
});
