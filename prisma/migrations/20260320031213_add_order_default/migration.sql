-- AlterTable
ALTER TABLE "orders" ALTER COLUMN "order_status" SET DEFAULT 'pending',
ALTER COLUMN "payment_status" SET DEFAULT 'unpaid',
ALTER COLUMN "delivery_status" SET DEFAULT 'undelivered';
