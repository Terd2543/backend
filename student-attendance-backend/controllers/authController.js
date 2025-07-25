// controllers/authController.js
const { auth } = require('../config/firebase');

exports.login = async (req, res) => {
  const { idToken } = req.body; // รับ idToken จาก Frontend

  if (!idToken) {
    return res.status(400).json({ message: 'Authentication token is required.' });
  }

  try {
    // ตรวจสอบ idToken ที่ส่งมาจาก Frontend
    const decodedToken = await auth.verifyIdToken(idToken);
    // คุณสามารถใช้ decodedToken.uid เพื่อระบุผู้ใช้ที่เข้าสู่ระบบ

    return res.status(200).json({
      message: 'Login successful.',
      uid: decodedToken.uid,
      email: decodedToken.email
    });

  } catch (error) {
    console.error('Error verifying ID token:', error.message);
    return res.status(401).json({ message: 'Invalid or expired token.', error: error.message });
  }
};