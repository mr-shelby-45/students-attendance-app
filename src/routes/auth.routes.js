const express = require("express");
const router = express.Router();
const { register, login, forgotPassword, resetPassword } = require("../controllers/auth.controller");
const { body } = require("express-validator");

const registerRules = [
  body("email").isEmail().withMessage("Valid email required"),
  body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
  body("firstName").notEmpty().withMessage("First name required"),
  body("lastName").notEmpty().withMessage("Last name required"),
  body("regNumber").notEmpty().withMessage("Registration number required"),
  body("collegeId").notEmpty().withMessage("College is required"),
];

const loginRules = [
  body("email").isEmail().withMessage("Valid email required"),
  body("password").notEmpty().withMessage("Password required"),
];

router.post("/register", registerRules, register);
router.post("/login", loginRules, login);
router.post("/forgot-password", body("email").isEmail(), forgotPassword);
router.post("/reset-password", resetPassword);

module.exports = router;