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

module.exports = { checkIn, getMyAttendance };
