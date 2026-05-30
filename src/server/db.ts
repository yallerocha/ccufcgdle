import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import path from 'path';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

const getPrismaInstance = () => {
  let url = process.env.DATABASE_URL || 'file:./dev.db';
  
  // Ensure the file path is absolute relative to the workspace root for Next.js consistency
  if (url.startsWith('file:')) {
    const relativePath = url.replace(/^file:/, '');
    const absolutePath = path.resolve(process.cwd(), relativePath);
    url = `file:${absolutePath}`;
  }
  
  const adapter = new PrismaBetterSqlite3({ url });
  return new PrismaClient({ adapter });
};

export const prisma = globalForPrisma.prisma || getPrismaInstance();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
