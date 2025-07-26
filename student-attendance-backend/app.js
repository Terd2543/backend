// app.js
// ไฟล์หลักของ Backend สำหรับระบบเช็คชื่อนักเรียน

// นำเข้าโมดูลที่จำเป็น
const express = require('express');
const bodyParser = require('body-parser'); // ยังคงต้องใช้สำหรับ API อื่นๆ
const cors = require('cors');
const { Client, middleware } = require('@line/bot-sdk'); // LINE Bot SDK
const admin = require('firebase-admin'); // Firebase Admin SDK
require('dotenv').config(); // โหลด Environment Variables จากไฟล์ .env (สำหรับการรันในเครื่อง)

// --- 1. การตั้งค่าและเริ่มต้น Firebase Admin SDK ---
// *** คำเตือน: การฝัง Service Account Key ลงในโค้ดโดยตรงนี้ "ไม่ปลอดภัยอย่างยิ่ง" ***
// *** หากคุณจะ Push โค้ดนี้ขึ้น GitHub Public Repository โปรดพิจารณาความเสี่ยงอย่างถี่ถ้วน ***
// *** แนะนำให้ใช้ Environment Variables บน Render Dashboard เพื่อความปลอดภัยสูงสุด ***
const serviceAccount = {
  "type": "service_account",
  "project_id": "service-b6c91",
  "private_key_id": "25742d742836b74c87b872da4fb709368bb00858", // <-- ตรวจสอบว่าตรงกับ Key ล่าสุดที่คุณให้มา
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQCzEsB+RqC8dWHu\nMGe4QG+7k2rxiz8cRxZz9d7uY4p4BULiunEN9YRg03wgI2Nhywh3/O2XhylTG/F2\nPgPQQ2HQIK7ahDokiu2cxmiNb6DkugeAziJExKp7iC91waGhreUcfiK6Cji4KVj9\nj1rUc4ljynO98n5Rt70tY7xDc/bcrmtNO7Zb0suRKGLPq8K1NLE6vIkXGawVLgYV\nxg4Rxla018b0Sz3g7EnYj9IEDAdShQI3nxi7AhLQ+yV5/PgPie8Rzg+H0gsTvpUQ\nKe3u6iYXCglLfeVJ6uM2zGXeEAn0dZQMsFjCbQhFrZIc6RaEvYJ+ojCODMiPqpfh\n86V8ipNjAgMBAAECggEAISvcFIgoxkBIP8Mfs3XcPLb2HIBa1HYmppxpC2fNAqaW\n2UEIKDnOp9EFMT7c7gSaMP/dUzBqa0bF181tD2sr903WlgvgaVyC34OxYmHHQBdl\nxGpq1qpHmlKD2CBiPHzl7/09mZDDKPofzfh8LtaoIKAkCI+e7qxGkt3ixev5Uq98\nOYTM4Lyz0i9jF6pj4O257l4b+b/KOT6cSWaHo0d67YcTs9tVeZRSldBa0DvLv1cu\naILkxbLRb/UYh38djTgtEWgZ7jwLi7xdQC0laNR2n6K5ihjfvgbItjDBNiCSn28A\n1W8fNXvoSf4ShW/MryiwcC1Rwhf54rFiEpqxAm30wQKBgQD73+VWgBnwcKVLJzSX\nJiLG6EYS/y9C5gHfz3r6ciCCr3M1ue4GUwEaGHCpAqjknUMQnM9PqfA/OstxNZzY\nYZcfAXHgWyNlbxZlRtlR37ts6KigRfxBFw4Eqn0RvabR2TnN3P++TS3aKPiOEc4i\n22VICEHcsBGOE1eRsfmvKaouKQKBgQC2AZoObcgchWkV/bYatBDCK34WccCol9UR\nm9ku6iWSH3+zqjtH0IRG5saqIbjrTwyDiRIkJsGLUz50fI9AvMHtIYrtgGY84tMD\n6dK6IVzKIh8WQe8Wg95/onZ6sqKPk5DK5o9bLusL6R6x0C45Glf722O+wAA0m/iA\nU0154ouOqwKBgHUxJscJkYgjEXWXR0vwjYvY9QnPvBC3bjXRltnCkkfcFJHx8cL1\nifS3XGv29dhxJ4wqOfdKDaON2qzREipHtgXSKUcHgL+oYVY8Ec+bdtxkoFj6VzV9\n4aLgJJNFl8HZ/aBAbKoBxQzVtVh9BlmHlWdfmC1zqqddbog2tAMBMtKJAoGASo+d\nbQvMTuLYignF8GqT8veeT9OJ+Yc54lzWPEHv4kzFI/U5E9J4XhNsj4YBG2Tm23vr\n0qON5mXT0CS3Cu5JA7waDfHr8EV77L59dYL1YFlaIuQf7jlXjTIhF2LW9bqeNoD9\neX1fDSITUQTX6sy//o2B70L40pSS2P9HXgdQ5MECgYAWIXycmeM3rfE+XqCltSsX\njnGxZA9iLnfeZTFPEQeRDnRiTR6wiWDa5oZ2Die5PCQqzdbj0Ha1archm7n4troK\n9Ei3oFLQrbAko0o+ZBGSrwY0DLgI+Edbw4YEbnaR55DH9MBAkKU+69Df5EDYO0Nt\nPSc+rjDvfroCmxSK7GeZ+A==\n-----END PRIVATE KEY-----\n", 
  "client_email": "firebase-adminsdk-fbsvc@service-b6c91.iam.gserviceaccount.com",
  "client_id": "107379482595606642903",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40service-b6c91.iam.gserviceaccount.com",
  "universe_domain": "googleapis.com"
};

// เริ่มต้น Firebase Admin SDK ด้วยข้อมูล Service Account Key ที่ได้มา
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore(); // กำหนด Firestore instance เพื่อใช้งาน
// กำหนดชั้นเรียนที่ระบบจะติดตาม โดยอ่านจาก Environment Variable หรือใช้ค่าเริ่มต้น
const CLASS_TO_TRACK = process.env.CLASS_TO_TRACK || 'ม.1/10'; 

// --- 2. การตั้งค่า LINE Bot SDK ---
// ตรวจสอบว่า Environment Variables สำหรับ LINE ถูกตั้งค่าหรือไม่
if (!process.env.LINE_CHANNEL_ACCESS_TOKEN || !process.env.LINE_CHANNEL_SECRET) {
    console.error('LINE_CHANNEL_ACCESS_TOKEN or LINE_CHANNEL_SECRET is not set in environment variables.');
    console.error('Please set these variables in your .env file (local) or Render Dashboard (cloud).');
    process.exit(1); // หยุดการทำงานหากไม่มีค่าที่จำเป็น
}

// กำหนดค่าคอนฟิกสำหรับ LINE Bot SDK
const lineConfig = {
    channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
    channelSecret: process.env.LINE_CHANNEL_SECRET,
};

const lineClient = new Client(lineConfig); // สร้าง LINE client instance สำหรับส่ง/รับข้อความ

// --- 3. การตั้งค่า Express App ---
const app = express();
// กำหนด Port ที่ Backend จะรัน โดยอ่านจาก Environment Variable หรือใช้ค่าเริ่มต้น
const PORT = process.env.PORT || 3000; 

// ดึงค่า ALLOWED_ORIGINS จาก Environment Variable สำหรับ CORS
// หากมีหลาย Origin ให้แยกด้วยคอมม่า (,) ใน .env เช่น ALLOWED_ORIGINS=https://domain1.com,https://domain2.com
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : [];

// Middleware
// ตั้งค่า CORS เพื่ออนุญาตเฉพาะ Origin ที่กำหนด
app.use(cors({
    origin: (origin, callback) => {
        console.log(`CORS check: Request origin is "${origin}"`); 
        // อนุญาต Request ที่ไม่มี Origin (เช่น จาก Postman หรือ curl)
        if (!origin) return callback(null, true);
        // ตรวจสอบว่า Origin ที่เข้ามาอยู่ในรายการที่อนุญาตหรือไม่
        if (ALLOWED_ORIGINS.indexOf(origin) === -1) {
            const msg = `The CORS policy for this site does not allow access from the specified Origin: ${origin}. Allowed origins: ${ALLOWED_ORIGINS.join(', ')}`; 
            console.error(msg); 
            return callback(new Error(msg), false);
        }
        console.log(`CORS check: Origin "${origin}" is allowed.`); 
        return callback(null, true);
    }
}));

// *** สำคัญ: ไม่ต้องใช้ app.use(bodyParser.json()); ตรงนี้แล้ว ***
// เราจะใช้ bodyParser.json() สำหรับ API อื่นๆ และ bodyParser.raw() สำหรับ webhook

// --- 4. API Endpoints (Routes) ---

// 4.1. Root Endpoint: สำหรับ Frontend (เดิมคือ /api)
// เปลี่ยนจาก /api เป็น /
app.get('/', (req, res) => {
    console.log('GET / request received (for Frontend base URL).'); 
    res.send('Attendance System Backend is running!');
});

// 4.2. LINE Webhook Endpoint: รับ Event จาก LINE Platform
// เปลี่ยนจาก /api/line-webhook เป็น /webhook
console.log('Registering POST /webhook route...'); 
app.post('/webhook', 
    // *** สำคัญ: ไม่ต้องใช้ bodyParser.raw() ที่นี่แล้ว ***
    // LINE SDK middleware จะจัดการ Raw Body และแปลงเป็น JSON Object เอง
    middleware(lineConfig), // LINE middleware ต้องประมวลผลก่อน
    async (req, res) => {
        console.log('LINE Webhook Event Received at /webhook.'); 
        console.log('Request Method:', req.method); 
        console.log('Request Path:', req.path); 
        console.log('Request URL:', req.originalUrl); 
        
        // req.body ควรจะเป็น JSON Object อยู่แล้วหลังจาก LINE middleware ประมวลผล
        const events = req.body.events; 
        console.log('Request Body (Parsed):', JSON.stringify(req.body, null, 2)); // Log req.body ทั้งหมด

        if (!events || events.length === 0) {
            console.log('No events to process in webhook body.'); 
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
                    // เช่น:
                    // if (userMessage.toLowerCase() === 'สวัสดี') {
                    //     await lineClient.replyMessage(event.replyToken, { type: 'text', text: 'สวัสดีครับ!' });
                    // } else {
                    //     await lineClient.replyMessage(event.replyToken, { type: 'text', text: 'ไม่เข้าใจคำสั่งครับ' });
                    // }
                }
            }));
            res.status(200).send('Events processed.'); 
        }
        catch (err) {
            console.error('Error processing LINE webhook events:', err);
            res.status(500).end(); 
        }
    }
);

// *** สำคัญ: ใช้ bodyParser.json() สำหรับ API อื่นๆ ที่ต้องการ JSON body ***
app.use(bodyParser.json()); 

// 4.3. API สำหรับการจัดการการเช็คชื่อของนักเรียน
// เปลี่ยน Path API อื่นๆ ให้ไม่มี /api นำหน้าแล้ว
app.get('/attendance/students', async (req, res) => { // เดิม /api/attendance/students
    console.log('GET /attendance/students request received.'); 
    try {
        const studentsRef = db.collection('students');
        // เพิ่ม query เพื่อดึงเฉพาะนักเรียนในชั้น ม.1/10
        const qStudents = query(studentsRef, where('class', '==', 'ม.1/10'));
        const studentSnapshot = await getDocs(qStudents); 

        if (studentSnapshot.empty) {
            console.log('No matching students found for class: ม.1/10');
            return res.status(200).json([]); 
        }
        const students = studentSnapshot.docs.map(doc => ({
            id: doc.id, 
            ...doc.data() 
        }));
        res.status(200).json(students);
    } catch (error) {
        console.error('Error fetching students:', error);
        res.status(500).json({ error: 'Failed to fetch students.' });
    }
});

app.post('/attendance/record', async (req, res) => { // เดิม /api/attendance/record
    console.log('POST /attendance/record request received.'); 
    const { studentId, studentName, date, status, checkIns } = req.body; 
    
    if (!studentId || !date || !status || !studentName) {
        console.error('Missing required fields for attendance record.'); 
        return res.status(400).json({ message: 'Missing required fields: studentId, date, status, studentName' });
    }

    const docId = `${studentId}-${date}`; 
    const attendanceRef = db.collection('attendance').doc(docId);

    try {
        if (status === 'มา') {
            await attendanceRef.set({
                studentId: studentId,
                studentName: studentName,
                date: date,
                status: 'มา', 
                checkIns: checkIns || [], // รับ checkIns array เข้ามาด้วย
                timestamp: admin.firestore.FieldValue.serverTimestamp() 
            }, { merge: true }); 
        } else {
            await attendanceRef.set({
                studentId: studentId,
                studentName: studentName,
                date: date,
                status: status,
                checkIns: [], // ล้าง checkIns สำหรับสถานะเหล่านี้
                timestamp: admin.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
        }

        console.log('Attendance recorded successfully for student:', studentId); 
        res.status(200).json({ message: 'Attendance recorded successfully!' });

    } catch (error) {
        console.error('Error recording attendance:', error);
        res.status(500).json({ message: 'Failed to record attendance', error: error.message });
    }
});

app.post('/attendance/summary-and-notify', async (req, res) => { // เดิม /api/attendance/summary-and-notify
    console.log('POST /attendance/summary-and-notify request received.'); 
    try {
        const studentsSnapshot = await db.collection('students')
            .where('class', '==', CLASS_TO_TRACK)
            .get();
        const allStudents = studentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const studentNamesMap = new Map(allStudents.map(s => [s.id, s.name]));

        const today = new Date();
        today.setHours(0, 0, 0, 0); 
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1); 

        const attendanceSnapshot = await db.collection('attendance')
            .where('date', '==', `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`) 
            .get();

        const latestStatus = {}; 
        attendanceSnapshot.docs.forEach(doc => {
            const data = doc.data();
            if (!latestStatus[data.studentId] || (data.timestamp && latestStatus[data.studentId].timestamp && latestStatus[data.studentId].timestamp.toDate() < data.timestamp.toDate())) {
                latestStatus[data.studentId] = data;
            }
        });

        const summary = {
            'มา': [],
            'ลา': [],
            'ขาด': [],
            'สาย': [], 
            'ยังไม่เช็คชื่อ': [] 
        };

        allStudents.forEach(student => {
            const statusRecord = latestStatus[student.id];
            if (statusRecord && statusRecord.status) {
                if (statusRecord.status === 'มา' && (!statusRecord.checkIns || statusRecord.checkIns.length === 0)) {
                    // ถ้าสถานะเป็น 'มา' แต่ไม่มี checkIns ให้ถือว่า 'ขาด'
                    summary['ขาด'].push(student.name);
                } else {
                    summary[statusRecord.status].push(student.name);
                }
            } else {
                summary['ยังไม่เช็คชื่อ'].push(student.name);
            }
        });

        let summaryMessage = `สรุปผลการเช็คชื่อ ม.1/10\nวันที่ ${new Date().toLocaleDateString('th-TH', { dateStyle: 'long' })}\n\n`;
        summaryMessage += `✅ มา: ${summary['มา'].length} คน (${summary['มา'].join(', ') || 'ไม่มี'})\n`;
        summaryMessage += `🟡 ลา: ${summary['ลา'].length} คน (${summary['ลา'].join(', ') || 'ไม่มี'})\n`;
        summaryMessage += `❌ ขาด: ${summary['ขาด'].length} คน (${summary['ขาด'].join(', ') || 'ไม่มี'})\n`;
        summaryMessage += `⏱️ สาย: ${summary['สาย'].length} คน (${summary['สาย'].join(', ') || 'ไม่มี'})`;

        console.log('Generated Summary Message:\n', summaryMessage);

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


// --- 5. เริ่มต้น Server ---
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Local Backend URL: http://localhost:${PORT}`);
    console.log(`Local LINE Webhook endpoint: http://localhost:${PORT}/webhook`); 
    console.log('Express app started and listening for requests.'); 
});

// --- 6. Global Error Handler (สำหรับจับ Error ที่ไม่ได้ถูกจับใน Route) ---
app.use((err, req, res, next) => {
    console.error('Unhandled Error:', err.stack); 
    res.status(500).send('Something broke!');
});

// --- 7. 404 Not Found Handler (ต้องอยู่ท้ายสุดของ Routes ทั้งหมด) ---
// ส่วนนี้จะทำงานเมื่อไม่มี Route ใดๆ ที่ตรงกับ Request ที่เข้ามา
app.use((req, res, next) => { // แก้ไข: เพิ่ม next กลับมา
    console.log(`404 Not Found: Request Method: ${req.method}, Path: ${req.path}, Original URL: ${req.originalUrl}`); 
    res.status(404).send('Not Found');
});
