const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const oldCollegeCodes = ["COES", "COBS", "COIS", "COHS"];

  // Step 1 — Delete attendance records linked to old college students
  const oldStudents = await prisma.student.findMany({
    where: { college: { code: { in: oldCollegeCodes } } },
    select: { id: true }
  });
  const oldStudentIds = oldStudents.map((s) => s.id);

  const deletedAttendance = await prisma.attendance.deleteMany({
    where: { studentId: { in: oldStudentIds } }
  });
  console.log(`✅ Deleted ${deletedAttendance.count} attendance records`);

  // Step 2 — Delete the students
  const deletedStudents = await prisma.student.deleteMany({
    where: { id: { in: oldStudentIds } }
  });
  console.log(`✅ Deleted ${deletedStudents.count} students`);

  // Step 3 — Delete units linked to old colleges
  const deletedUnits = await prisma.unit.deleteMany({
    where: { college: { code: { in: oldCollegeCodes } } }
  });
  console.log(`✅ Deleted ${deletedUnits.count} old units`);

  // Step 4 — Delete old colleges
  const deletedColleges = await prisma.college.deleteMany({
    where: { code: { in: oldCollegeCodes } }
  });
  console.log(`✅ Deleted ${deletedColleges.count} old colleges`);

  console.log("\n🎉 Cleanup complete!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());