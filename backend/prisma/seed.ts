import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function upsertTrain(id: string, name: string) {
  return prisma.train.upsert({
    where: { id },
    update: { name, capacity: 60 },
    create: { id, name, capacity: 60 },
  });
}

async function main() {
  console.log('Seeding stations, supported routes, schedules, seats, and sample bookings...');

  await prisma.temporaryLock.deleteMany({ where: { sessionId: { startsWith: 'seed-booked-' } } });
  await prisma.schedule.deleteMany();

  const cmb = await prisma.station.upsert({
    where: { code: 'CMB' },
    update: { name: 'Colombo Fort' },
    create: { name: 'Colombo Fort', code: 'CMB' },
  });

  const knd = await prisma.station.upsert({
    where: { code: 'KND' },
    update: { name: 'Kandy' },
    create: { name: 'Kandy', code: 'KND' },
  });

  const bdl = await prisma.station.upsert({
    where: { code: 'BDL' },
    update: { name: 'Badulla' },
    create: { name: 'Badulla', code: 'BDL' },
  });

  await prisma.station.deleteMany({ where: { code: { in: ['ELL', 'GAL'] } } });

  // Create trains - one train serves multiple segments
  const expressEast = await upsertTrain('train-express-east', 'Express East');
  const expressWest = await upsertTrain('train-express-west', 'Express West');

  const today = new Date();
  const atTime = (hour: number, minute: number) => {
    const d = new Date(today);
    d.setHours(hour, minute, 0, 0);
    return d;
  };

  // CRITICAL: Same train, same departure time, different route segments
  // This enables segment-based booking where users only pay for their segment
  const seededSchedules = await prisma.schedule.createManyAndReturn({
    data: [
      // Express East - Departs Colombo at 6:00 AM
      // Segment 1: Colombo → Kandy (6:00 - 9:20)
      {
        trainId: expressEast.id,
        originId: cmb.id,
        destinationId: knd.id,
        departureTime: atTime(6, 0),
        arrivalTime: atTime(9, 20),
        travelDate: new Date(),
      },
      // Segment 2: Colombo → Badulla (SAME TRAIN, SAME 6:00 departure)
      {
        trainId: expressEast.id,
        originId: cmb.id,
        destinationId: bdl.id,
        departureTime: atTime(6, 0), // Same departure time!
        arrivalTime: atTime(13, 30),
        travelDate: new Date(),
      },
      // Segment 3: Kandy → Badulla (SAME TRAIN, continues from Kandy)
      {
        trainId: expressEast.id,
        originId: knd.id,
        destinationId: bdl.id,
        departureTime: atTime(9, 30), // Departs Kandy after 10min stop
        arrivalTime: atTime(13, 30),
        travelDate: new Date(),
      },

      // Express West - Departs Badulla at 14:00 PM
      // Segment 1: Badulla → Kandy (14:00 - 18:00)
      {
        trainId: expressWest.id,
        originId: bdl.id,
        destinationId: knd.id,
        departureTime: atTime(14, 0),
        arrivalTime: atTime(18, 0),
        travelDate: new Date(),
      },
      // Segment 2: Badulla → Colombo (SAME TRAIN, SAME 14:00 departure)
      {
        trainId: expressWest.id,
        originId: bdl.id,
        destinationId: cmb.id,
        departureTime: atTime(14, 0), // Same departure time!
        arrivalTime: atTime(21, 30),
        travelDate: new Date(),
      },
      // Segment 3: Kandy → Colombo (SAME TRAIN, continues from Kandy)
      {
        trainId: expressWest.id,
        originId: knd.id,
        destinationId: cmb.id,
        departureTime: atTime(18, 10), // Departs Kandy after 10min stop
        arrivalTime: atTime(21, 30),
        travelDate: new Date(),
      },
    ],
  });

  const trains = [expressEast, expressWest];
  for (const train of trains) {
    const existingSeatsCount = await prisma.seat.count({ where: { trainId: train.id } });
    if (existingSeatsCount === 0) {
      const seatData = [];
      for (let i = 1; i <= 20; i++) {
        seatData.push({ trainId: train.id, seatNo: `A${i}`, class: '1st Class' });
      }
      for (let i = 1; i <= 40; i++) {
        seatData.push({ trainId: train.id, seatNo: `B${i}`, class: '2nd Class' });
      }
      await prisma.seat.createMany({ data: seatData });
    }
  }

  const lockExpiry = new Date();
  lockExpiry.setFullYear(lockExpiry.getFullYear() + 1);

  // Only seed bookings for FULL ROUTE schedules to test segment-based booking properly
  // CMB→BDL and BDL→CMB schedules represent the full train journey
  const fullRouteSchedules = seededSchedules.filter(s => 
    (s.originId === cmb.id && s.destinationId === bdl.id) ||
    (s.originId === bdl.id && s.destinationId === cmb.id)
  );

  for (const schedule of fullRouteSchedules) {
    const seatsForTrain = await prisma.seat.findMany({
      where: { trainId: schedule.trainId },
      orderBy: [{ class: 'asc' }, { seatNo: 'asc' }],
      take: 5,
    });

    await prisma.temporaryLock.createMany({
      data: Array.from({ length: 14 }).flatMap((_, dayOffset) => {
        const travelDate = new Date(schedule.travelDate);
        travelDate.setDate(travelDate.getDate() + dayOffset);

        return seatsForTrain.map((seat, index) => {
          // Alternate between segment 1 only and full route (segments 1+2)
          // segmentMask 1 = first segment only (CMB→KND or BDL→KND)
          // segmentMask 3 = both segments (full route)
          const segmentMask = index % 2 === 0 ? 1 : 3;
          
          return {
            trainId: schedule.trainId,
            scheduleId: schedule.id,
            seatId: seat.id,
            travelDate,
            segmentMask,
            expiresAt: lockExpiry,
            sessionId: `seed-booked-${schedule.id}`,
          };
        });
      }),
    });
  }

  console.log('Seeding complete!');
  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('SEGMENT-BASED BOOKING TEST SCENARIOS:');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');
  console.log('Train: Express East (6:00 AM departure from Colombo)');
  console.log('  → Colombo to Kandy: 6:00 AM - 9:20 AM');
  console.log('  → Colombo to Badulla: 6:00 AM - 1:30 PM (full route)');
  console.log('  → Kandy to Badulla: 9:30 AM - 1:30 PM');
  console.log('');
  console.log('Train: Express West (2:00 PM departure from Badulla)');
  console.log('  → Badulla to Kandy: 2:00 PM - 6:00 PM');
  console.log('  → Badulla to Colombo: 2:00 PM - 9:30 PM (full route)');
  console.log('  → Kandy to Colombo: 6:10 PM - 9:30 PM');
  console.log('');
  console.log('TEST CASE:');
  console.log('  1. Book seat A1 for Colombo → Kandy (segment 1)');
  console.log('  2. Same seat A1 should be FREE for Kandy → Badulla (segment 2)');
  console.log('  3. User pays only for the segment they travel!');
  console.log('═══════════════════════════════════════════════════════════');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
