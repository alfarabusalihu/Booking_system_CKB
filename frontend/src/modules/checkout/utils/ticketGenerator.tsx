import { Document, Page, Text, View, StyleSheet, pdf } from '@react-pdf/renderer';
import QRCode from 'qrcode';

interface TicketData {
  bookingRef: string;
  passengerName: string;
  passengerEmail: string;
  trainId: string;
  trainName?: string;
  seats: Array<{
    seatNo: string;
    class: string;
  }>;
  origin: string;
  destination: string;
  departureTime?: string;
  travelDate: string;
  totalAmount: number;
}

const styles = StyleSheet.create({
  page: {
    padding: 40,
    backgroundColor: '#ffffff',
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 20,
    borderBottom: '2pt solid #1e293b',
    paddingBottom: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 10,
    color: '#64748b',
  },
  bookingRef: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#10b981',
    marginTop: 10,
    padding: 10,
    backgroundColor: '#f0fdf4',
    borderRadius: 4,
    textAlign: 'center',
  },
  section: {
    marginTop: 20,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoGrid: {
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 15,
  },
  infoItem: {
    width: '45%',
    marginBottom: 10,
  },
  infoLabel: {
    fontSize: 9,
    color: '#64748b',
    marginBottom: 3,
  },
  infoValue: {
    fontSize: 11,
    color: '#0f172a',
    fontWeight: 'bold',
  },
  seatsContainer: {
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  seatBadge: {
    padding: '6pt 10pt',
    backgroundColor: '#dbeafe',
    borderRadius: 4,
    fontSize: 10,
    fontWeight: 'bold',
    color: '#1e40af',
  },
  qrContainer: {
    marginTop: 30,
    padding: 20,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  qrImage: {
    width: 150,
    height: 150,
  },
  qrText: {
    fontSize: 8,
    color: '#64748b',
    marginTop: 10,
    textAlign: 'center',
  },
  footer: {
    marginTop: 30,
    paddingTop: 15,
    borderTop: '1pt solid #e2e8f0',
  },
  footerText: {
    fontSize: 8,
    color: '#94a3b8',
    textAlign: 'center',
    marginBottom: 3,
  },
});

async function generateQRCode(data: string): Promise<string> {
  try {
    return await QRCode.toDataURL(data, {
      width: 300,
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

function TrainTicketDocument({
  data,
  qrCodeDataURL,
}: {
  data: TicketData;
  qrCodeDataURL: string;
}) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Sri Lanka Railways</Text>
          <Text style={styles.subtitle}>Electronic Train Ticket</Text>
          <Text style={styles.bookingRef}>Booking Reference: {data.bookingRef}</Text>
        </View>

        {/* Passenger Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Passenger Information</Text>
          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Full Name</Text>
              <Text style={styles.infoValue}>{data.passengerName}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Email Address</Text>
              <Text style={styles.infoValue}>{data.passengerEmail}</Text>
            </View>
          </View>
        </View>

        {/* Journey Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Journey Details</Text>
          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Train ID</Text>
              <Text style={styles.infoValue}>{data.trainId}</Text>
            </View>
            {data.trainName && (
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Train Name</Text>
                <Text style={styles.infoValue}>{data.trainName}</Text>
              </View>
            )}
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>From</Text>
              <Text style={styles.infoValue}>{data.origin}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>To</Text>
              <Text style={styles.infoValue}>{data.destination}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Travel Date</Text>
              <Text style={styles.infoValue}>
                {new Date(data.travelDate).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </Text>
            </View>
            {data.departureTime && (
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Departure Time</Text>
                <Text style={styles.infoValue}>{data.departureTime}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Seat Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Seat Information</Text>
          <View style={styles.seatsContainer}>
            {data.seats.map((seat, index) => (
              <View key={index} style={styles.seatBadge}>
                <Text>
                  {seat.class} - {seat.seatNo}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Payment Information */}
        <View style={styles.section}>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Total Amount Paid</Text>
            <Text style={[styles.infoValue, { fontSize: 14, color: '#10b981' }]}>
              LKR {data.totalAmount.toLocaleString()}
            </Text>
          </View>
        </View>

        {/* QR Code */}
        {qrCodeDataURL && (
          <View style={styles.qrContainer}>
            <Text style={[styles.sectionTitle, { marginBottom: 10 }]}>
              Ticket Verification Code
            </Text>
            <img src={qrCodeDataURL} style={styles.qrImage} />
            <Text style={styles.qrText}>
              Present this QR code at the station for ticket verification
            </Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            This is a computer-generated e-ticket and does not require a signature.
          </Text>
          <Text style={styles.footerText}>
            Please arrive at the station at least 15 minutes before departure.
          </Text>
          <Text style={styles.footerText}>
            For support, contact: support@railway.lk | +94 11 234 5678
          </Text>
        </View>
      </Page>
    </Document>
  );
}

export async function generateAndDownloadTicket(data: TicketData): Promise<void> {
  try {
    // Generate QR code with booking reference and validation data
    const qrData = JSON.stringify({
      ref: data.bookingRef,
      email: data.passengerEmail,
      date: data.travelDate,
    });
    const qrCodeDataURL = await generateQRCode(qrData);

    // Generate PDF
    const doc = <TrainTicketDocument data={data} qrCodeDataURL={qrCodeDataURL} />;
    const blob = await pdf(doc).toBlob();

    // Download the PDF
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Train-Ticket-${data.bookingRef}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    console.log('Ticket PDF generated and downloaded successfully');
  } catch (error) {
    console.error('Failed to generate ticket PDF:', error);
    throw new Error('Failed to generate ticket. Please contact support.');
  }
}
