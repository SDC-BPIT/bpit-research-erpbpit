const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

Promise.all([
  p.user.count(),
  p.journal.count(),
  p.patent.count(),
  p.conference.count(),
  p.fDP.count(),
  p.bookChapter.count(),
  p.book.count(),
  p.department.count(),
]).then(([u, j, pa, c, f, bc, b, d]) => {
  console.log('=== DATABASE RECORD COUNTS ===');
  console.log('Users:', u);
  console.log('Departments:', d);
  console.log('Journals:', j);
  console.log('Patents:', pa);
  console.log('Conferences:', c);
  console.log('FDPs:', f);
  console.log('Book Chapters:', bc);
  console.log('Books:', b);
  console.log('==============================');
  console.log('DATABASE_URL:', process.env.DATABASE_URL);
  p.$disconnect();
}).catch(e => {
  console.error('DB CONNECTION ERROR:', e.message);
  p.$disconnect();
});
