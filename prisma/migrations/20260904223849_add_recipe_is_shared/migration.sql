-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_recipes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "cuisine" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "servings" INTEGER NOT NULL,
    "source" TEXT,
    "is_shared" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "deleted_at" DATETIME
);
INSERT INTO "new_recipes" ("category", "created_at", "cuisine", "deleted_at", "description", "id", "name", "servings", "source", "updated_at") SELECT "category", "created_at", "cuisine", "deleted_at", "description", "id", "name", "servings", "source", "updated_at" FROM "recipes";
DROP TABLE "recipes";
ALTER TABLE "new_recipes" RENAME TO "recipes";
CREATE INDEX "recipes_cuisine_idx" ON "recipes"("cuisine");
CREATE INDEX "recipes_category_idx" ON "recipes"("category");
CREATE INDEX "recipes_cuisine_category_idx" ON "recipes"("cuisine", "category");
CREATE INDEX "recipes_deleted_at_idx" ON "recipes"("deleted_at");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
