-- CreateTable: Submission history
CREATE TABLE "Submission" (
    "id"              SERIAL PRIMARY KEY,
    "userId"          INTEGER,
    "codePaneId"      INTEGER NOT NULL,
    "language"        TEXT NOT NULL,
    "code"            TEXT NOT NULL,
    "status"          TEXT NOT NULL,
    "passedCount"     INTEGER NOT NULL DEFAULT 0,
    "totalCount"      INTEGER NOT NULL DEFAULT 0,
    "executionTimeMs" INTEGER,
    "error"           TEXT,
    "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Submission_userId_fkey" FOREIGN KEY ("userId")
        REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE,

    CONSTRAINT "Submission_codePaneId_fkey" FOREIGN KEY ("codePaneId")
        REFERENCES "CodePane"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
