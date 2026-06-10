const express = require("express");
const router = express.Router();
const crypto = require("node:crypto");
const bcrypt = require("bcryptjs");
const prisma = require("../prisma/prismaClient");
const { sendPasswordResetEmail } = require("../lib/email");

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
const TOKEN_EXPIRY_MS = 60 * 60 * 1000;

// @desc    Request password reset
// @route   POST /api/auth/forgot-password
// @access  Public
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || typeof email !== "string") {
      return res.status(400).json({ message: "Email is required" });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      return res.json({
        message: "If that email exists, a reset link has been sent",
      });
    }

    await prisma.passwordReset.updateMany({
      where: { userId: user.id, used: false },
      data: { used: true },
    });

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_MS);

    await prisma.passwordReset.create({
      data: {
        token,
        expiresAt,
        userId: user.id,
      },
    });

    const resetUrl = `${FRONTEND_URL}/pages/reset-password.html?token=${token}`;
    await sendPasswordResetEmail(normalizedEmail, resetUrl);

    res.json({ message: "If that email exists, a reset link has been sent" });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// @desc    Reset password with token
// @route   POST /api/auth/reset-password
// @access  Public
router.post("/reset-password", async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res
        .status(400)
        .json({ message: "Token and password are required" });
    }

    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters" });
    }

    const resetRecord = await prisma.passwordReset.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!resetRecord) {
      return res.status(400).json({ message: "Invalid or expired reset link" });
    }

    if (resetRecord.used) {
      return res
        .status(400)
        .json({ message: "Reset link has already been used" });
    }

    if (new Date() > resetRecord.expiresAt) {
      return res.status(400).json({ message: "Reset link has expired" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    await prisma.user.update({
      where: { id: resetRecord.userId },
      data: { password: hashedPassword },
    });

    await prisma.passwordReset.update({
      where: { token },
      data: { used: true },
    });

    res.json({ message: "Password reset successfully" });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
