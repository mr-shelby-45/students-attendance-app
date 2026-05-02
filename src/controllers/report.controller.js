const prisma = require("../config/prisma");
const PDFDocument = require("pdfkit");

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

// ── GET /api/reports/generate ─────────────────────────────────────────────────
const generateMyReport = async (req, res, next) => {
  try {
    const studentId = req.user.id;

    // Get student info
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: { college: { select: { name: true, code: true } } },
    });

    // Get weekly attendance records
    const weeklyRecords = await prisma.weeklyAttendance.findMany({
      where: { studentId },
      include: { unit: { select: { code: true, name: true } } },
      orderBy: [{ weekNumber: "asc" }, { unit: { code: "asc" } }],
    });

    // Group by unit
    const unitMap = {};
    for (const record of weeklyRecords) {
      const key = record.unit.code;
      if (!unitMap[key]) {
        unitMap[key] = {
          unitCode: record.unit.code,
          unitName: record.unit.name,
          present: 0,
          missed: 0,
          pending: 0,
          records: [],
        };
      }
      if (record.status === "PRESENT") unitMap[key].present++;
      else if (record.status === "MISSED") unitMap[key].missed++;
      else unitMap[key].pending++;
      unitMap[key].records.push(record);
    }

    const units = Object.values(unitMap);
    const totalPresent = units.reduce((sum, u) => sum + u.present, 0);
    const totalMissed = units.reduce((sum, u) => sum + u.missed, 0);
    const totalClasses = totalPresent + totalMissed;
    const overallPercentage = totalClasses > 0
      ? Math.round((totalPresent / totalClasses) * 100)
      : 0;

    // ── Generate PDF ────────────────────────────────────────────────────────
    const doc = new PDFDocument({ margin: 50, size: "A4" });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="attendance_${student.regNumber}.pdf"`
    );
    doc.pipe(res);

    // Header
    doc
      .fontSize(20)
      .font("Helvetica-Bold")
      .text("JKUAT Attendance Report", { align: "center" });

    doc.moveDown(0.5);
    doc
      .fontSize(11)
      .font("Helvetica")
      .text(`Generated: ${new Date().toLocaleDateString("en-KE", {
        weekday: "long", year: "numeric", month: "long", day: "numeric"
      })}`, { align: "center" });

    // Divider
    doc.moveDown(0.5);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    doc.moveDown(0.5);

    // Student Info
    doc.fontSize(12).font("Helvetica-Bold").text("Student Information");
    doc.moveDown(0.3);
    doc.fontSize(11).font("Helvetica");
    doc.text(`Name:              ${student.firstName} ${student.lastName}`);
    doc.text(`Reg Number:        ${student.regNumber}`);
    doc.text(`Email:             ${student.email}`);
    doc.text(`College:           ${student.college.name} (${student.college.code})`);

    doc.moveDown(0.5);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    doc.moveDown(0.5);

    // Overall Summary
    doc.fontSize(12).font("Helvetica-Bold").text("Overall Summary");
    doc.moveDown(0.3);
    doc.fontSize(11).font("Helvetica");
    doc.text(`Total Classes:     ${totalClasses}`);
    doc.text(`Attended:          ${totalPresent}`);
    doc.text(`Missed:            ${totalMissed}`);
    doc.text(`Attendance Rate:   ${overallPercentage}%`);

    doc.moveDown(0.5);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    doc.moveDown(0.5);

    // Per Unit Breakdown
    doc.fontSize(12).font("Helvetica-Bold").text("Unit Breakdown");
    doc.moveDown(0.5);

    for (const unit of units) {
      const total = unit.present + unit.missed;
      const pct = total > 0 ? Math.round((unit.present / total) * 100) : 0;

      doc.fontSize(11).font("Helvetica-Bold")
        .text(`${unit.unitCode} — ${unit.unitName}`);
      doc.fontSize(10).font("Helvetica")
        .text(`Attended: ${unit.present}/${total} classes (${pct}%)`);

      // Week by week
      doc.moveDown(0.2);
      const weekGroups = {};
      for (const r of unit.records) {
        if (!weekGroups[r.weekNumber]) weekGroups[r.weekNumber] = [];
        weekGroups[r.weekNumber].push(r);
      }

      for (const [week, recs] of Object.entries(weekGroups)) {
        const status = recs[0].status;
        const icon = status === "PRESENT" ? "✓" : status === "MISSED" ? "✗" : "─";
        doc.fontSize(9).font("Helvetica")
          .text(`   Week ${week}:  ${icon} ${status}`, { indent: 20 });
      }

      doc.moveDown(0.5);
    }

    // Footer
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    doc.moveDown(0.3);
    doc.fontSize(9).font("Helvetica")
      .text("This report was generated automatically by the JKUAT Attendance System.",
        { align: "center", color: "grey" });

    doc.end();
  } catch (err) {
    next(err);
  }
};

module.exports = { getMySummary, generateMyReport };