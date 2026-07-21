-- DropForeignKey
ALTER TABLE "CodeProgress" DROP CONSTRAINT "CodeProgress_playerId_fkey";

-- DropForeignKey
ALTER TABLE "CodeResult" DROP CONSTRAINT "CodeResult_playerId_fkey";

-- DropForeignKey
ALTER TABLE "DailyCharacter" DROP CONSTRAINT "DailyCharacter_characterId_fkey";

-- DropForeignKey
ALTER TABLE "DailyProgress" DROP CONSTRAINT "DailyProgress_playerId_fkey";

-- DropForeignKey
ALTER TABLE "ForcaProgress" DROP CONSTRAINT "ForcaProgress_playerId_fkey";

-- DropForeignKey
ALTER TABLE "ForcaResult" DROP CONSTRAINT "ForcaResult_playerId_fkey";

-- DropForeignKey
ALTER TABLE "GameResult" DROP CONSTRAINT "GameResult_playerId_fkey";

-- DropForeignKey
ALTER TABLE "GameStreak" DROP CONSTRAINT "GameStreak_playerId_fkey";

-- DropForeignKey
ALTER TABLE "QuizProgress" DROP CONSTRAINT "QuizProgress_playerId_fkey";

-- DropForeignKey
ALTER TABLE "QuizResult" DROP CONSTRAINT "QuizResult_playerId_fkey";

-- DropForeignKey
ALTER TABLE "TermoProgress" DROP CONSTRAINT "TermoProgress_playerId_fkey";

-- DropForeignKey
ALTER TABLE "TermoResult" DROP CONSTRAINT "TermoResult_playerId_fkey";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "gameArea",
DROP COLUMN "gameEntrySemester",
DROP COLUMN "gameGender",
DROP COLUMN "gameIsColab",
DROP COLUMN "gameLikesCoffee",
DROP COLUMN "gamePhotoUrl",
DROP COLUMN "gameProjects",
DROP COLUMN "gameRole",
DROP COLUMN "gameSyncDate",
ALTER COLUMN "gender" DROP DEFAULT,
ALTER COLUMN "role" DROP DEFAULT,
ALTER COLUMN "entrySemester" DROP DEFAULT,
ALTER COLUMN "isColab" DROP DEFAULT,
ALTER COLUMN "likesCoffee" DROP DEFAULT,
ALTER COLUMN "area" DROP DEFAULT;

-- DropTable
DROP TABLE "CodeDaily";

-- DropTable
DROP TABLE "CodeProgress";

-- DropTable
DROP TABLE "CodeResult";

-- DropTable
DROP TABLE "DailyCharacter";

-- DropTable
DROP TABLE "DailyProgress";

-- DropTable
DROP TABLE "ForcaDaily";

-- DropTable
DROP TABLE "ForcaProgress";

-- DropTable
DROP TABLE "ForcaResult";

-- DropTable
DROP TABLE "GameResult";

-- DropTable
DROP TABLE "GameStreak";

-- DropTable
DROP TABLE "QuizDaily";

-- DropTable
DROP TABLE "QuizProgress";

-- DropTable
DROP TABLE "QuizResult";

-- DropTable
DROP TABLE "TermoDaily";

-- DropTable
DROP TABLE "TermoProgress";

-- DropTable
DROP TABLE "TermoResult";

-- CreateTable
CREATE TABLE "ShowRun" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "questionIds" TEXT NOT NULL,
    "currentStep" INTEGER NOT NULL DEFAULT 1,
    "prize" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'playing',
    "usedLifelines" TEXT NOT NULL DEFAULT '',
    "durationMs" INTEGER,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),

    CONSTRAINT "ShowRun_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ShowRun_playerId_prize_idx" ON "ShowRun"("playerId", "prize");

-- CreateIndex
CREATE INDEX "ShowRun_prize_durationMs_idx" ON "ShowRun"("prize", "durationMs");

-- AddForeignKey
ALTER TABLE "ShowRun" ADD CONSTRAINT "ShowRun_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

