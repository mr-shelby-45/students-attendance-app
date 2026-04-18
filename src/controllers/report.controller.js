const prisma = require("../config/prisma");

const getMySummary = async (req, res, next) => {
  try {
    const studentId = req.user.id;

    const records = await prisma.attendance.findMany({
      where: { studentId },
      include: { unit: { select: { code: true, name: true } } },
      orderBy: { checkedInAt: "desc" },
    });

    const summary = records.reduce((acc, record) => {
      const key = record.unit.code;
      if (!acc[key]) {
        acc[key] = {
          unitCode: record.unit.code,
          unitName: record.unit.name,
          totalAttended: 0,
          sessions: [],
        };
      }
      acc[key].totalAttended += 1;
      acc[key].sessions.push({
        date: record.checkedInAt,
        status: record.status,
      });
      return acc;
    }, {});

    res.json({
      studentId,
      totalUnits: Object.keys(summary).length,
      summary: Object.values(summary),
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getMySummary };