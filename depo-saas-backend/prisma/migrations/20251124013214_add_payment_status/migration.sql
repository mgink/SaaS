-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "isCash" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "isPaid" BOOLEAN NOT NULL DEFAULT false;
