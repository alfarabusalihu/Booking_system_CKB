import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding initial stations, trains, and schedules...');

  // Create Stations
  const cmb = await prisma.station.upsert({
    where: { code: 'CMB' },
    update: {},
    create: { name: 'Colombo Fort', code: 'CMB' },
  });

  const knd = await prisma.station.upsert({
    where: { code: 'KND' },
    update: {},
    create: { name: 'Kandy', code: 'KND' },
  });

  const bdl = await prisma.station.upsert({
    where: { code: 'BDL' },
    update: {},
    create: { name: 'Badulla', code: 'BDL' },
  });

  const gal = await prisma.station.upsert({
    where: { code: 'GAL' },
    update: {},
    create: { name: 'Galle', code: 'GAL' },
  });

  const ell = await prisma.station.upsert({
    where: { code: 'ELL' },
    update: {},
    create: { name: 'Ella', code: 'ELL' },
  });

  // Create Trains
  const podiMenike = await prisma.train.upsert({
    where: { id: 'train-podi-menike' },
    update: {},
    create: {
      id: 'train-podi-menike',
      name: 'Podi Menike (Express)',
      capacity: 60,
    },
  });

  const uluMenike = await prisma.train.upsert({
    where: { id: 'train-[#0001]' },
    update: {},
    create: {
      id: 'train-[#0001]',
      name: 'Udarata Menike',
      capacity: 60,
    },
  });

  // Seed Schedules
  const today = new Date();
  await prisma.schedule.deleteMany(); // Reset old test schedules

  await prisma.schedule.createMany({
    data: [
      {
        trainId: podiMenike.id,
        originId: cmb.id,
        destinationId: knd.id,
        departureTime: new Date(today.setHours(5, 55, 0, 0)),
        arrivalTime: new Date(today.setHours(9, 15, 0, 0)),
        travelDate: new Date(),
      },
      {
        trainId: podiMenike.id,
        originId: cmb.id,
        destinationId: knd.id,
        departureTime: new Date(today.setHours(8, 30, 0, 0)),
        arrivalTime: new Date(today.setHours(12, 0, 0, 0)),
        travelDate: new Date(),
      },
      {
        trainId: uluMenike.id,
        originId: cmb.id,
        destinationId: bdl.id,
        departureTime: new Date(today.setHours(12, 45, 0, 0)),
        arrivalTime: new Date(today.setHours(19, 30, 0, 0)),
        travelDate: new Date(),
      },
      {
        trainId: uluMenike.id,
        originId: cmb.id,
        destinationId: bdl.id,
        departureTime: new Date(today.setHours(20, 0, 0, 0)),
        arrivalTime: new Date(today.setHours(6, 0, 0, 0)),
        travelDate: new Date(),
      },
    ],
  });

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
