import { registerAs } from '@nestjs/config';

export interface DatabaseConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
  ssl: boolean;
  poolMax: number;
}

export default registerAs(
  'database',
  (): DatabaseConfig => ({
    host: process.env.DB_HOST as string,
    port: parseInt(process.env.DB_PORT ?? '5432', 10),
    username: process.env.DB_USERNAME as string,
    password: process.env.DB_PASSWORD as string,
    database: process.env.DB_NAME as string,
    ssl: process.env.DB_SSL === 'true',
    poolMax: parseInt(process.env.DB_POOL_MAX ?? '10', 10),
  }),
);
