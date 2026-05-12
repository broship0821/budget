-- AlterTable
ALTER TABLE "asset_items" DROP COLUMN "category";

-- CreateIndex
CREATE UNIQUE INDEX "asset_items_name_key" ON "asset_items"("name");
