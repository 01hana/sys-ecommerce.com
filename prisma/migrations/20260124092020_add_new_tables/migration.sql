-- AlterTable
ALTER TABLE "products" ADD COLUMN     "description" TEXT,
ADD COLUMN     "stock" INTEGER NOT NULL DEFAULT 0;
