import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import dotenv from 'dotenv';
import { err, log } from '../utils/logger.js';

dotenv.config();

if (!process.env.DATABASE_URL) {
  err('BOOT', 'DATABASE_URL is not set in .env! Server cannot start.');
  process.exit(1);
}

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);

// Create Prisma client with adapter
// TypeScript type assertion to work around adapter type issues
const prismaWithAdapter = new PrismaClient({ adapter });
export const prisma = prismaWithAdapter as any as PrismaClient;

pool.query('SELECT 1')
  .then(() => log('DB', 'PostgreSQL connection verified.'))
  .catch((e) => {
    err('DB', 'Cannot connect to PostgreSQL. Is the database running?', e);
    process.exit(1);
  });
