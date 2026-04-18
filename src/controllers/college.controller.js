const prisma = require("../config/prisma");

const getColleges = async (req, res, next) => {
  try {
    const colleges = await prisma.college.findMany({
      select: { id: true, name: true, code: true },
      orderBy: { name: "asc" },
    });
    res.json(colleges);
  } catch (err) {
    next(err);
  }
};

const getUnitsByCollege = async (req, res, next) => {
  try {
    const { collegeId } = req.params;
    const units = await prisma.unit.findMany({
      where: { collegeId },
      select: { id: true, code: true, name: true },
      orderBy: { code: "asc" },
    });
    res.json(units);
  } catch (err) {
    next(err);
  }
};

module.exports = { getColleges, getUnitsByCollege };