import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';
import { DatabaseConfig } from '../config/database.config';

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DatabaseService.name);
  private readonly pool: Pool;

  constructor(private readonly configService: ConfigService) {
    const dbConfig = this.configService.get<DatabaseConfig>('database')!;

    this.pool = new Pool({
      host: dbConfig.host,
      port: dbConfig.port,
      user: dbConfig.username,
      password: dbConfig.password,
      database: dbConfig.database,
      ssl: dbConfig.ssl ? { rejectUnauthorized: true } : false,

      // Pool sizing — bounds how many concurrent connections this instance can open.
      max: dbConfig.poolMax,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 5_000,

      // Defense-in-depth against runaway/hanging queries (slow-query DoS, locked rows).
      statement_timeout: 10_000,
      query_timeout: 10_000,
      idle_in_transaction_session_timeout: 10_000,
    });

    this.pool.on('error', (err) => {
      // Fired on idle-client errors (e.g. connection dropped by the server) —
      // must be handled or an unhandled 'error' event crashes the process.
      this.logger.error('Unexpected idle client error', err.stack);
    });
  }

  async onModuleInit(): Promise<void> {
    await this.query('SELECT 1');
    this.logger.log('Database connection established');
  }

  async onModuleDestroy(): Promise<void> {
    await this.pool.end();
    this.logger.log('Database pool closed');
  }

  /**
   * Runs a parameterized query. `text` must use positional placeholders
   * ($1, $2, ...) — never build SQL via string concatenation/interpolation
   * with request-derived values, as that opens the door to SQL injection.
   *
   * @example
   *   this.databaseService.query(
   *     'SELECT id, name FROM salons WHERE owner_id = $1 AND is_active = $2',
   *     [ownerId, true],
   *   );
   */
  async query<T extends QueryResultRow = QueryResultRow>(
    text: string,
    params?: unknown[],
  ): Promise<QueryResult<T>> {
    const start = Date.now();
    try {
      const result = await this.pool.query<T>(text, params);
      this.logger.debug(`${Date.now() - start}ms | ${text}`);
      return result;
    } catch (error) {
      // Log the failing statement, but never the bound parameters —
      // they may carry PII or credentials.
      this.logger.error(`Query failed: ${text}`, (error as Error).stack);
      throw error;
    }
  }

  /**
   * Runs `work` inside a single transaction on a dedicated client.
   * Commits on success, rolls back and rethrows on any error, and always
   * releases the client back to the pool.
   *
   * @example
   *   await this.databaseService.transaction(async (client) => {
   *     await client.query('UPDATE bookings SET status = $1 WHERE id = $2', ['confirmed', bookingId]);
   *     await client.query('INSERT INTO booking_events (booking_id, type) VALUES ($1, $2)', [bookingId, 'confirmed']);
   *   });
   */
  async transaction<T>(work: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const result = await work(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}

/**
 * SQL identifiers (table/column names) can't be bound as query parameters —
 * `$1` only works for values. Whenever an identifier must be chosen
 * dynamically (e.g. a sortable column from a query string), validate it
 * against a fixed allow-list with this helper instead of interpolating the
 * raw input into the SQL string.
 *
 * @example
 *   const sortColumn = assertAllowedIdentifier(req.query.sortBy, ['created_at', 'name', 'price']);
 *   this.databaseService.query(`SELECT * FROM services ORDER BY ${sortColumn} ASC`);
 */
export function assertAllowedIdentifier<T extends string>(
  value: string,
  allowed: readonly T[],
): T {
  if (!allowed.includes(value as T)) {
    throw new Error(`Invalid identifier: ${value}`);
  }
  return value as T;
}
