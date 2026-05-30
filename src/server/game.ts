import { prisma } from './db';
import { User } from '@prisma/client';
import { INACTIVITY_DAYS, getLocalDateString } from '@/shared/utils';

export async function getActiveUsers(): Promise<User[]> {
  const activeThreshold = new Date();
  activeThreshold.setDate(activeThreshold.getDate() - INACTIVITY_DAYS);

  return prisma.user.findMany({
    where: {
      isActive: true,
      lastLogin: {
        gte: activeThreshold
      }
    }
  });
}

export async function getOrCreateDailyCharacter(dateStr?: string): Promise<User | null> {
  const targetDate = dateStr || getLocalDateString();

  // 1. Check if daily character already exists for this date
  const existingDaily = await prisma.dailyCharacter.findUnique({
    where: { date: targetDate },
    include: { character: true }
  });

  if (existingDaily) {
    return existingDaily.character;
  }

  // 2. No daily character found, let's select a new one
  const activeUsers = await getActiveUsers();

  if (activeUsers.length === 0) {
    // Fallback: If no active users (e.g. brand new site), get ANY user
    const anyUser = await prisma.user.findFirst();
    if (!anyUser) return null; // No users registered at all
    
    // Save daily character
    await prisma.dailyCharacter.create({
      data: {
        date: targetDate,
        characterId: anyUser.id
      }
    });
    return anyUser;
  }

  // 3. To make it more fun, try to avoid choosing characters chosen recently (e.g., in the last 10 days)
  const recentDailies = await prisma.dailyCharacter.findMany({
    take: 10,
    orderBy: { createdAt: 'desc' },
    select: { characterId: true }
  });
  const recentIds = new Set(recentDailies.map(d => d.characterId));

  // Filter out recent characters
  let pool = activeUsers.filter(u => !recentIds.has(u.id));

  // If pool is empty, fall back to all active users
  if (pool.length === 0) {
    pool = activeUsers;
  }

  // 4. Select random user from the pool
  const randomIndex = Math.floor(Math.random() * pool.length);
  const selectedUser = pool[randomIndex];

  // 5. Save the daily character to prevent it from changing on subsequent loads today
  try {
    const newDaily = await prisma.dailyCharacter.create({
      data: {
        date: targetDate,
        characterId: selectedUser.id
      },
      include: {
        character: true
      }
    });
    return newDaily.character;
  } catch (error) {
    // In case of parallel requests creating the same daily character, return the existing one
    const checkAgain = await prisma.dailyCharacter.findUnique({
      where: { date: targetDate },
      include: { character: true }
    });
    return checkAgain ? checkAgain.character : selectedUser;
  }
}

// Compare a guess user with the target user
export interface GuessFeedback {
  correct: boolean;
  photoUrl?: string | null;
  fields: {
    name: { value: string; result: 'correct' | 'incorrect' };
    gender: { value: string; result: 'correct' | 'incorrect' };
    role: { value: string; result: 'correct' | 'incorrect' };
    entrySemester: { 
      value: string; 
      result: 'correct' | 'higher' | 'lower' | 'incorrect' 
    };
    favoriteLanguage: { value: string; result: 'correct' | 'incorrect' };
    area: { value: string; result: 'correct' | 'incorrect' };
    lab: { value: string; result: 'correct' | 'incorrect' };
    likesCoffee: { value: string; result: 'correct' | 'incorrect' };
  };
}

export function compareCharacters(guess: User, target: User): GuessFeedback {
  const correct = guess.id === target.id;

  // Helper to parse entry semester (e.g. "2020.1" -> 2020.1 or "Antes de 2018" -> 2017)
  const parseSemester = (sem: string): number => {
    if (sem.startsWith('Antes')) return 2017.0;
    const parts = sem.split('.');
    if (parts.length === 2) {
      const year = parseInt(parts[0]);
      const term = parseInt(parts[1]);
      return year + (term === 2 ? 0.5 : 0.0);
    }
    return parseInt(sem) || 0;
  };

  const guessSemVal = parseSemester(guess.entrySemester);
  const targetSemVal = parseSemester(target.entrySemester);

  let entrySemResult: 'correct' | 'higher' | 'lower' | 'incorrect' = 'incorrect';
  if (guess.entrySemester === target.entrySemester) {
    entrySemResult = 'correct';
  } else if (guessSemVal < targetSemVal) {
    entrySemResult = 'higher'; // The target is higher (newer) than the guess
  } else if (guessSemVal > targetSemVal) {
    entrySemResult = 'lower';  // The target is lower (older) than the guess
  }

  return {
    correct,
    photoUrl: guess.photoUrl,
    fields: {
      name: {
        value: guess.name,
        result: guess.name === target.name ? 'correct' : 'incorrect'
      },
      gender: {
        value: guess.gender,
        result: guess.gender === target.gender ? 'correct' : 'incorrect'
      },
      role: {
        value: guess.role,
        result: guess.role === target.role ? 'correct' : 'incorrect'
      },
      entrySemester: {
        value: guess.entrySemester,
        result: entrySemResult
      },
      favoriteLanguage: {
        value: guess.favoriteLanguage,
        result: guess.favoriteLanguage === target.favoriteLanguage ? 'correct' : 'incorrect'
      },
      area: {
        value: guess.area,
        result: guess.area === target.area ? 'correct' : 'incorrect'
      },
      lab: {
        value: guess.lab,
        result: guess.lab === target.lab ? 'correct' : 'incorrect'
      },
      likesCoffee: {
        value: guess.likesCoffee,
        result: guess.likesCoffee === target.likesCoffee ? 'correct' : 'incorrect'
      }
    }
  };
}
