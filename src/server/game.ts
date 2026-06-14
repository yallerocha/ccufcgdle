import { prisma } from './db';
import { User } from '@prisma/client';
import { INACTIVITY_DAYS, getLocalDateString } from '@/shared/utils';

// Promotes each user's editable attributes into their daily game snapshot
// (game* fields) at most once per day. Because a profile edit never touches the
// game* fields directly (see PUT /api/auth/me), and this only runs when the
// snapshot is stale (gameSyncDate != today), an edit made today is only picked
// up by the next day's sync — so the games reflect attribute changes a day late.
// Photo is the exception: gameView always reads the live photoUrl.
let lastSyncDate = '';
export async function syncGameAttributes(): Promise<void> {
  const today = getLocalDateString();
  // Cheap in-process guard so we don't issue the UPDATE on every request.
  if (lastSyncDate === today) return;
  await prisma.$executeRaw`
    UPDATE "User" SET
      "gameGender" = "gender",
      "gameRole" = "role",
      "gameEntrySemester" = "entrySemester",
      "gameIsColab" = "isColab",
      "gameArea" = "area",
      "gameProjects" = "projects",
      "gameLikesCoffee" = "likesCoffee",
      "gameSyncDate" = ${today}
    WHERE "gameSyncDate" <> ${today}
  `;
  lastSyncDate = today;
}

// Returns a User whose attribute fields are the daily game snapshot (game*),
// falling back to the editable values when a user has never been synced (e.g.
// just registered). Games must compare/display attributes through this view so
// that same-day profile edits don't leak into the current round. Photo always
// uses the live value so avatar changes appear immediately.
export function gameView(u: User): User {
  return {
    ...u,
    gender: u.gameSyncDate ? u.gameGender : u.gender,
    role: u.gameSyncDate ? u.gameRole : u.role,
    entrySemester: u.gameSyncDate ? u.gameEntrySemester : u.entrySemester,
    isColab: u.gameSyncDate ? u.gameIsColab : u.isColab,
    area: u.gameSyncDate ? u.gameArea : u.area,
    projects: u.gameSyncDate ? u.gameProjects : u.projects,
    likesCoffee: u.gameSyncDate ? u.gameLikesCoffee : u.likesCoffee,
    photoUrl: u.photoUrl,
  };
}

/** Resolves the current profile photo for a member shown in games (e.g. Forca). */
export async function livePhotoByUserName(name: string | null | undefined): Promise<string | null> {
  if (!name) return null;
  const user = await prisma.user.findUnique({
    where: { name },
    select: { photoUrl: true },
  });
  return user?.photoUrl ?? null;
}

export async function getActiveUsers(): Promise<User[]> {
  await syncGameAttributes();

  const activeThreshold = new Date();
  activeThreshold.setDate(activeThreshold.getDate() - INACTIVITY_DAYS);

  const users = await prisma.user.findMany({
    where: {
      isActive: true,
      emailVerifiedAt: { not: null },
      lastLogin: {
        gte: activeThreshold
      }
    }
  });
  // Expose the daily snapshot, not the live (possibly just-edited) attributes.
  return users.map(gameView);
}

export async function getOrCreateDailyCharacter(dateStr?: string): Promise<User | null> {
  const targetDate = dateStr || getLocalDateString();
  await syncGameAttributes();

  // 1. Check if daily character already exists for this date
  const existingDaily = await prisma.dailyCharacter.findUnique({
    where: { date: targetDate },
    include: { character: true }
  });

  if (existingDaily) {
    return gameView(existingDaily.character);
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
    return gameView(anyUser);
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
    return gameView(newDaily.character);
  } catch (error) {
    // In case of parallel requests creating the same daily character, return the existing one
    const checkAgain = await prisma.dailyCharacter.findUnique({
      where: { date: targetDate },
      include: { character: true }
    });
    return checkAgain ? gameView(checkAgain.character) : gameView(selectedUser);
  }
}

/** Counts finalized days only — today's pick is excluded until the date rolls over. */
export async function countPersonOfDayAppearances(characterId: string): Promise<number> {
  const today = getLocalDateString();
  return prisma.dailyCharacter.count({
    where: { characterId, date: { lt: today } },
  });
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
    isColab: { value: string; result: 'correct' | 'incorrect' };
    // Multivalor: 'correct' = mesmo conjunto, 'partial' = ao menos 1 em comum,
    // 'incorrect' = nenhuma área em comum.
    area: { value: string; result: 'correct' | 'partial' | 'incorrect' };
    projects: { value: string; result: 'correct' | 'incorrect' };
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

  // Compara conjuntos de áreas (multivalor).
  const guessAreas = [...new Set(guess.area)];
  const targetAreaSet = new Set(target.area);
  const sharedAreas = guessAreas.filter((a) => targetAreaSet.has(a));
  let areaResult: 'correct' | 'partial' | 'incorrect';
  if (sharedAreas.length === guessAreas.length && sharedAreas.length === targetAreaSet.size) {
    areaResult = 'correct';
  } else if (sharedAreas.length > 0) {
    areaResult = 'partial';
  } else {
    areaResult = 'incorrect';
  }

  const guessProject = guess.projects[0] ?? '';
  const targetProject = target.projects[0] ?? '';
  const projectsResult: 'correct' | 'incorrect' =
    guessProject !== '' && guessProject === targetProject ? 'correct' : 'incorrect';

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
      isColab: {
        value: guess.isColab,
        result: guess.isColab === target.isColab ? 'correct' : 'incorrect'
      },
      area: {
        value: guess.area.join(', '),
        result: areaResult,
      },
      projects: {
        value: guessProject,
        result: projectsResult,
      },
      likesCoffee: {
        value: guess.likesCoffee,
        result: guess.likesCoffee === target.likesCoffee ? 'correct' : 'incorrect'
      }
    }
  };
}
