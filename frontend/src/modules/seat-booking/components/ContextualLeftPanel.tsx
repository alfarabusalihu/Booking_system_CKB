'use client';

import { Info } from 'lucide-react';
import { useBookingStore } from '@/modules/core/store';
import { InlineAuthPanel } from '@/modules/auth/components/InlineAuthPanel';
import { CheckoutPanel } from '@/modules/checkout/components/CheckoutPanel';

interface ContextualLeftPanelProps {
  pendingSeatNos?: string[];
  showAuthOverride?: boolean;
  onClearPendingSeat?: () => void;
  onAuthComplete?: () => void | Promise<void>;
  from: string;
  to: string;
  date: string;
  trainId: string;
  scheduleId?: string;
}

export function ContextualLeftPanel({
  pendingSeatNos = [],
  showAuthOverride = false,
  onClearPendingSeat,
  onAuthComplete,
  from,
  to,
  date,
  trainId,
  scheduleId,
}: ContextualLeftPanelProps) {
  const { cart, user } = useBookingStore();
  const activeCart = cart.filter((item) => item.trainId === trainId && (!scheduleId || item.scheduleId === scheduleId));

  const handleAuthComplete = async () => {
    if (onClearPendingSeat) onClearPendingSeat();
    if (onAuthComplete) await onAuthComplete();
  };

  const isGuestMode = !user;
  const hasCart = activeCart.length > 0;
  const showAuthPanel = isGuestMode && (hasCart || pendingSeatNos.length > 0 || showAuthOverride);

  return (
    <div className="w-full h-full flex flex-col gap-6">
        {showAuthPanel && (
          <InlineAuthPanel
            pendingSeatNos={pendingSeatNos}
            onAuthComplete={handleAuthComplete}
          />
        )}

        {user && hasCart && (
          <CheckoutPanel
            activeCart={activeCart}
          />
        )}

        {!showAuthPanel && !(user && hasCart) && (
          <div className="glass-panel p-6 md:p-8 space-y-5 animate-panelIn transition-card">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                <Info className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-white">Interactive Seat Reservation Rules</h3>
                <p className="text-slate-400 text-xs">Sri Lanka Railways Bitmask Availability Protocol</p>
              </div>
            </div>

            <div className="space-y-3 text-xs text-slate-300 leading-relaxed pt-2 border-t border-slate-800">
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5">
                  1
                </span>
                <p><strong>Guest-First View</strong>: Anyone can view real-time seat availability on the Train Coach on the RIGHT.</p>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5">
                  2
                </span>
                <p><strong>10-Minute Atomic Hold</strong>: Selecting a seat immediately locks it on PostgreSQL row level for 10 minutes.</p>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5">
                  3
                </span>
                <p><strong>Bitmask Segment Hold</strong>: Seats booked for intermediate stops (e.g. Colombo to Kandy) automatically remain free for subsequent legs (e.g. Kandy to Badulla).</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-400">Maximum Limit</span>
              <span className="text-white font-black">6 Seats per passenger</span>
            </div>
          </div>
        )}
    </div>
  );
}
