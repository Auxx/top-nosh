-- CreateTable
CREATE TABLE "galleries" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "deleted_at" DATETIME
);

-- CreateTable
CREATE TABLE "gallery_images" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "gallery_id" TEXT NOT NULL,
    "full_size_file_id" TEXT NOT NULL,
    "thumbnail_file_id" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "deleted_at" DATETIME,
    CONSTRAINT "gallery_images_gallery_id_fkey" FOREIGN KEY ("gallery_id") REFERENCES "galleries" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "gallery_images_full_size_file_id_fkey" FOREIGN KEY ("full_size_file_id") REFERENCES "files" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "gallery_images_thumbnail_file_id_fkey" FOREIGN KEY ("thumbnail_file_id") REFERENCES "files" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "galleries_deleted_at_idx" ON "galleries"("deleted_at");

-- CreateIndex
CREATE INDEX "gallery_images_gallery_id_idx" ON "gallery_images"("gallery_id");

-- CreateIndex
CREATE INDEX "gallery_images_deleted_at_idx" ON "gallery_images"("deleted_at");
