-- Daily game snapshot fields on User (were previously applied only via db push)
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "gameGender" TEXT NOT NULL DEFAULT '';
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "gameRole" TEXT NOT NULL DEFAULT '';
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "gameEntrySemester" TEXT NOT NULL DEFAULT '';
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "gameIsColab" TEXT NOT NULL DEFAULT '';
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "gameArea" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "gameProjects" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "gameLikesCoffee" TEXT NOT NULL DEFAULT '';
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "gamePhotoUrl" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "gameSyncDate" TEXT NOT NULL DEFAULT '';

-- GameStreak
CREATE TABLE IF NOT EXISTS "GameStreak" (
    "id" SERIAL NOT NULL,
    "playerId" TEXT NOT NULL,
    "game" TEXT NOT NULL,
    "current" INTEGER NOT NULL DEFAULT 0,
    "best" INTEGER NOT NULL DEFAULT 0,
    "lastDate" TEXT NOT NULL DEFAULT '',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GameStreak_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "GameStreak_playerId_game_key" ON "GameStreak"("playerId", "game");

DO $$ BEGIN
  ALTER TABLE "GameStreak" ADD CONSTRAINT "GameStreak_playerId_fkey"
    FOREIGN KEY ("playerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Forca game tables
CREATE TABLE IF NOT EXISTS "ForcaDaily" (
    "id" SERIAL NOT NULL,
    "date" TEXT NOT NULL,
    "word" TEXT NOT NULL,
    "display" TEXT NOT NULL,
    "personName" TEXT,
    "personPhoto" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ForcaDaily_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "ForcaDaily_date_key" ON "ForcaDaily"("date");

CREATE TABLE IF NOT EXISTS "ForcaProgress" (
    "id" SERIAL NOT NULL,
    "date" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "guessed" TEXT NOT NULL DEFAULT '',
    "firstGuessAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "solved" BOOLEAN NOT NULL DEFAULT false,
    "solvedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ForcaProgress_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "ForcaProgress_date_playerId_key" ON "ForcaProgress"("date", "playerId");

DO $$ BEGIN
  ALTER TABLE "ForcaProgress" ADD CONSTRAINT "ForcaProgress_playerId_fkey"
    FOREIGN KEY ("playerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "ForcaResult" (
    "id" SERIAL NOT NULL,
    "date" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL,
    "durationMs" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ForcaResult_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "ForcaResult_date_playerId_key" ON "ForcaResult"("date", "playerId");
CREATE INDEX IF NOT EXISTS "ForcaResult_date_attempts_durationMs_idx" ON "ForcaResult"("date", "attempts", "durationMs");

DO $$ BEGIN
  ALTER TABLE "ForcaResult" ADD CONSTRAINT "ForcaResult_playerId_fkey"
    FOREIGN KEY ("playerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
