-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_user_tokens" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'AUTHENTICATION',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "user_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_user_tokens" ("created_at", "id", "token", "user_id") SELECT "created_at", "id", "token", "user_id" FROM "user_tokens";
DROP TABLE "user_tokens";
ALTER TABLE "new_user_tokens" RENAME TO "user_tokens";
CREATE UNIQUE INDEX "user_tokens_token_key" ON "user_tokens"("token");
CREATE INDEX "user_tokens_user_id_idx" ON "user_tokens"("user_id");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
