/**
 * Search Module Types
 * Centralized type definitions for search and station functionality
 */

export interface SeatData {
  id: string;
  seatNo: string;
  class: string;
  isAvailable: boolean;
  isBooked: boolean;
  isLocked: boolean;
  isSelected?: boolean;
  priceLkr?: number;
}

export interface SearchBoxProps {
  onSearch?: (query: {
    origin: string;
    destination: string;
    date: string;
  }) => void;
}
