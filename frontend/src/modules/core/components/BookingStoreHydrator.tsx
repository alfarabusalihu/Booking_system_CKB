'use client';

import { useEffect } from 'react';
import { useBookingStore } from '@/modules/core/store';

export function BookingStoreHydrator() {
  useEffect(() => {
    void useBookingStore.persist.rehydrate();
  }, []);

  return null;
}
