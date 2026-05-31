-- CreateTable
CREATE TABLE "TermoDaily" (
    "id" SERIAL NOT NULL,
    "date" TEXT NOT NULL,
    "word" TEXT NOT NULL,
    "display" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TermoDaily_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TermoProgress" (
    "id" SERIAL NOT NULL,
    "date" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "firstGuessAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "solved" BOOLEAN NOT NULL DEFAULT false,
    "solvedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TermoProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TermoResult" (
    "id" SERIAL NOT NULL,
    "date" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL,
    "durationMs" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TermoResult_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TermoDaily_date_key" ON "TermoDaily"("date");

-- CreateIndex
CREATE UNIQUE INDEX "TermoProgress_date_playerId_key" ON "TermoProgress"("date", "playerId");

-- CreateIndex
CREATE UNIQUE INDEX "TermoResult_date_playerId_key" ON "TermoResult"("date", "playerId");

-- CreateIndex
CREATE INDEX "TermoResult_date_attempts_durationMs_idx" ON "TermoResult"("date", "attempts", "durationMs");

-- AddForeignKey
ALTER TABLE "TermoProgress" ADD CONSTRAINT "TermoProgress_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TermoResult" ADD CONSTRAINT "TermoResult_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
