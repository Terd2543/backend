// app.js
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { Client, middleware } = require('@line/bot-sdk');
const admin = require('firebase-admin');
require('dotenv').config(); // โหลด Environment Variables จาก .env file

// --- 1. Firebase Admin SDK Initialization ---
// การตั้งค่า Service Account Key:
// - หากรันบน Render/Cloud: จะอ่านค่าจาก Environment Variable ชื่อ FIREBASE_SERVICE_ACCOUNT_KEY
// - หากรันในเครื่อง (Local): จะอ่านจากไฟล์ JSON ที่ระบุ Path ไว้
const serviceAccountLocalPath = './your-project-name-firebase-adminsdk-xxxxx-xxxxxxxxxx.json'; // *** สำคัญ: เปลี่ยนชื่อไฟล์นี้ให้ตรงกับที่คุณดาวน์โหลดมาจริงๆ ***

let serviceAccount;

if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
  // กรณีรันบน Render หรือ Cloud ที่มีการตั้งค่า Environment Variable นี้
  try {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
    console.log("Using Firebase Service Account from environment variable.");
  } catch (e) {
    console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY environment variable:", e);
    process.exit(1); // หยุดการทำงานหากไม่สามารถอ่านค่าได้
  }
} else {
  // กรณีรันในเครื่อง (Local) และไม่มี Environment Variable
  try {
    serviceAccount = require(serviceAccountLocalPath);
    console.log(`Using Firebase Service Account from local file: ${serviceAccountLocalPath}`);
  } catch (e) {
    console.error(`Error: Could not load local Firebase Service Account file at ${serviceAccountLocalPath}`);
    console.error("Please ensure the file exists and the path is correct in app.js.");
    console.error("If deploying to cloud, remember to set FIREBASE_SERVICE_ACCOUNT_KEY environment variable.");
    process.exit(1); // หยุดการทำงานหากไม่สามารถโหลดไฟล์ได้
  }
}

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore(); // กำหนด Firestore instance เพื่อใช้งาน
const CLASS_TO_TRACK = process.env.CLASS_TO_TRACK || 'ม.1/10'; // ชั้นเรียนที่ต้องการติดตาม (ค่าเริ่มต้น ม.1/10)

// --- 2. LINE Bot SDK Configuration ---
// ตรวจสอบว่า Environment Variables สำหรับ LINE ถูกตั้งค่าหรือไม่
if (!process.env.LINE_CHANNEL_ACCESS_TOKEN || !process.env.LINE_CHANNEL_SECRET) {
    console.error('LINE_CHANNEL_ACCESS_TOKEN or LINE_CHANNEL_SECRET is not set in environment variables.');
    console.error('Please set these variables in your .env file (local) or Render Dashboard (cloud).');
    process.exit(1); // หยุดการทำงานหากไม่มีค่าที่จำเป็น
}

const lineConfig = {
    channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
    channelSecret: process.env.LINE_CHANNEL_SECRET,
};

const lineClient = new Client(lineConfig); // สร้าง LINE client instance สำหรับส่ง/รับข้อความ

// --- 3. Express App Setup ---
const app = express();
const PORT = process.env.PORT || 3000; // ใช้ PORT จาก .env หรือใช้ 3000 เป็นค่าเริ่มต้น

// Middleware
app.use(cors()); // อนุญาตให้ Frontend (ที่อาจอยู่คนละ Domain) สามารถเรียกใช้ Backend ได้
app.use(bodyParser.json()); // สำหรับ Parse JSON body ของ Request ที่เข้ามา

// --- 4. API Endpoints (Routes) ---

// 4.1. Root Endpoint: สำหรับทดสอบว่า Backend ทำงานอยู่ไหม
app.get('/', (req, res) => {
    res.send('Attendance System Backend is running!');
});

// 4.2. LINE Webhook Endpoint: รับ Event จาก LINE Platform
// Path นี้คือ /api/line-webhook
app.post('/api/line-webhook', middleware(lineConfig), async (req, res) => {
    console.log('LINE Webhook Event Received.');

    const events = req.body.events; // ดึงเหตุการณ์ทั้งหมดที่ LINE ส่งมา

    if (!events || events.length === 0) {
        return res.status(200).send('No events to process.');
    }

    try {
        await Promise.all(events.map(async (event) => {
            if (event.type === 'follow') {
                // เหตุการณ์: ผู้ใช้เพิ่ม LINE Bot เป็นเพื่อน
                const userId = event.source.userId;
                console.log(`User followed bot: ${userId}`);
                try {
                    // บันทึก userId ลง Firestore เพื่อใช้ส่งข้อความในอนาคต (ถ้าจำเป็น)
                    await db.collection('lineUsers').doc(userId).set({
                        userId: userId,
                        timestamp: admin.firestore.FieldValue.serverTimestamp()
                    }, { merge: true }); // merge: true เพื่ออัปเดตถ้ามีอยู่แล้ว
                    console.log(`Saved userId: ${userId} to Firestore.`);
                    // ส่งข้อความต้อนรับ
                    return lineClient.replyMessage(event.replyToken, {
                        type: 'text',
                        text: 'ยินดีต้อนรับสู่ระบบเช็คชื่อครับ! หากมีข้อสงสัยติดต่อครูประจำชั้นได้เลยครับ'
                    });
                } catch (error) {
                    console.error('Error saving userId or sending welcome message:', error);
                }
            } else if (event.type === 'unfollow') {
                // เหตุการณ์: ผู้ใช้เลิกเป็นเพื่อนกับ LINE Bot
                const userId = event.source.userId;
                console.log(`User unfollowed bot: ${userId}`);
                // คุณอาจจะต้องการลบ userId นี้ออกจาก Firestore ด้วย
                try {
                    await db.collection('lineUsers').doc(userId).delete();
                    console.log(`Deleted userId: ${userId} from Firestore.`);
                } catch (error) {
                    console.error('Error deleting userId on unfollow:', error);
                }
            } else if (event.type === 'message' && event.message.type === 'text') {
                // เหตุการณ์: ผู้ใช้ส่งข้อความมาหา LINE Bot
                const userId = event.source.userId;
                const userMessage = event.message.text;
                console.log(`Received message from ${userId}: "${userMessage}"`);

                // คุณสามารถเพิ่ม logic สำหรับการตอบกลับข้อความหรือรับคำสั่งจากผู้ใช้ได้ที่นี่
                // เช่น:
                // if (userMessage.toLowerCase() === 'สวัสดี') {
                //     await lineClient.replyMessage(event.replyToken, { type: 'text', text: 'สวัสดีครับ!' });
                // } else {
                //     await lineClient.replyMessage(event.replyToken, { type: 'text', text: 'ไม่เข้าใจคำสั่งครับ' });
                // }
            }
            // เพิ่มเงื่อนไขสำหรับ event type อื่นๆ ที่คุณต้องการจัดการได้ที่นี่
        }));
        res.status(200).send('Events processed.'); // ส่ง 200 OK กลับไปให้ LINE
    } catch (err) {
        console.error('Error processing LINE webhook events:', err);
        res.status(500).end(); // ส่ง Error กลับไปหากมีปัญหา
    }
});

// 4.3. API สำหรับการจัดการการเช็คชื่อของนักเรียน

// ดึงรายชื่อนักเรียนทั้งหมดในชั้นเรียนที่กำหนด (จาก CLASS_TO_TRACK)
app.get('/api/attendance/students', async (req, res) => {
    try {
        const studentsRef = db.collection('students');
        const snapshot = await studentsRef.where('class', '==', CLASS_TO_TRACK).get();
        if (snapshot.empty) {
            console.log('No matching students found for class:', CLASS_TO_TRACK);
            return res.status(200).json([]); // คืนค่า array เปล่าถ้าไม่พบนักเรียน
        }
        const students = snapshot.docs.map(doc => ({
            id: doc.id, // ใช้ ID ของ Document (ซึ่งควรเป็นเลขที่นักเรียน)
            ...doc.data() // ดึงข้อมูลอื่นๆ (name, class)
        }));
        res.status(200).json(students);
    } catch (error) {
        console.error('Error fetching students:', error);
        res.status(500).json({ error: 'Failed to fetch students.' });
    }
});

// บันทึกสถานะการเช็คชื่อของนักเรียน (มา, ลา, ขาด)
app.post('/api/attendance/record', async (req, res) => {
    const { studentId, status } = req.body;
    if (!studentId || !status) {
        return res.status(400).json({ error: 'Student ID and status are required.' });
    }

    try {
        const recordRef = db.collection('attendance').doc(); // ให้ Firestore สร้าง Document ID อัตโนมัติ
        await recordRef.set({
            studentId: studentId,
            status: status,
            timestamp: admin.firestore.FieldValue.serverTimestamp() // บันทึกเวลาจาก Server
        });
        res.status(200).json({ message: 'Attendance recorded successfully.' });
    } catch (error) {
        console.error('Error recording attendance:', error);
        res.status(500).json({ error: 'Failed to record attendance.' });
    }
});

// บันทึกเวลาที่นักเรียนเช็คอิน/เช็คเอาต์ (สำหรับสถานะ 'มา' ที่มีเวลาเข้า/ออก)
app.post('/api/attendance/record-checkin', async (req, res) => {
    const { studentId, type } = req.body; // type: 'in' หรือ 'out'
    if (!studentId || !type) {
        return res.status(400).json({ error: 'Student ID and type (in/out) are required.' });
    }

    try {
        const checkinRef = db.collection('checkins').doc(); // ให้ Firestore สร้าง Document ID อัตโนมัติ
        await checkinRef.set({
            studentId: studentId,
            type: type,
            timestamp: admin.firestore.FieldValue.serverTimestamp()
        });
        res.status(200).json({ message: `Check-${type} recorded successfully.` });
    } catch (error) {
        console.error(`Error recording check-${type}:`, error);
        res.status(500).json({ error: `Failed to record check-${type}.` });
    }
});

// สรุปผลการเช็คชื่อประจำวันและแจ้งเตือนผ่าน LINE Broadcast
app.post('/api/attendance/summary-and-notify', async (req, res) => {
    try {
        // 1. ดึงข้อมูลนักเรียนทั้งหมดในชั้นเรียนที่ติดตาม
        const studentsSnapshot = await db.collection('students')
            .where('class', '==', CLASS_TO_TRACK)
            .get();
        const allStudents = studentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        // สร้าง Map เพื่อหาชื่อนักเรียนจาก ID ได้ง่ายขึ้น
        const studentNames = new Map(allStudents.map(s => [s.id, s.name]));

        // 2. ดึงสถานะการเช็คชื่อล่าสุดของแต่ละคนสำหรับวันนี้
        const today = new Date();
        today.setHours(0, 0, 0, 0); // ตั้งค่าเวลาเริ่มต้นของวันนี้ (00:00:00)
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1); // ตั้งค่าเวลาเริ่มต้นของวันพรุ่งนี้

        const attendanceSnapshot = await db.collection('attendance')
            .where('timestamp', '>=', admin.firestore.Timestamp.fromDate(today))
            .where('timestamp', '<', admin.firestore.Timestamp.fromDate(tomorrow))
            .get();

        const latestStatus = {}; // เก็บสถานะล่าสุดของแต่ละ studentId
        attendanceSnapshot.docs.forEach(doc => {
            const data = doc.data();
            // ตรวจสอบว่ามีสถานะสำหรับนักเรียนคนนี้แล้วหรือไม่ หรือสถานะที่พบใหม่เป็นสถานะที่ใหม่กว่า
            if (!latestStatus[data.studentId] || latestStatus[data.studentId].timestamp.toDate() < data.timestamp.toDate()) {
                latestStatus[data.studentId] = data;
            }
        });

        // 3. จัดกลุ่มสถานะและสร้างข้อความสรุป
        const summary = {
            'มา': [],
            'ลา': [],
            'ขาด': [],
            'ยังไม่เช็คชื่อ': [] // สำหรับนักเรียนที่ไม่มีสถานะบันทึกไว้ในวันนี้เลย
        };

        allStudents.forEach(student => {
            const statusRecord = latestStatus[student.id];
            if (statusRecord) {
                summary[statusRecord.status].push(student.name);
            } else {
                summary['ยังไม่เช็คชื่อ'].push(student.name);
            }
        });

        // 4. สร้างข้อความสรุปสำหรับ LINE
        let summaryMessage = `สรุปผลการเช็คชื่อ วันที่ ${new Date().toLocaleDateString('th-TH', { dateStyle: 'long' })}\n\n`;
        summaryMessage += `✅ มา (${summary['มา'].length} คน): ${summary['มา'].length > 0 ? summary['มา'].join(', ') : '-'}\n`;
        summaryMessage += `🟡 ลา (${summary['ลา'].length} คน): ${summary['ลา'].length > 0 ? summary['ลา'].join(', ') : '-'}\n`;
        summaryMessage += `❌ ขาด (${summary['ขาด'].length} คน): ${summary['ขาด'].length > 0 ? summary['ขาด'].join(', ') : '-'}\n`;
        summaryMessage += `⚪ ยังไม่เช็คชื่อ (${summary['ยังไม่เช็คชื่อ'].length} คน): ${summary['ยังไม่เช็คชื่อ'].length > 0 ? summary['ยังไม่เช็คชื่อ'].join(', ') : '-'}\n`;

        console.log('Generated Summary Message:\n', summaryMessage);

        // 5. ส่งข้อความ Broadcast ไปยังผู้ใช้ LINE ทั้งหมดที่ Bot เป็นเพื่อน
        // LINE API จะส่งข้อความไปยังทุกคนที่ 'Follow' บอทนี้อยู่แล้ว
        const broadcastResult = await lineClient.broadcast({
            type: 'text',
            text: summaryMessage
        });
        console.log('LINE Broadcast message sent:', broadcastResult);

        res.status(200).json({ message: 'Summary generated and LINE notification sent.', summary: summary });
    } catch (error) {
        console.error('Error generating summary or sending LINE notification:', error);
        res.status(500).json({ error: 'Failed to generate summary or send LINE notification.' });
    }
});


// --- 5. Start Server ---
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Local Backend URL: http://localhost:${PORT}`);
    console.log(`Local LINE Webhook endpoint: http://localhost:${PORT}/api/line-webhook`);
});
