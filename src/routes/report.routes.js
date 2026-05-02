const express = require("express");
const router = express.Router();
const { getMySummary, generateMyReport } = require("../controllers/report.controller");
const { verifyToken } = require("../middleware/auth");

router.use(verifyToken);

router.get("/summary", getMySummary);
router.get("/generate", generateMyReport);

module.exports = router;