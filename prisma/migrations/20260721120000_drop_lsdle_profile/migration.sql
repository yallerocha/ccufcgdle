-- DropForeignKey
ALTER TABLE "Project" DROP CONSTRAINT "Project_createdById_fkey";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "area",
DROP COLUMN "entrySemester",
DROP COLUMN "gender",
DROP COLUMN "isColab",
DROP COLUMN "likesCoffee",
DROP COLUMN "projects",
DROP COLUMN "role";

-- DropTable
DROP TABLE "Project";

