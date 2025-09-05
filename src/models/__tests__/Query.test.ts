import { describe, it, expect, beforeEach } from 'vitest';
import Query, { type QueryStatus } from '../Query';

describe('Query model', () => {
  let testQuery: Query;

  beforeEach(() => {
    testQuery = new Query({
      id: 'test-query-1',
      sql: 'SELECT * FROM users',
      name: 'Test Query'
    });
  });

  describe('constructor', () => {
    it('constructs with required fields', () => {
      const q = new Query({ id: 'q1', sql: 'SELECT 1' });
      expect(q.id).toBe('q1');
      expect(q.sql).toBe('SELECT 1');
      expect(q.status).toBe('draft');
      expect(q.createdAt).toBeInstanceOf(Date);
      expect(q.updatedAt).toBeInstanceOf(Date);
    });

    it('constructs with all optional fields', () => {
      const createdAt = new Date('2023-01-01');
      const updatedAt = new Date('2023-01-02');
      const q = new Query({
        id: 'q2',
        sql: 'SELECT 2',
        name: 'Test Query',
        createdAt,
        updatedAt,
        status: 'completed',
        lastError: 'Some error'
      });

      expect(q.name).toBe('Test Query');
      expect(q.createdAt).toBe(createdAt);
      expect(q.updatedAt).toBe(updatedAt);
      expect(q.status).toBe('completed');
      expect(q.lastError).toBe('Some error');
    });

    it('sets default values when optional fields not provided', () => {
      const q = new Query({ id: 'q3', sql: 'SELECT 3' });
      expect(q.name).toBeUndefined();
      expect(q.status).toBe('draft');
      expect(q.lastError).toBeNull();
      expect(q.createdAt).toBeInstanceOf(Date);
      expect(q.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe('fromJSON', () => {
    it('creates instance from valid JSON payload', () => {
      const payload = {
        id: 'json-query',
        sql: 'SELECT * FROM table',
        name: 'JSON Query',
        createdAt: '2023-01-01T00:00:00.000Z',
        updatedAt: '2023-01-02T00:00:00.000Z',
        status: 'running' as QueryStatus,
        lastError: null
      };

      const q = Query.fromJSON(payload);
      expect(q.id).toBe('json-query');
      expect(q.sql).toBe('SELECT * FROM table');
      expect(q.name).toBe('JSON Query');
      expect(q.createdAt).toEqual(new Date('2023-01-01T00:00:00.000Z'));
      expect(q.updatedAt).toEqual(new Date('2023-01-02T00:00:00.000Z'));
      expect(q.status).toBe('running');
      expect(q.lastError).toBeNull();
    });

    it('throws TypeError for invalid payload', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(() => Query.fromJSON(null as any)).toThrow(TypeError);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(() => Query.fromJSON('invalid' as any)).toThrow(TypeError);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(() => Query.fromJSON(42 as any)).toThrow(TypeError);
    });

    it('throws TypeError for missing required fields', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(() => Query.fromJSON({ id: 'test' } as any)).toThrow(TypeError);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(() => Query.fromJSON({ sql: 'SELECT 1' } as any)).toThrow(TypeError);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(() => Query.fromJSON({ id: 123, sql: 'SELECT 1' } as any)).toThrow(TypeError);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(() => Query.fromJSON({ id: 'test', sql: 123 } as any)).toThrow(TypeError);
    });
  });

  describe('toJSON', () => {
    it('serializes all fields correctly', () => {
      const json = testQuery.toJSON();
      expect(json.id).toBe('test-query-1');
      expect(json.sql).toBe('SELECT * FROM users');
      expect(json.name).toBe('Test Query');
      expect(json.status).toBe('draft');
      expect(json.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
      expect(json.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
      expect(json.lastError).toBeNull();
    });

    it('roundtrips correctly', () => {
      const json = testQuery.toJSON();
      const restored = Query.fromJSON(json);

      expect(restored.id).toBe(testQuery.id);
      expect(restored.sql).toBe(testQuery.sql);
      expect(restored.name).toBe(testQuery.name);
      expect(restored.status).toBe(testQuery.status);
      expect(restored.createdAt.getTime()).toBe(testQuery.createdAt.getTime());
      expect(restored.updatedAt.getTime()).toBe(testQuery.updatedAt.getTime());
      expect(restored.lastError).toBe(testQuery.lastError);
    });
  });

  describe('clone', () => {
    it('creates exact copy when no overrides provided', () => {
      const cloned = testQuery.clone();

      expect(cloned).not.toBe(testQuery);
      expect(cloned.id).toBe(testQuery.id);
      expect(cloned.sql).toBe(testQuery.sql);
      expect(cloned.name).toBe(testQuery.name);
      expect(cloned.status).toBe(testQuery.status);
    });

    it('applies overrides correctly', () => {
      const cloned = testQuery.clone({
        id: 'cloned-query',
        sql: 'SELECT * FROM orders',
        status: 'completed'
      });

      expect(cloned.id).toBe('cloned-query');
      expect(cloned.sql).toBe('SELECT * FROM orders');
      expect(cloned.status).toBe('completed');
      expect(cloned.name).toBe(testQuery.name); // unchanged
    });
  });

  describe('validate', () => {
    it('passes validation for valid query', () => {
      expect(() => testQuery.validate()).not.toThrow();
      expect(testQuery.validate()).toBe(true);
    });

    it('throws error for missing id', () => {
      const q = new Query({ id: '', sql: 'SELECT 1' });
      expect(() => q.validate()).toThrow('Query validation failed: id is required');
    });

    it('throws error for missing sql', () => {
      const q = new Query({ id: 'test', sql: '' });
      expect(() => q.validate()).toThrow('Query validation failed: sql is required');
    });

    it('throws error for non-string sql', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const q = new Query({ id: 'test', sql: null as any });
      expect(() => q.validate()).toThrow('Query validation failed: sql is required');
    });

    it('throws error for multiple validation failures', () => {
      const q = new Query({ id: '', sql: '' });
      expect(() => q.validate()).toThrow('Query validation failed: id is required, sql is required');
    });
  });

  describe('status management', () => {
    it('supports all valid status values', () => {
      const statuses: QueryStatus[] = ['draft', 'running', 'completed', 'failed'];

      statuses.forEach(status => {
        const q = new Query({ id: 'test', sql: 'SELECT 1', status });
        expect(q.status).toBe(status);
      });
    });
  });

  describe('error handling', () => {
    it('handles lastError field correctly', () => {
      const q1 = new Query({ id: 'test', sql: 'SELECT 1' });
      expect(q1.lastError).toBeNull();

      const q2 = new Query({ id: 'test', sql: 'SELECT 1', lastError: 'Syntax error' });
      expect(q2.lastError).toBe('Syntax error');

      const q3 = new Query({ id: 'test', sql: 'SELECT 1', lastError: null });
      expect(q3.lastError).toBeNull();
    });
  });
});
