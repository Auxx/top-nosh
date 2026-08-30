-- CreateTable
CREATE TABLE "recipes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "cuisine" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "servings" INTEGER NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "recipe_stages" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "recipe_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "recipe_stages_recipe_id_fkey" FOREIGN KEY ("recipe_id") REFERENCES "recipes" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "cooking_steps" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "stage_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "cooking_steps_stage_id_fkey" FOREIGN KEY ("stage_id") REFERENCES "recipe_stages" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ingredients" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "stage_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "quantity" REAL NOT NULL,
    "unit" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "ingredients_stage_id_fkey" FOREIGN KEY ("stage_id") REFERENCES "recipe_stages" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "recipes_cuisine_idx" ON "recipes"("cuisine");

-- CreateIndex
CREATE INDEX "recipes_category_idx" ON "recipes"("category");

-- CreateIndex
CREATE INDEX "recipes_cuisine_category_idx" ON "recipes"("cuisine", "category");

-- CreateIndex
CREATE INDEX "recipe_stages_recipe_id_idx" ON "recipe_stages"("recipe_id");

-- CreateIndex
CREATE INDEX "cooking_steps_stage_id_idx" ON "cooking_steps"("stage_id");

-- CreateIndex
CREATE INDEX "ingredients_stage_id_idx" ON "ingredients"("stage_id");
