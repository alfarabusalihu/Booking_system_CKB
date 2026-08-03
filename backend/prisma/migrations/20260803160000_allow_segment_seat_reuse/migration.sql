-- Allow one physical seat to be held on multiple non-overlapping route segments.
DROP INDEX IF EXISTS "TemporaryLock_trainId_seatId_travelDate_key";

CREATE INDEX IF NOT EXISTS "TemporaryLock_trainId_seatId_travelDate_idx"
ON "TemporaryLock"("trainId", "seatId", "travelDate");
