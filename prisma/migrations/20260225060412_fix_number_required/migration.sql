/*
  Warnings:

  - A unique constraint covering the columns `[number]` on the table `products` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "products_number_key" ON "products"("number");
