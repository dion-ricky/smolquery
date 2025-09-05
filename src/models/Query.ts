export type QueryStatus = 'draft' | 'running' | 'completed' | 'failed';

export interface QueryPayload {
  id: string;
  sql: string;
  name?: string;
  createdAt?: string;
  updatedAt?: string;
  status?: QueryStatus;
  lastError?: string | null;
}

export class Query {
  id: string;
  sql: string;
  name?: string;
  createdAt: Date;
  updatedAt: Date;
  status: QueryStatus;
  lastError?: string | null;

  constructor(payload: {
    id: string;
    sql: string;
    name?: string;
    createdAt?: Date;
    updatedAt?: Date;
    status?: QueryStatus;
    lastError?: string | null;
  }) {
    this.id = payload.id;
    this.sql = payload.sql;
    this.name = payload.name;
    this.createdAt = payload.createdAt ?? new Date();
    this.updatedAt = payload.updatedAt ?? new Date();
    this.status = payload.status ?? 'draft';
    this.lastError = payload.lastError ?? null;
  }

  static fromJSON(json: QueryPayload) {
    if (!json || typeof json !== 'object') throw new TypeError('Invalid Query payload');
    if (typeof json.id !== 'string' || typeof json.sql !== 'string') {
      throw new TypeError('Query payload missing required fields: id, sql');
    }
    return new Query({
      id: json.id,
      sql: json.sql,
      name: json.name,
      createdAt: json.createdAt ? new Date(json.createdAt) : undefined,
      updatedAt: json.updatedAt ? new Date(json.updatedAt) : undefined,
      status: json.status,
      lastError: json.lastError ?? null,
    });
  }

  toJSON(): QueryPayload {
    return {
      id: this.id,
      sql: this.sql,
      name: this.name,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
      status: this.status,
      lastError: this.lastError ?? null,
    };
  }

  clone(overrides?: Partial<QueryPayload>) {
    const payload = { ...this.toJSON(), ...overrides };
    return Query.fromJSON(payload);
  }

  validate() {
    const errors: string[] = [];
    if (!this.id) errors.push('id is required');
    if (!this.sql || typeof this.sql !== 'string') errors.push('sql is required');
    if (errors.length) throw new Error('Query validation failed: ' + errors.join(', '));
    return true;
  }
}

export default Query;
