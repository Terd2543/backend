// uploadStudents.js
const admin = require('firebase-admin');
// ต้องแก้ไข path นี้ให้ตรงกับไฟล์ Service Account Key ของคุณ
const serviceAccount = require('./service-b6c91-firebase-adminsdk-fbsvc-bd63ab59b8.json'); 
const studentsData = require('./student_data.json'); // Path ไปยังไฟล์ student_data.json

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

uploadStudents().catch(console.error);
