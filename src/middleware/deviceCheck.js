const prisma = require("../config/prisma");
const crypto = require("crypto");

// Generates a hash from device info — combining multiple signals makes spoofing harder
function generateFingerprint(deviceInfo) {
  const raw = [
    deviceInfo.deviceId,
    deviceInfo.deviceName,
    deviceInfo.brand,
    deviceInfo.osName,
    deviceInfo.osVersion,
    deviceInfo.modelName,
  ]
    .filter(Boolean)
    .join("|")
    .toLowerCase();

  return crypto.createHash("sha256").update(raw).digest("hex");
}

// On first login: saves device fingerprint to the student record
// On subsequent logins: compares incoming fingerprint against stored one
const checkDevice = async (req, res, next) => {
  const { deviceInfo } = req.body;
  const studentId = req.user.id;

  if (!deviceInfo || !deviceInfo.deviceId) {
    return res.status(400).json({ error: "Device information is required." });
  }

  try {
    const student = await prisma.student.findUnique({ where: { id: studentId } });

    const incomingFingerprint = generateFingerprint(deviceInfo);

    // First time registering a device
    if (!student.deviceFingerprint) {
      await prisma.student.update({
        where: { id: studentId },
        data: {
          deviceId: deviceInfo.deviceId,
          deviceFingerprint: incomingFingerprint,
          isDeviceLocked: true,
        },
      });

      req.deviceVerified = true;
      return next();
    }

    // Device mismatch — block and flag
    if (student.deviceFingerprint !== incomingFingerprint) {
      return res.status(403).json({
        error: "Device not recognized. Attendance must be marked from your registered device.",
        flagged: true,
      });
    }

    req.deviceVerified = true;
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = { checkDevice, generateFingerprint };
