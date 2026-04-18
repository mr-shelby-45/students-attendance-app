const express = require("express");
const router = express.Router();
const { getColleges, getUnitsByCollege } = require("../controllers/college.controller");

router.get("/", getColleges);
router.get("/:collegeId/units", getUnitsByCollege);

module.exports = router;