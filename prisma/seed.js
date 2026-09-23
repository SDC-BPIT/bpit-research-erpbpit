const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  const depts = ['CSE','ECE','IT','EEE','MECH','CIVIL','CHEM','MBA','MCA','AIDS','AIML','CSD'];
  for (const name of depts) {
    await prisma.department.upsert({ where: { name }, update: {}, create: { name } });
  }
  console.log('Departments seeded!');

  const adminPass = await bcrypt.hash('admin123', 10);
  const existingAdmin = await prisma.user.findUnique({ where: { email: 'admin@bpitindia.ac.in' } });
  const adminFacultyId = existingAdmin?.facultyId || 'FAC001';
  
  await prisma.user.upsert({
    where: { email: 'admin@bpitindia.ac.in' },
    update: { name: 'Admin', role: 'admin', dept: 'Administration' },
    create: { name: 'Admin', email: 'admin@bpitindia.ac.in', password: adminPass, role: 'admin', dept: 'Administration', facultyId: adminFacultyId }
  });

  const existingPrincipal = await prisma.user.findUnique({ where: { email: 'principal@bpitindia.ac.in' } });
  const principalFacultyId = existingPrincipal?.facultyId || 'FAC002';
  
  await prisma.user.upsert({
    where: { email: 'principal@bpitindia.ac.in' },
    update: { name: 'Principal', role: 'admin', dept: 'Administration' },
    create: { name: 'Principal', email: 'principal@bpitindia.ac.in', password: adminPass, role: 'admin', dept: 'Administration', facultyId: principalFacultyId }
  });

  const facPass = await bcrypt.hash('faculty123', 10);
  const existingFaculty = await prisma.user.findUnique({ where: { email: 'amandureja@bpitindia.ac.in' } });
  const facultyFacultyId = existingFaculty?.facultyId || 'FAC003';
  
  const facultyUser = await prisma.user.upsert({
    where: { email: 'amandureja@bpitindia.ac.in' },
    update: {},
    create: { name: 'Aman Dureja', email: 'amandureja@bpitindia.ac.in', password: facPass, role: 'faculty', dept: 'CSE', facultyId: facultyFacultyId }
  });

  console.log('Users seeded!');

  // Seed test data for faculty user
  await prisma.journal.deleteMany({ where: { submittedById: facultyUser.id } });
  await prisma.patent.deleteMany({ where: { submittedById: facultyUser.id } });

  await prisma.journal.create({
    data: {
      title: 'Advanced Machine Learning Techniques for Image Processing',
      authors: 'Aman Dureja, Dr. Rajesh Kumar, Prof. Amit Singh',
      journal: 'IEEE Transactions on Computer Vision',
      issn: '2078-0966',
      publisher: 'IEEE',
      affiliation: 'BPIT',
      totalAuthors: '3',
      authorPosition: '1',
      correspondingAuthor: 'Yes',
      phdWork: 'No',
      publicationMonth: '3',
      year: '2025',
      volume: '45',
      issue: '2',
      pages: '234-245',
      impactFactor: '5.2',
      sciScie: 'Yes',
      esci: 'No',
      scopus: 'Yes',
      quartile: 'Q1',
      ugcCareListed: 'Yes',
      peerReviewed: 'Yes',
      department: 'CSE',
      status: 'Published',
      doi: 'https://doi.org/10.1109/TCV.2025.456789',
      link: 'https://example.com/paper1',
      academicYear: '2024-25',
      submittedById: facultyUser.id,
      submittedByName: facultyUser.name,
      submittedAt: new Date().toISOString().split('T')[0]
    }
  });

  await prisma.journal.create({
    data: {
      title: 'Deep Learning Architecture for Natural Language Processing',
      authors: 'Aman Dureja, Prof. Neha Sharma',
      journal: 'ACM Computing Surveys',
      issn: '0360-0300',
      publisher: 'ACM',
      affiliation: 'BPIT',
      totalAuthors: '2',
      authorPosition: '1',
      correspondingAuthor: 'Yes',
      phdWork: 'Yes',
      publicationMonth: '6',
      year: '2024',
      volume: '57',
      issue: '4',
      pages: '78-95',
      impactFactor: '8.1',
      sciScie: 'Yes',
      esci: 'No',
      scopus: 'Yes',
      quartile: 'Q1',
      ugcCareListed: 'Yes',
      peerReviewed: 'Yes',
      citationsWoS: '12',
      citationsGoogleScholar: '25',
      department: 'CSE',
      status: 'Published',
      academicYear: '2023-24',
      submittedById: facultyUser.id,
      submittedByName: facultyUser.name,
      submittedAt: new Date().toISOString().split('T')[0]
    }
  });

  await prisma.patent.create({
    data: {
      title: 'IoT-Based Smart Health Monitoring System',
      inventors: 'Aman Dureja, Rajesh Kumar',
      applicationNo: 'IPA/001/2024',
      filingDate: '2024-01-15',
      publicationDate: '2024-08-20',
      status: 'Published',
      type: 'Utility',
      country: 'India',
      patentNo: 'IN202214567890',
      yourAffiliationInIPR: 'BPIT',
      department: 'CSE',
      academicYear: '2024-25',
      submittedById: facultyUser.id,
      submittedByName: facultyUser.name,
      submittedAt: new Date().toISOString().split('T')[0]
    }
  });

  console.log('Sample records seeded for faculty user!');
  console.log('');
  console.log('Login credentials:');
  console.log('  Admin:     admin@bpitindia.ac.in      /  admin123');
  console.log('  Principal: principal@bpitindia.ac.in  /  admin123');
  console.log('  Faculty:   amandureja@bpitindia.ac.in /  faculty123');
}

main().catch(console.error).finally(function() { prisma.$disconnect(); });
