import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Pessoas ficticias, usadas apenas para popular o banco em desenvolvimento.
const mockUsers = [
  { email: 'yalle.silva@ccc.ufcg.edu.br', name: 'Yalle.Silva', photoUrl: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Yalle', isAdmin: true },
  { email: 'brasileiro@ccc.ufcg.edu.br', name: 'Prof.Brasileiro', photoUrl: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Brasileiro', isAdmin: false },
  { email: 'carla.edge@ccc.ufcg.edu.br', name: 'Carla.Edge', photoUrl: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Carla', isAdmin: false },
  { email: 'rafael.chain@ccc.ufcg.edu.br', name: 'Rafael.Chain', photoUrl: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Rafael', isAdmin: false },
  { email: 'marina.data@ccc.ufcg.edu.br', name: 'Marina.Data', photoUrl: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Marina', isAdmin: false },
  { email: 'joao.hpc@ccc.ufcg.edu.br', name: 'Joao.HPC', photoUrl: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Joao', isAdmin: false },
  { email: 'beatriz.obs@ccc.ufcg.edu.br', name: 'Beatriz.Obs', photoUrl: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Beatriz', isAdmin: false },
  { email: 'diego.iot@ccc.ufcg.edu.br', name: 'Diego.IoT', photoUrl: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Diego', isAdmin: false },
];

async function main() {
  console.log('Starting seeding...');

  // Hash a default password: "senha123"
  const passwordHash = await bcrypt.hash('senha123', 10);

  // Clear existing data (for a clean seed)
  await prisma.user.deleteMany({});

  for (const user of mockUsers) {
    const createdUser = await prisma.user.create({
      data: { ...user, passwordHash, lastLogin: new Date(), isActive: true, emailVerifiedAt: new Date() },
    });
    console.log(`Created user: ${createdUser.name} (${createdUser.email})`);
  }

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
