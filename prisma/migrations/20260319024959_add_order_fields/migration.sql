-- CreateTable
CREATE TABLE "orders" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "order_status" TEXT NOT NULL,
    "order_number" TEXT NOT NULL,
    "items" JSONB NOT NULL,
    "total_price" DOUBLE PRECISION NOT NULL,
    "payment_method" TEXT NOT NULL,
    "delivery_method" TEXT NOT NULL,
    "payment_status" TEXT NOT NULL,
    "delivery_status" TEXT NOT NULL,
    "memo" TEXT,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "orders_order_number_key" ON "orders"("order_number");
