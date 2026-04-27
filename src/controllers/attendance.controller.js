const prisma = require("../config/prisma");

// ── POST /api/attendance/check-in ─────────────────────────────────────────────
// Protected by: verifyToken → checkGeofence → checkDevice (in route)
const checkIn = async (req, res, next) => {
  try {
    const { unitCode, latitude, longitude, deviceInfo } = req.body;
    const studentId = req.user.id;

    // Validate unit exists
    const unit = await prisma.unit.findUnique({ where: { code: unitCode } });
    if (!unit) return res.status(404).json({ error: "Unit not found." });

    // Prevent duplicate check-in for the same unit on the same day
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const existing = await prisma.attendance.findFirst({
      where: {
        studentId,
        unitId: unit.id,
        checkedInAt: { gte: todayStart, lte: todayEnd },
      },
    });

    if (existing) {
      return res.status(409).json({ error: "You have already checked in for this unit today." });
    }

    const attendance = await prisma.attendance.create({
      data: {
        studentId,
        unitId: unit.id,
        latitude,
        longitude,
        deviceId: deviceInfo.deviceId,
        status: "PRESENT",
      },
      include: { unit: { select: { code: true, name: true } } },
    });
    // Record in weekly attendance
    const { getSemesterWeek, getCurrentYear } = require("../utils/weeklyReset");      
    await prisma.weeklyAttendance.upsert({
      where: {
        studentId_unitId_weekNumber_year: {
          studentId,
          unitId: unit.id,
          weekNumber: getSemesterWeek(),
          year: getCurrentYear(),
        },
      },
      update: {
        status: "PRESENT",
        checkedInAt: new Date(),
      },
      create: {
        studentId,
        unitId: unit.id,
        weekNumber: getSemesterWeek(),
        year: getCurrentYear(),
        status: "PRESENT",
        checkedInAt: new Date(),
      },
    });

    res.status(201).json({
      message: `Attendance marked for ${attendance.unit.name}.`,
      attendance,
    });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/attendance/my ────────────────────────────────────────────────────
const getMyAttendance = async (req, res, next) => {
  try {
    const studentId = req.user.id;
    const { unitCode } = req.query;

    const where = { studentId };
    if (unitCode) {
      const unit = await prisma.unit.findUnique({ where: { code: unitCode } });
      if (unit) where.unitId = unit.id;
    }

    const records = await prisma.attendance.findMany({
      where,
      include: { unit: { select: { code: true, name: true } } },
      orderBy: { checkedInAt: "desc" },
    });

    res.json({ total: records.length, records });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/attendance/weekly ────────────────────────────────────────────────
const getWeeklySummary = async (req, res, next) => {
  try {
    const studentId = req.user.id;
    const { getSemesterWeek, getCurrentYear } = require("../utils/weeklyReset");

    const weekNumber = getSemesterWeek();
    const year = getCurrentYear();

    // Get student with their college units
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        college: { include: { units: { orderBy: { code: "asc" } } } },
      },
    });

    // Get all weekly attendance records for this week
    const weeklyRecords = await prisma.weeklyAttendance.findMany({
      where: { studentId, weekNumber, year },
    });

    // Map units with their status for this week
    const summary = student.college.units.map((unit) => {
      const record = weeklyRecords.find((r) => r.unitId === unit.id);
      return {
        unitId: unit.id,
        unitCode: unit.code,
        unitName: unit.name,
        weekNumber,
        status: record ? record.status : "PENDING",
        checkedInAt: record?.checkedInAt || null,
      };
    });

    res.json({ weekNumber, year, summary });
  } catch (err) {
    next(err);
  }
};

module.exports = { checkIn, getMyAttendance, getWeeklySummary };
