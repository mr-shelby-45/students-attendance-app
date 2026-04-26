const cron = require("node-cron");
const prisma = require("../config/prisma");

// Calculate current semester week number (1-14) from SEMESTER_START in .env
const getSemesterWeek = () => {
  const start = new Date(process.env.SEMESTER_START);
  const now = new Date();
  const diffMs = now - start;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const week = Math.floor(diffDays / 7) + 1;
  return Math.min(Math.max(week, 1), 14); // clamp between 1 and 14
};

const getCurrentYear = () => new Date().getFullYear();

// Mark all unchecked units as MISSED for all students at end of week
const runWeeklyReset = async () => {
  console.log("⏰ Running weekly attendance reset...");

  const weekNumber = getSemesterWeek();
  const year = getCurrentYear();

  try {
    // Get all students with their college units
    const students = await prisma.student.findMany({
      include: {
        college: {
          include: { units: true },
        },
      },
    });

    let missedCount = 0;

    for (const student of students) {
      for (const unit of student.college.units) {
        // Check if a weekly record already exists for this student/unit/week
        const existing = await prisma.weeklyAttendance.findUnique({
          where: {
            studentId_unitId_weekNumber_year: {
              studentId: student.id,
              unitId: unit.id,
              weekNumber,
              year,
            },
          },
        });

        // If no record or still PENDING — mark as MISSED
        if (!existing || existing.status === "PENDING") {
          await prisma.weeklyAttendance.upsert({
            where: {
              studentId_unitId_weekNumber_year: {
                studentId: student.id,
                unitId: unit.id,
                weekNumber,
                year,
              },
            },
            update: { status: "MISSED" },
            create: {
              studentId: student.id,
              unitId: unit.id,
              weekNumber,
              year,
              status: "MISSED",
            },
          });
          missedCount++;
        }
      }
    }

    console.log(`✅ Weekly reset complete. ${missedCount} units marked as MISSED.`);
  } catch (err) {
    console.error("❌ Weekly reset failed:", err.message);
  }
};

// Schedule: every Sunday at 23:59
const scheduleWeeklyReset = () => {
  cron.schedule("59 23 * * 0", runWeeklyReset, {
    timezone: "Africa/Nairobi",
  });
  console.log("📅 Weekly reset cron job scheduled (Sunday 23:59 EAT)");
};

module.exports = { scheduleWeeklyReset, runWeeklyReset, getSemesterWeek, getCurrentYear };