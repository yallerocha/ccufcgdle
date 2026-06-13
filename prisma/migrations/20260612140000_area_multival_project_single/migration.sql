-- area: single string -> string array (one area per existing user)
ALTER TABLE "User" ADD COLUMN "area_new" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
UPDATE "User" SET "area_new" = ARRAY["area"]::TEXT[] WHERE "area" IS NOT NULL AND "area" <> '';
ALTER TABLE "User" DROP COLUMN "area";
ALTER TABLE "User" RENAME COLUMN "area_new" TO "area";

-- gameArea: single string -> string array
ALTER TABLE "User" ADD COLUMN "gameArea_new" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
UPDATE "User" SET "gameArea_new" = CASE
  WHEN "gameArea" IS NULL OR "gameArea" = '' THEN ARRAY[]::TEXT[]
  ELSE ARRAY["gameArea"]::TEXT[]
END;
ALTER TABLE "User" DROP COLUMN "gameArea";
ALTER TABLE "User" RENAME COLUMN "gameArea_new" TO "gameArea";

-- projects: keep only the first entry when multiple were stored
UPDATE "User" SET "projects" = ARRAY[("projects")[1]]
WHERE array_length("projects", 1) > 1;

UPDATE "User" SET "gameProjects" = ARRAY[("gameProjects")[1]]
WHERE array_length("gameProjects", 1) > 1;
