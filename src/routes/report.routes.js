const express = require("express");
const router = express.Router();
const { getMySummary } = require("../controllers/report.controller");
const { verifyToken } = require("../middleware/auth");

router.use(verifyToken);

router.get("/summary", getMySummary);

module.exports = router;