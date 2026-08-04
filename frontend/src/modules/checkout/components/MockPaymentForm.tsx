'use client';

import { useState } from 'react';
import { CreditCard, Lock, CheckCircle } from 'lucide-react';

interface MockPaymentFormProps {
  totalAmount: number;
  onPaymentSuccess: (identificationNumber: string) => void;
  onPaymentError?: (error: string) => void;
  travelDate: string; // Required for NIC duplicate check
}

export function MockPaymentForm({ 
  totalAmount, 
  onPaymentSuccess,
  onPaymentError,
  travelDate 
}: MockPaymentFormProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvc, setCvc] = useState('');
  const [cardholderName, setCardholderName] = useState('');
  const [identificationType, setIdentificationType] = useState<'NIC' | 'PASSPORT'>('NIC');
  const [identificationNumber, setIdentificationNumber] = useState('');

  const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/\s/g, '');
    const formatted = cleaned.match(/.{1,4}/g)?.join(' ') || cleaned;
    return formatted.slice(0, 19); // 16 digits + 3 spaces
  };

  const formatExpiryDate = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length >= 2) {
      return `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}`;
    }
    return cleaned;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validation
    if (!cardNumber || !expiryDate || !cvc || !cardholderName || !identificationNumber) {
      onPaymentError?.('Please fill in all payment details including identification');
      return;
    }

    if (cardNumber.replace(/\s/g, '').length !== 16) {
      onPaymentError?.('Please enter a valid 16-digit card number');
      return;
    }

    if (cvc.length !== 3) {
      onPaymentError?.('Please enter a valid 3-digit CVC');
      return;
    }

    // Validate expiry date
    if (expiryDate.length !== 5) {
      onPaymentError?.('Please enter a valid expiry date (MM/YY)');
      return;
    }

    const [month, year] = expiryDate.split('/');
    const monthNum = parseInt(month, 10);
    const yearNum = parseInt('20' + year, 10); // Convert YY to YYYY
    
    if (monthNum < 1 || monthNum > 12) {
      onPaymentError?.('Please enter a valid month (01-12)');
      return;
    }

    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1; // 0-indexed

    if (yearNum < currentYear || (yearNum === currentYear && monthNum < currentMonth)) {
      onPaymentError?.('Card expiry date has passed. Please check your card details.');
      return;
    }

    if (yearNum > currentYear + 10) {
      onPaymentError?.('Please enter a realistic expiry date (within 10 years)');
      return;
    }

    // Validate cardholder name (allow letters, spaces, hyphens)
    const namePattern = /^[A-Z\s-]+$/;
    if (!namePattern.test(cardholderName)) {
      onPaymentError?.('Please enter a valid name (letters, spaces, and hyphens only)');
      return;
    }

    if (cardholderName.trim().length < 2) {
      onPaymentError?.('Please enter a valid cardholder name');
      return;
    }

    // Validate identification number
    if (identificationType === 'NIC') {
      const nicLength = identificationNumber.length;
      if (nicLength !== 10 && nicLength !== 12) {
        onPaymentError?.('NIC should be 10 or 12 characters');
        return;
      }
      // Enhanced NIC format validation
      if (nicLength === 10) {
        // Old NIC: 9 digits + V/X
        const nicPattern = /^\d{9}[VX]$/;
        if (!nicPattern.test(identificationNumber)) {
          onPaymentError?.('Old NIC format: 9 digits followed by V or X (e.g., 956789012V)');
          return;
        }
      } else {
        // New NIC: 12 digits
        const nicPattern = /^\d{12}$/;
        if (!nicPattern.test(identificationNumber)) {
          onPaymentError?.('New NIC format: 12 digits (e.g., 199856789012)');
          return;
        }
      }
    } else {
      if (identificationNumber.length < 6) {
        onPaymentError?.('Please enter a valid passport number (minimum 6 characters)');
        return;
      }
      // Passport should be alphanumeric
      const passportPattern = /^[A-Z0-9]+$/;
      if (!passportPattern.test(identificationNumber)) {
        onPaymentError?.('Passport should contain only letters and numbers');
        return;
      }
    }

    setIsProcessing(true);

    // Check for duplicate NIC/Passport
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5050/api';
      const checkResponse = await fetch(`${apiBase}/checkout/check-identification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identificationType,
          identificationNumber,
          travelDate,
        }),
      });

      const checkData = await checkResponse.json();

      if (!checkData.success) {
        setIsProcessing(false);
        onPaymentError?.('Failed to validate identification. Please try again.');
        return;
      }

      if (!checkData.available) {
        setIsProcessing(false);
        onPaymentError?.(checkData.message || `This ${identificationType} is already used in an active booking for this date.`);
        return;
      }
    } catch (error) {
      console.error('Identification check error:', error);
      setIsProcessing(false);
      onPaymentError?.('Network error while validating identification. Please check your connection.');
      return;
    }

    // Simulate payment processing (mock - no real API call)
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Mock payment always succeeds
    setIsProcessing(false);
    onPaymentSuccess(identificationNumber);
  };

  return (
    <div className="space-y-6">
      {/* Payment Summary */}
      <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-2xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-400 mb-1">Total Amount</p>
            <p className="text-3xl font-black text-white">
              LKR {totalAmount.toLocaleString()}
            </p>
          </div>
          <div className="w-16 h-16 rounded-full bg-blue-500/20 flex items-center justify-center">
            <CreditCard className="w-8 h-8 text-blue-400" />
          </div>
        </div>
      </div>

      {/* Demo Notice */}
      <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex items-start gap-3">
        <Lock className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-bold text-amber-300 mb-1">Demo Payment Mode</p>
          <p className="text-xs text-amber-200/80">
            This is a simulated payment. No real transaction will be processed.
            Use any test card details to proceed.
          </p>
        </div>
      </div>

      {/* Payment Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Card Number */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Card Number
          </label>
          <div className="relative">
            <input
              type="text"
              value={cardNumber}
              onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
              placeholder="1234 5678 9012 3456"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
              disabled={isProcessing}
              maxLength={19}
            />
            <CreditCard className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          </div>
        </div>

        {/* Expiry and CVC */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Expiry Date
            </label>
            <input
              type="text"
              value={expiryDate}
              onChange={(e) => setExpiryDate(formatExpiryDate(e.target.value))}
              placeholder="MM/YY"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
              disabled={isProcessing}
              maxLength={5}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              CVC
            </label>
            <input
              type="text"
              value={cvc}
              onChange={(e) => setCvc(e.target.value.replace(/\D/g, '').slice(0, 3))}
              placeholder="123"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
              disabled={isProcessing}
              maxLength={3}
            />
          </div>
        </div>

        {/* Cardholder Name */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Cardholder Name
          </label>
          <input
            type="text"
            value={cardholderName}
            onChange={(e) => {
              // Allow only letters, spaces, and hyphens
              const value = e.target.value.toUpperCase().replace(/[^A-Z\s-]/g, '');
              setCardholderName(value);
            }}
            placeholder="JOHN DOE"
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
            disabled={isProcessing}
          />
          <p className="text-xs text-gray-500 mt-1">
            Letters, spaces, and hyphens only
          </p>
        </div>

        {/* Identification Section */}
        <div className="pt-4 border-t border-slate-700">
          <label className="block text-sm font-medium text-gray-300 mb-3">
            Identification Document
          </label>
          
          {/* ID Type Selection */}
          <div className="flex gap-3 mb-4">
            <button
              type="button"
              onClick={() => setIdentificationType('NIC')}
              disabled={isProcessing}
              className={`flex-1 py-2.5 px-4 rounded-lg font-medium text-sm transition-all ${
                identificationType === 'NIC'
                  ? 'bg-blue-600 text-white border-2 border-blue-500'
                  : 'bg-slate-800 text-gray-400 border-2 border-slate-700 hover:border-slate-600'
              }`}
            >
              NIC (National ID)
            </button>
            <button
              type="button"
              onClick={() => setIdentificationType('PASSPORT')}
              disabled={isProcessing}
              className={`flex-1 py-2.5 px-4 rounded-lg font-medium text-sm transition-all ${
                identificationType === 'PASSPORT'
                  ? 'bg-blue-600 text-white border-2 border-blue-500'
                  : 'bg-slate-800 text-gray-400 border-2 border-slate-700 hover:border-slate-600'
              }`}
            >
              Passport
            </button>
          </div>

          {/* ID Number Input */}
          <input
            type="text"
            value={identificationNumber}
            onChange={(e) => {
              const value = e.target.value.toUpperCase();
              // For NIC: allow digits and V/X, For Passport: allow alphanumeric
              const sanitized = identificationType === 'NIC' 
                ? value.replace(/[^0-9VX]/g, '')
                : value.replace(/[^A-Z0-9]/g, '');
              setIdentificationNumber(sanitized);
            }}
            placeholder={identificationType === 'NIC' ? '956789012V or 199856789012' : 'N1234567'}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
            disabled={isProcessing}
            maxLength={identificationType === 'NIC' ? 12 : 20}
          />
          <p className="text-xs text-gray-500 mt-2">
            {identificationType === 'NIC' 
              ? 'Old format: 9 digits + V (e.g., 956789012V) or New format: 12 digits' 
              : 'Alphanumeric, minimum 6 characters'}
          </p>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isProcessing}
          className="w-full h-14 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold text-lg rounded-xl flex items-center justify-center gap-3 transition-all shadow-lg shadow-blue-600/30 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isProcessing ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Processing Payment...
            </>
          ) : (
            <>
              <CheckCircle className="w-5 h-5" />
              Confirm Payment
            </>
          )}
        </button>

        {/* Security Notice */}
        <div className="flex items-center justify-center gap-2 text-xs text-gray-500 mt-4">
          <Lock className="w-3 h-3" />
          <span>Secure mock payment processing</span>
        </div>
      </form>

      {/* Test Cards Info */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
        <p className="text-xs font-bold text-gray-400 mb-2">Test Card Numbers:</p>
        <ul className="text-xs text-gray-500 space-y-1">
          <li>• Success: 4242 4242 4242 4242</li>
          <li>• Any expiry date in the future</li>
          <li>• Any 3-digit CVC</li>
        </ul>
      </div>
    </div>
  );
}
