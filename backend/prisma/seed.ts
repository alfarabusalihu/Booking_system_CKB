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

  const colomboKandy = await upsertTrain('train-colombo-kandy-express', 'Colombo Kandy Express');
  const kandyColombo = await upsertTrain('train-kandy-colombo-express', 'Kandy Colombo Express');
  const colomboBadulla = await upsertTrain('train-colombo-badulla-express', 'Colombo Badulla Express');
  const badullaColombo = await upsertTrain('train-badulla-colombo-express', 'Badulla Colombo Express');
  const kandyBadulla = await upsertTrain('train-kandy-badulla-link', 'Kandy Badulla Link');
  const badullaKandy = await upsertTrain('train-badulla-kandy-link', 'Badulla Kandy Link');

  const today = new Date();
  const atTime = (hour: number, minute: number) => {
    const d = new Date(today);
    d.setHours(hour, minute, 0, 0);
    return d;
  };

  const seededSchedules = await prisma.schedule.createManyAndReturn({
    data: [
      {
        trainId: colomboKandy.id,
        originId: cmb.id,
        destinationId: knd.id,
        departureTime: atTime(5, 55),
        arrivalTime: atTime(9, 15),
        travelDate: new Date(),
      },
      {
        trainId: kandyColombo.id,
        originId: knd.id,
        destinationId: cmb.id,
        departureTime: atTime(15, 30),
        arrivalTime: atTime(19, 0),
        travelDate: new Date(),
      },
      {
        trainId: colomboBadulla.id,
        originId: cmb.id,
        destinationId: bdl.id,
        departureTime: atTime(6, 30),
        arrivalTime: atTime(14, 0),
        travelDate: new Date(),
      },
      {
        trainId: badullaColombo.id,
        originId: bdl.id,
        destinationId: cmb.id,
        departureTime: atTime(9, 0),
        arrivalTime: atTime(16, 30),
        travelDate: new Date(),
      },
      {
        trainId: kandyBadulla.id,
        originId: knd.id,
        destinationId: bdl.id,
        departureTime: atTime(10, 15),
        arrivalTime: atTime(15, 45),
        travelDate: new Date(),
      },
      {
        trainId: badullaKandy.id,
        originId: bdl.id,
        destinationId: knd.id,
        departureTime: atTime(11, 30),
        arrivalTime: atTime(17, 0),
        travelDate: new Date(),
      },
    ],
  });

  const trains = [colomboKandy, kandyColombo, colomboBadulla, badullaColombo, kandyBadulla, badullaKandy];
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

  for (const schedule of seededSchedules) {
    const seatsForTrain = await prisma.seat.findMany({
      where: { trainId: schedule.trainId },
      orderBy: [{ class: 'asc' }, { seatNo: 'asc' }],
      take: 5,
    });

    await prisma.temporaryLock.createMany({
      data: Array.from({ length: 14 }).flatMap((_, dayOffset) => {
        const travelDate = new Date(schedule.travelDate);
        travelDate.setDate(travelDate.getDate() + dayOffset);

        return seatsForTrain.map((seat, index) => ({
          trainId: schedule.trainId,
          scheduleId: schedule.id,
          seatId: seat.id,
          travelDate,
          segmentMask: index % 2 === 0 ? 1 : 3,
          expiresAt: lockExpiry,
          sessionId: `seed-booked-${schedule.id}`,
        }));
      }),
    });
  }

  console.log('Seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
