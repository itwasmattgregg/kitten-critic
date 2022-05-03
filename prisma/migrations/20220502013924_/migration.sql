-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Vote" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "url" TEXT NOT NULL,
    "up" BOOLEAN NOT NULL,
    "title" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "userId" TEXT NOT NULL,
    CONSTRAINT "Vote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Vote" ("createdAt", "id", "up", "updatedAt", "url", "userId") SELECT "createdAt", "id", "up", "updatedAt", "url", "userId" FROM "Vote";
DROP TABLE "Vote";
ALTER TABLE "new_Vote" RENAME TO "Vote";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
