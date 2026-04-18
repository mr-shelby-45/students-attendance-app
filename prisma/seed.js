const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // ── Colleges ──────────────────────────────────────────────────────────────
  const colleges = await Promise.all([
    prisma.college.upsert({
      where: { code: "COES" },
      update: {},
      create: { name: "College of Engineering & Technology", code: "COES" },
    }),
    prisma.college.upsert({
      where: { code: "COBS" },
      update: {},
      create: { name: "College of Business & Economics", code: "COBS" },
    }),
    prisma.college.upsert({
      where: { code: "COIS" },
      update: {},
      create: { name: "College of Information Sciences", code: "COIS" },
    }),
    prisma.college.upsert({
      where: { code: "COHS" },
      update: {},
      create: { name: "College of Health Sciences", code: "COHS" },
    }),
  ]);

  console.log(`✅ ${colleges.length} colleges created`);

  // ── Units ─────────────────────────────────────────────────────────────────
  const coes = colleges.find((c) => c.code === "COES");
  const cobs = colleges.find((c) => c.code === "COBS");
  const cois = colleges.find((c) => c.code === "COIS");
  const cohs = colleges.find((c) => c.code === "COHS");

  const units = await Promise.all([
    // Engineering units
    prisma.unit.upsert({
      where: { code: "ENG101" },
      update: {},
      create: { code: "ENG101", name: "Engineering Mathematics I", collegeId: coes.id },
    }),
    prisma.unit.upsert({
      where: { code: "ENG202" },
      update: {},
      create: { code: "ENG202", name: "Structural Analysis", collegeId: coes.id },
    }),
    // Business units
    prisma.unit.upsert({
      where: { code: "BUS101" },
      update: {},
      create: { code: "BUS101", name: "Introduction to Business", collegeId: cobs.id },
    }),
    prisma.unit.upsert({
      where: { code: "ACC201" },
      update: {},
      create: { code: "ACC201", name: "Financial Accounting", collegeId: cobs.id },
    }),
    // IS units
    prisma.unit.upsert({
      where: { code: "ISC101" },
      update: {},
      create: { code: "ISC101", name: "Introduction to Programming", collegeId: cois.id },
    }),
    prisma.unit.upsert({
      where: { code: "ISC301" },
      update: {},
      create: { code: "ISC301", name: "Database Systems", collegeId: cois.id },
    }),
    // Health units
    prisma.unit.upsert({
      where: { code: "MED101" },
      update: {},
      create: { code: "MED101", name: "Human Anatomy I", collegeId: cohs.id },
    }),
  ]);

  console.log(`✅ ${units.length} units created`);
  console.log("\n🎉 Seed complete! You can now register students and start using the app.");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
