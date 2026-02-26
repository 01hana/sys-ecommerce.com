/*
  Warnings:

  - You are about to drop the column `createdAt` on the `categories` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `categories` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `customers` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `customers` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `users` table. All the data in the column will be lost.
  - Added the required column `updated_at` to the `categories` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `customers` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `products` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "categories" RENAME COLUMN "updatedAt" TO "updated_at";
ALTER TABLE "categories" RENAME COLUMN "createdAt" TO "created_at";

-- AlterTable
ALTER TABLE "customers" RENAME COLUMN "updatedAt" TO "updated_at";
ALTER TABLE "customers" RENAME COLUMN "createdAt" TO "created_at";

-- AlterTable
ALTER TABLE "products" RENAME COLUMN "updatedAt" TO "updated_at";
ALTER TABLE "products" RENAME COLUMN "createdAt" TO "created_at";

-- AlterTable
ALTER TABLE "users" RENAME COLUMN "updatedAt" TO "updated_at";
ALTER TABLE "users" RENAME COLUMN "createdAt" TO "created_at";

