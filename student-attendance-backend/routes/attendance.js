// routes/attendance.js
const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');

router.post('/record', attendanceController.recordAttendance);
router.get('/summary-and-notify', attendanceController.getAttendanceSummaryAndNotify);

module.exports = router;