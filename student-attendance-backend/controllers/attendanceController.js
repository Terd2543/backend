// controllers/attendanceController.js
const { db, admin } = require('../config/firebase');
const { broadcastLineMessage } = require('../utils/lineMessagingApi'); // ใช้ Messaging API

exports.recordAttendance = async (req, res) => {
  const { studentId, date, status, studentName } = req.body;

  if (!studentId || !date || !status || !studentName) {
    return res.status(400).json({ message: 'Missing required fields: studentId, date, status, studentName' });
  }

  try {
    const attendanceRef = db.collection('attendance');
    const docId = `${studentId}-${date}`; // Unique ID for each student per day

    await attendanceRef.doc(docId).set({
      studentId: studentId,
      studentName: studentName,
      date: date, // 'YYYY-MM-DD'
      status: status, // 'มา', 'ลา', 'ขาด', 'สาย'
      timestamp: admin.firestore.FieldValue.serverTimestamp() // Server timestamp for recording time
    }, { merge: true }); // Use merge: true to update if document already exists

    res.status(200).json({ message: 'Attendance recorded successfully!' });

  } catch (error) {
    console.error('Error recording attendance:', error);
    res.status(500).json({ message: 'Failed to record attendance', error: error.message });
  }
};

exports.getAttendanceSummaryAndNotify = async (req, res) => {
  const { date } = req.query; // Get date from Query parameter

  if (!date) {
    return res.status(400).json({ message: 'Date parameter is required for summary.' });
  }

  try {
    const attendanceSnapshot = await db.collection('attendance')
      .where('date', '==', date)
      .get();

    let มา = 0;
    let ลา = [];
    let ขาด = [];
    let สาย = [];

    attendanceSnapshot.forEach(doc => {
      const data = doc.data();
      switch (data.status) {
        case 'มา':
          มา++;
          break;
        case 'ลา':
          ลา.push(data.studentName);
          break;
        case 'ขาด':
          ขาด.push(data.studentName);
          break;
          case 'สาย':
          สาย.push(data.studentName);
          break;
      }
    });

    // Prepare message for LINE Messaging API
    const lineMessage = `\n[สรุปเช็คชื่อ ม.1/10]\nวันที่ ${date}\n\n` +
                        `✅ มาทั้งหมด: ${มา} คน\n` +
                        `⚠️ ลา: ${ลา.length} คน (${ลา.join(', ') || 'ไม่มี'}) \n` +
                        `❌ ขาด: ${ขาด.length} คน (${ขาด.join(', ') || 'ไม่มี'}) \n` +
                        `⏱️ สาย: ${สาย.length} คน (${สาย.join(', ') || 'ไม่มี'})`;

    // Send LINE notification using Messaging API (broadcast to all who added the bot)
    await broadcastLineMessage(lineMessage);

    res.status(200).json({
      message: 'Attendance summary retrieved and LINE broadcasted successfully!',
      summary: {
        มา,
        ลา: ลา.length,
        ขาด: ขาด.length,
        สาย: สาย.length,
        names: { ลา, ขาด, สาย }
      }
    });

  } catch (error) {
    console.error('Error getting attendance summary or sending LINE notification:', error);
    res.status(500).json({ message: 'Failed to get summary or send notification', error: error.message });
  }
};