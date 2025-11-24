-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'BRANCH_MANAGER';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "isPasswordChanged" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "phone" TEXT;
