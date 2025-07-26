// app.js
// ไฟล์หลักของ Backend สำหรับระบบเช็คชื่อนักเรียน

// นำเข้าโมดูลที่จำเป็น
const express = require('express');
const bodyParser = require('body-parser');
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
  "private_key_id": "bd63ab59b804d6ba4d5937e09b1ae650ae0f919f",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC7lDV4CHGSyKCw\nuwtg3QubrK12aECNYvd/ABx6jG94iJxBHs2wvUxcwoeJomjw1NH9Kc4o2GVCwAYv\n2teYv4mgndH7xsreZyutIxZA70bkCEB8GwtTn3Q2R+1SFqEXF4M5BlGaEHatpVyH\nOmylXNv0kO1UgBFn8Kzd7RXg4/S26V7E7n3U2vGNSs3tED4Ag8n6FvbKWUemQ77u\njt4bKyLjOt+3ej3geIVL1+aTzX4YZsi7Fy7466gBEFe5afk0a+qsMhWHZ8p5K9/N\nZqoVL/QLMLQ0zqspgweNMK9jtoqrvcjdMxkz4KEB2ILpp5nRT333OTuzaM3QBrzV\nUgJ4JbexAgMBAAECggEAD/eL6Z2TLvLXAtQyu411Vhk6/Sl4o50saVCBta8yM4KY\nnzTXcddbPBYiLwWp6ySI6QTfxwhMh+o/XJMQGrEX+2atUvVwzvR3Rxo45B26EHt6\nibxMZYZ2mcKobkr9oWQsYY4RI8BWnQdgOr6VZ8OuXkFFgnwR5aG0a7VC6ubC+oLG\n1KGL4O1zrJl4vEmAszDL70/KiHQlL7eBY9oOyGLcyd21a/yZF1y/k6THK6Zh4r6+\nO89V2/g9ZHW0FOmr8z/bq1C7EsCd05SSXEZ7+sP+KQg5PmNziplAGzMaka2My2t+\nY4AA49UjK07/Vgfd57v9LH/A75BIhlN+dKDCOHQS5QKBgQDhv6z6ApbGunxW9QNZ\nSEXR5nWTKgs/fJBDc1tD/fPRNOBy95z06DKrqYHqpf3yhmbKGUtLyii4K2NSsYew\nQpJ+5lb/9Y7jg5y1kHfqps2TUcZPlTRotuu1KmYxUFY0DEOaqQDyF56HN3Ytl9TR\nSG1kRr8r7zWLT/52avpdRDRvdwKBgQDUtx23SayhYbDle3em1nqaFJ2pLwSdpBgA\n2QQkL1TMu5xh7vlK4XINyJK9yK3RutAa7gLqRbqyYkSmopImSIZ5fr7FV3QCmnDa\nXphfK7eSHmaug7ApTDyl8ttDElVw2thh4pYLuyB90b7KKZ1e5+XiyG89PNfe/hl5\nr9ie3ELsFwKBgBvjMdswtq+WGgYj/mXpJ7bmYV/ssbcGDExI091yYcxWW+PX8uvO\nQ3QxXHtARj7Pm6MbvNGAB8e4lGyCweBkWPSUP+seyqgQeitzzVyPfpXUZEswg2js\nL/IRas5svjlvymowto0xncPWdiLrvr6b0+evVa53voWXPDgkvwkGg/PBAoGBALS0\nt3btDM2wizH4uMYwMMlSuDlw6w/sxkN6GU2QNA8VVp3QAVI+wcC54wd9Q0UH2iD2\nj91rzVYbq0yQkW4acLsoFHLbf39yqmqor/Mx1Wo5j2u0DeSXknI8JU8OdS1BjU9i\nyas/ljOtCtL9lWZ5xM7rDa1NUeprnULGQ1V5sxSTAoGAbVAEAekzqI8MdOWeClFn\nzr4K7gCQfh8vvzw1dmH5AvcXt8NRFbuBlpHV5I9UTqwYtyVr0s89IY6nITf0n+Dt\n/WWsdxEAwiUrnZ3e2yl8Sxi/0PSjj3C30eviw17wgEXEt46je3zC4B3quy4Tl3SU\n5p7bfDG/j/zpbegsTV97UGY=\n-----END PRIVATE KEY-----\n",
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

// 4.1. Root Endpoint: สำหรับทดสอบว่า Backend ทำงานอยู่ไหม
app.get('/', (req, res) => {
    console.log('GET / request received.'); 
    res.send('Attendance System Backend is running!');
});

// 4.2. LINE Webhook Endpoint: รับ Event จาก LINE Platform
// Path นี้คือ /api/line-webhook
console.log('Registering POST /api/line-webhook route...'); 
app.post('/api/line-webhook', 
    bodyParser.raw({ type: 'application/json' }), // ใช้ bodyParser.raw() สำหรับ LINE Webhook โดยเฉพาะ
    middleware(lineConfig), // LINE middleware ต้องประมวลผลก่อน
    async (req, res) => {
        console.log('LINE Webhook Event Received at /api/line-webhook.'); 
        console.log('Request Method:', req.method); 
        console.log('Request Path:', req.path); 
        console.log('Request URL:', req.originalUrl); 
        
        let events;
        try {
            // req.body จะเป็น Buffer เมื่อใช้ bodyParser.raw()
            // เราต้องแปลงกลับเป็น JSON Object ด้วยตัวเอง
            events = JSON.parse(req.body.toString()).events;
            console.log('Request Body (Parsed):', JSON.stringify(events, null, 2)); 
        } catch (parseError) {
            console.error('Error parsing LINE webhook raw body:', parseError);
            return res.status(400).send('Invalid JSON in webhook body.');
        }

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

// ดึงรายชื่อนักเรียนทั้งหมดในชั้นเรียนที่กำหนด (จาก CLASS_TO_TRACK)
app.get('/api/attendance/students', async (req, res) => {
    console.log('GET /api/attendance/students request received.'); 
    try {
        const studentsRef = db.collection('students');
        const snapshot = await studentsRef.where('class', '==', CLASS_TO_TRACK).get();
        if (snapshot.empty) {
            console.log('No matching students found for class:', CLASS_TO_TRACK);
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

// บันทึกสถานะการเช็คชื่อของนักเรียน (มา, ลา, ขาด, สาย)
// API นี้จะรับข้อมูลสถานะรวมของนักเรียนสำหรับวันนั้นๆ
app.post('/api/attendance/record', async (req, res) => {
    console.log('POST /api/attendance/record request received.'); 
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
                checkIns: checkIns || [], 
                timestamp: admin.firestore.FieldValue.serverTimestamp() 
            }, { merge: true }); 
        } else {
            await attendanceRef.set({
                studentId: studentId,
                studentName: studentName,
                date: date,
                status: status,
                checkIns: [], 
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

// สรุปผลการเช็คชื่อประจำวันและแจ้งเตือนผ่าน LINE Broadcast
app.post('/api/attendance/summary-and-notify', async (req, res) => {
    console.log('POST /api/attendance/summary-and-notify request received.'); 
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
    console.log(`Local LINE Webhook endpoint: http://localhost:${PORT}/api/line-webhook`);
    console.log('Express app started and listening for requests.'); 
});

// --- 6. Global Error Handler (สำหรับจับ Error ที่ไม่ได้ถูกจับใน Route) ---
app.use((err, req, res, next) => {
    console.error('Unhandled Error:', err.stack); 
    res.status(500).send('Something broke!');
});

// --- 7. 404 Not Found Handler (ต้องอยู่ท้ายสุดของ Routes ทั้งหมด) ---
// ส่วนนี้จะทำงานเมื่อไม่มี Route ใดๆ ที่ตรงกับ Request ที่เข้ามา
app.use((req, res, next) => {
    console.log(`404 Not Found: Request Method: ${req.method}, Path: ${req.path}, Original URL: ${req.originalUrl}`); 
    res.status(404).send('Not Found');
});
