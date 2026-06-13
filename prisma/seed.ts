import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import { DEFAULT_PROJECT_NAMES } from '../src/shared/validation';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Pessoas ficticias tematicas do LSD (Laboratorio de Sistemas Distribuidos),
// usadas apenas para popular o banco em desenvolvimento.
const mockUsers = [
  {
    email: 'yalle.silva@lsd.ufcg.edu.br',
    name: 'Yalle.Silva',
    gender: 'Masculino',
    role: 'Graduando',
    entrySemester: '2021.2',
    isColab: 'Não',
    area: 'Sistemas Distribuídos / Redes',
    projects: ['Computação em Nuvem', 'Observabilidade'],
    likesCoffee: 'Não',
    photoUrl: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Yalle',
    isAdmin: true,
  },
  {
    email: 'brasileiro@lsd.ufcg.edu.br',
    name: 'Prof.Brasileiro',
    gender: 'Masculino',
    role: 'Professor',
    entrySemester: 'Antes de 2018',
    isColab: 'Não',
    area: 'Sistemas Distribuídos / Redes',
    projects: ['Computação em Nuvem', 'Computação na Borda', 'Big Data'],
    likesCoffee: 'Sim',
    photoUrl: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Brasileiro',
    isAdmin: false,
  },
  {
    email: 'carla.edge@lsd.ufcg.edu.br',
    name: 'Carla.Edge',
    gender: 'Feminino',
    role: 'Mestrando',
    entrySemester: '2022.1',
    isColab: 'Não',
    area: 'Sistemas Distribuídos / Redes',
    projects: ['Computação na Borda', 'IoT'],
    likesCoffee: 'Sim',
    photoUrl: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Carla',
    isAdmin: false,
  },
  {
    email: 'rafael.chain@lsd.ufcg.edu.br',
    name: 'Rafael.Chain',
    gender: 'Masculino',
    role: 'Doutorando',
    entrySemester: '2023.1',
    isColab: 'Não',
    area: 'Segurança da Informação',
    projects: ['Blockchain'],
    likesCoffee: 'Não',
    photoUrl: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Rafael',
    isAdmin: false,
  },
  {
    email: 'marina.data@lsd.ufcg.edu.br',
    name: 'Marina.Data',
    gender: 'Feminino',
    role: 'Mestrando',
    entrySemester: '2020.1',
    isColab: 'Não',
    area: 'Ciência de Dados / IA',
    projects: ['Big Data', 'Computação em Nuvem'],
    likesCoffee: 'Sim',
    photoUrl: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Marina',
    isAdmin: false,
  },
  {
    email: 'joao.hpc@lsd.ufcg.edu.br',
    name: 'Joao.HPC',
    gender: 'Masculino',
    role: 'Pesquisador',
    entrySemester: '2019.1',
    isColab: 'Não',
    area: 'Hardware / Embarcados',
    projects: ['HPC', 'Computação Verde'],
    likesCoffee: 'Não',
    photoUrl: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Joao',
    isAdmin: false,
  },
  {
    email: 'beatriz.obs@lsd.ufcg.edu.br',
    name: 'Beatriz.Obs',
    gender: 'Feminino',
    role: 'Graduando',
    entrySemester: '2024.1',
    isColab: 'Não',
    area: 'Engenharia de Software',
    projects: ['Observabilidade'],
    likesCoffee: 'Sim',
    photoUrl: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Beatriz',
    isAdmin: false,
  },
  {
    email: 'diego.iot@lsd.ufcg.edu.br',
    name: 'Diego.IoT',
    gender: 'Masculino',
    role: 'Funcionário',
    entrySemester: '2018.2',
    isColab: 'Não',
    area: 'Hardware / Embarcados',
    projects: ['IoT', 'Computação na Borda'],
    likesCoffee: 'Não',
    photoUrl: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Diego',
    isAdmin: false,
  }
];

async function main() {
  console.log('Starting seeding...');
  
  // Hash a default password: "senha123"
  const passwordHash = await bcrypt.hash('senha123', 10);

  // Clear existing data (for a clean seed)
  await prisma.dailyCharacter.deleteMany({});
  await prisma.user.deleteMany({});

  for (const name of DEFAULT_PROJECT_NAMES) {
    await prisma.project.upsert({
      where: { name },
      create: { name },
      update: {},
    });
  }

  for (const user of mockUsers) {
    for (const projectName of user.projects) {
      await prisma.project.upsert({
        where: { name: projectName },
        create: { name: projectName },
        update: {},
      });
    }

    const createdUser = await prisma.user.create({
      data: {
        ...user,
        area: Array.isArray(user.area) ? user.area : [user.area],
        projects: [user.projects[0]],
        passwordHash,
        lastLogin: new Date(),
        isActive: true,
      }
    });
    console.log(`Created user: ${createdUser.name} (${createdUser.email})`);
  }

  // Intentionally NOT pinning a "person of the day": the app picks one at
  // random on the first guess of each day and persists it (see
  // getOrCreateDailyCharacter), so everyone gets the same random person.

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
