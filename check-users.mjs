import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
try {
  const users = await p.user.findMany();
  console.log('Total users:', users.length);
  if (users.length === 0) {
    console.log('Database kosong!');
  } else {
    users.forEach(x => console.log(x.nomorInduk, x.email));
  }
} finally {
  await p.$disconnect();
}
