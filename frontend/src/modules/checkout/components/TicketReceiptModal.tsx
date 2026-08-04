'use client';

import { useState } from 'react';
import { X, Download, CheckCircle } from 'lucide-react';
import { Document, Page, Text, View, Image, StyleSheet, pdf } from '@react-pdf/renderer';
import QRCode from 'qrcode';

interface TicketReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingData: {
    bookingRef: string;
    passengerName: string;
    passengerEmail: string;
    identificationNumber: string;
    trainId: string;
    seats: Array<{ seatNo: string; class: string }>;
    origin: string;
    destination: string;
    departureTime?: string;
    travelDate: string;
    totalAmount: number;
  };
}

const styles = StyleSheet.create({
  page: {
    padding: 30,
    backgroundColor: '#ffffff',
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 12,
    borderBottom: '2pt solid #1e293b',
    paddingBottom: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0f172a',
    textAlign: 'center',
    marginBottom: 3,
  },
  subtitle: {
    fontSize: 8,
    color: '#64748b',
    textAlign: 'center',
  },
  bookingRef: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#10b981',
    marginTop: 6,
    padding: 6,
    backgroundColor: '#f0fdf4',
    borderRadius: 4,
    textAlign: 'center',
  },
  section: {
    marginTop: 10,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 5,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  row: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
    gap: 10,
  },
  infoItem: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 7,
    color: '#64748b',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 9,
    color: '#0f172a',
    fontWeight: 'bold',
  },
  journeyRow: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 5,
    marginBottom: 5,
    padding: 6,
    backgroundColor: '#f8fafc',
    borderRadius: 4,
  },
  journeyLeft: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  journeyText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  arrow: {
    fontSize: 10,
    color: '#64748b',
    marginHorizontal: 6,
  },
  amountText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#10b981',
  },
  timelineContainer: {
    marginTop: 6,
    padding: 6,
    backgroundColor: '#f1f5f9',
    borderRadius: 4,
    borderLeft: '3pt solid #3b82f6',
  },
  timelineRow: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 3,
  },
  stationName: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  stationTime: {
    fontSize: 8,
    color: '#475569',
  },
  timeLabel: {
    fontSize: 7,
    color: '#64748b',
  },
  detailsRow: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 5,
    gap: 10,
  },
  seatsContainer: {
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
    marginTop: 5,
  },
  seatBadge: {
    padding: '4pt 7pt',
    backgroundColor: '#dbeafe',
    borderRadius: 3,
    fontSize: 8,
    fontWeight: 'bold',
    color: '#1e40af',
  },
  bottomSection: {
    marginTop: 12,
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 15,
  },
  leftColumn: {
    flex: 1,
  },
  qrContainer: {
    width: 90,
    padding: 8,
    backgroundColor: '#f8fafc',
    borderRadius: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  qrImage: {
    width: 70,
    height: 70,
  },
  qrText: {
    fontSize: 6,
    color: '#64748b',
    marginTop: 4,
    textAlign: 'center',
  },
  instructionItem: {
    fontSize: 7,
    color: '#475569',
    marginBottom: 3,
  },
  footer: {
    marginTop: 12,
    paddingTop: 8,
    borderTop: '1pt solid #e2e8f0',
  },
  footerText: {
    fontSize: 6,
    color: '#94a3b8',
    textAlign: 'center',
  },
});

async function generateQRCode(data: string): Promise<string> {
  try {
    return await QRCode.toDataURL(data, {
      width: 200,
      margin: 1,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    });
  } catch (err) {
    console.error('QR Code generation failed:', err);
    return '';
  }
}

// Calculate arrival time based on route (simplified for demo)
function calculateArrivalTime(origin: string, destination: string, departureTime: string): string {
  // Parse departure time (format: "HH:MM" or "H:MM AM/PM")
  const timeMatch = departureTime.match(/(\d{1,2}):(\d{2})/);
  if (!timeMatch) return 'TBD';
  
  let hours = parseInt(timeMatch[1]);
  const minutes = parseInt(timeMatch[2]);
  
  // Check if PM
  if (departureTime.toLowerCase().includes('pm') && hours < 12) {
    hours += 12;
  }
  
  // Route duration mapping (in minutes)
  const routeDurations: Record<string, number> = {
    'Colombo Fort-Kandy': 200,           // 3h 20min
    'Kandy-Badulla': 240,                // 4h
    'Colombo Fort-Badulla': 450,         // 7h 30min
    'Badulla-Kandy': 240,                // 4h
    'Kandy-Colombo Fort': 200,           // 3h 20min
    'Badulla-Colombo Fort': 450,         // 7h 30min
  };
  
  const routeKey = `${origin}-${destination}`;
  const durationMinutes = routeDurations[routeKey] || 180; // Default 3h
  
  // Calculate arrival time
  const totalMinutes = hours * 60 + minutes + durationMinutes;
  const arrivalHours = Math.floor(totalMinutes / 60) % 24;
  const arrivalMinutes = totalMinutes % 60;
  
  // Format time
  const period = arrivalHours >= 12 ? 'PM' : 'AM';
  const displayHours = arrivalHours > 12 ? arrivalHours - 12 : (arrivalHours === 0 ? 12 : arrivalHours);
  
  return `${displayHours}:${arrivalMinutes.toString().padStart(2, '0')} ${period}`;
}

function TrainTicketDocument({
  data,
  qrCodeDataURL,
}: {
  data: TicketReceiptModalProps['bookingData'];
  qrCodeDataURL: string;
}) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Sri Lanka Railways - Electronic Ticket</Text>
          <Text style={styles.subtitle}>Keep this ticket for verification during travel</Text>
          <Text style={styles.bookingRef}>Booking Ref: {data.bookingRef}</Text>
        </View>

        {/* Passenger Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Passenger Information</Text>
          <View style={styles.row}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Full Name</Text>
              <Text style={styles.infoValue}>{data.passengerName}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>{data.passengerEmail}</Text>
            </View>
          </View>
          <View style={styles.row}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>ID Number</Text>
              <Text style={styles.infoValue}>{data.identificationNumber}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Travel Date</Text>
              <Text style={styles.infoValue}>
                {new Date(data.travelDate).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </Text>
            </View>
          </View>
        </View>

        {/* Journey & Payment in One Row */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Journey & Payment</Text>
          <View style={styles.journeyRow}>
            <View style={styles.journeyLeft}>
              <Text style={styles.journeyText}>{data.origin}</Text>
              <Text style={styles.arrow}>→</Text>
              <Text style={styles.journeyText}>{data.destination}</Text>
            </View>
            <Text style={styles.amountText}>LKR {data.totalAmount.toLocaleString()}</Text>
          </View>
          
          {/* Station Timeline */}
          {data.departureTime && (
            <View style={styles.timelineContainer}>
              <View style={styles.timelineRow}>
                <Text style={styles.stationName}>{data.origin}</Text>
                <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Text style={styles.timeLabel}>Depart:</Text>
                  <Text style={styles.stationTime}>{data.departureTime}</Text>
                </View>
              </View>
              <View style={styles.timelineRow}>
                <Text style={styles.stationName}>{data.destination}</Text>
                <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Text style={styles.timeLabel}>Arrive:</Text>
                  <Text style={styles.stationTime}>
                    {calculateArrivalTime(data.origin, data.destination, data.departureTime)}
                  </Text>
                </View>
              </View>
            </View>
          )}
          
          <View style={styles.detailsRow}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Train ID</Text>
              <Text style={styles.infoValue}>{data.trainId}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Seats ({data.seats.length})</Text>
              <Text style={styles.infoValue}>
                {data.seats.map(s => s.seatNo).join(', ')}
              </Text>
            </View>
          </View>
        </View>

        {/* Bottom Section with Instructions & QR */}
        <View style={styles.bottomSection}>
          <View style={styles.leftColumn}>
            <Text style={styles.sectionTitle}>Travel Instructions</Text>
            <Text style={styles.instructionItem}>• Present this ticket and ID at station</Text>
            <Text style={styles.instructionItem}>• Arrive 15 minutes before departure</Text>
            <Text style={styles.instructionItem}>• Ticket is non-transferable</Text>
            <Text style={styles.instructionItem}>• Keep ticket until journey ends</Text>
            <Text style={[styles.instructionItem, { marginTop: 6 }]}>
              Support: support@railway.lk | +94 11 234 5678
            </Text>
          </View>
          
          {qrCodeDataURL && (
            <View style={styles.qrContainer}>
              <Image src={qrCodeDataURL} style={styles.qrImage} />
              <Text style={styles.qrText}>Scan at station</Text>
            </View>
          )}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Computer-generated e-ticket. Valid with ID. Keep until journey ends.
          </Text>
        </View>
      </Page>
    </Document>
  );
}

export function TicketReceiptModal({ isOpen, onClose, bookingData }: TicketReceiptModalProps) {
  const [isDownloading, setIsDownloading] = useState(false);

  if (!isOpen) return null;

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      // Generate QR code
      const qrData = JSON.stringify({
        ref: bookingData.bookingRef,
        id: bookingData.identificationNumber,
        date: bookingData.travelDate,
      });
      const qrCodeDataURL = await generateQRCode(qrData);

      // Generate PDF
      const doc = <TrainTicketDocument data={bookingData} qrCodeDataURL={qrCodeDataURL} />;
      const blob = await pdf(doc).toBlob();

      // Download
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Train-Ticket-${bookingData.bookingRef}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      console.log('Ticket PDF downloaded successfully');
    } catch (error) {
      console.error('Failed to generate ticket PDF:', error);
      alert('Failed to generate ticket. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl shadow-2xl max-w-md w-full border border-emerald-500/30 animate-in fade-in zoom-in duration-300">
        {/* Header */}
        <div className="p-6 border-b border-slate-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 border-2 border-emerald-500/50 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <h2 className="text-xl font-black text-white">Payment Successful!</h2>
                <p className="text-sm text-slate-400">Your ticket is ready</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-slate-700 hover:bg-slate-600 flex items-center justify-center text-slate-400 hover:text-white transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Booking Reference */}
          <div className="bg-gradient-to-r from-emerald-500/10 to-blue-500/10 border border-emerald-500/30 rounded-xl p-4">
            <p className="text-xs text-slate-400 mb-1">Booking Reference</p>
            <p className="text-2xl font-black text-emerald-400 font-mono tracking-wider">
              {bookingData.bookingRef}
            </p>
          </div>

          {/* Booking Details */}
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Passenger</span>
              <span className="text-white font-bold">{bookingData.passengerName}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Journey</span>
              <span className="text-white font-bold">
                {bookingData.origin} → {bookingData.destination}
              </span>
            </div>
            {bookingData.departureTime && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Departure</span>
                <span className="text-white font-bold">{bookingData.departureTime}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Date</span>
              <span className="text-white font-bold">
                {new Date(bookingData.travelDate).toLocaleDateString()}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Seats</span>
              <span className="text-white font-bold">
                {bookingData.seats.map(s => s.seatNo).join(', ')}
              </span>
            </div>
            <div className="flex justify-between text-sm pt-2 border-t border-slate-700">
              <span className="text-slate-400">Total Paid</span>
              <span className="text-emerald-400 font-black text-lg">
                LKR {bookingData.totalAmount.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Download Button */}
          <button
            onClick={handleDownload}
            disabled={isDownloading}
            className="w-full h-14 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold text-lg rounded-xl flex items-center justify-center gap-3 transition-all shadow-lg shadow-blue-600/30 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isDownloading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Generating PDF...
              </>
            ) : (
              <>
                <Download className="w-5 h-5" />
                Download Ticket
              </>
            )}
          </button>

          {/* Info */}
          <p className="text-xs text-center text-slate-500">
            Download your ticket and present it at the station along with your identification document
          </p>
        </div>
      </div>
    </div>
  );
}
