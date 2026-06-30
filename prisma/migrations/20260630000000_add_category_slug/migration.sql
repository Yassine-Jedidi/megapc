-- AlterTable
ALTER TABLE "Category" ADD COLUMN "slug" TEXT;

-- Backfill slugs from existing category names (handle French accents)
UPDATE "Category" SET "slug" = LOWER(
  REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
    REPLACE(REPLACE(REPLACE(REPLACE(REPLACE("name",
    ' ', '-'),
    '&', ''),
    '''', ''),
    'É', 'e'), 'È', 'e'), 'Ê', 'e'), 'Ë', 'e'),
    'é', 'e'), 'è', 'e'), 'ê', 'e'), 'ë', 'e'),
    'à', 'a'), 'â', 'a'),
    'ç', 'c'),
    'ô', 'o'), 'ö', 'o'),
    'ù', 'u'), 'û', 'u'), 'ü', 'u'),
    'î', 'i'), 'ï', 'i');

-- Make slug NOT NULL after backfill
ALTER TABLE "Category" ALTER COLUMN "slug" SET NOT NULL;

-- CreateUniqueIndex
CREATE UNIQUE INDEX "Category_slug_key" ON "Category"("slug");
