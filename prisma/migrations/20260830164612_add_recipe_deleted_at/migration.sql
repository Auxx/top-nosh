-- AlterTable
ALTER TABLE "recipes" ADD COLUMN "deleted_at" DATETIME;

-- CreateIndex
CREATE INDEX "recipes_deleted_at_idx" ON "recipes"("deleted_at");
