import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const lineCodes = [
    { code: "A1", name: "Hat A1" },
    { code: "A2", name: "Hat A2" },
    { code: "A3", name: "Hat A3" },
    { code: "A4", name: "Hat A4" },
    { code: "A5", name: "Hat A5" },
    { code: "A6", name: "Hat A6" },
    { code: "A7", name: "Hat A7" },
    { code: "A95", name: "Hat A95" }
  ];
  for (const line of lineCodes) {
    await prisma.line.upsert({
      where: { code: line.code },
      update: {},
      create: line,
    });
  }
  console.log("Hatlar başarıyla eklendi!");
}
main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
