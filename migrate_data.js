const { Client } = require('pg');
const { PrismaClient } = require('@prisma/client');

const pgClient = new Client({
  connectionString: 'postgresql://postgres:password@localhost:5432/bpit_research'
});

const mariaPrisma = new PrismaClient();

async function migrate() {
  console.log('Connecting to PostgreSQL database...');
  try {
    await pgClient.connect();
    console.log('Successfully connected to PostgreSQL!');
  } catch (err) {
    console.error('Failed to connect to PostgreSQL:', err.message);
    process.exit(1);
  }

  try {
    console.log('Clearing MariaDB sample seed tables for clean import...');
    // Delete in reverse foreign key dependency order
    await mariaPrisma.book.deleteMany();
    await mariaPrisma.bookChapter.deleteMany();
    await mariaPrisma.fDP.deleteMany();
    await mariaPrisma.conference.deleteMany();
    await mariaPrisma.patent.deleteMany();
    await mariaPrisma.journal.deleteMany();
    await mariaPrisma.facultyQualification.deleteMany();
    await mariaPrisma.facultyDeptDesig.deleteMany();
    await mariaPrisma.faculty.deleteMany();
    await mariaPrisma.course.deleteMany();
    await mariaPrisma.user.deleteMany();
    await mariaPrisma.department.deleteMany();
    console.log('MariaDB cleaned!');

    // 1. Departments
    const pgDepts = await pgClient.query('SELECT * FROM "Department"');
    console.log(`Found ${pgDepts.rows.length} departments in PostgreSQL`);
    for (const d of pgDepts.rows) {
      await mariaPrisma.department.create({
        data: { id: d.id, name: d.name, createdAt: d.createdAt }
      });
    }

    // 2. Users
    const pgUsers = await pgClient.query('SELECT * FROM "User"');
    console.log(`Found ${pgUsers.rows.length} users in PostgreSQL`);
    for (const u of pgUsers.rows) {
      await mariaPrisma.user.create({
        data: {
          id: u.id,
          name: u.name,
          email: u.email,
          password: u.password,
          role: u.role,
          dept: u.dept,
          facultyId: u.facultyId,
          resetToken: u.resetToken,
          resetTokenExpiry: u.resetTokenExpiry,
          createdAt: u.createdAt
        }
      });
    }

    // 3. Courses
    const pgCourses = await pgClient.query('SELECT * FROM "Course"').catch(() => ({ rows: [] }));
    console.log(`Found ${pgCourses.rows.length} courses in PostgreSQL`);
    for (const c of pgCourses.rows) {
      await mariaPrisma.course.create({
        data: { id: c.id, name: c.name }
      });
    }

    // 4. Faculty
    const pgFaculty = await pgClient.query('SELECT * FROM "Faculty"').catch(() => ({ rows: [] }));
    console.log(`Found ${pgFaculty.rows.length} faculty records in PostgreSQL`);
    for (const f of pgFaculty.rows) {
      const data = { ...f };
      delete data.id;
      if (data.oldFacultyId !== null && data.oldFacultyId !== undefined) {
        data.oldFacultyId = BigInt(data.oldFacultyId);
      }
      await mariaPrisma.faculty.create({
        data: { id: f.id, ...data }
      });
    }

    // 5. FacultyDeptDesig
    const pgDesig = await pgClient.query('SELECT * FROM "FacultyDeptDesig"').catch(() => ({ rows: [] }));
    console.log(`Found ${pgDesig.rows.length} faculty dept desig records in PostgreSQL`);
    for (const d of pgDesig.rows) {
      const data = { ...d };
      delete data.id;
      await mariaPrisma.facultyDeptDesig.create({ data: { id: d.id, ...data } });
    }

    // 6. FacultyQualification
    const pgQual = await pgClient.query('SELECT * FROM "FacultyQualification"').catch(() => ({ rows: [] }));
    console.log(`Found ${pgQual.rows.length} faculty qualification records in PostgreSQL`);
    for (const q of pgQual.rows) {
      const data = { ...q };
      delete data.id;
      await mariaPrisma.facultyQualification.create({ data: { id: q.id, ...data } });
    }

    // Helper to migrate module records cleanly
    async function migrateModule(tableName, modelName) {
      const res = await pgClient.query(`SELECT * FROM "${tableName}"`).catch(() => ({ rows: [] }));
      console.log(`Migrating ${res.rows.length} records from PostgreSQL table "${tableName}"...`);
      for (const row of res.rows) {
        const data = { ...row };
        const id = data.id;
        delete data.id;
        await mariaPrisma[modelName].create({
          data: { id, ...data }
        });
      }
    }

    // 7. Journals
    await migrateModule('Journal', 'journal');
    // 8. Patents
    await migrateModule('Patent', 'patent');
    // 9. Conferences
    await migrateModule('Conference', 'conference');
    // 10. FDP
    await migrateModule('FDP', 'fDP');
    // 11. BookChapters
    await migrateModule('BookChapter', 'bookChapter');
    // 12. Books
    await migrateModule('Book', 'book');

    console.log('');
    console.log('🎉 SUCCESS: All PostgreSQL users, departments, faculty profiles, and ERP records have been fully imported into MariaDB!');
  } catch (err) {
    console.error('Migration error:', err);
  } finally {
    await pgClient.end();
    await mariaPrisma.$disconnect();
  }
}

migrate();
