/**
 * Seat Booking Module Types
 * Centralized type definitions for seat selection and booking functionality
 */

import type { SeatData } from '@/modules/search/types';

export type ViewMode = 'ALL' | 'BOOKED_ONLY';

export interface TrainTimeSwitcherProps {
  currentTrainId: string;
  currentScheduleId?: string;
  schedules: Array<{
    id: string;
    trainId: string;
    trainName: string;
    departureTime: string;
    arrivalTime: string;
  }>;
  onSwitchTrain: (trainId: string, scheduleId: string) => void;
}

export interface TrainSeatGridBoxProps {
  seats: SeatData[];
  selectedSeatIds: string[];
  onSeatClick: (seatId: string) => void;
  isLoading?: boolean;
}

export interface SeatMapContainerProps {
  trainId: string;
  scheduleId?: string;
  travelDate: string;
  origin: string;
  destination: string;
}

export interface RouteSummaryCardProps {
  currentTrainId: string;
  currentScheduleId?: string;
  origin: string;
  destination: string;
  travelDate: string;
  departureTime?: string;
  arrivalTime?: string;
}

export interface ContextualLeftPanelProps {
  pendingSeatNos?: string[];
  showAuthOverride?: boolean;
  onAuthSuccess?: () => void;
}
