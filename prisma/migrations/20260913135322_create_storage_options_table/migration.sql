-- CreateTable
CREATE TABLE "storage_options" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "type" TEXT NOT NULL DEFAULT 'local',
    "url" TEXT NOT NULL,
    "external_url" TEXT NOT NULL,
    "username" TEXT,
    "password" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "deleted_at" DATETIME
);

-- CreateIndex
CREATE INDEX "storage_options_deleted_at_idx" ON "storage_options"("deleted_at");
