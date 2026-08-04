// Script to fix existing reservations with invalid prices
import { prisma } from '../src/lib/prisma.js';

async function fixPrices() {
  console.log('🔍 Checking for reservations with invalid prices...');
  
  const invalidReservations = await prisma.seatReservation.findMany({
    where: {
      priceLkr: { lte: 0 }
    },
    include: { seat: true }
  });
  
  console.log(`📊 Found ${invalidReservations.length} reservations with invalid prices`);
  
  if (invalidReservations.length === 0) {
    console.log('✅ All reservations have valid prices!');
    return;
  }
  
  let fixed = 0;
  for (const reservation of invalidReservations) {
    const price = reservation.seat.class === '1st Class' ? 1200 : 650;
    
    await prisma.seatReservation.update({
      where: { id: reservation.id },
      data: { priceLkr: price }
    });
    
    console.log(`✓ Fixed reservation ${reservation.id}: ${reservation.seat.seatNo} (${reservation.seat.class}) → ${price} LKR`);
    fixed++;
  }
  
  console.log(`\n✅ Fixed ${fixed} reservations successfully!`);
  
  // Verify fix
  const remaining = await prisma.seatReservation.count({
    where: { priceLkr: 0 }
  });
  
  if (remaining === 0) {
    console.log('✅ Verification passed - no reservations with zero price');
  } else {
    console.warn(`⚠️  Warning: ${remaining} reservations still have zero price`);
  }
}

fixPrices()
  .then(() => {
    console.log('\n🎉 Price fix completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error fixing prices:', error);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
