const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("Seeding JKUAT database...");

  // ── Colleges ──────────────────────────────────────────────────────────────
  const colleges = await Promise.all([
    prisma.college.upsert({
      where: { code: "COPAS" },
      update: { name: "College of Pure and Applied Sciences" },
      create: { name: "College of Pure and Applied Sciences", code: "COPAS" },
    }),
    prisma.college.upsert({
      where: { code: "COHES" },
      update: { name: "College of Health Sciences" },
      create: { name: "College of Health Sciences", code: "COHES" },
    }),
    prisma.college.upsert({
      where: { code: "COHRED" },
      update: { name: "College of Human Resource Development" },
      create: { name: "College of Human Resource Development", code: "COHRED" },
    }),
    prisma.college.upsert({
      where: { code: "COETEC" },
      update: { name: "College of Engineering and Technology" },
      create: { name: "College of Engineering and Technology", code: "COETEC" },
    }),
  ]);

  console.log(`${colleges.length} colleges seeded`);

  const copas = colleges.find((c) => c.code === "COPAS");
  const cohes = colleges.find((c) => c.code === "COHES");
  const cohred = colleges.find((c) => c.code === "COHRED");
  const coetec = colleges.find((c) => c.code === "COETEC");

  // ── Units ─────────────────────────────────────────────────────────────────
  const units = await Promise.all([
    // COPAS
    prisma.unit.upsert({ where: { code: "SMA2104" }, update: {}, create: { code: "SMA2104", name: "Mathematics for Science", collegeId: copas.id } }),
    prisma.unit.upsert({ where: { code: "SMA2101" }, update: {}, create: { code: "SMA2101", name: "Calculus I", collegeId: copas.id } }),
    prisma.unit.upsert({ where: { code: "SPH2101" }, update: {}, create: { code: "SPH2101", name: "Operating systems I", collegeId: copas.id } }),
    prisma.unit.upsert({ where: { code: "SMA2456" }, update: {}, create: { code: "SCH2101", name: "Artificial Intelligence", collegeId: copas.id } }),

    // COHES
    prisma.unit.upsert({ where: { code: "HNS2101" }, update: {}, create: { code: "HNS2101", name: "Human Anatomy I", collegeId: cohes.id } }),
    prisma.unit.upsert({ where: { code: "HNS2102" }, update: {}, create: { code: "HNS2102", name: "Human Physiology I", collegeId: cohes.id } }),
    prisma.unit.upsert({ where: { code: "HNS2103" }, update: {}, create: { code: "HNS2103", name: "Biochemistry I", collegeId: cohes.id } }),

    // COHRED
    prisma.unit.upsert({ where: { code: "HRD2101" }, update: {}, create: { code: "HRD2101", name: "Introduction to HRM", collegeId: cohred.id } }),
    prisma.unit.upsert({ where: { code: "HRD2102" }, update: {}, create: { code: "HRD2102", name: "Organizational Behaviour", collegeId: cohred.id } }),
    prisma.unit.upsert({ where: { code: "HRD2103" }, update: {}, create: { code: "HRD2103", name: "Communication Skills", collegeId: cohred.id } }),

    // COETEC
    prisma.unit.upsert({ where: { code: "ECE2101" }, update: {}, create: { code: "ECE2101", name: "Fluid Mechanics I", collegeId: coetec.id } }),
    prisma.unit.upsert({ where: { code: "ECE2102" }, update: {}, create: { code: "ECE2102", name: "Introduction to Programming", collegeId: coetec.id } }),
    prisma.unit.upsert({ where: { code: "ECE2103" }, update: {}, create: { code: "ECE2103", name: "Electronic Circuits I", collegeId: coetec.id } }),
    prisma.unit.upsert({ where: { code: "ECE2104" }, update: {}, create: { code: "ECE2104", name: "Ordinary Differential Equations I", collegeId: coetec.id } }),
  ]);

  console.log(`${units.length} units seeded`);
  console.log("\n JKUAT seed complete!");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });