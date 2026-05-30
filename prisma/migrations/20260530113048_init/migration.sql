-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "gender" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "entrySemester" TEXT NOT NULL,
    "isColab" TEXT NOT NULL,
    "area" TEXT NOT NULL,
    "projects" TEXT[],
    "likesCoffee" TEXT NOT NULL,
    "photoUrl" TEXT,
    "lastLogin" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyCharacter" (
    "id" SERIAL NOT NULL,
    "date" TEXT NOT NULL,
    "characterId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DailyCharacter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GameResult" (
    "id" SERIAL NOT NULL,
    "date" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL,
    "durationMs" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GameResult_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_name_key" ON "User"("name");

-- CreateIndex
CREATE UNIQUE INDEX "DailyCharacter_date_key" ON "DailyCharacter"("date");

-- CreateIndex
CREATE INDEX "GameResult_date_attempts_durationMs_idx" ON "GameResult"("date", "attempts", "durationMs");

-- CreateIndex
CREATE UNIQUE INDEX "GameResult_date_playerId_key" ON "GameResult"("date", "playerId");

-- AddForeignKey
ALTER TABLE "DailyCharacter" ADD CONSTRAINT "DailyCharacter_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameResult" ADD CONSTRAINT "GameResult_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

