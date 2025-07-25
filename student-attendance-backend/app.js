// app.js
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { Client, middleware } = require('@line/bot-sdk');
const admin = require('firebase-admin');
require('dotenv').config(); // โหลด Environment Variables จาก .env file

// --- 1. Firebase Admin SDK Initialization ---
// ตรวจสอบว่า Service Account Key ถูกตั้งค่าผ่าน Environment Variable (สำหรับ Deploy บน Cloud)
// หรือจากไฟล์ Service Account Key ในเครื่อง (สำหรับ Local Development)
const serviceAccountLocalPath = './your-project-name-firebase-adminsdk-xxxxx-xxxxxxxxxx.json'; // *** เปลี่ยนชื่อไฟล์นี้ให้ถูกต้องตามที่คุณดาวน์โหลดมา ***

let serviceAccount;

if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
  try {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
    console.log("Using Firebase Service Account from environment variable.");
  } catch (e) {
    console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY environment variable:", e);
    process.exit(1);
  }
} else {
  try {
    serviceAccount = require(serviceAccountLocalPath);
    console.log(`Using Firebase Service Account from local file: ${serviceAccountLocalPath}`);
  } catch (e) {
    console.error(`Error: Could not load local Firebase Service Account file at ${serviceAccountLocalPath}`);
    console.error("Please ensure the file exists and the path is correct.");
    console.error("If deploying to cloud, set FIREBASE_SERVICE_ACCOUNT_KEY environment variable.");
    process.exit(1);
  }
}

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore(); // กำหนด Firestore instance
const CLASS_TO_TRACK = process.env.CLASS_TO_TRACK || 'ม.1/10'; // ชั้นเรียนที่ต้องการติดตาม

// --- 2. LINE Bot SDK Configuration ---
if (!process.env.LINE_CHANNEL_ACCESS_TOKEN || !process.env.LINE_CHANNEL_SECRET) {
    console.error('LINE_CHANNEL_ACCESS_TOKEN or LINE_CHANNEL_SECRET is not set in environment variables.');
    process.exit(1);
}

const lineConfig = {
    channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
    channelSecret: process.env.LINE_CHANNEL_SECRET,
};

const lineClient = new Client(lineConfig); // สร้าง LINE client instance

// --- 3. Express App Setup ---
const app = express();
const PORT = process.env.PORT || 3000; // ใช้ PORT จาก .env หรือใช้ 3000 เป็นค่าเริ่มต้น

// Middleware
app.use(cors()); // อนุญาตให้ Frontend (ที่อาจอยู่คนละ Domain) สามารถเรียกใช้ Backend ได้
app.use(bodyParser.json()); // สำหรับ Parse JSON body ของ Request

// --- 4. API Endpoints (Routes) ---

// Root Endpoint สำหรับทดสอบว่า Backend ทำงานอยู่ไหม
app.get('/', (req, res) => {
    res.send('Attendance System Backend is running!');
});

// 4.1. LINE Webhook Endpoint
// ใช้ middleware ของ LINE เพื่อยืนยันความถูกต้องของ request
app.post('/api/line-webhook', middleware(lineConfig), async (req, res) => {
    console.log('LINE Webhook Event Received.');

    const events = req.body.events;

    if (!events || events.length === 0) {
        return res.status(200).send('No events to process.');
    }

    try {
        await Promise.all(events.map(async (event) => {
            if (event.type === 'follow') {
                const userId = event.source.userId;
                console.log(`User followed bot: ${userId}`);
                try {
                    await db.collection('lineUsers').doc(userId).set({
                        userId: userId,
                        timestamp: admin.firestore.FieldValue.serverTimestamp()
                    }, { merge: true });
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
                const userId = event.source.userId;
                console.log(`User unfollowed bot: ${userId}`);
                try {
                    await db.collection('lineUsers').doc(userId).delete();
                    console.log(`Deleted userId: ${userId} from Firestore.`);
                } catch (error) {
                    console.error('Error deleting userId on unfollow:', error);
                }
            } else if (event.type === 'message' && event.message.type === 'text') {
                const userId = event.source.userId;
                const userMessage = event.message.text;
                console.log(`Received message from ${userId}: "${userMessage}"`);
                // คุณสามารถเพิ่ม logic สำหรับการตอบกลับข้อความหรือรับคำสั่งจากผู้ใช้ได้ที่นี่
            }
        }));
        res.status(200).send('Events processed.');
    } catch (err) {
        console.error('Error processing LINE webhook events:', err);
        res.status(500).end();
    }
});

// 4.2. API สำหรับการจัดการการเช็คชื่อ
// ดึงรายชื่อนักเรียนทั้งหมด
app.get('/api/attendance/students', async (req, res) => {
    try {
        const studentsRef = db.collection('students');
        const snapshot = await studentsRef.where('class', '==', CLASS_TO_TRACK).get();
        if (snapshot.empty) {
            console.log('No matching students found.');
            return res.status(200).json([]);
        }
        const students = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        res.status(200).json(students);
    } catch (error) {
        console.error('Error fetching students:', error);
        res.status(500).json({ error: 'Failed to fetch students.' });
    }
});

// บันทึกสถานะการเช็คชื่อของนักเรียน
app.post('/api/attendance/record', async (req, res) => {
    const { studentId, status } = req.body;
    if (!studentId || !status) {
        return res.status(400).json({ error: 'Student ID and status are required.' });
    }

    try {
        const recordRef = db.collection('attendance').doc(); // Auto-ID สำหรับแต่ละ Record
        await recordRef.set({
            studentId: studentId,
            status: status,
            timestamp: admin.firestore.FieldValue.serverTimestamp()
        });
        res.status(200).json({ message: 'Attendance recorded successfully.' });
    } catch (error) {
        console.error('Error recording attendance:', error);
        res.status(500).json({ error: 'Failed to record attendance.' });
    }
});

// บันทึกเวลาที่นักเรียนเช็คอิน/เช็คเอาต์ (สำหรับสถานะ 'มา')
app.post('/api/attendance/record-checkin', async (req, res) => {
    const { studentId, type } = req.body; // type: 'in' หรือ 'out'
    if (!studentId || !type) {
        return res.status(400).json({ error: 'Student ID and type (in/out) are required.' });
    }

    try {
        const checkinRef = db.collection('checkins').doc(); // Auto-ID
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


// สรุปผลการเช็คชื่อและแจ้งเตือนผ่าน LINE Broadcast
app.post('/api/attendance/summary-and-notify', async (req, res) => {
    try {
        // 1. ดึงข้อมูลนักเรียนทั้งหมดในชั้นเรียนที่ติดตาม
        const studentsSnapshot = await db.collection('students')
            .where('class', '==', CLASS_TO_TRACK)
            .get();
        const allStudents = studentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const studentNames = new Map(allStudents.map(s => [s.id, s.name]));

        // 2. ดึงสถานะการเช็คชื่อล่าสุดของแต่ละคนสำหรับวันนี้
        const today = new Date();
        today.setHours(0, 0, 0, 0); // ตั้งค่าเวลาเริ่มต้นของวันนี้
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1); // ตั้งค่าเวลาเริ่มต้นของวันพรุ่งนี้

        const attendanceSnapshot = await db.collection('attendance')
            .where('timestamp', '>=', admin.firestore.Timestamp.fromDate(today))
            .where('timestamp', '<', admin.firestore.Timestamp.fromDate(tomorrow))
            .get();

        const latestStatus = {};
        attendanceSnapshot.docs.forEach(doc => {
            const data = doc.data();
            // ตรวจสอบสถานะล่าสุดสำหรับนักเรียนแต่ละคน
            if (!latestStatus[data.studentId] || latestStatus[data.studentId].timestamp.toDate() < data.timestamp.toDate()) {
                latestStatus[data.studentId] = data;
            }
        });

        // 3. จัดกลุ่มสถานะ
        const summary = {
            'มา': [],
            'ลา': [],
            'ขาด': [],
            'ยังไม่เช็คชื่อ': [] // สำหรับนักเรียนที่ไม่มีสถานะบันทึกไว้ในวันนี้
        };

        allStudents.forEach(student => {
            const statusRecord = latestStatus[student.id];
            if (statusRecord) {
                summary[statusRecord.status].push(student.name);
            } else {
                summary['ยังไม่เช็คชื่อ'].push(student.name);
            }
        });

        // 4. สร้างข้อความสรุป
        let summaryMessage = `สรุปผลการเช็คชื่อ วันที่ ${new Date().toLocaleDateString('th-TH')}\n\n`;
        summaryMessage += `✅ มา: ${summary['มา'].length > 0 ? summary['มา'].join(', ') : '-'}\n`;
        summaryMessage += `🟡 ลา: ${summary['ลา'].length > 0 ? summary['ลา'].join(', ') : '-'}\n`;
        summaryMessage += `❌ ขาด: ${summary['ขาด'].length > 0 ? summary['ขาด'].join(', ') : '-'}\n`;
        summaryMessage += `⚪ ยังไม่เช็คชื่อ: ${summary['ยังไม่เช็คชื่อ'].length > 0 ? summary['ยังไม่เช็คชื่อ'].join(', ') : '-'}\n`;

        console.log(summaryMessage);

        // 5. ส่งข้อความ Broadcast ไปยังผู้ใช้ LINE ทั้งหมดที่ Bot เป็นเพื่อน
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
