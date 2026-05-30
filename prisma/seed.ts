import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const mockUsers = [
  {
    email: 'yalle.silva@ufcg.edu.br',
    name: 'Yalle.Silva',
    gender: 'Masculino',
    role: 'Estudante',
    entrySemester: '2021.2',
    favoriteLanguage: 'JavaScript',
    area: 'Engenharia de Software',
    lab: 'LSD',
    likesCoffee: 'Só energético',
    photoUrl: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Yalle',
    isAdmin: true,
  },
  {
    email: 'dalton@computacao.ufcg.edu.br',
    name: 'Prof.Dalton',
    gender: 'Masculino',
    role: 'Professor',
    entrySemester: 'Antes de 2018',
    favoriteLanguage: 'Java',
    area: 'Engenharia de Software',
    lab: 'SPLab',
    likesCoffee: 'Sim',
    photoUrl: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Dalton',
    isAdmin: false,
  },
  {
    email: 'clara.campolina@estudante.ufcg.edu.br',
    name: 'Clara.Camp',
    gender: 'Feminino',
    role: 'Estudante',
    entrySemester: '2022.1',
    favoriteLanguage: 'Haskell',
    area: 'Teoria da Computação',
    lab: 'PET',
    likesCoffee: 'Não',
    photoUrl: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Clara',
    isAdmin: false,
  },
  {
    email: 'franklin@computacao.ufcg.edu.br',
    name: 'Prof.Franklin',
    gender: 'Masculino',
    role: 'Professor',
    entrySemester: 'Antes de 2018',
    favoriteLanguage: 'C',
    area: 'Teoria da Computação',
    lab: 'Nenhum',
    likesCoffee: 'Sim',
    photoUrl: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Franklin',
    isAdmin: false,
  },
  {
    email: 'matheus.ex@aluno.ufcg.edu.br',
    name: 'Matheus.Ex',
    gender: 'Masculino',
    role: 'Ex-aluno',
    entrySemester: '2019.1',
    favoriteLanguage: 'Rust',
    area: 'Segurança da Informação',
    lab: 'Nenhum',
    likesCoffee: 'Sim',
    photoUrl: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Matheus',
    isAdmin: false,
  },
  {
    email: 'eliane.tae@computacao.ufcg.edu.br',
    name: 'Eliane.Tae',
    gender: 'Feminino',
    role: 'Técnico',
    entrySemester: '2018.2',
    favoriteLanguage: 'Python',
    area: 'Sistemas Distribuídos / Redes',
    lab: 'LCC',
    likesCoffee: 'Sim',
    photoUrl: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Eliane',
    isAdmin: false,
  },
  {
    email: 'andre.virtus@ufcg.edu.br',
    name: 'Andre.Virtus',
    gender: 'Masculino',
    role: 'Estudante',
    entrySemester: '2023.1',
    favoriteLanguage: 'C++',
    area: 'Hardware / Embarcados',
    lab: 'VIRTUS',
    likesCoffee: 'Só energético',
    photoUrl: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Andre',
    isAdmin: false,
  },
  {
    email: 'patricia.ai@ufcg.edu.br',
    name: 'Patricia.AI',
    gender: 'Feminino',
    role: 'Estudante',
    entrySemester: '2020.1',
    favoriteLanguage: 'Python',
    area: 'Ciência de Dados / IA',
    lab: 'UFCG.AI',
    likesCoffee: 'Sim',
    photoUrl: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Patricia',
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
    where: { name: 'Prof.Dalton' }
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
    console.log(`Set Prof.Dalton as daily character for date ${todayStr}`);
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
