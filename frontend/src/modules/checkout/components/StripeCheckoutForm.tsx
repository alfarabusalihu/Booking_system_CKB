'use client';

import { useState, useEffect } from 'react';
import { loadStripe, StripeElementsOptions } from '@stripe/stripe-js';
import {Elements,PaymentElement,useStripe,useElements,} from '@stripe/react-stripe-js';
import { CreditCard, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ''
);

interface StripeCheckoutFormProps {
  clientSecret: string;
  totalAmountLkr: number;
  onSuccess: () => void | Promise<void>;
}

function CheckoutForm({
  onSuccess,
  totalAmountLkr,
}: {
  onSuccess: () => void | Promise<void>;
  totalAmountLkr: number;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

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
        // Wait a moment to show success state
        setTimeout(async () => {
          await onSuccess();
        }, 1500);
      }
    } catch (err) {
      console.error('Payment error:', err);
      setErrorMessage('An unexpected error occurred. Please try again.');
      setIsProcessing(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="text-center py-8 space-y-4">
        <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle className="w-8 h-8 text-emerald-400" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-white mb-2">Payment Successful!</h3>
          <p className="text-slate-400 text-sm">
            Generating your ticket and booking confirmation...
          </p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-white">Payment Details</h3>
          <div className="text-right">
            <p className="text-xs text-slate-400">Total Amount</p>
            <p className="text-xl font-black text-emerald-400">
              LKR {totalAmountLkr.toLocaleString()}
            </p>
          </div>
        </div>

        <div className="glass-panel p-4 space-y-3">
          <PaymentElement
            options={{
              layout: 'tabs',
            }}
          />
        </div>
      </div>

      {errorMessage && (
        <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs font-bold flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || !elements || isProcessing}
        className="w-full h-13 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-black text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-600/30 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isProcessing ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Processing Secure Payment...
          </>
        ) : (
          <>
            <CreditCard className="w-4 h-4" />
            Confirm & Pay LKR {totalAmountLkr.toLocaleString()}
          </>
        )}
      </button>

      <p className="text-xs text-slate-500 text-center">
        Your payment is secured by Stripe. Card details are never stored on our servers.
      </p>
    </form>
  );
}

export function StripeCheckoutForm({
  clientSecret,
  totalAmountLkr,
  onSuccess,
}: StripeCheckoutFormProps) {
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
          },
        },
      });
    }
  }, [clientSecret]);

  if (!options) {
    return (
      <div className="text-center py-8">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-400 mx-auto" />
        <p className="text-slate-400 text-sm mt-4">Loading payment form...</p>
      </div>
    );
  }

  return (
    <Elements stripe={stripePromise} options={options}>
      <CheckoutForm onSuccess={onSuccess} totalAmountLkr={totalAmountLkr} />
    </Elements>
  );
}
