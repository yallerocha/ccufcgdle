import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

/** Default admin account (local + production). */
export const DEFAULT_ADMIN = {
  email: 'yalle.silva@ccc.ufcg.edu.br',
  password: 'Yalle@04112002',
  name: 'Yalle Rocha',
} as const;

/**
 * Ensures the default admin exists without wiping other users.
 * Idempotent — safe to run on every API startup.
 */
export async function ensureDefaultAdmin(): Promise<void> {
  const passwordHash = await bcrypt.hash(DEFAULT_ADMIN.password, 10);
  const now = new Date();

  await prisma.user.upsert({
    where: { email: DEFAULT_ADMIN.email },
    update: {
      name: DEFAULT_ADMIN.name,
      isAdmin: true,
      emailVerifiedAt: now,
      passwordHash,
    },
    create: {
      email: DEFAULT_ADMIN.email,
      passwordHash,
      name: DEFAULT_ADMIN.name,
      isAdmin: true,
      emailVerifiedAt: now,
      lastLogin: now,
      isActive: true,
    },
  });

  console.log(`[admin] Default admin ready: ${DEFAULT_ADMIN.email}`);
}

ensureDefaultAdmin()
  .catch((err) => {
    console.error('[admin] Failed to ensure default admin:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
