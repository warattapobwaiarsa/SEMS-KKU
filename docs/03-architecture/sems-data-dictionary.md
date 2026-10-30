# SEMS-KKU — Data Dictionary (พจนานุกรมข้อมูล)

**ระบบ:** Scholarship Evaluation Management System (ระบบบริหารจัดการการประเมินทุนการศึกษา — SEMS)  
**สถาบัน:** มหาวิทยาลัยขอนแก่น (Khon Kaen University)  
**ระบบจัดการฐานข้อมูล (DBMS):** PostgreSQL 15+  
**เครื่องมือจัดการแบบจำลองข้อมูล (ORM):** Prisma ORM  
**ไฟล์ Schema ต้นทาง:** `backend/prisma/schema.prisma`

---

## 1. สรุปภาพรวมโครงสร้างฐานข้อมูล (Database Overview)

| รายการ | จำนวน | หน่วย | รายละเอียด |
|:---|:---:|:---:|:---|
| ตารางทั้งหมด (Tables) | **14** | ตาราง | ครอบคลุม 5 กลุ่มโมดูลหลัก |
| แอตทริบิวต์ทั้งหมด (Attributes) | **128** | ฟิลด์ | รวมทุกตาราง |
| ความสัมพันธ์ระหว่างตาราง (Relationships) | **18** | เส้น | รูปแบบ 1:1 และ 1:M |
| ประเภทข้อมูลแจงนับ (Enums) | **6** | ชนิด | ควบคุมความถูกต้องของสถานะและสิทธิ์ |
| Unique Constraints (นอกเหนือจาก PK) | **9** | เงื่อนไข | เดี่ยว 6 รายการ, ผสม (Composite) 3 รายการ |
| ดัชนีเสริม (Secondary Indexes) | **20** | ดัชนี | เพิ่มความเร็วในการสืบค้นและคัดกรองข้อมูล |

---

## 2. สารบัญตารางและโมดูลการทำงาน (Table Directory)

| ลำดับ | ชื่อตาราง (Table Name) | ชื่อภาษาไทย / คำอธิบายหน้าที่ | กลุ่มโมดูล (Module) | จำนวนฟิลด์ | Primary Key |
|:---:|:---|:---|:---|:---:|:---:|
| 1 | `users` | ข้อมูลผู้ใช้งานระบบและบทบาท | User & Authentication | 8 | `id` |
| 2 | `user_sessions` | เซสชันการเข้าสู่ระบบและสถานะเชื่อมต่อ | User & Authentication | 5 | `id` |
| 3 | `criteria` | ชุดเกณฑ์การประเมินหลัก | Criteria Module | 4 | `id` |
| 4 | `sub_criteria` | หัวข้อและเงื่อนไขเกณฑ์การประเมินย่อย | Criteria Module | 7 | `id` |
| 5 | `scholarship_rounds` | รอบการพิจารณาทุนการศึกษา | Round & Applicant | 10 | `id` |
| 6 | `import_batches` | ประวัติและสถิติการนำเข้าไฟล์ผู้สมัคร | Round & Applicant | 9 | `id` |
| 7 | `applicants` | ข้อมูลการศึกษาและสถานะผู้สมัคร | Round & Applicant | 14 | `id` |
| 8 | `applicant_contacts` | ข้อมูลติดต่อและเลขบัตรประชาชน (PII) | Round & Applicant | 5 | `applicantId` |
| 9 | `applicant_supporting_info` | ข้อมูลครอบครัว ฐานะ และภาระหนี้สิน | Round & Applicant | 27 | `applicantId` |
| 10 | `evaluations` | ใบประเมินคะแนนรายบุคคลของผู้ประเมิน | Evaluation Module | 8 | `id` |
| 11 | `evaluation_items` | รายการคะแนนและความเห็นรายเกณฑ์ย่อย | Evaluation Module | 6 | `id` |
| 12 | `allocation_summaries` | สรุปงบประมาณและสถานะการจัดสรรรอบทุน | Allocation & Audit | 8 | `id` |
| 13 | `allocations` | ผลการจัดสรรทุนและยอดเงินรายบุคคล | Allocation & Audit | 7 | `id` |
| 14 | `audit_logs` | ประวัติการดำเนินกิจกรรมสำคัญในระบบ | Allocation & Audit | 10 | `id` |

---

## 3. พจนานุกรมข้อมูลรายตาราง (Detailed Data Dictionary)

*คำอธิบายสัญลักษณ์และอักษรย่อ:*
- **PK:** คีย์หลัก (Primary Key)
- **FK:** คีย์นอก (Foreign Key)
- **UK:** คีย์ที่ไม่ซ้ำกัน (Unique Constraint)
- **NN:** ค่าว่างไม่ได้ (Not Null)
- **Nullable:** อนุญาตให้เป็นค่าว่างได้ (Null)

---

### 3.1 ตาราง `users` (ข้อมูลผู้ใช้งานระบบ)
*คำอธิบาย:* ใช้จัดเก็บข้อมูลบัญชีผู้ดูแลระบบ (Admin) และกรรมการผู้ประเมินทุน (Evaluator)  
*กลุ่มโมดูล:* User & Authentication Module

| ลำดับ | ชื่อฟิลด์ (Attribute) | ชนิดข้อมูล (Data Type) | Key | Null | ค่าเริ่มต้น (Default) | คำอธิบายฟิลด์และกฎทางธุรกิจ |
|:---:|:---|:---|:---:|:---:|:---:|:---|
| 1 | `id` | Integer | PK | NN | Auto Increment | รหัสประจำตัวผู้ใช้งาน |
| 2 | `email` | Text | UK | NN | - | อีเมลสำหรับเข้าสู่ระบบ (@kku.ac.th หรือ @kkumail.com ห้ามซ้ำ) |
| 3 | `name` | Text | - | NN | - | ชื่อ-นามสกุลของผู้ใช้งาน |
| 4 | `role` | Enum (`UserRole`) | - | NN | - | สิทธิ์การใช้งาน: `ADMIN`, `EVALUATOR` (ไม่สามารถเปลี่ยนได้หลังสร้าง) |
| 5 | `isActive` | Boolean | - | NN | `true` | สถานะการเปิดใช้งานบัญชี (`true` = ใช้งานได้, `false` = ปิดระงับ) |
| 6 | `expiresAt` | Timestamp | - | Nullable | `null` | วันหมดอายุบัญชี (เฉพาะ Evaluator เวลา 00:00 น., Admin เป็น null) |
| 7 | `createdAt` | Timestamp | - | NN | `now()` | วันเวลาที่สร้างบัญชีผู้ใช้ |
| 8 | `updatedAt` | Timestamp | - | NN | Auto | วันเวลาที่ปรับปรุงข้อมูลล่าสุด |

---

### 3.2 ตาราง `user_sessions` (เซสชันการเข้าใช้งานระบบ)
*คำอธิบาย:* ควบคุมการเข้าสู่ระบบแบบเครื่องเดียวต่อหนึ่งบัญชี (Single Active Session) และตรวจสอบ Idle Timeout 60 นาที  
*กลุ่มโมดูล:* User & Authentication Module

| ลำดับ | ชื่อฟิลด์ (Attribute) | ชนิดข้อมูล (Data Type) | Key | Null | ค่าเริ่มต้น (Default) | คำอธิบายฟิลด์และกฎทางธุรกิจ |
|:---:|:---|:---|:---:|:---:|:---:|:---|
| 1 | `id` | Integer | PK | NN | Auto Increment | รหัสเซสชัน |
| 2 | `userId` | Integer | FK, UK | NN | - | รหัสผู้ใช้งาน (อ้างอิง `users.id`, 1 ผู้ใช้มีได้เพียง 1 เซสชัน) |
| 3 | `sessionId` | Text | UK | NN | - | รหัส Session Identifier / Token ประจำการล็อกอิน |
| 4 | `createdAt` | Timestamp | - | NN | `now()` | วันเวลาที่เริ่มต้นเซสชัน |
| 5 | `lastActivityAt` | Timestamp | - | NN | `now()` | วันเวลาที่มีการส่งคำขอล่าสุด (ใช้คำนวณตัดสิทธิ์เมื่อไม่มีกิจกรรม 60 นาที) |

---

### 3.3 ตาราง `criteria` (เกณฑ์การประเมินหลัก)
*คำอธิบาย:* จัดเก็บแม่แบบชุดเกณฑ์การประเมินทุน สามารถนำไปผูกใช้ซ้ำในหลายรอบทุนได้  
*กลุ่มโมดูล:* Criteria Module

| ลำดับ | ชื่อฟิลด์ (Attribute) | ชนิดข้อมูล (Data Type) | Key | Null | ค่าเริ่มต้น (Default) | คำอธิบายฟิลด์และกฎทางธุรกิจ |
|:---:|:---|:---|:---:|:---:|:---:|:---|
| 1 | `id` | Integer | PK | NN | Auto Increment | รหัสเกณฑ์การประเมิน |
| 2 | `name` | Text | UK | NN | - | ชื่อชุดเกณฑ์การประเมิน (ห้ามซ้ำกันในระบบ) |
| 3 | `createdAt` | Timestamp | - | NN | `now()` | วันเวลาที่สร้างชุดเกณฑ์ |
| 4 | `updatedAt` | Timestamp | - | NN | Auto | วันเวลาที่แก้ไขชุดเกณฑ์ล่าสุด |

---

### 3.4 ตาราง `sub_criteria` (เกณฑ์การประเมินย่อย)
*คำอธิบาย:* หัวข้อการให้คะแนนและเกณฑ์ย่อยในแต่ละชุดเกณฑ์หลัก  
*กลุ่มโมดูล:* Criteria Module

| ลำดับ | ชื่อฟิลด์ (Attribute) | ชนิดข้อมูล (Data Type) | Key | Null | ค่าเริ่มต้น (Default) | คำอธิบายฟิลด์และกฎทางธุรกิจ |
|:---:|:---|:---|:---:|:---:|:---:|:---|
| 1 | `id` | Integer | PK | NN | Auto Increment | รหัสเกณฑ์ย่อย |
| 2 | `criteriaId` | Integer | FK | NN | - | รหัสเกณฑ์หลัก (อ้างอิง `criteria.id`) |
| 3 | `title` | Text | - | NN | - | ชื่อหัวข้อเกณฑ์ย่อย (สามารถซ้ำกันได้) |
| 4 | `type` | Enum (`SubCriteriaType`) | - | NN | - | ประเภทเกณฑ์: `SCORED` (คิดคะแนน), `TEXT` (ข้อความประเมิน) |
| 5 | `maxScore` | Integer | - | Nullable | `null` | คะแนนเต็ม 1–100 (เฉพาะประเภท SCORED, ประเภท TEXT เป็น null) |
| 6 | `allowComment` | Boolean | - | NN | `false` | อนุญาตให้ระบุความเห็นเพิ่มเติมหรือไม่ (เฉพาะ SCORED) |
| 7 | `sortOrder` | Integer | - | NN | - | ลำดับการแสดงผลของหัวข้อเกณฑ์ย่อย |

---

### 3.5 ตาราง `scholarship_rounds` (รอบการพิจารณาทุนการศึกษา)
*คำอธิบาย:* ข้อมูลรอบการเปิดรับสมัครทุนการศึกษา ปีการศึกษา ภาคการศึกษา และสถานะรอบทุน  
*กลุ่มโมดูล:* Round & Applicant Module

| ลำดับ | ชื่อฟิลด์ (Attribute) | ชนิดข้อมูล (Data Type) | Key | Null | ค่าเริ่มต้น (Default) | คำอธิบายฟิลด์และกฎทางธุรกิจ |
|:---:|:---|:---|:---:|:---:|:---:|:---|
| 1 | `id` | Integer | PK | NN | Auto Increment | รหัสรอบทุนการศึกษา |
| 2 | `name` | Text | - | NN | - | ชื่อโครงการหรือรอบทุนการศึกษา |
| 3 | `academicYear` | Integer | - | NN | - | ปีการศึกษา (พ.ศ. 2550–2700) |
| 4 | `semester` | Integer | - | NN | - | ภาคการศึกษา (1 หรือ 2) |
| 5 | `criteriaId` | Integer | FK | Nullable | `null` | รหัสเกณฑ์ที่ใช้ประเมินรอบนี้ (อ้างอิง `criteria.id`, 1 รอบใช้ 1 เกณฑ์) |
| 6 | `status` | Enum (`RoundStatus`) | - | NN | `DRAFT` | สถานะรอบทุน: `DRAFT`, `OPEN`, `CLOSED` (เปลี่ยนสถานะทางเดียว) |
| 7 | `createdAt` | Timestamp | - | NN | `now()` | วันเวลาที่สร้างรอบทุน |
| 8 | `openedAt` | Timestamp | - | Nullable | `null` | วันเวลาที่เปิดรอบประเมิน |
| 9 | `closedAt` | Timestamp | - | Nullable | `null` | วันเวลาที่ปิดรอบประเมิน |
| 10 | `updatedAt` | Timestamp | - | NN | Auto | วันเวลาที่แก้ไขข้อมูลรอบทุนล่าสุด |

---

### 3.6 ตาราง `import_batches` (ประวัติการนำเข้าไฟล์ผู้สมัคร)
*คำอธิบาย:* จัดเก็บบันทึกประวัติและสถิติการนำเข้าไฟล์รายชื่อผู้สมัคร (Excel/CSV)  
*กลุ่มโมดูล:* Round & Applicant Module

| ลำดับ | ชื่อฟิลด์ (Attribute) | ชนิดข้อมูล (Data Type) | Key | Null | ค่าเริ่มต้น (Default) | คำอธิบายฟิลด์และกฎทางธุรกิจ |
|:---:|:---|:---|:---:|:---:|:---:|:---|
| 1 | `id` | Integer | PK | NN | Auto Increment | รหัสประวัติการนำเข้า |
| 2 | `roundId` | Integer | FK | NN | - | รหัสรอบทุนที่นำเข้า (อ้างอิง `scholarship_rounds.id`) |
| 3 | `fileName` | Text | - | NN | - | ชื่อไฟล์ต้นฉบับที่อัปโหลด |
| 4 | `totalRows` | Integer | - | NN | - | จำนวนแถวทั้งหมดในไฟล์ |
| 5 | `validRows` | Integer | - | NN | - | จำนวนแถวที่ข้อมูลถูกต้องและบันทึกสำเร็จ |
| 6 | `invalidRows` | Integer | - | NN | - | จำนวนแถวที่ไม่ผ่านการตรวจสอบความถูกต้อง |
| 7 | `errorDetails` | Jsonb | - | Nullable | `null` | รายละเอียดข้อผิดพลาดแต่ละแถว `[{row, reason}]` (ห้ามมีเลขบัตรประชาชนเต็ม) |
| 8 | `importedById` | Integer | FK | NN | - | รหัสผู้ดูแลระบบผู้นำเข้าไฟล์ (อ้างอิง `users.id`) |
| 9 | `importedAt` | Timestamp | - | NN | `now()` | วันเวลาที่นำเข้าไฟล์ |

---

### 3.7 ตาราง `applicants` (ข้อมูลพื้นฐานผู้สมัคร)
*คำอธิบาย:* ข้อมูลการศึกษาและข้อมูลส่วนบุคคลทั่วไปของผู้สมัคร  
*กลุ่มโมดูล:* Round & Applicant Module

| ลำดับ | ชื่อฟิลด์ (Attribute) | ชนิดข้อมูล (Data Type) | Key | Null | ค่าเริ่มต้น (Default) | คำอธิบายฟิลด์และกฎทางธุรกิจ |
|:---:|:---|:---|:---:|:---:|:---:|:---|
| 1 | `id` | Integer | PK | NN | Auto Increment | รหัสผู้สมัครในระบบ |
| 2 | `roundId` | Integer | FK, UK* | NN | - | รหัสรอบทุน (อ้างอิง `scholarship_rounds.id`) |
| 3 | `importBatchId` | Integer | FK | NN | - | รหัสชุดการนำเข้า (อ้างอิง `import_batches.id`) |
| 4 | `legacySeq` | Integer | - | Nullable | `null` | ลำดับเดิมจากเอกสารต้นฉบับ (ใช้อ้างอิง ไม่ใช้จัดลำดับ) |
| 5 | `studentCode` | Text | UK* | NN | - | รหัสนักศึกษา (*Unique ร่วมกับ `roundId` ห้ามซ้ำในรอบเดียวกัน) |
| 6 | `titlePrefix` | Text | - | NN | - | คำนำหน้าชื่อ (นาย, นางสาว) |
| 7 | `firstName` | Text | - | NN | - | ชื่อจริง |
| 8 | `lastName` | Text | - | NN | - | นามสกุล |
| 9 | `faculty` | Text | - | NN | - | คณะที่สังกัด |
| 10 | `major` | Text | - | NN | - | สาขาวิชา |
| 11 | `studyYear` | Integer | - | NN | - | ชั้นปีการศึกษา (1–4) |
| 12 | `gpa` | Numeric(3,2) | - | NN | - | เกรดเฉลี่ยสะสม (0.00–4.00) |
| 13 | `createdAt` | Timestamp | - | NN | `now()` | วันเวลาที่บันทึกข้อมูล |
| 14 | `anonymizedAt` | Timestamp | - | Nullable | `null` | วันเวลาที่ทำการปกปิดข้อมูลถาวร (เมื่อครบกำหนดจัดเก็บ 6 ปี) |

---

### 3.8 ตาราง `applicant_contacts` (ข้อมูลติดต่อและข้อมูลระบุตัวตน PII)
*คำอธิบาย:* แยกจัดเก็บข้อมูลติดต่อและเลขบัตรประชาชนเพื่อความปลอดภัยตามมาตรฐาน PDPA (เข้าถึงได้เฉพาะ Admin)  
*กลุ่มโมดูล:* Round & Applicant Module

| ลำดับ | ชื่อฟิลด์ (Attribute) | ชนิดข้อมูล (Data Type) | Key | Null | ค่าเริ่มต้น (Default) | คำอธิบายฟิลด์และกฎทางธุรกิจ |
|:---:|:---|:---|:---:|:---:|:---:|:---|
| 1 | `applicantId` | Integer | PK, FK | NN | - | รหัสผู้สมัคร (อ้างอิง `applicants.id` แบบ 1:1, ON DELETE CASCADE) |
| 2 | `phone` | Text | - | NN | - | หมายเลขโทรศัพท์ 10 หลัก (ขึ้นต้นด้วย 0) |
| 3 | `email` | Text | - | NN | - | อีเมลสำหรับติดต่อ |
| 4 | `citizenIdEncrypted`| Text | - | NN | - | เลขประจำตัวประชาชน 13 หลักที่ผ่านการเข้ารหัสลับ (Encrypted) |
| 5 | `citizenIdMasked` | Text | - | NN | - | เลขประจำตัวประชาชนแบบหน้ากาก เช่น `1-2345-XXXXX-XX-3` |

---

### 3.9 ตาราง `applicant_supporting_info` (ข้อมูลประกอบการพิจารณาด้านเศรษฐกิจและครอบครัว)
*คำอธิบาย:* ข้อมูลสภาพความเป็นอยู่ รายได้ และภาระหนี้สินสำหรับให้กรรมการพิจารณาประเมิน  
*กลุ่มโมดูล:* Round & Applicant Module

| ลำดับ | ชื่อฟิลด์ (Attribute) | ชนิดข้อมูล (Data Type) | Key | Null | ค่าเริ่มต้น (Default) | คำอธิบายฟิลด์และกฎทางธุรกิจ |
|:---:|:---|:---|:---:|:---:|:---:|:---|
| 1 | `applicantId` | Integer | PK, FK | NN | - | รหัสผู้สมัคร (อ้างอิง `applicants.id` แบบ 1:1, ON DELETE CASCADE) |
| 2 | `applicationDate` | Text | - | Nullable | `null` | วันที่ยื่นใบสมัคร |
| 3 | `accommodation` | Text | - | Nullable | `null` | ลักษณะที่พักอาศัย (เช่น หอพักใน, หอพักนอก, บ้านตนเอง) |
| 4 | `rent` | Text | - | Nullable | `null` | ค่าเช่าที่พักและค่าสาธารณูปโภคต่อเดือน |
| 5 | `personalExpense` | Text | - | Nullable | `null` | ค่าใช้จ่ายส่วนตัวเฉลี่ยต่อเดือน |
| 6 | `studyEquipmentCost`| Text | - | Nullable | `null` | ค่าอุปกรณ์การศึกษา |
| 7 | `electronicDevices` | Text | - | Nullable | `null` | อุปกรณ์อิเล็กทรอนิกส์ที่มีในการศึกษา |
| 8 | `sideIncome` | Text | - | Nullable | `null` | รายได้พิเศษจากการทำงานนอกเวลา |
| 9 | `fatherAge` | Text | - | Nullable | `null` | บิดา: อายุ |
| 10 | `fatherOccupation` | Text | - | Nullable | `null` | บิดา: อาชีพ |
| 11 | `fatherIncome` | Text | - | Nullable | `null` | บิดา: รายได้ต่อเดือน |
| 12 | `fatherStatus` | Text | - | Nullable | `null` | บิดา: สถานภาพ (มีชีวิต, ถึงแก่กรรม) |
| 13 | `motherAge` | Text | - | Nullable | `null` | มารดา: อายุ |
| 14 | `motherOccupation` | Text | - | Nullable | `null` | มารดา: อาชีพ |
| 15 | `motherIncome` | Text | - | Nullable | `null` | มารดา: รายได้ต่อเดือน |
| 16 | `motherStatus` | Text | - | Nullable | `null` | มารดา: สถานภาพ |
| 17 | `parentsStatus` | Text | - | Nullable | `null` | สถานภาพความสัมพันธ์ของบิดามารดา (อยู่ร่วมกัน, หย่าร้าง) |
| 18 | `tuitionPayer` | Text | - | Nullable | `null` | ผู้รับผิดชอบค่าเล่าเรียนหลัก |
| 19 | `guardianRelation` | Text | - | Nullable | `null` | ผู้อุปการะ: ความเกี่ยวข้อง |
| 20 | `guardianOccupation`| Text | - | Nullable | `null` | ผู้อุปการะ: อาชีพ |
| 21 | `guardianIncome` | Text | - | Nullable | `null` | ผู้อุปการะ: รายได้ต่อเดือน |
| 22 | `siblingsWorking` | Text | - | Nullable | `null` | จำนวนพี่น้องที่ทำงานแล้ว |
| 23 | `siblingsNotWorking`| Text | - | Nullable | `null` | จำนวนพี่น้องที่ยังไม่ทำงาน |
| 24 | `siblingsStudying` | Text | - | Nullable | `null` | จำนวนพี่น้องที่กำลังศึกษาอยู่ |
| 25 | `studentLoan` | Text | - | Nullable | `null` | ข้อมูลการกู้ยืมเงิน กยศ. / กรอ. |
| 26 | `previousScholarships`| Text | - | Nullable | `null` | ประวัติทุนการศึกษาที่เคยได้รับในอดีต |
| 27 | `accommodationMapUrl`| Text | - | Nullable | `null` | ลิงก์ URL แผนที่แสดงที่พักอาศัย (Google Maps) |

---

### 3.10 ตาราง `evaluations` (ใบประเมินผลคะแนนรายบุคคล)
*คำอธิบาย:* บันทึกการประเมินของผู้สมัครจากกรรมการแต่ละท่าน รองรับการบันทึกแบบร่าง (Draft) และส่งผล (Submitted)  
*กลุ่มโมดูล:* Evaluation Module

| ลำดับ | ชื่อฟิลด์ (Attribute) | ชนิดข้อมูล (Data Type) | Key | Null | ค่าเริ่มต้น (Default) | คำอธิบายฟิลด์และกฎทางธุรกิจ |
|:---:|:---|:---|:---:|:---:|:---:|:---|
| 1 | `id` | Integer | PK | NN | Auto Increment | รหัสใบประเมิน |
| 2 | `applicantId` | Integer | FK, UK* | NN | - | รหัสผู้สมัคร (อ้างอิง `applicants.id`) |
| 3 | `evaluatorId` | Integer | FK, UK* | NN | - | รหัสกรรมการผู้ประเมิน (*Unique ร่วมกับ `applicantId` ห้ามประเมินซ้ำ) |
| 4 | `status` | Enum (`EvaluationStatus`) | - | NN | `DRAFT` | สถานะใบประเมิน: `DRAFT` (แบบร่าง), `SUBMITTED` (ส่งผลแล้ว แก้ไม่ได้) |
| 5 | `totalScore` | Integer | - | Nullable | `null` | คะแนนรวมเฉพาะเกณฑ์ SCORED บันทึกเมื่อกดยืนยันส่งผล |
| 6 | `createdAt` | Timestamp | - | NN | `now()` | วันเวลาที่เริ่มเปิดใบประเมิน |
| 7 | `updatedAt` | Timestamp | - | NN | Auto | วันเวลาที่บันทึกคะแนนล่าสุด (รองรับ Auto-save) |
| 8 | `submittedAt` | Timestamp | - | Nullable | `null` | วันเวลาที่กดยืนยันส่งผลการประเมิน |

---

### 3.11 ตาราง `evaluation_items` (รายการคะแนนรายหัวข้อย่อย)
*คำอธิบาย:* รายละเอียดคะแนน ความเห็น และคำตอบตามเกณฑ์ย่อยในแต่ละใบประเมิน  
*กลุ่มโมดูล:* Evaluation Module

| ลำดับ | ชื่อฟิลด์ (Attribute) | ชนิดข้อมูล (Data Type) | Key | Null | ค่าเริ่มต้น (Default) | คำอธิบายฟิลด์และกฎทางธุรกิจ |
|:---:|:---|:---|:---:|:---:|:---:|:---|
| 1 | `id` | Integer | PK | NN | Auto Increment | รหัสรายการประเมินย่อย |
| 2 | `evaluationId` | Integer | FK, UK* | NN | - | รหัสใบประเมิน (อ้างอิง `evaluations.id`, ON DELETE CASCADE) |
| 3 | `subCriteriaId` | Integer | FK, UK* | NN | - | รหัสเกณฑ์ย่อย (*Unique ร่วมกับ `evaluationId` ห้ามลงคะแนนซ้ำข้อเดิม) |
| 4 | `score` | Integer | - | Nullable | `null` | คะแนนที่ได้ (0 ถึง maxScore, null = ยังไม่กรอก) |
| 5 | `comment` | Text | - | Nullable | `null` | ความคิดเห็นเพิ่มเติมของกรรมการ |
| 6 | `textValue` | Text | - | Nullable | `null` | ข้อความผลการประเมิน (สำหรับเกณฑ์ย่อยประเภท TEXT) |

---

### 3.12 ตาราง `allocation_summaries` (สรุปงบประมาณและการจัดสรรทุนของรอบ)
*คำอธิบาย:* ควบคุมเพดานงบประมาณและสถานะการปิดยอดจัดสรรทุนของแต่ละรอบทุน  
*กลุ่มโมดูล:* Allocation & Audit Module

| ลำดับ | ชื่อฟิลด์ (Attribute) | ชนิดข้อมูล (Data Type) | Key | Null | ค่าเริ่มต้น (Default) | คำอธิบายฟิลด์และกฎทางธุรกิจ |
|:---:|:---|:---|:---:|:---:|:---:|:---|
| 1 | `id` | Integer | PK | NN | Auto Increment | รหัสสรุปงบประมาณรอบทุน |
| 2 | `roundId` | Integer | FK, UK | NN | - | รหัสรอบทุน (อ้างอิง `scholarship_rounds.id` แบบ 1:1) |
| 3 | `totalBudget` | Numeric(14,2) | - | NN | - | วงเงินงบประมาณรวมที่ได้รับจัดสรรในรอบนี้ (บาท) |
| 4 | `status` | Enum (`AllocationStatus`) | - | NN | `EDITING` | สถานะการจัดสรร: `EDITING` (กำลังจัดสรร), `FINALIZED` (ปิดยอดแล้ว) |
| 5 | `statusChangedById` | Integer | FK | Nullable | `null` | รหัสผู้ดูแลระบบที่เปลี่ยนสถานะ (อ้างอิง `users.id`) |
| 6 | `statusChangedAt` | Timestamp | - | NN | `now()` | วันเวลาที่ปรับปรุงสถานะการจัดสรรล่าสุด |
| 7 | `createdAt` | Timestamp | - | NN | `now()` | วันเวลาที่บันทึกข้อมูล |
| 8 | `updatedAt` | Timestamp | - | NN | Auto | วันเวลาที่แก้ไขข้อมูลล่าสุด |

---

### 3.13 ตาราง `allocations` (ผลการจัดสรรทุนรายบุคคล)
*คำอธิบาย:* บันทึกผลการตัดสินใจมอบทุนและจำนวนเงินที่นักศึกษาได้รับ  
*กลุ่มโมดูล:* Allocation & Audit Module

| ลำดับ | ชื่อฟิลด์ (Attribute) | ชนิดข้อมูล (Data Type) | Key | Null | ค่าเริ่มต้น (Default) | คำอธิบายฟิลด์และกฎทางธุรกิจ |
|:---:|:---|:---|:---:|:---:|:---:|:---|
| 1 | `id` | Integer | PK | NN | Auto Increment | รหัสรายการจัดสรร |
| 2 | `summaryId` | Integer | FK | NN | - | รหัสสรุปงบประมาณ (อ้างอิง `allocation_summaries.id`) |
| 3 | `applicantId` | Integer | FK, UK | NN | - | รหัสผู้สมัคร (อ้างอิง `applicants.id` แบบ 1:1, 1 คนได้ 1 รายการ) |
| 4 | `isAwarded` | Boolean | - | NN | `false` | สถานะการได้รับทุน (`true` = ได้รับทุน, `false` = ไม่ได้รับทุน) |
| 5 | `amount` | Numeric(14,2) | - | NN | `0.00` | จำนวนเงินทุนที่ได้รับอนุมัติ (บาท ทศนิยม 2 ตำแหน่ง) |
| 6 | `createdAt` | Timestamp | - | NN | `now()` | วันเวลาที่บันทึกข้อมูล |
| 7 | `updatedAt` | Timestamp | - | NN | Auto | วันเวลาที่แก้ไขข้อมูลล่าสุด |

---

### 3.14 ตาราง `audit_logs` (บันทึกประวัติการใช้งานและกิจกรรมสำคัญ)
*คำอธิบาย:* เก็บบันทึกประวัติการกระทำเพื่อความโปร่งใส ตรวจสอบย้อนกลับ และปฏิบัติตามมาตรฐาน PDPA (จัดเก็บ 6 ปี)  
*กลุ่มโมดูล:* Allocation & Audit Module

| ลำดับ | ชื่อฟิลด์ (Attribute) | ชนิดข้อมูล (Data Type) | Key | Null | ค่าเริ่มต้น (Default) | คำอธิบายฟิลด์และกฎทางธุรกิจ |
|:---:|:---|:---|:---:|:---:|:---|:---|
| 1 | `id` | BigInt | PK | NN | Auto Increment | รหัสบันทึกกิจกรรม |
| 2 | `actorId` | Integer | FK | Nullable | `null` | รหัสผู้ใช้งานที่กระทำการ (อ้างอิง `users.id`, null คือคำสั่งจากระบบ) |
| 3 | `action` | Enum (`AuditAction`) | - | NN | - | ประเภทกิจกรรม (18 รายการ เช่น `VIEW_CITIZEN_ID`, `ROUND_STATUS_CHANGE`) |
| 4 | `entityType` | Text | - | NN | - | ชื่อโมเดล/เอนทิตีที่เกี่ยวข้อง เช่น User, ScholarshipRound, Allocation |
| 5 | `entityId` | Text | - | Nullable | `null` | รหัสเป้าหมายของข้อมูลที่มีการเปลี่ยนแปลง |
| 6 | `roundId` | Integer | - | Nullable | `null` | รหัสรอบทุนที่เกี่ยวข้องสำหรับการค้นหา |
| 7 | `oldValue` | Jsonb | - | Nullable | `null` | ข้อมูลค่าเดิมก่อนการแก้ไข (ห้ามบันทึกเลขบัตรประชาชนฉบับเต็ม) |
| 8 | `newValue` | Jsonb | - | Nullable | `null` | ข้อมูลค่าใหม่หลังการแก้ไข |
| 9 | `detail` | Jsonb | - | Nullable | `null` | ข้อมูลบริบทเพิ่มเติมของการกระทำ |
| 10 | `createdAt` | Timestamp | - | NN | `now()` | วันเวลาที่เกิดกิจกรรม |

---

## 4. ตารางประเภทข้อมูลแจงนับ (Enumeration Types: Enum)

ตารางแจกแจงค่าคงที่ที่กำหนดขึ้นในระบบฐานข้อมูล PostgreSQL สำหรับจำกัดขอบเขตข้อมูลของฟิลด์ต่างๆ:

| ชื่อ Enum | ค่าที่กำหนด (Allowed Values) | ตารางและคอลัมน์ที่ใช้งาน | คำอธิบายและวัตถุประสงค์ |
|:---|:---|:---|:---|
| `UserRole` | `ADMIN`, `EVALUATOR` | `users.role` | ระดับสิทธิ์ของผู้ใช้งานในระบบ (Admin = 1, Evaluator = 2) |
| `RoundStatus` | `DRAFT`, `OPEN`, `CLOSED` | `scholarship_rounds.status` | สถานะวงจรรอบทุนการศึกษา (เปลี่ยนทางเดียว DRAFT → OPEN → CLOSED) |
| `SubCriteriaType` | `SCORED`, `TEXT` | `sub_criteria.type` | ชนิดของเกณฑ์ย่อย (SCORED = คิดคะแนน 1–100, TEXT = ข้อความประเมิน) |
| `EvaluationStatus` | `DRAFT`, `SUBMITTED` | `evaluations.status` | สถานะใบประเมิน (DRAFT = แบบร่าง, SUBMITTED = ส่งผลแล้วแก้ไขไม่ได้) |
| `AllocationStatus` | `EDITING`, `FINALIZED` | `allocation_summaries.status` | สถานะการจัดสรรงบประมาณ (EDITING = กำลังจัดสรร, FINALIZED = สิ้นสุดการจัดสรร) |
| `AuditAction` | 18 รายการ:<br>• `VIEW_CITIZEN_ID`<br>• `EXPORT_EVALUATION_REPORT`<br>• `EXPORT_ALLOCATION_REPORT`<br>• `IMPORT_APPLICANTS`<br>• `ROUND_STATUS_CHANGE`<br>• `ALLOCATION_STATUS_CHANGE`<br>• `USER_CREATE`, `USER_UPDATE`<br>• `USER_ACTIVATE`, `USER_DEACTIVATE`<br>• `USER_AUTO_DEACTIVATE`, `USER_EXTEND_EXPIRY`<br>• `CRITERIA_CREATE`, `CRITERIA_UPDATE`<br>• `EVALUATION_SUBMIT`<br>• `BUDGET_SET`, `BUDGET_UPDATE`<br>• `ALLOCATION_UPDATE` | `audit_logs.action` | รายการกิจกรรมสำคัญที่ระบบบันทึกเพื่อการตรวจสอบย้อนกลับตามข้อกำหนด PDPA |

---

## 5. ตารางความสัมพันธ์ระหว่างตาราง (Entity Relationships & Constraints)

| ลำดับ | ตารางหลัก (Parent Table) | ตารางที่สัมพันธ์ (Child Table) | คีย์นอก (Foreign Key) | ความสัมพันธ์ (Cardinality) | เงื่อนไขการลบ (On Delete) | คำอธิบายความสัมพันธ์และกฎทางธุรกิจ |
|:---:|:---|:---|:---|:---:|:---:|:---|
| 1 | `users` | `user_sessions` | `userId` | **1 : 1** | RESTRICT | ผู้ใช้ 1 คนมีเซสชันการล็อกอินได้เพียง 1 เซสชัน (Single Active Session) |
| 2 | `criteria` | `sub_criteria` | `criteriaId` | **1 : M** | RESTRICT | เกณฑ์หลัก 1 ชุด ประกอบด้วยเกณฑ์ย่อยได้หลายข้อ |
| 3 | `criteria` | `scholarship_rounds` | `criteriaId` | **1 : M** | SET NULL | เกณฑ์ 1 ชุด นำไปใช้ในหลายรอบทุนได้ (1 รอบใช้ได้ 1 เกณฑ์) |
| 4 | `scholarship_rounds` | `import_batches` | `roundId` | **1 : M** | RESTRICT | รอบทุน 1 รอบ สามารถนำเข้าไฟล์รายชื่อผู้สมัครได้หลายครั้ง |
| 5 | `users` | `import_batches` | `importedById` | **1 : M** | RESTRICT | ผู้ดูแลระบบ 1 คน สามารถเป็นผู้นำเข้าไฟล์ข้อมูลได้หลายครั้ง |
| 6 | `scholarship_rounds` | `applicants` | `roundId` | **1 : M** | RESTRICT | รอบทุน 1 รอบ ประกอบด้วยรายชื่อผู้สมัครได้หลายคน |
| 7 | `import_batches` | `applicants` | `importBatchId` | **1 : M** | RESTRICT | ชุดการนำเข้าไฟล์ 1 ครั้ง สร้างรายการผู้สมัครได้หลายคน |
| 8 | `applicants` | `applicant_contacts` | `applicantId` | **1 : 1** | CASCADE | ผู้สมัคร 1 คน มีข้อมูลติดต่อและเลขบัตรประชาชน 1 ชุด (ลบผู้สมัครจะลบข้อมูลติดต่อด้วย) |
| 9 | `applicants` | `applicant_supporting_info`| `applicantId` | **1 : 1** | CASCADE | ผู้สมัคร 1 คน มีข้อมูลครอบครัว/รายได้ 1 ชุด (ลบผู้สมัครจะลบข้อมูลส่วนนี้ด้วย) |
| 10 | `applicants` | `evaluations` | `applicantId` | **1 : M** | RESTRICT | ผู้สมัคร 1 คน ได้รับการประเมินจากกรรมการได้หลายคน |
| 11 | `users` | `evaluations` | `evaluatorId` | **1 : M** | RESTRICT | กรรมการ 1 คน ประเมินผู้สมัครได้หลายคน (ประเมินคนเดิมซ้ำไม่ได้) |
| 12 | `evaluations` | `evaluation_items` | `evaluationId` | **1 : M** | CASCADE | ใบประเมิน 1 ใบ ประกอบด้วยรายการคะแนนตามเกณฑ์ย่อยหลายรายการ |
| 13 | `sub_criteria` | `evaluation_items` | `subCriteriaId`| **1 : M** | RESTRICT | เกณฑ์ย่อย 1 ข้อ ถูกนำไปใช้บันทึกคะแนนในใบประเมินได้หลายใบ |
| 14 | `scholarship_rounds` | `allocation_summaries` | `roundId` | **1 : 1** | RESTRICT | รอบทุน 1 รอบ มียอดสรุปงบประมาณและสถานะการจัดสรรได้เพียง 1 รายการ |
| 15 | `allocation_summaries` | `allocations` | `summaryId` | **1 : M** | RESTRICT | ยอดสรุปงบประมาณ 1 ชุด เชื่อมโยงไปยังรายการจัดสรรทุนของผู้สมัครได้หลายคน |
| 16 | `applicants` | `allocations` | `applicantId` | **1 : 1** | RESTRICT | ผู้สมัคร 1 คน มีผลการจัดสรรทุนในรอบนั้นได้เพียง 1 รายการ |
| 17 | `users` | `allocation_summaries` | `statusChangedById` | **1 : M** | RESTRICT | ผู้ดูแลระบบ 1 คน สามารถปรับเปลี่ยนสถานะการจัดสรรได้หลายรอบทุน |
| 18 | `users` | `audit_logs` | `actorId` | **1 : M** | SET NULL | ผู้ใช้งาน 1 คน มีประวัติการกระทำกิจกรรมในระบบได้หลายรายการ |
