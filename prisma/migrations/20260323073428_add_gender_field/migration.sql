-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('male', 'female', 'unknown');

-- AlterTable
ALTER TABLE "customers" ADD COLUMN     "gender" "Gender" NOT NULL DEFAULT 'unknown';
