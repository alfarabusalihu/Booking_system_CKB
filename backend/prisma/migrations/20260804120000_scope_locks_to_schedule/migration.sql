ALTER TABLE "TemporaryLock"
ADD COLUMN IF NOT EXISTS "scheduleId" TEXT;

CREATE INDEX IF NOT EXISTS "TemporaryLock_scheduleId_seatId_travelDate_idx"
ON "TemporaryLock"("scheduleId", "seatId", "travelDate");
