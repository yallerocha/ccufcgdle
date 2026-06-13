-- area: single string -> string array (skip if already migrated)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'User'
      AND column_name = 'area'
      AND udt_name = 'text'
      AND data_type = 'text'
  ) THEN
    ALTER TABLE "User" ADD COLUMN "area_new" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
    UPDATE "User" SET "area_new" = ARRAY["area"]::TEXT[] WHERE "area" IS NOT NULL AND "area" <> '';
    ALTER TABLE "User" DROP COLUMN "area";
    ALTER TABLE "User" RENAME COLUMN "area_new" TO "area";
  END IF;
END $$;

-- projects: keep only the first entry when multiple were stored
UPDATE "User" SET "projects" = ARRAY[("projects")[1]]
WHERE "projects" IS NOT NULL AND array_length("projects", 1) > 1;

UPDATE "User" SET "gameProjects" = ARRAY[("gameProjects")[1]]
WHERE "gameProjects" IS NOT NULL AND array_length("gameProjects", 1) > 1;
