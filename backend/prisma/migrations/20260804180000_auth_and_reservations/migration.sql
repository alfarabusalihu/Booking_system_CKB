-- CreateEnum
CREATE TYPE "ReservationStatus" AS ENUM ('HOLD', 'CONFIRMED', 'EXPIRED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SeatReservation" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "trainId" TEXT NOT NULL,
    "scheduleId" TEXT,
    "seatId" TEXT NOT NULL,
    "travelDate" DATE NOT NULL,
    "segmentMask" INTEGER NOT NULL DEFAULT 1,
    "status" "ReservationStatus" NOT NULL DEFAULT 'HOLD',
    "sessionId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "paymentIntentId" TEXT,
    "bookingRef" TEXT,
    "priceLkr" INTEGER NOT NULL DEFAULT 0,
    "lockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SeatReservation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "SeatReservation_bookingRef_key" ON "SeatReservation"("bookingRef");

-- CreateIndex
CREATE INDEX "SeatReservation_trainId_seatId_travelDate_idx" ON "SeatReservation"("trainId", "seatId", "travelDate");

-- CreateIndex
CREATE INDEX "SeatReservation_scheduleId_seatId_travelDate_idx" ON "SeatReservation"("scheduleId", "seatId", "travelDate");

-- CreateIndex
CREATE INDEX "SeatReservation_sessionId_idx" ON "SeatReservation"("sessionId");

-- CreateIndex
CREATE INDEX "SeatReservation_status_expiresAt_idx" ON "SeatReservation"("status", "expiresAt");

-- AddForeignKey
ALTER TABLE "SeatReservation" ADD CONSTRAINT "SeatReservation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeatReservation" ADD CONSTRAINT "SeatReservation_seatId_fkey" FOREIGN KEY ("seatId") REFERENCES "Seat"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
