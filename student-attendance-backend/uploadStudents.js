const admin = require('firebase-admin');
const serviceAccount = require('./path/to/your/serviceAccountKey.json'); // *** เปลี่ยน path นี้ให้ถูกต้อง ***
const studentsData = require('./student_data.json'); // ไฟล์ข้อมูลนักเรียนของคุณ

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function uploadStudents() {
  console.log('Starting student data upload...');
  let uploadedCount = 0;
  let errorCount = 0;

  for (const student of studentsData) {
    try {
      // ตรงนี้คือส่วนสำคัญ: เราใช้ student.id (เลขที่) เป็น Document ID
      const docRef = db.collection('students').doc(student.id);
      await docRef.set({
        name: student.name,
        class: student.class
        // ไม่ต้องใส่ lineId ตรงนี้ ถ้าไม่มีใน JSON
      });
      console.log(`Successfully uploaded student: ${student.name} (ID: ${student.id})`);
      uploadedCount++;
    } catch (error) {
      console.error(`Error uploading student ${student.name}:`, error.message);
      errorCount++;
    }
  }

  console.log(`\nUpload finished.`);
  console.log(`Total students processed: ${studentsData.length}`);
  console.log(`Successfully uploaded: ${uploadedCount}`);
  console.log(`Errors: ${errorCount}`);
}

uploadStudents().then(() => {
  process.exit(0); // Exit process after completion
}).catch(err => {
  console.error("Script failed:", err);
  process.exit(1);
});