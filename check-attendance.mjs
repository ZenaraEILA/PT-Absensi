import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
try {
  const users = await p.user.findMany({ include: { attendances: { orderBy: { tanggal: 'desc' }, take: 5 } } });
  for (const u of users) {
    console.log(u.nomorInduk, '- attendances:', u.attendances.length);
    for (const a of u.attendances) {
      console.log('  ', a.tanggal.toISOString().slice(0,10), 'checkIn:', a.checkIn?.toISOString().slice(11,16), 'checkOut:', a.checkOut?.toISOString().slice(11,16), 'status:', a.status);
    }
  }
} finally {
  await p.$disconnect();
}
