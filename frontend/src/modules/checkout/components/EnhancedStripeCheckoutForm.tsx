'use client';

import { useState, useEffect } from 'react';
import { loadStripe, StripeElementsOptions } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import {
  CreditCard,
  Loader2,
  Shield,
  Lock,
  AlertCircle,
  CheckCircle2,
  Info,
} from 'lucide-react';
import { PaymentSuccessAnimation } from './PaymentSuccessAnimation';

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ''
);

interface EnhancedStripeCheckoutFormProps {
  clientSecret: string;
  totalAmountLkr: number;
  seatCount: number;
  onSuccess: () => void | Promise<void>;
}

function CheckoutForm({
  onSuccess,
  totalAmountLkr,
  seatCount,
}: {
  onSuccess: () => void | Promise<void>;
  totalAmountLkr: number;
  seatCount: number;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'unknown'>('unknown');
  const [isElementReady, setIsElementReady] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setErrorMessage('');

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        redirect: 'if_required',
        confirmParams: {
          return_url: `${window.location.origin}/checkout/success`,
        },
      });

      if (error) {
        setErrorMessage(error.message || 'Payment failed. Please try again.');
        setIsProcessing(false);
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        setIsSuccess(true);
        // Wait for animation before calling success callback
        setTimeout(async () => {
          await onSuccess();
        }, 4000);
      }
    } catch (err) {
      console.error('Payment error:', err);
      setErrorMessage('An unexpected error occurred. Please try again.');
      setIsProcessing(false);
    }
  };

  if (isSuccess) {
    return <PaymentSuccessAnimation onComplete={onSuccess} />;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Amount Summary Card */}
      <div className="glass-panel p-5 space-y-3 border-emerald-500/20">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Total Amount</p>
            <p className="text-3xl font-black text-white mt-1">
              LKR {totalAmountLkr.toLocaleString()}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Seats</p>
            <p className="text-3xl font-black text-emerald-400 mt-1">{seatCount}</p>
          </div>
        </div>
        <div className="pt-3 border-t border-slate-800">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500">Per seat</span>
            <span className="text-slate-300 font-bold">
              LKR {Math.round(totalAmountLkr / seatCount).toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Security Badge */}
      <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
        <Shield className="w-4 h-4 text-emerald-400" />
        <span>Secured by Stripe • 256-bit SSL Encryption</span>
      </div>

      {/* Payment Element */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-indigo-400" />
            Payment Details
          </h3>
          {!isElementReady && (
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Loader2 className="w-3 h-3 animate-spin" />
              Loading...
            </div>
          )}
        </div>

        <div className="glass-panel p-4">
          <PaymentElement
            onReady={() => setIsElementReady(true)}
            onChange={(e) => {
              if (e.value.type === 'card') {
                setPaymentMethod('card');
              }
            }}
            options={{
              layout: 'tabs',
              wallets: {
                applePay: 'auto',
                googlePay: 'auto',
              },
            }}
          />
        </div>
      </div>

      {/* Info Box */}
      <div className="p-3.5 rounded-xl bg-blue-500/5 border border-blue-500/20 flex items-start gap-3">
        <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
        <div className="text-xs text-blue-300 space-y-1">
          <p className="font-bold">Your seats are reserved for 10 minutes</p>
          <p className="text-blue-400/80">Complete payment to confirm your booking</p>
        </div>
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-bold text-red-300">{errorMessage}</p>
            <p className="text-xs text-red-400/80 mt-1">
              Please check your card details and try again
            </p>
          </div>
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={!stripe || !elements || isProcessing || !isElementReady}
        className="w-full h-14 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-black text-base flex items-center justify-center gap-3 transition-all shadow-xl shadow-emerald-600/30 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none group relative overflow-hidden"
      >
        {/* Shimmer Effect */}
        {!isProcessing && (
          <div className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        )}

        {isProcessing ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Processing Secure Payment...</span>
          </>
        ) : (
          <>
            <Lock className="w-5 h-5" />
            <span>Pay LKR {totalAmountLkr.toLocaleString()}</span>
            <CheckCircle2 className="w-5 h-5" />
          </>
        )}
      </button>

      {/* Trust Indicators */}
      <div className="flex items-center justify-center gap-6 pt-2">
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <Lock className="w-3 h-3" />
          <span>PCI DSS Compliant</span>
        </div>
        <div className="w-px h-4 bg-slate-800" />
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <Shield className="w-3 h-3" />
          <span>3D Secure</span>
        </div>
      </div>

      {/* Footer Note */}
      <p className="text-xs text-slate-500 text-center leading-relaxed">
        Your payment information is encrypted and never stored on our servers.
        <br />
        Powered by <span className="text-indigo-400 font-bold">Stripe</span>
      </p>
    </form>
  );
}

export function EnhancedStripeCheckoutForm({
  clientSecret,
  totalAmountLkr,
  seatCount,
  onSuccess,
}: EnhancedStripeCheckoutFormProps) {
  const [options, setOptions] = useState<StripeElementsOptions | null>(null);

  useEffect(() => {
    if (clientSecret) {
      setOptions({
        clientSecret,
        appearance: {
          theme: 'night',
          variables: {
            colorPrimary: '#10b981',
            colorBackground: '#0f172a',
            colorText: '#f8fafc',
            colorDanger: '#ef4444',
            fontFamily: 'Inter, system-ui, sans-serif',
            spacingUnit: '4px',
            borderRadius: '12px',
            fontSizeBase: '14px',
          },
          rules: {
            '.Input': {
              border: '1px solid rgb(51 65 85)',
              boxShadow: 'none',
            },
            '.Input:focus': {
              border: '1px solid rgb(16 185 129)',
              boxShadow: '0 0 0 3px rgba(16, 185, 129, 0.1)',
            },
            '.Label': {
              fontWeight: '600',
              marginBottom: '8px',
            },
          },
        },
      });
    }
  }, [clientSecret]);

  if (!options) {
    return (
      <div className="text-center py-12">
        <div className="relative inline-flex items-center justify-center">
          <div className="absolute w-16 h-16 rounded-full bg-indigo-500/20 animate-ping" />
          <Loader2 className="w-8 h-8 animate-spin text-indigo-400 relative" />
        </div>
        <p className="text-slate-400 text-sm mt-4 font-medium">Initializing secure payment...</p>
        <p className="text-slate-600 text-xs mt-2">Connecting to Stripe</p>
      </div>
    );
  }

  return (
    <Elements stripe={stripePromise} options={options}>
      <CheckoutForm onSuccess={onSuccess} totalAmountLkr={totalAmountLkr} seatCount={seatCount} />
    </Elements>
  );
}
