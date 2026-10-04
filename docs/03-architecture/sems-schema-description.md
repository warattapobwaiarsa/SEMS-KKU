# SEMS — Schema Description (เอกสารอธิบายโครงสร้างฐานข้อมูล)

**ระบบ:** Scholarship Evaluation Management System (SEMS)
**ฐานข้อมูล:** PostgreSQL · **ORM:** Prisma
**ที่มา:** `schema.prisma` ซึ่งออกแบบจาก Scope 1.3, Business Rules v1.2 (BR), FRS v0.1, NFR v0.1
**เอกสารคู่กัน:** `er-diagram.md` (ER Diagram), `schema.md` (กฎ/ข้อสมมติ/raw SQL), `sems.dbml` (dbdiagram.io)

---

## 1. สรุปภาพรวม

| รายการ | จำนวน |
|---|---|
| ตาราง (Table) | **14** |
| Enum | **6** |
| Attribute ทั้งหมด (ทุกตารางรวมกัน) | **128** |
| Foreign Key (ความสัมพันธ์) | **18** |
| Unique constraint (นอกเหนือจาก PK) | **9** (แบบเดี่ยว 6, แบบผสม 3) |
| Index (นอกเหนือจาก PK/Unique) | **20** |

### 1.1 จำนวน Attribute ต่อตาราง

| # | ตาราง | กลุ่ม | จำนวน Attribute | PK | FK |
|---|---|---|---|---|---|
| 1 | `users` | ผู้ใช้ | 8 | id | 0 |
| 2 | `user_sessions` | ผู้ใช้ | 5 | id | 1 |
| 3 | `criteria` | เกณฑ์ | 4 | id | 0 |
| 4 | `sub_criteria` | เกณฑ์ | 7 | id | 1 |
| 5 | `scholarship_rounds` | รอบทุน | 10 | id | 1 |
| 6 | `import_batches` | ผู้สมัคร | 9 | id | 2 |
| 7 | `applicants` | ผู้สมัคร | 14 | id | 2 |
| 8 | `applicant_contacts` | ผู้สมัคร (PII) | 5 | applicantId | 1 (PK+FK) |
| 9 | `applicant_supporting_info` | ผู้สมัคร | 27 | applicantId | 1 (PK+FK) |
| 10 | `evaluations` | การประเมิน | 8 | id | 2 |
| 11 | `evaluation_items` | การประเมิน | 6 | id | 2 |
| 12 | `allocation_summaries` | จัดสรรทุน | 8 | id | 2 |
| 13 | `allocations` | จัดสรรทุน | 7 | id | 2 |
| 14 | `audit_logs` | Audit | 10 | id | 1 |
| | **รวม** | | **128** | | **18** |

> **แก้ไขจากเอกสารก่อนหน้า:** `schema.md` ระบุไว้ว่า "13 ตาราง" แต่ที่ถูกต้องคือ **14 ตาราง** (นับจาก model ใน `schema.prisma`) ให้ยึดตัวเลขในเอกสารนี้

### 1.2 ข้อมูลที่ "ไม่เก็บเป็นตาราง/คอลัมน์" (คำนวณเมื่อใช้งาน)

| ข้อมูล | คำนวณจาก | ที่มา |
|---|---|---|
| คะแนนสุดท้ายของผู้สมัคร | ค่าเฉลี่ย `evaluations.totalScore` ที่ `status = SUBMITTED` (ไม่มี Submitted = 0.00) | BR-SCR-01..04 |
| อันดับ | เรียงคะแนนสุดท้ายมาก→น้อย เท่ากันเรียง `studentCode` น้อย→มาก (เทียบก่อนปัดเศษ) | BR-SCR-05 |
| ผลรวมคะแนนสูงสุดของเกณฑ์ | SUM(`sub_criteria.maxScore`) เฉพาะ `SCORED` | BR-CRT-07 |
| ยอดจัดสรรแล้ว | SUM(`allocations.amount`) ของรอบ | BR-ALC-08 |
| งบคงเหลือ | `totalBudget` − ยอดจัดสรรแล้ว | BR-ALC-08 |
| จำนวนผู้ได้รับทุน | COUNT(`allocations`) ที่ `isAwarded = true` | Scope 1.3.4.6 |
| จำนวนผู้ประเมินที่ Submitted ต่อผู้สมัคร | COUNT(`evaluations`) ที่ Submitted | Scope 1.3.3.2 |
| รายชื่อผู้สมัครที่ไม่มี Submitted ตอนปิดรอบ | query ตอนปิดรอบ (จำนวนที่ Admin รับทราบเก็บใน `audit_logs.detail`) | BR-RND-12 |
| รหัสผ่านไฟล์ส่งออก / ไฟล์รายงานที่ส่งออก / ไฟล์ Excel ที่อัปโหลด | ไม่เก็บ | BR-EXP-04, BR-IMP-16 |

---

## 2. Enum (6 ชนิด)

| Enum | ค่า (ค่าตัวเลขตาม Scope) | ใช้ที่ | ที่มา |
|---|---|---|---|
| `UserRole` | `ADMIN` (1), `EVALUATOR` (2) | users.role | BR-USR-03 |
| `RoundStatus` | `DRAFT` (1), `OPEN` (2), `CLOSED` (3) | scholarship_rounds.status | BR-RND-04 |
| `SubCriteriaType` | `SCORED` (1 = มีคะแนน), `TEXT` (2 = ข้อความ) | sub_criteria.type | BR-CRT-02 |
| `EvaluationStatus` | `DRAFT` (1), `SUBMITTED` (2) | evaluations.status | BR-EVL |
| `AllocationStatus` | `EDITING` (1), `FINALIZED` (2) | allocation_summaries.status | BR-ALC-11 |
| `AuditAction` | 18 ค่า: `VIEW_CITIZEN_ID`, `EXPORT_EVALUATION_REPORT`, `EXPORT_ALLOCATION_REPORT`, `IMPORT_APPLICANTS`, `ROUND_STATUS_CHANGE`, `ALLOCATION_STATUS_CHANGE`, `USER_CREATE`, `USER_UPDATE`, `USER_ACTIVATE`, `USER_DEACTIVATE`, `USER_AUTO_DEACTIVATE`, `USER_EXTEND_EXPIRY`, `CRITERIA_CREATE`, `CRITERIA_UPDATE`, `EVALUATION_SUBMIT`, `BUDGET_SET`, `BUDGET_UPDATE`, `ALLOCATION_UPDATE` | audit_logs.action | BR-PDP-01 |

---

## 3. Data Dictionary (รายละเอียดทุก Attribute)

**คำอธิบายคอลัมน์:** Key = PK (Primary Key) / FK (Foreign Key) / UK (Unique) · Null = ว่างได้หรือไม่ · ชนิดข้อมูลเป็นชนิดจริงใน PostgreSQL (Prisma `Int`→integer, `String`→text, `Boolean`→boolean, `DateTime`→timestamp(3), `Json`→jsonb, `BigInt`→bigint)

### 3.1 `users` — ผู้ใช้งาน (8 attributes)
| # | Attribute | ชนิด | Key | Null | Default | คำอธิบาย / กฎ |
|---|---|---|---|---|---|---|
| 1 | id | integer | PK | ไม่ | auto increment | รหัสผู้ใช้ (FR-SYS-01) |
| 2 | email | text | UK | ไม่ | — | บัญชีผู้ใช้ ต้องเป็น `@kku.ac.th` หรือ `@kkumail.com` และไม่ซ้ำ (BR-USR-02, ตรวจโดเมนที่ Backend) |
| 3 | name | text | | ไม่ | — | ชื่อผู้ใช้ |
| 4 | role | UserRole | | ไม่ | — | 1 = Admin, 2 = Evaluator เปลี่ยนไม่ได้หลังสร้าง (BR-USR-03) |
| 5 | isActive | boolean | | ไม่ | true | สถานะบัญชี 0 = ปิด, 1 = เปิด |
| 6 | expiresAt | timestamp | | ได้ | null | วันหมดอายุ เฉพาะ Evaluator (Admin = null) ตัดที่ 00:00 เวลาไทย (BR-USR-04..06) |
| 7 | createdAt | timestamp | | ไม่ | now() | |
| 8 | updatedAt | timestamp | | ไม่ | auto | |

### 3.2 `user_sessions` — เซสชัน (5 attributes)
| # | Attribute | ชนิด | Key | Null | Default | คำอธิบาย / กฎ |
|---|---|---|---|---|---|---|
| 1 | id | integer | PK | ไม่ | auto increment | |
| 2 | userId | integer | FK→users.id, UK | ไม่ | — | 1 ผู้ใช้มีได้ 1 เซสชัน (BR-EVL-08) |
| 3 | sessionId | text | UK | ไม่ | — | ล็อกอินเครื่องใหม่ = แทนที่ค่านี้ เครื่องเก่าถูกตัด |
| 4 | createdAt | timestamp | | ไม่ | now() | |
| 5 | lastActivityAt | timestamp | | ไม่ | now() | ใช้ตัด idle timeout 60 นาที (BR-SYS-02) |

### 3.3 `criteria` — เกณฑ์การประเมิน (4 attributes)
| # | Attribute | ชนิด | Key | Null | Default | คำอธิบาย / กฎ |
|---|---|---|---|---|---|---|
| 1 | id | integer | PK | ไม่ | auto increment | รหัสเกณฑ์ |
| 2 | name | text | UK | ไม่ | — | ชื่อเกณฑ์ ห้ามซ้ำ (BR-CRT-01, MSG-31) |
| 3 | createdAt | timestamp | | ไม่ | now() | |
| 4 | updatedAt | timestamp | | ไม่ | auto | |

### 3.4 `sub_criteria` — เกณฑ์ย่อย (7 attributes)
| # | Attribute | ชนิด | Key | Null | Default | คำอธิบาย / กฎ |
|---|---|---|---|---|---|---|
| 1 | id | integer | PK | ไม่ | auto increment | รหัสเกณฑ์ย่อย |
| 2 | criteriaId | integer | FK→criteria.id | ไม่ | — | เกณฑ์แม่ |
| 3 | title | text | | ไม่ | — | ชื่อหัวข้อ **ซ้ำได้** แม้ในเกณฑ์เดียวกัน (BR-CRT-12) |
| 4 | type | SubCriteriaType | | ไม่ | — | 1 = SCORED, 2 = TEXT |
| 5 | maxScore | integer | | ได้ | null | เฉพาะ SCORED จำนวนเต็ม 1–100 (BR-CRT-05); TEXT = null |
| 6 | allowComment | boolean | | ไม่ | false | อนุญาต Comment เฉพาะ SCORED (BR-CRT-03) |
| 7 | sortOrder | integer | | ไม่ | — | ลำดับแสดง |

### 3.5 `scholarship_rounds` — รอบทุนการศึกษา (10 attributes)
| # | Attribute | ชนิด | Key | Null | Default | คำอธิบาย / กฎ |
|---|---|---|---|---|---|---|
| 1 | id | integer | PK | ไม่ | auto increment | รหัสรอบทุน |
| 2 | name | text | | ไม่ | — | ชื่อทุน (ซ้ำได้ BR-RND-03) |
| 3 | academicYear | integer | | ไม่ | — | ปีการศึกษา พ.ศ. 2550–2700 (BR-RND-01) |
| 4 | semester | integer | | ไม่ | — | ภาคการศึกษา 1 หรือ 2 (BR-RND-02) |
| 5 | criteriaId | integer | FK→criteria.id | ได้ | null | เกณฑ์ที่ใช้ (1 รอบใช้ 1 เกณฑ์) null ได้ใน Draft (BR-RND-07) |
| 6 | status | RoundStatus | | ไม่ | DRAFT | เปลี่ยนทางเดียว Draft→Open→Closed (BR-RND-04) |
| 7 | createdAt | timestamp | | ไม่ | now() | วันเวลาที่สร้าง |
| 8 | openedAt | timestamp | | ได้ | null | เวลาเปิดรอบ |
| 9 | closedAt | timestamp | | ได้ | null | เวลาปิดรอบ |
| 10 | updatedAt | timestamp | | ไม่ | auto | |

### 3.6 `import_batches` — ประวัติการนำเข้า (9 attributes)
| # | Attribute | ชนิด | Key | Null | Default | คำอธิบาย / กฎ |
|---|---|---|---|---|---|---|
| 1 | id | integer | PK | ไม่ | auto increment | |
| 2 | roundId | integer | FK→scholarship_rounds.id | ไม่ | — | |
| 3 | fileName | text | | ไม่ | — | ชื่อไฟล์ที่นำเข้า |
| 4 | totalRows | integer | | ไม่ | — | จำนวนแถวทั้งหมด |
| 5 | validRows | integer | | ไม่ | — | แถวที่ผ่าน |
| 6 | invalidRows | integer | | ไม่ | — | แถวที่ไม่ผ่าน (แสดงตอนเปิดรอบ BR-RND-09) |
| 7 | errorDetails | jsonb | | ได้ | null | `[{row, reason}]` **ห้ามมีเลขบัตรเต็ม** (BR-IMP-15) |
| 8 | importedById | integer | FK→users.id | ไม่ | — | ผู้นำเข้า |
| 9 | importedAt | timestamp | | ไม่ | now() | |

### 3.7 `applicants` — ผู้สมัคร (14 attributes)
| # | Attribute | ชนิด | Key | Null | Default | คำอธิบาย / กฎ |
|---|---|---|---|---|---|---|
| 1 | id | integer | PK | ไม่ | auto increment | รหัสผู้สมัคร |
| 2 | roundId | integer | FK→scholarship_rounds.id, UK(ผสม) | ไม่ | — | |
| 3 | importBatchId | integer | FK→import_batches.id | ไม่ | — | batch ที่นำเข้าล่าสุด |
| 4 | legacySeq | integer | | ได้ | null | "ลำดับ" จากระบบเดิม ใช้อ้างอิง ไม่ใช้เรียงอันดับ (BR-IMP-20) |
| 5 | studentCode | text | UK(ผสม) | ไม่ | — | รหัสนักศึกษา ไม่ซ้ำภายในรอบ (BR-IMP-04) ซ้ำข้ามรอบได้ (BR-IMP-09) |
| 6 | titlePrefix | text | | ไม่ | — | คำนำหน้า |
| 7 | firstName | text | | ไม่ | — | ชื่อ |
| 8 | lastName | text | | ไม่ | — | สกุล |
| 9 | faculty | text | | ไม่ | — | คณะ |
| 10 | major | text | | ไม่ | — | สาขา |
| 11 | studyYear | integer | | ไม่ | — | ชั้นปี 1–4 (BR-IMP-07) |
| 12 | gpa | numeric(3,2) | | ไม่ | — | 0.00–4.00 (BR-IMP-05) |
| 13 | createdAt | timestamp | | ไม่ | now() | |
| 14 | anonymizedAt | timestamp | | ได้ | null | เวลาที่ DBA anonymize ครบ 6 ปี (นอก SEMS, BR-PDP-10) |

### 3.8 `applicant_contacts` — ข้อมูลติดต่อและเลขบัตร (5 attributes) · Admin เท่านั้น
| # | Attribute | ชนิด | Key | Null | Default | คำอธิบาย / กฎ |
|---|---|---|---|---|---|---|
| 1 | applicantId | integer | PK, FK→applicants.id | ไม่ | — | ความสัมพันธ์ 1:1 กับผู้สมัคร (ON DELETE CASCADE) |
| 2 | phone | text | | ไม่ | — | 10 หลักขึ้นต้น 0 (เติม 0 ให้เลข 9 หลักที่ขึ้นต้น 6/8/9, BR-IMP-08) |
| 3 | email | text | | ไม่ | — | ไม่ตรวจรูปแบบ |
| 4 | citizenIdEncrypted | text | | ไม่ | — | เลขบัตร 13 หลัก เก็บแบบเข้ารหัส (BR-PDP-06) อัลกอริทึม/กุญแจ [TBD] |
| 5 | citizenIdMasked | text | | ไม่ | — | รูปแบบ `1-2345-XXXXX-XX-3` (BR-PDP-03) |

### 3.9 `applicant_supporting_info` — ข้อมูลประกอบการพิจารณา (27 attributes)
ทุกฟิลด์ (ยกเว้น PK) เป็น `text` ว่างได้ เพราะ BR ไม่บังคับและไม่ตรวจเนื้อหา (BR-IMP-03, BR-IMP-10) Evaluator ดูได้อย่างเดียว

| # | Attribute | Key | คำอธิบาย (คอลัมน์ในไฟล์ Excel) |
|---|---|---|---|
| 1 | applicantId | PK, FK→applicants.id | 1:1 กับผู้สมัคร (ON DELETE CASCADE) |
| 2 | applicationDate | | วันที่สมัคร (เก็บเป็นข้อความ, BR-IMP-23) |
| 3 | accommodation | | ที่พัก |
| 4 | rent | | ค่าเช่าหอ/บ้าน รวมค่าน้ำ-ไฟ |
| 5 | personalExpense | | ค่าใช้จ่ายส่วนตัว |
| 6 | studyEquipmentCost | | ค่าอุปกรณ์การศึกษา |
| 7 | electronicDevices | | อุปกรณ์อิเล็กทรอนิกส์ที่มี |
| 8 | sideIncome | | รายได้เสริม |
| 9 | fatherAge | | บิดา: อายุ |
| 10 | fatherOccupation | | บิดา: อาชีพ |
| 11 | fatherIncome | | บิดา: รายได้ |
| 12 | fatherStatus | | บิดา: สภาพ |
| 13 | motherAge | | มารดา: อายุ |
| 14 | motherOccupation | | มารดา: อาชีพ |
| 15 | motherIncome | | มารดา: รายได้ |
| 16 | motherStatus | | มารดา: สภาพ |
| 17 | parentsStatus | | สภาพบิดา-มารดา |
| 18 | tuitionPayer | | คนออกเงินเรียน |
| 19 | guardianRelation | | ผู้อุปการะ: ความเกี่ยวข้อง |
| 20 | guardianOccupation | | ผู้อุปการะ: อาชีพ |
| 21 | guardianIncome | | ผู้อุปการะ: รายได้ |
| 22 | siblingsWorking | | พี่น้อง: ทำงาน |
| 23 | siblingsNotWorking | | พี่น้อง: ไม่ทำงาน |
| 24 | siblingsStudying | | พี่น้อง: เรียน |
| 25 | studentLoan | | ข้อมูล กยศ. |
| 26 | previousScholarships | | ทุนที่เคยได้รับ |
| 27 | accommodationMapUrl | | ลิงก์แผนที่ที่พัก (แสดงเป็นลิงก์เฉพาะ http/https, BR-IMP-22) |

### 3.10 `evaluations` — ผลการประเมินรายผู้ประเมิน (8 attributes)
| # | Attribute | ชนิด | Key | Null | Default | คำอธิบาย / กฎ |
|---|---|---|---|---|---|---|
| 1 | id | integer | PK | ไม่ | auto increment | รหัสการประเมิน |
| 2 | applicantId | integer | FK→applicants.id, UK(ผสม) | ไม่ | — | |
| 3 | evaluatorId | integer | FK→users.id, UK(ผสม) | ไม่ | — | ผู้ประเมิน (ห้ามประเมินผู้สมัครรายเดิมซ้ำ BR-EVL-02) |
| 4 | status | EvaluationStatus | | ไม่ | DRAFT | Submitted แล้วแก้ไม่ได้ (BR-EVL-09) |
| 5 | totalScore | integer | | ได้ | null | คะแนนรวม (เฉพาะ SCORED) บันทึกตอน Submit |
| 6 | createdAt | timestamp | | ไม่ | now() | |
| 7 | updatedAt | timestamp | | ไม่ | auto | เวลาบันทึกล่าสุด (Auto-save) |
| 8 | submittedAt | timestamp | | ได้ | null | เวลายืนยันส่งผล |

### 3.11 `evaluation_items` — คะแนน/ข้อความรายเกณฑ์ย่อย (6 attributes)
| # | Attribute | ชนิด | Key | Null | Default | คำอธิบาย / กฎ |
|---|---|---|---|---|---|---|
| 1 | id | integer | PK | ไม่ | auto increment | |
| 2 | evaluationId | integer | FK→evaluations.id, UK(ผสม) | ไม่ | — | ON DELETE CASCADE |
| 3 | subCriteriaId | integer | FK→sub_criteria.id, UK(ผสม) | ไม่ | — | |
| 4 | score | integer | | ได้ | null | จำนวนเต็ม 0..maxScore; **null = ยังไม่กรอก (ไม่ใช่ 0)** (BR-EVL-03, BR-EVL-07) |
| 5 | comment | text | | ได้ | null | ความคิดเห็น เฉพาะข้อที่ allowComment (ไม่จำกัดความยาว) |
| 6 | textValue | text | | ได้ | null | ข้อความ เฉพาะเกณฑ์ย่อยแบบ TEXT (ไม่บังคับ) |

### 3.12 `allocation_summaries` — งบประมาณและสถานะการจัดสรรต่อรอบ (8 attributes)
| # | Attribute | ชนิด | Key | Null | Default | คำอธิบาย / กฎ |
|---|---|---|---|---|---|---|
| 1 | id | integer | PK | ไม่ | auto increment | |
| 2 | roundId | integer | FK→scholarship_rounds.id, UK | ไม่ | — | 1 รอบมี 1 แถว สร้างตอนตั้งงบครั้งแรก (BR-ALC-04) |
| 3 | totalBudget | numeric(14,2) | | ไม่ | — | งบรวม > 0 (BR-ALC-02) แก้ได้เมื่อยอดจัดสรรแล้ว = 0 (BR-ALC-03) |
| 4 | status | AllocationStatus | | ไม่ | EDITING | Editing ↔ Finalized (BR-ALC-11) |
| 5 | statusChangedById | integer | FK→users.id | ได้ | null | ผู้ดำเนินการ (BR-ALC-13) |
| 6 | statusChangedAt | timestamp | | ไม่ | now() | เวลาเปลี่ยนสถานะ |
| 7 | createdAt | timestamp | | ไม่ | now() | |
| 8 | updatedAt | timestamp | | ไม่ | auto | |

### 3.13 `allocations` — ผลการจัดสรรรายบุคคล (7 attributes)
| # | Attribute | ชนิด | Key | Null | Default | คำอธิบาย / กฎ |
|---|---|---|---|---|---|---|
| 1 | id | integer | PK | ไม่ | auto increment | รหัสการจัดสรร |
| 2 | summaryId | integer | FK→allocation_summaries.id | ไม่ | — | |
| 3 | applicantId | integer | FK→applicants.id, UK | ไม่ | — | 1 ผู้สมัคร 1 รายการ |
| 4 | isAwarded | boolean | | ไม่ | false | 0 = ไม่ได้รับทุน, 1 = ได้รับทุน คะแนนสุดท้าย 0 ตั้งเป็น true ไม่ได้ (BR-ALC-07) |
| 5 | amount | numeric(14,2) | | ไม่ | 0 | จำนวนเงิน (บาท ทศนิยม ≤ 2) ได้รับทุน > 0, ไม่ได้รับ = 0 (BR-ALC-06, BR-ALC-09) |
| 6 | createdAt | timestamp | | ไม่ | now() | |
| 7 | updatedAt | timestamp | | ไม่ | auto | |

### 3.14 `audit_logs` — บันทึกการใช้งาน (10 attributes)
| # | Attribute | ชนิด | Key | Null | Default | คำอธิบาย / กฎ |
|---|---|---|---|---|---|---|
| 1 | id | bigint | PK | ไม่ | auto increment | |
| 2 | actorId | integer | FK→users.id | ได้ | null | ผู้ดำเนินการ (null = ระบบ เช่น ตัดวันหมดอายุบัญชี) |
| 3 | action | AuditAction | | ไม่ | — | รายการที่ดำเนินการ |
| 4 | entityType | text | | ไม่ | — | เช่น User, ScholarshipRound, Allocation |
| 5 | entityId | text | | ได้ | null | รหัสเป้าหมาย |
| 6 | roundId | integer | (ไม่ใช่ FK) | ได้ | null | ไว้สืบค้นตามรอบ |
| 7 | oldValue | jsonb | | ได้ | null | ค่าเดิม (BR-PDP-02) |
| 8 | newValue | jsonb | | ได้ | null | ค่าใหม่ |
| 9 | detail | jsonb | | ได้ | null | ข้อมูลเสริม เช่น จำนวนผู้สมัครที่ Admin รับทราบตอนปิดรอบ |
| 10 | createdAt | timestamp | | ไม่ | now() | |

ข้อกำหนด: ห้ามมีเลขบัตรเต็มใน log ใด ๆ (NFR-PRV-02) · ไม่มีหน้าจอดู/แก้/ลบใน SEMS (BR-PDP-07) · เก็บ 6 ปี (BR-PDP-08)

---

## 4. Cardinality (ความสัมพันธ์ระหว่างตาราง)

อ่านรูปแบบ "A (ฝั่งพ่อ) — B (ฝั่งลูก)" โดยตัวเลขแสดงจำนวนที่เป็นไปได้ของแต่ละฝั่ง (0..1 = ไม่มีหรือมี 1, 0..N = ไม่มีหรือมีหลายรายการ)

### 4.1 ตารางความสัมพันธ์ทั้ง 18 รายการ

| # | ตารางพ่อ (ฝั่ง "1") | ตารางลูก (FK อยู่ที่นี่) | FK | Cardinality | ประเภท | ON DELETE | ความหมาย |
|---|---|---|---|---|---|---|---|
| R1 | users | user_sessions | userId | 1 : 0..1 | 1:1 | Restrict | ผู้ใช้หนึ่งคนมีเซสชันได้ไม่เกิน 1 (เซสชันเดียวต่อบัญชี) |
| R2 | criteria | sub_criteria | criteriaId | 1 : 0..N | 1:N | Restrict | เกณฑ์หนึ่งมีเกณฑ์ย่อยหลายข้อ (ต้องมี SCORED ≥ 1 ข้อ ตรวจที่ Backend, BR-CRT-04) |
| R3 | criteria | scholarship_rounds | criteriaId | 0..1 : 0..N | 1:N | SetNull* | เกณฑ์ชุดเดียวใช้ได้หลายรอบ แต่ 1 รอบใช้ 1 เกณฑ์ (BR-RND-07, BR-CRT-10) |
| R4 | scholarship_rounds | import_batches | roundId | 1 : 0..N | 1:N | Restrict | รอบหนึ่งมีประวัตินำเข้าหลายครั้ง |
| R5 | users | import_batches | importedById | 1 : 0..N | 1:N | Restrict | Admin หนึ่งคนนำเข้าได้หลายครั้ง |
| R6 | scholarship_rounds | applicants | roundId | 1 : 0..N | 1:N | Restrict | รอบหนึ่งมีผู้สมัครหลายคน (ผู้สมัครคนเดียวกันในอีกรอบ = อีกแถว) |
| R7 | import_batches | applicants | importBatchId | 1 : 0..N | 1:N | Restrict | batch หนึ่งสร้างผู้สมัครหลายแถว |
| R8 | applicants | applicant_contacts | applicantId (PK) | 1 : 0..1 | 1:1 | **Cascade** | ข้อมูลติดต่อ/เลขบัตรของผู้สมัคร |
| R9 | applicants | applicant_supporting_info | applicantId (PK) | 1 : 0..1 | 1:1 | **Cascade** | ข้อมูลประกอบการพิจารณาของผู้สมัคร |
| R10 | applicants | evaluations | applicantId | 1 : 0..N | 1:N | Restrict | ผู้สมัครถูกประเมินได้โดยหลาย Evaluator ไม่จำกัดจำนวน (BR-EVL-02) |
| R11 | users (Evaluator) | evaluations | evaluatorId | 1 : 0..N | 1:N | Restrict | Evaluator หนึ่งคนประเมินได้หลายผู้สมัคร |
| R12 | evaluations | evaluation_items | evaluationId | 1 : 0..N | 1:N | **Cascade** | การประเมินหนึ่งครั้งมีรายการคะแนนรายเกณฑ์ย่อย |
| R13 | sub_criteria | evaluation_items | subCriteriaId | 1 : 0..N | 1:N | Restrict | เกณฑ์ย่อยหนึ่งข้อถูกให้คะแนนในหลายการประเมิน |
| R14 | scholarship_rounds | allocation_summaries | roundId | 1 : 0..1 | 1:1 | Restrict | รอบหนึ่งมีสรุปงบ/สถานะการจัดสรรได้ 1 รายการ (สร้างตอนตั้งงบครั้งแรก) |
| R15 | users | allocation_summaries | statusChangedById | 0..1 : 0..N | 1:N | SetNull* | ผู้ดำเนินการเปลี่ยนสถานะล่าสุด |
| R16 | allocation_summaries | allocations | summaryId | 1 : 0..N | 1:N | Restrict | สรุปหนึ่งรอบมีรายการจัดสรรรายบุคคลหลายรายการ |
| R17 | applicants | allocations | applicantId | 1 : 0..1 | 1:1 | Restrict | ผู้สมัครหนึ่งคนมีผลจัดสรรได้ 1 รายการ |
| R18 | users | audit_logs | actorId | 0..1 : 0..N | 1:N | SetNull* | ผู้ดำเนินการ (null = ระบบ) |

\* ค่า SetNull/Restrict เป็นค่าเริ่มต้นของ Prisma (ฝั่ง FK ว่างได้ = SetNull, ฝั่งบังคับ = Restrict) ในทางปฏิบัติไม่ถูกใช้เพราะ **SEMS ไม่มีฟังก์ชันลบผู้ใช้/รอบทุน** (BR-USR-13, BR-RND-06) ส่วน Cascade ตั้งไว้ชัดเจนเฉพาะ R8, R9, R12 เพื่อให้การนำเข้าแบบ "แทนที่" ลบผู้สมัครเดิมของรอบได้สะอาด

### 4.2 สรุปตามประเภทความสัมพันธ์

| ประเภท | จำนวน | รายการ |
|---|---|---|
| One-to-One (1:1) | 5 | R1, R8, R9, R14, R17 |
| One-to-Many (1:N) | 13 | R2–R7, R10–R13, R15, R16, R18 |
| Many-to-Many (M:N) เชิงตรรกะ | 2 | ดูหัวข้อ 4.3 |

### 4.3 ความสัมพันธ์ Many-to-Many เชิงตรรกะ (แตกด้วยตารางกลาง)

| ความสัมพันธ์ | ตารางกลาง | ความหมาย | กฎ |
|---|---|---|---|
| ผู้สมัคร (applicants) ↔ ผู้ประเมิน (users) | `evaluations` | ผู้ประเมินหลายคนประเมินผู้สมัครคนเดียวกันได้ และผู้ประเมินหนึ่งคนประเมินได้หลายผู้สมัคร | Unique `(evaluatorId, applicantId)` ห้ามประเมินซ้ำ (BR-EVL-02) |
| การประเมิน (evaluations) ↔ เกณฑ์ย่อย (sub_criteria) | `evaluation_items` | การประเมินหนึ่งครั้งให้คะแนนหลายเกณฑ์ย่อย และเกณฑ์ย่อยหนึ่งข้อถูกใช้ในหลายการประเมิน | Unique `(evaluationId, subCriteriaId)` |

### 4.4 ความสัมพันธ์ที่ไม่ได้เป็น Foreign Key

| ความสัมพันธ์ | เหตุผล |
|---|---|
| `audit_logs.roundId` → scholarship_rounds | เก็บเป็นตัวเลขอ้างอิงเฉย ๆ เพื่อไม่ให้ log ผูกกับวงจรชีวิตข้อมูล (log เก็บ 6 ปี และต้องคงอยู่แม้ข้อมูลถูก anonymize) |
| `evaluations` → รอบทุน | ไม่เก็บ `roundId` ซ้ำ หาได้จาก `applicants.roundId` (ลดข้อมูลซ้ำซ้อน) |
| `allocations` → รอบทุน | หาได้ผ่าน `summaryId → allocation_summaries.roundId` |

### 4.5 แผนผังความสัมพันธ์แบบย่อ

```
users ─1:0..1─ user_sessions
users ─1:N─ import_batches ─N:1─ scholarship_rounds ─N:0..1─ criteria ─1:N─ sub_criteria
users ─1:N─ evaluations ─N:1─ applicants ─N:1─ scholarship_rounds
users ─1:N─ audit_logs
users ─0..1:N─ allocation_summaries ─1:1─ scholarship_rounds
scholarship_rounds ─1:N─ applicants ─1:0..1─ applicant_contacts
                                    ─1:0..1─ applicant_supporting_info
                                    ─1:0..1─ allocations ─N:1─ allocation_summaries
import_batches ─1:N─ applicants
evaluations ─1:N─ evaluation_items ─N:1─ sub_criteria
```

(ภาพ ER Diagram แบบเต็มดูที่ `er-diagram.md` หรือวาง `sems.dbml` ใน dbdiagram.io)

---

## 5. Constraint และ Index

### 5.1 Unique Constraint (9 รายการ)

| # | ตาราง | คอลัมน์ | ชนิด | วัตถุประสงค์ | ที่มา |
|---|---|---|---|---|---|
| U1 | users | email | เดี่ยว | บัญชีไม่ซ้ำ | BR-USR-02 |
| U2 | user_sessions | userId | เดี่ยว | 1 ผู้ใช้ 1 เซสชัน | BR-EVL-08 |
| U3 | user_sessions | sessionId | เดี่ยว | รหัสเซสชันไม่ซ้ำ | — |
| U4 | criteria | name | เดี่ยว | ชื่อเกณฑ์ไม่ซ้ำ | BR-CRT-01 |
| U5 | allocation_summaries | roundId | เดี่ยว | 1 รอบ 1 สรุปจัดสรร | BR-ALC-04 |
| U6 | allocations | applicantId | เดี่ยว | 1 ผู้สมัคร 1 ผลจัดสรร | BR-ALC-04 |
| U7 | applicants | (roundId, studentCode) | ผสม | รหัสนักศึกษาไม่ซ้ำในรอบ | BR-IMP-04 |
| U8 | evaluations | (evaluatorId, applicantId) | ผสม | ห้ามประเมินซ้ำ | BR-EVL-02 |
| U9 | evaluation_items | (evaluationId, subCriteriaId) | ผสม | 1 เกณฑ์ย่อยมี 1 แถวต่อการประเมิน | — |

### 5.2 Index (20 รายการ นอกเหนือจาก PK/Unique)

| ตาราง | Index | ใช้กับ |
|---|---|---|
| users | (role, isActive), (expiresAt) | ค้นหาผู้ใช้, งานตัดวันหมดอายุ |
| sub_criteria | (criteriaId, sortOrder) | แสดงเกณฑ์ย่อยตามลำดับ |
| scholarship_rounds | (status), (academicYear, semester), (name), (criteriaId) | ค้นหารอบ, หารอบที่ใช้เกณฑ์ |
| import_batches | (roundId, importedAt) | หา batch ล่าสุดของรอบ |
| applicants | (roundId, faculty), (roundId, lastName, firstName), (importBatchId) | กรองรายชื่อ |
| evaluations | (applicantId, status), (evaluatorId, status) | คำนวณคะแนน, ดูงานของ Evaluator |
| evaluation_items | (subCriteriaId) | |
| allocations | (summaryId, isAwarded) | นับผู้ได้รับทุน |
| audit_logs | (createdAt), (action, createdAt), (actorId, createdAt), (entityType, entityId), (roundId) | สืบค้น log |

### 5.3 CHECK Constraint (ต้องเพิ่มเองใน migration — Prisma ไม่รองรับ)

| ตาราง | กฎ | ที่มา |
|---|---|---|
| sub_criteria | SCORED: maxScore 1–100; TEXT: maxScore null และ allowComment = false | BR-CRT-03, BR-CRT-05 |
| scholarship_rounds | academicYear 2550–2700; semester ∈ {1, 2} | BR-RND-01, BR-RND-02 |
| applicants | studyYear 1–4; gpa 0.00–4.00 | BR-IMP-05, BR-IMP-07 |
| allocation_summaries | totalBudget > 0 | BR-ALC-02 |
| allocations | isAwarded = true ⇒ amount > 0; isAwarded = false ⇒ amount = 0 | BR-ALC-06 |
| evaluation_items | score ≥ 0 หรือ null | BR-EVL-03 |

SQL ฉบับเต็มอยู่ใน `schema.md` หัวข้อ 4

---

## 6. ตารางสรุป Entity ที่สัมพันธ์กับ Use Case / ผู้ใช้

| ตาราง | Admin | Evaluator | System | หมายเหตุสิทธิ์ |
|---|---|---|---|---|
| users, user_sessions | จัดการ | — | ตัดหมดอายุ/เซสชัน | |
| criteria, sub_criteria | จัดการ | — | — | แก้ไม่ได้เมื่อรอบที่ใช้เป็น Open/Closed |
| scholarship_rounds | จัดการ/เปิด/ปิด | — | ตรวจความพร้อม | |
| import_batches, applicants | นำเข้า/ดู | ดู (เฉพาะรอบ Open) | ตรวจไฟล์ | ไม่แสดงเลขบัตร/โทรศัพท์/อีเมล |
| applicant_contacts | ดูเฉพาะหน้ารายละเอียดจัดสรร + รายงานจัดสรร | **ห้ามเข้าถึง** | — | ทุกการดูเลขเต็มลง audit_logs |
| applicant_supporting_info | — (ไม่แสดงในตาราง Admin) | ดู | — | |
| evaluations, evaluation_items | ดู (Submitted) | กรอก/แก้ Draft/Submit | คำนวณคะแนน | Admin Submit แทนไม่ได้ |
| allocation_summaries, allocations | กำหนดงบ/จัดสรร/Finalize | — | ตรวจงบ/สถานะ | |
| audit_logs | — (ไม่มีหน้าจอดู) | — | บันทึกอัตโนมัติ | ตรวจโดยผู้ดูแลเซิร์ฟเวอร์นอก SEMS |

---

## 7. ข้อสมมติและประเด็นที่ยังเปิด

| # | ประเด็น | การตัดสินใจ |
|---|---|---|
| 1 | Audit Log เก็บที่ไหน | ตารางใน DB (ตามที่ยืนยัน) |
| 2 | อัลกอริทึม/กุญแจเข้ารหัสเลขบัตร | [TBD] คอลัมน์เป็น text (ciphertext) |
| 3 | ข้อมูลประกอบการพิจารณาเป็น text ทั้งหมด | เพราะระบบไม่ตรวจเนื้อหา; แยกคอลัมน์ตัวเลขภายหลังได้ถ้าต้องทำสถิติ |
| 4 | `citizenIdMasked` เก็บสำเร็จรูป | ลดการถอดรหัส; ตัดได้ถ้าต้องการเก็บเลขเต็มที่เดียว |
| 5 | `user_sessions` | ตัดได้หากใช้ session store อื่น (Redis/JWT) |
| 6 | `import_batches` เก็บประวัติทุกครั้ง | BR ต้องการแค่ครั้งล่าสุด แต่เก็บประวัติเพื่อตรวจสอบย้อนหลัง |
| 7 | คะแนนสุดท้าย/อันดับไม่เก็บ | ถ้า Realtime ช้า (NFR-PRF-03 ยัง TBD) ค่อยเพิ่ม cache/materialized view |
| 8 | ขนาด/ความยาวฟิลด์ | ไม่กำหนดตามคำตัดสิน E5 (text ใน PostgreSQL) |
| 9 | Anonymize ครบ 6 ปี | ออกแบบแยก PII ไว้ที่ applicants (ชื่อ/รหัส), applicant_contacts, applicant_supporting_info, evaluation_items.comment/textValue; คง score, allocations, rounds, criteria เชิงสถิติ (NFR-PRV-04) |
