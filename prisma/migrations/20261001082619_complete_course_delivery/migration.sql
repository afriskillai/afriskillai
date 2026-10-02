/*
  Warnings:

  - Added the required column `customerEmail` to the `Order` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "DeliveryStatus" AS ENUM ('PENDING', 'PROCESSING', 'SENT', 'FAILED');

-- CreateEnum
CREATE TYPE "DeliveryType" AS ENUM ('PURCHASE_EMAIL', 'RESEND_EMAIL');

-- CreateEnum
CREATE TYPE "TokenType" AS ENUM ('EMAIL_VERIFICATION', 'PASSWORD_RESET');

-- AlterTable
ALTER TABLE "Course" ADD COLUMN     "privateAccessUrl" TEXT,
ADD COLUMN     "privatePdfName" TEXT,
ADD COLUMN     "privatePdfPath" TEXT,
ADD COLUMN     "privatePdfSize" INTEGER;

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "customerEmail" TEXT NOT NULL,
ADD COLUMN     "customerFirstName" TEXT,
ADD COLUMN     "customerLastName" TEXT,
ADD COLUMN     "customerPhone" TEXT;

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "verifiedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "phone" TEXT;

-- CreateTable
CREATE TABLE "AccountToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "TokenType" NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AccountToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CourseDelivery" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "paymentId" TEXT,
    "recipientEmail" TEXT NOT NULL,
    "type" "DeliveryType" NOT NULL DEFAULT 'PURCHASE_EMAIL',
    "status" "DeliveryStatus" NOT NULL DEFAULT 'PENDING',
    "providerMessageId" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastAttemptAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CourseDelivery_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AccountToken_tokenHash_key" ON "AccountToken"("tokenHash");

-- CreateIndex
CREATE INDEX "AccountToken_userId_idx" ON "AccountToken"("userId");

-- CreateIndex
CREATE INDEX "AccountToken_type_idx" ON "AccountToken"("type");

-- CreateIndex
CREATE INDEX "AccountToken_expiresAt_idx" ON "AccountToken"("expiresAt");

-- CreateIndex
CREATE INDEX "AccountToken_userId_type_idx" ON "AccountToken"("userId", "type");

-- CreateIndex
CREATE INDEX "CourseDelivery_orderId_idx" ON "CourseDelivery"("orderId");

-- CreateIndex
CREATE INDEX "CourseDelivery_courseId_idx" ON "CourseDelivery"("courseId");

-- CreateIndex
CREATE INDEX "CourseDelivery_paymentId_idx" ON "CourseDelivery"("paymentId");

-- CreateIndex
CREATE INDEX "CourseDelivery_recipientEmail_idx" ON "CourseDelivery"("recipientEmail");

-- CreateIndex
CREATE INDEX "CourseDelivery_status_idx" ON "CourseDelivery"("status");

-- CreateIndex
CREATE INDEX "CourseDelivery_createdAt_idx" ON "CourseDelivery"("createdAt");

-- CreateIndex
CREATE INDEX "CourseDelivery_status_createdAt_idx" ON "CourseDelivery"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Order_customerEmail_idx" ON "Order"("customerEmail");

-- AddForeignKey
ALTER TABLE "AccountToken" ADD CONSTRAINT "AccountToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseDelivery" ADD CONSTRAINT "CourseDelivery_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseDelivery" ADD CONSTRAINT "CourseDelivery_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseDelivery" ADD CONSTRAINT "CourseDelivery_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
