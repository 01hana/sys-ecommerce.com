/*
  Warnings:

  - You are about to drop the column `image` on the `products` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[name]` on the table `products` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `cover` to the `products` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `category` on the `products` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "products" DROP COLUMN "image",
ADD COLUMN     "cover" TEXT NOT NULL,
ADD COLUMN     "images" TEXT[],
DROP COLUMN "category",
ADD COLUMN     "category" INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "products_name_key" ON "products"("name");
