// uploadStudents.js
// สคริปต์สำหรับอัปโหลดข้อมูลนักเรียนจาก student_data.json เข้าสู่ Firestore

const admin = require('firebase-admin');
// ไม่ต้องใช้ dotenv แล้ว เนื่องจาก Service Account Key ถูกฝังโดยตรง
// require('dotenv').config(); 

const studentsData = require('./student_data.json'); // Path ไปยังไฟล์ student_data.json

// --- คำเตือนสำคัญ: การฝัง Service Account Key ลงในโค้ดโดยตรงนี้ "ไม่ปลอดภัยอย่างยิ่ง" ---
// --- หากคุณจะ Push โค้ดนี้ขึ้น GitHub Public Repository โปรดพิจารณาความเสี่ยงอย่างถี่ถ้วน ---
// --- แนะนำให้ใช้ Environment Variables บน Render Dashboard เพื่อความปลอดภัยสูงสุด ---
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

const db = admin.firestore();

async function uploadStudents() {
  console.log('Starting student data upload to Firestore...');
  for (const student of studentsData) {
    try {
      // ใช้ student.id เป็น Document ID
      await db.collection('students').doc(student.id.toString()).set(student);
      console.log(`Uploaded student: ${student.name} (ID: ${student.id})`);
    } catch (error) {
      console.error(`Error uploading student ${student.name} (ID: ${student.id}):`, error);
    }
  }
  console.log('Student data upload complete.');
}

// เรียกฟังก์ชันอัปโหลดข้อมูล
uploadStudents().catch(console.error);
