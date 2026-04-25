const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const prisma = require("../config/prisma");
const { sendPasswordResetEmail } = require("../utils/email");

// ── Helper: sign JWT ──────────────────────────────────────────────────────────
const signToken = (payload) =>
  jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });

// ── POST /api/auth/register ───────────────────────────────────────────────────
const register = async (req, res, next) => {
  try {
    const { email, password, firstName, lastName, regNumber, collegeId } = req.body;

    const existing = await prisma.student.findUnique({ where: { email } });
    if (existing) return res.status(409).json({ error: "Email already registered." });

    const hashedPassword = await bcrypt.hash(password, 12);

    const student = await prisma.student.create({
      data: { email, password: hashedPassword, firstName, lastName, regNumber, collegeId },
      select: { id: true, email: true, firstName: true, lastName: true, regNumber: true },
    });

    const token = signToken({ id: student.id, email: student.email, role: "STUDENT" });

    res.status(201).json({ message: "Account created successfully.", token, student });
  } catch (err) {
    next(err);
  }
};

// ── POST /api/auth/login ─────────────────────────────────────────────
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const student = await prisma.student.findUnique({
      where: { email },
      include: { college: { select: { id: true, name: true, code: true } } },
    });

    if (!student) return res.status(401).json({ error: "Invalid email or password." });

    const isMatch = await bcrypt.compare(password, student.password);
    if (!isMatch) return res.status(401).json({ error: "Invalid email or password." });

    const token = signToken({ id: student.id, email: student.email, role: "STUDENT" });

    // Never send the password back
    const { password: _, resetToken: __, resetTokenExpiry: ___, ...safeStudent } = student;

    res.json({ message: "Login successful.", token, student: safeStudent });
  } catch (err) {
    next(err);
  }
};

// ── POST /api/auth/forgot-password ───────────────────────────────────────────
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    const student = await prisma.student.findUnique({ where: { email } });
    // Always return 200 to prevent email enumeration attacks
    if (!student) return res.json({ message: "If that email exists, a reset OTP has been sent." });

    // Generate a 6-digit OTP
    const otp = crypto.randomInt(100000, 999999).toString();
    const expiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    await prisma.student.update({
      where: { email },
      data: {
        resetToken: await bcrypt.hash(otp, 10), // store hashed OTP
        resetTokenExpiry: expiry,
      },
    });

    await sendPasswordResetEmail(email, student.firstName, otp);

    res.json({ message: "If that email exists, a reset OTP has been sent." });
  } catch (err) {
    next(err);
  }
};

// ── POST /api/auth/reset-password ────────────────────────────────────────────
const resetPassword = async (req, res, next) => {
  try {
    const { email, otp, newPassword } = req.body;

    const student = await prisma.student.findUnique({ where: { email } });
    if (!student || !student.resetToken) {
      return res.status(400).json({ error: "Invalid or expired reset request." });
    }

    if (new Date() > student.resetTokenExpiry) {
      return res.status(400).json({ error: "OTP has expired. Please request a new one." });
    }

    const isValidOtp = await bcrypt.compare(otp, student.resetToken);
    if (!isValidOtp) return res.status(400).json({ error: "Invalid OTP." });

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await prisma.student.update({
      where: { email },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });

    res.json({ message: "Password reset successfully. You can now log in." });
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login, forgotPassword, resetPassword };
