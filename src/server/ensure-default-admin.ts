import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import { DEFAULT_PROJECT_NAMES } from '../shared/validation.js';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

/** Default admin account (local + production). */
export const DEFAULT_ADMIN = {
  email: 'yalle.silva@lsd.ufcg.edu.br',
  password: 'senha123',
  name: 'Yalle.Silva',
  gender: 'Masculino',
  role: 'Graduando',
  entrySemester: '2021.2',
  isColab: 'Não',
  area: ['Sistemas Distribuídos / Redes'],
  projects: ['Computação em Nuvem'],
  likesCoffee: 'Não',
} as const;

/**
 * Ensures the default admin exists without wiping other users.
 * Idempotent — safe to run on every API startup.
 */
export async function ensureDefaultAdmin(): Promise<void> {
  for (const name of DEFAULT_PROJECT_NAMES) {
    await prisma.project.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  const passwordHash = await bcrypt.hash(DEFAULT_ADMIN.password, 10);
  const now = new Date();

  await prisma.user.upsert({
    where: { email: DEFAULT_ADMIN.email },
    update: {
      isAdmin: true,
      emailVerifiedAt: now,
      passwordHash,
    },
    create: {
      email: DEFAULT_ADMIN.email,
      passwordHash,
      name: DEFAULT_ADMIN.name,
      gender: DEFAULT_ADMIN.gender,
      role: DEFAULT_ADMIN.role,
      entrySemester: DEFAULT_ADMIN.entrySemester,
      isColab: DEFAULT_ADMIN.isColab,
      area: [...DEFAULT_ADMIN.area],
      projects: [...DEFAULT_ADMIN.projects],
      likesCoffee: DEFAULT_ADMIN.likesCoffee,
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
