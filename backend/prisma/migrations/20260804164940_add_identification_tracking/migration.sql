-- AlterTable
ALTER TABLE "SeatReservation" ADD COLUMN     "identificationNumber" TEXT,
ADD COLUMN     "identificationType" TEXT;

-- AlterTable
ALTER TABLE "TemporaryLock" ADD COLUMN     "segmentMask" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "identificationNumber" TEXT,
ADD COLUMN     "identificationType" TEXT;

-- CreateIndex
CREATE INDEX "SeatReservation_identificationNumber_travelDate_status_idx" ON "SeatReservation"("identificationNumber", "travelDate", "status");

-- AddForeignKey
ALTER TABLE "Schedule" ADD CONSTRAINT "Schedule_originId_fkey" FOREIGN KEY ("originId") REFERENCES "Station"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Schedule" ADD CONSTRAINT "Schedule_destinationId_fkey" FOREIGN KEY ("destinationId") REFERENCES "Station"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
