const {PrismaClient} = require('@prisma/client');
(async function(){
  const prisma = new PrismaClient();
  const dmmf = prisma._dmmf;
  const journal = dmmf.modelMap.Journal || dmmf.modelMap.journal;
  console.log('journal exists:', !!journal);
  if (journal) console.log(journal.fields.map(f => f.name).join(','));
  await prisma.$disconnect();
})();
