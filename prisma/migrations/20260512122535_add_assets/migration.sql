-- CreateTable
CREATE TABLE "asset_items" (
    "id" SERIAL NOT NULL,
    "category" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "asset_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asset_records" (
    "id" SERIAL NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "itemId" INTEGER NOT NULL,
    "amount" BIGINT NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "asset_records_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "asset_items_category_name_key" ON "asset_items"("category", "name");

-- CreateIndex
CREATE UNIQUE INDEX "asset_records_year_month_itemId_key" ON "asset_records"("year", "month", "itemId");

-- AddForeignKey
ALTER TABLE "asset_records" ADD CONSTRAINT "asset_records_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "asset_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
