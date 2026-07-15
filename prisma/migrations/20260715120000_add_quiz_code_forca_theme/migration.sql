-- Forca: theme/category hint for the daily word
ALTER TABLE "ForcaDaily" ADD COLUMN IF NOT EXISTS "theme" TEXT NOT NULL DEFAULT '';

-- Quiz (POSCOMP-style daily quiz) tables
CREATE TABLE IF NOT EXISTS "QuizDaily" (
    "id" SERIAL NOT NULL,
    "date" TEXT NOT NULL,
    "questionIds" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuizDaily_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "QuizDaily_date_key" ON "QuizDaily"("date");

CREATE TABLE IF NOT EXISTS "QuizProgress" (
    "id" SERIAL NOT NULL,
    "date" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "answers" TEXT NOT NULL DEFAULT '[]',
    "firstAnswerAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finished" BOOLEAN NOT NULL DEFAULT false,
    "finishedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuizProgress_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "QuizProgress_date_playerId_key" ON "QuizProgress"("date", "playerId");

DO $$ BEGIN
  ALTER TABLE "QuizProgress" ADD CONSTRAINT "QuizProgress_playerId_fkey"
    FOREIGN KEY ("playerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "QuizResult" (
    "id" SERIAL NOT NULL,
    "date" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "correct" INTEGER NOT NULL,
    "total" INTEGER NOT NULL,
    "durationMs" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuizResult_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "QuizResult_date_playerId_key" ON "QuizResult"("date", "playerId");
CREATE INDEX IF NOT EXISTS "QuizResult_date_correct_durationMs_idx" ON "QuizResult"("date", "correct", "durationMs");

DO $$ BEGIN
  ALTER TABLE "QuizResult" ADD CONSTRAINT "QuizResult_playerId_fkey"
    FOREIGN KEY ("playerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Code (daily coding challenge) tables
CREATE TABLE IF NOT EXISTS "CodeDaily" (
    "id" SERIAL NOT NULL,
    "date" TEXT NOT NULL,
    "challengeId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CodeDaily_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "CodeDaily_date_key" ON "CodeDaily"("date");

CREATE TABLE IF NOT EXISTS "CodeProgress" (
    "id" SERIAL NOT NULL,
    "date" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "firstTryAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "solved" BOOLEAN NOT NULL DEFAULT false,
    "solvedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CodeProgress_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "CodeProgress_date_playerId_key" ON "CodeProgress"("date", "playerId");

DO $$ BEGIN
  ALTER TABLE "CodeProgress" ADD CONSTRAINT "CodeProgress_playerId_fkey"
    FOREIGN KEY ("playerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "CodeResult" (
    "id" SERIAL NOT NULL,
    "date" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL,
    "durationMs" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CodeResult_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "CodeResult_date_playerId_key" ON "CodeResult"("date", "playerId");
CREATE INDEX IF NOT EXISTS "CodeResult_date_attempts_durationMs_idx" ON "CodeResult"("date", "attempts", "durationMs");

DO $$ BEGIN
  ALTER TABLE "CodeResult" ADD CONSTRAINT "CodeResult_playerId_fkey"
    FOREIGN KEY ("playerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
