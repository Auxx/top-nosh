-- CreateTable
CREATE TABLE "files" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "original_file_name" TEXT NOT NULL,
    "file_size" INTEGER NOT NULL,
    "mime_type" TEXT NOT NULL,
    "generated_file_name" TEXT NOT NULL,
    "storage_id" TEXT NOT NULL,
    "location_path" TEXT NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'staging',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "deleted_at" DATETIME,
    CONSTRAINT "files_storage_id_fkey" FOREIGN KEY ("storage_id") REFERENCES "storage_options" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "files_storage_id_idx" ON "files"("storage_id");

-- CreateIndex
CREATE INDEX "files_deleted_at_idx" ON "files"("deleted_at");

-- CreateIndex
CREATE INDEX "files_state_idx" ON "files"("state");
