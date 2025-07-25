// uploadStudents.js
const admin = require('firebase-admin'); // 1. เรียกใช้ Firebase Admin SDK

// --- ส่วนที่ 2: การตั้งค่า Service Account Key (จุดสำคัญที่สุด) ---
// บรรทัดนี้ใช้สำหรับบอกว่าไฟล์ Service Account Key ของคุณชื่ออะไรและอยู่ที่ไหน
// ***** คุณต้องเปลี่ยนชื่อไฟล์ตรงนี้ให้ตรงกับชื่อไฟล์ที่คุณดาวน์โหลดมาจริงๆ *****
const serviceAccountLocalPath = './student-attendance-system-firebase-adminsdk-abcdef1234.json'; 

let serviceAccount; // ตัวแปรนี้จะเก็บข้อมูล Service Account Key ที่อ่านได้

// เช็คว่ามี Environment Variable ชื่อ FIREBASE_SERVICE_ACCOUNT_KEY ไหม?
if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
  // ถ้ามี (แปลว่ารันบน Render หรือ Cloud)
  try {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY); // แปลง JSON String กลับเป็น Object
    console.log("Using Firebase Service Account from environment variable.");
  } catch (e) {
    console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY environment variable:", e);
    process.exit(1); // หยุดโปรแกรมถ้ามีปัญหา
  }
} else {
  // ถ้าไม่มี (แปลว่ารันในเครื่องของคุณ)
  try {
    serviceAccount = require(serviceAccountLocalPath); // โหลดไฟล์ Service Account Key จาก Path ที่ระบุ
    console.log(`Using Firebase Service Account from local file: ${serviceAccountLocalPath}`);
  } catch (e) {
    console.error(`Error: Could not load local Firebase Service Account file at ${serviceAccountLocalPath}`);
    console.error("Please ensure the file exists and the path is correct.");
    console.error("If deploying to cloud, set FIREBASE_SERVICE_ACCOUNT_KEY environment variable.");
    process.exit(1); // หยุดโปรแกรมถ้าหาไฟล์ไม่เจอ
  }
}

// --- ส่วนที่ 3: โหลดรายชื่อนักเรียนจากไฟล์ JSON ---
// โหลดข้อมูลจาก student_data.json ซึ่งเป็นไฟล์ที่คุณใส่รายชื่อนักเรียนไว้
const studentsData = require('./student_data.json'); 

// --- ส่วนที่ 4: เริ่มต้น Firebase Admin SDK ---
// ใช้ข้อมูล Service Account Key ที่ได้มา (ไม่ว่าจากไฟล์หรือ Environment Variable)
// เพื่อให้ Node.js ของเราสามารถคุยกับ Firebase ได้
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore(); // กำหนดให้ตัวแปร db คือ Firestore database

// --- ส่วนที่ 5: ฟังก์ชันอัปโหลดข้อมูลนักเรียน ---
async function uploadStudents() {
  console.log('Starting student data upload...');
  let uploadedCount = 0;
  let errorCount = 0;

  // วนลูป (Loop) ไปทีละคนในรายชื่อนักเรียน
  for (const student of studentsData) {
    // เช็คว่ามีข้อมูลสำคัญครบไหม (id, name, class)
    if (!student.id || !student.name || !student.class) {
      console.warn(`Skipping student due to missing required fields (id, name, or class):`, student);
      errorCount++;
      continue; // ข้ามคนนี้ไปคนต่อไป
    }

    try {
      // ***** ส่วนนี้คือการส่งข้อมูลขึ้น Firestore *****
      // กำหนด Document ID ให้เป็นเลขที่นักเรียน (student.id)
      const docRef = db.collection('students').doc(String(student.id)); 
      // บันทึกข้อมูล (ชื่อ, ชั้นเรียน) ลงไปใน Document นั้น
      await docRef.set({
        name: student.name,
        class: student.class
      });
      console.log(`Successfully uploaded student: ${student.name} (ID: ${student.id})`);
      uploadedCount++;
    } catch (error) {
      console.error(`Error uploading student ${student.name} (ID: ${student.id}):`, error.message);
      errorCount++;
    }
  }

  // สรุปผลการอัปโหลด
  console.log(`\nUpload finished.`);
  console.log(`Total students processed: ${studentsData.length}`);
  console.log(`Successfully uploaded: ${uploadedCount}`);
  console.log(`Errors: ${errorCount}`);
}

// --- ส่วนที่ 6: เรียกใช้งานฟังก์ชันอัปโหลด ---
// สั่งให้ฟังก์ชัน uploadStudents เริ่มทำงาน
uploadStudents().then(() => {
  console.log('Script completed.');
  process.exit(0); // ออกจากโปรแกรมเมื่อทำงานเสร็จ
}).catch(err => {
  console.error("Script failed unexpectedly:", err);
  process.exit(1); // ออกจากโปรแกรมพร้อมแจ้ง Error
});
