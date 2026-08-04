-- Migration: Add price constraint and fix existing data
-- Date: 2026-08-04

-- First, update any reservations with invalid prices
UPDATE "SeatReservation" 
SET "priceLkr" = (
  CASE 
    WHEN (SELECT class FROM "Seat" WHERE id = "SeatReservation"."seatId") = '1st Class' 
    THEN 1200
    ELSE 650
  END
)
WHERE "priceLkr" <= 0 OR "priceLkr" IS NULL;

-- Add constraint to prevent future zero prices
ALTER TABLE "SeatReservation" 
ADD CONSTRAINT "priceLkr_positive" CHECK ("priceLkr" > 0);

-- Add index for better query performance on price
CREATE INDEX IF NOT EXISTS "idx_seatreservation_price" ON "SeatReservation"("priceLkr");
