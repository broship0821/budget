-- CreateTable
CREATE TABLE "portfolio_records" (
    "id" SERIAL NOT NULL,
    "date" DATE NOT NULL,
    "amount" BIGINT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "portfolio_records_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "portfolio_records_date_key" ON "portfolio_records"("date");
