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
  "private_key_id": "25742d742836b74c87b872da4fb709368bb00858",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQCzEsB+RqC8dWHu\nMGe4QG+7k2rxiz8cRxZz9d7uY4p4BULiunEN9YRg03wgI2Nhywh3/O2XhylTG/F2\nPgPQQ2HQIK7ahDokiu2cxmiNb6DkugeAziJExKp7iC91waGhreUcfiK6Cji4KVj9\nj1rUc4ljynO98n5Rt70tY7xDc/bcrmtNO7Zb0suRKGLPq8K1NLE6vIkXGawVLgYV\nxg4Rxla018b0Sz3g7EnYj9IEDAdShQI3nxi7AhLQ+yV5/PgPie8Rzg+H0gsTvpUQ\nKe3u6iYXCglLfeVJ6uM2zGXeEAn0dZQMsFjCbQhFrZIc6RaEvYJ+ojCODMiPqpfh\n86V8ipNjAgMBAAECggEAISvcFIgoxkBIP8Mfs3XcPLb2HIBa1HYmppxpC2fNAqaW\n2UEIKDnOp9EFMT7c7gSaMP/dUzBqa0bF181tD2sr903WlgvgaVyC34OxYmHHQBdl\nxGpq1qpHmlKD2CBiPHzl7/09mZDDKPofzfh8LtaoIKAkCI+e7qxGkt3ixev5Uq98\nOYTM4Lyz0i9jF6pj4O257l4b+b/KOT6cSWaHo0d67YcTs9tVeZRSldBa0DvLv1cu\naILkxbLRb/UYh38djTgtEWgZ7jwLi7xdQC0laNR2n6K5ihjfvgbItjDBNiCSn28A\n1W8fNXvoSf4ShW/MryiwcC1Rwhf54rFiEpqxAm30wQKBgQD73+VWgBnwcKVLJzSX\nJiLG6EYS/y9C5gHfz3r6ciCCr3M1ue4GUwEaGHCpAqjknUMQnM9PqfA/OstxNZzY\nYZcfAXHgWyNlbxZlRtlR37ts6KigRfxBFw4Eqn0RvabR2TnN3P++TS3aKPiOEc4i\n22VICEHcsBGOE1eRsfmvKaouKQKBgQC2AZoObcgchWkV/bYatBDCK34WccCol9UR\nm9ku6iWSH3+zqjtH0IRG5saqIbjrTwyDiRIkJsGLUz50fI9AvMHtIYrtgGY84tMD\n6dK6IVzKIh8WQe8Wg95/onZ6sqKPk5DK5o9bLusL6R6x0C45Glf722O+wAA0m/iA\nU0154ouOqwKBgHUxJscJkYgjEXWXR0vwjYvY9QnPvBC3bjXRltnCkkfcFJHx8cL1\nifS3XGv29dhxJ4wqOfdKDaON2qzREipHtgXSKUcHgL+oYVY8Ec+bdtxkoFj6VzV9\n4aLgJJNFl8HZ/aBAbKoBxQzVtVh9BlhHlWdfmC1zqqddbog2tAMBMtKJAoGASo+d\nbQvMTuLYignF8GqT8veeT9OJ+Yc54lzWPEHv4kzFI/U5E9J4XhNsj4YBG2Tm23vr\n0qON5mXT0CS3Cu5JA7waDfHr8EV77L59dYL1YFlaIuQf7jlXjTIhF2LW9bqeNoD9\neX1fDSITUQTX6sy//o2B70L40pSS2P9HXgdQ5MECgYAWIXycmeM3rfE+XqCltSsX\njnGxZA9iLnfeZTFPEQeRDnRiTR6wiWDa5oZ2Die5PCQqzdbj0Ha1archm7n4troK\n9Ei3oFLQrbAko0o+ZBGSrwY0DLgI+Edbw4YEbnaR55DH9MBAkKU+69Df5EDYO0Nt\nPSc+rjDvfroCmxSK7GeZ+A==\n-----END PRIVATE KEY-----\n",
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
