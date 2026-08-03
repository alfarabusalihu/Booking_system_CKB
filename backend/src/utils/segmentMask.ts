// Station index for bitmask segment calculation
// Ordered by geographic position on the rail network
const STATION_INDEX: Record<string, number> = {
  CMB: 0, // Colombo Fort
  KND: 1, // Kandy
  BDL: 2, // Badulla
};

/**
 * Calculates a bitmask integer representing the segment of track
 * between two station codes. Two journeys conflict if their masks overlap:
 *   (maskA & maskB) !== 0
 *
 * Example: CMB→KND = (1<<1)-(1<<0) = 2-1 = 0b0001
 *          KND→BDL = (1<<2)-(1<<1) = 4-2 = 0b0010
 *          CMB→BDL = (1<<2)-(1<<0) = 4-1 = 0b0011 (overlaps both above)
 */
export function calculateSegmentMask(fromCode: string, toCode: string): number {
  const startIdx = STATION_INDEX[fromCode] ?? 0;
  const endIdx = STATION_INDEX[toCode] ?? 1;
  const low = Math.min(startIdx, endIdx);
  const high = Math.max(startIdx, endIdx);
  return (1 << high) - (1 << low);
}
