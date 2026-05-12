-- CreateTable
CREATE TABLE "memos" (
    "key" TEXT NOT NULL,
    "content" TEXT NOT NULL DEFAULT '',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "memos_pkey" PRIMARY KEY ("key")
);
