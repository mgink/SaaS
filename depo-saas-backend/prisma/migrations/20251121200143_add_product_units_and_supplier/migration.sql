-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "itemsPerBox" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "supplierId" TEXT,
ADD COLUMN     "unitType" TEXT NOT NULL DEFAULT 'PIECE';

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;
