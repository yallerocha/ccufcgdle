import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Personagens ficticios tematicos do LSD (Laboratorio de Sistemas Distribuidos).
// O campo `lab` agora representa o subgrupo / linha de pesquisa dentro do LSD.
const mockUsers = [
  {
    email: 'yalle.silva@lsd.ufcg.edu.br',
    name: 'Yalle.Silva',
    gender: 'Masculino',
    role: 'Estudante',
    entrySemester: '2021.2',
    isColab: 'Sim',
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
    isColab: 'Sim',
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
    role: 'Estudante',
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
    role: 'Estudante',
    entrySemester: '2023.1',
    isColab: 'Sim',
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
    role: 'Estudante',
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
    role: 'Ex-aluno',
    entrySemester: '2019.1',
    isColab: 'Sim',
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
    role: 'Estudante',
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
    role: 'Técnico',
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

  // Clear existing characters (for a clean seed)
  await prisma.dailyCharacter.deleteMany({});
  await prisma.user.deleteMany({});

  for (const user of mockUsers) {
    const createdUser = await prisma.user.create({
      data: {
        ...user,
        passwordHash,
        lastLogin: new Date(),
        isActive: true,
      }
    });
    console.log(`Created user: ${createdUser.name} (${createdUser.email})`);
  }

  // Set the first user as character of the day for testing
  const firstUser = await prisma.user.findFirst({
    where: { name: 'Prof.Brasileiro' }
  });

  if (firstUser) {
    const today = new Date();
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Recife',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    const todayStr = formatter.format(today);

    await prisma.dailyCharacter.create({
      data: {
        date: todayStr,
        characterId: firstUser.id
      }
    });
    console.log(`Set Prof.Brasileiro as daily character for date ${todayStr}`);
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
