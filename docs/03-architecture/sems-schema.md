# SEMS — Database Schema

เอกสารอธิบาย `schema.prisma` (PostgreSQL + Prisma ตาม TECH_STACK)
อ้างอิง: Scope 1.3 · Business Rules v1.2 (BR) · FRS v0.1 · NFR v0.1
คู่กับ: `er-diagram.md`

---

## 1. ภาพรวม

| กลุ่ม | ตาราง |
|---|---|
| ผู้ใช้/เซสชัน | `users`, `user_sessions` |
| เกณฑ์ | `criteria`, `sub_criteria` |
| รอบทุน | `scholarship_rounds` |
| ผู้สมัคร/นำเข้า | `import_batches`, `applicants`, `applicant_contacts`, `applicant_supporting_info` |
| การประเมิน | `evaluations`, `evaluation_items` |
| จัดสรรทุน | `allocation_summaries`, `allocations` |
| Audit | `audit_logs` |

รวม **13 ตาราง** · **6 enums**

### สิ่งที่ "ไม่เก็บเป็นตาราง/คอลัมน์" โดยตั้งใจ

| ข้อมูล | เหตุผล |
|---|---|
| คะแนนสุดท้าย, อันดับ | คำนวณจาก Evaluation ที่ Submitted ทุกครั้ง (Realtime ระหว่างรอบ Open) — BR-SCR-01..05, FR-SCR-05 |
| ผลรวมคะแนนสูงสุดของเกณฑ์ | ระบบคำนวณ แก้ตรงไม่ได้ — BR-CRT-07 |
| ยอดจัดสรรแล้ว, งบคงเหลือ, จำนวนผู้ได้รับทุน | คำนวณจาก `allocations` — BR-ALC-08 |
| จำนวนผู้ประเมินที่ Submitted ต่อผู้สมัคร | นับจาก `evaluations` — Scope 1.3.3.2 |
| รายการผู้สมัครที่ไม่มี Submitted ตอนปิดรอบ | query ตอนปิดรอบ; จำนวนที่ Admin รับทราบเก็บใน `audit_logs.detail` — BR-RND-12, FR-AUD-03 |
| รหัสผ่านไฟล์ส่งออก, ไฟล์ Excel ที่ส่งออก | ไม่เก็บ — FR-EXP-07, BR-EXP-04 |
| ไฟล์ Excel ที่อัปโหลด | ลบเมื่อเสร็จ/ยกเลิก — BR-IMP-16 (เก็บเฉพาะ metadata ใน `import_batches`) |

---

## 2. Enums

| Enum | ค่า | หมายเหตุ |
|---|---|---|
| `UserRole` | `ADMIN`(1), `EVALUATOR`(2) | BR-USR-03 |
| `RoundStatus` | `DRAFT`(1), `OPEN`(2), `CLOSED`(3) | เปลี่ยนทางเดียว BR-RND-04 |
| `SubCriteriaType` | `SCORED`(1), `TEXT`(2) | BR-CRT-02 |
| `EvaluationStatus` | `DRAFT`(1), `SUBMITTED`(2) | |
| `AllocationStatus` | `EDITING`(1), `FINALIZED`(2) | แยกจากสถานะรอบ BR-ALC-11 |
| `AuditAction` | 18 ค่า (ดู schema.prisma) | ครอบคลุม BR-PDP-01 ทุกรายการ + `USER_AUTO_DEACTIVATE`, `USER_EXTEND_EXPIRY` |

---

## 3. รายละเอียดตาราง

### 3.1 `users`
| คอลัมน์ | ชนิด | กฎ/หมายเหตุ |
|---|---|---|
| id | Int PK auto | |
| email | String **unique** | บัญชี = อีเมล `@kku.ac.th`/`@kkumail.com` (ตรวจโดเมนที่ Backend) BR-USR-02 |
| name | String | |
| role | UserRole | เปลี่ยนไม่ได้หลังสร้าง (Backend บังคับ) BR-USR-03 |
| isActive | Boolean | 0/1 |
| expiresAt | DateTime? | เฉพาะ Evaluator; Admin = null; ตัดที่ 00:00 เวลาไทย BR-USR-04..06 |
| createdAt / updatedAt | DateTime | |

Index: `(role, isActive)`, `(expiresAt)` — ใช้กับงานตัดวันหมดอายุและค้นหา
ไม่มีการลบแถว (BR-USR-13)

### 3.2 `user_sessions`
เซสชันเดียวต่อบัญชี (BR-EVL-08) + idle timeout 60 นาที (BR-SYS-02)
`userId` unique → ล็อกอินเครื่องใหม่ให้ upsert `sessionId` (เครื่องเก่าจะเห็น MSG-28) · `lastActivityAt` อัปเดตทุกคำขอ
> ถ้าทีมเลือกจัดการเซสชันด้วย Redis/JWT blacklist แทน สามารถตัดตารางนี้ออกได้ โดยไม่กระทบตารางอื่น

### 3.3 `criteria`
| คอลัมน์ | ชนิด | กฎ |
|---|---|---|
| id | Int PK | |
| name | String **unique** | ห้ามซ้ำ BR-CRT-01 (MSG-31) |

### 3.4 `sub_criteria`
| คอลัมน์ | ชนิด | กฎ |
|---|---|---|
| id | Int PK | |
| criteriaId | FK → criteria | |
| title | String | **ซ้ำได้** แม้ในเกณฑ์เดียวกัน BR-CRT-12 |
| type | SubCriteriaType | |
| maxScore | Int? | เฉพาะ SCORED, จำนวนเต็ม 1–100 BR-CRT-05 |
| allowComment | Boolean | เฉพาะ SCORED BR-CRT-03 |
| sortOrder | Int | ลำดับแสดง; เปลี่ยนลำดับ = แก้ไข (ล็อกเมื่อเกณฑ์ถูกใช้ใน Open/Closed) BR-CRT-08 |

ไม่ทำ unique บน `(criteriaId, sortOrder)` เพื่อให้สลับลำดับใน transaction เดียวได้ง่าย

### 3.5 `scholarship_rounds`
| คอลัมน์ | ชนิด | กฎ |
|---|---|---|
| id | Int PK | |
| name | String | |
| academicYear | Int | พ.ศ. 2550–2700 BR-RND-01 |
| semester | Int | 1 หรือ 2 BR-RND-02 |
| criteriaId | FK? → criteria | 1 รอบใช้ 1 เกณฑ์; null ได้ใน Draft; เปลี่ยน/ถอดได้เฉพาะ Draft BR-RND-07 |
| status | RoundStatus | default DRAFT |
| createdAt / openedAt / closedAt | DateTime | เวลาที่เปลี่ยนสถานะ (Scope 1.3.2.7) |

ชื่อ/ปี/ภาคซ้ำได้ (BR-RND-03) → ไม่มี unique · ไม่ลบรอบ (BR-RND-06)

### 3.6 `import_batches`
ประวัติการนำเข้า: ชื่อไฟล์, จำนวนแถวทั้งหมด/ผ่าน/ไม่ผ่าน, รายละเอียดข้อผิดพลาด (JSON `[{row, reason}]` **ห้ามมีเลขบัตรเต็ม**), ผู้นำเข้า, เวลา
แถวล่าสุดของรอบใช้แสดง "จำนวนแถว invalid" ตอนเปิดรอบ (BR-RND-09)
`applicants.importBatchId` ชี้ batch ที่นำเข้าล่าสุด (ผู้สมัครของ batch เก่าถูกแทนที่หมด)

### 3.7 `applicants`
ข้อมูลที่ไม่ใช่ข้อมูลติดต่อ/เลขบัตร (Evaluator และตารางของ Admin เห็นได้)
| คอลัมน์ | ชนิด | กฎ |
|---|---|---|
| roundId | FK | |
| legacySeq | Int? | "ลำดับ" จากระบบเดิม ใช้อ้างอิง ไม่ใช้เรียงอันดับ BR-IMP-20 |
| studentCode | String | **unique ภายในรอบ** BR-IMP-04; ซ้ำข้ามรอบได้ BR-IMP-09 |
| titlePrefix, firstName, lastName | String | |
| faculty, major | String | |
| studyYear | Int | 1–4 BR-IMP-07 |
| gpa | Decimal(3,2) | 0.00–4.00 BR-IMP-05 |
| anonymizedAt | DateTime? | ตั้งโดย DBA เมื่อ anonymize ครบ 6 ปี (นอก SEMS) |

Unique: `(roundId, studentCode)` · Index: `(roundId, faculty)`, `(roundId, lastName, firstName)`
การนำเข้าแทนที่ = ลบผู้สมัครเดิมของรอบ + สร้างใหม่ใน **transaction เดียว** (NFR-DAT-01) ทำได้ปลอดภัยเพราะรอบ Draft ยังไม่มี evaluation/allocation

### 3.8 `applicant_contacts` (PII — Admin เท่านั้น)
| คอลัมน์ | หมายเหตุ |
|---|---|
| phone | 10 หลักขึ้นต้น 0 (เติม 0 ให้เลข 9 หลักที่ขึ้นต้น 6/8/9 ก่อนบันทึก) BR-IMP-08 |
| email | ไม่ตรวจรูปแบบ |
| citizenIdEncrypted | ciphertext 13 หลัก — อัลกอริทึม/กุญแจ `[TBD]` NFR-SEC-02 |
| citizenIdMasked | `1-2345-XXXXX-XX-3` BR-PDP-03 (เก็บสำเร็จรูปเพื่อไม่ต้องถอดรหัสทุกครั้งที่แสดง) |

**เหตุผลที่แยกตาราง:** (1) Evaluator API ไม่ควร join/select ตารางนี้เลย → ลดความเสี่ยงหลุดโดยพลาด (NFR-SEC-04, FR-AUD-05) (2) anonymize ได้โดย UPDATE/DELETE แถวเดียวโดยไม่แตะความสัมพันธ์ (NFR-PRV-04)
ไม่ตรวจเลขบัตรซ้ำ (BR-IMP-04) จึงไม่มี unique

### 3.9 `applicant_supporting_info`
ข้อมูลประกอบการพิจารณา (Evaluator ดูอย่างเดียว) — **ทุกฟิลด์เป็น `String?`** เพราะ
- ว่างได้ทั้งหมด (BR-IMP-03) และระบบไม่ตรวจเนื้อหา/ชนิด (BR-IMP-10, คำตัดสิน E5)
- ในไฟล์ตัวอย่างบางช่องเป็นตัวเลข บางช่องเป็นข้อความอิสระ ถ้าแปลงเป็นตัวเลขแล้วพบข้อความในไฟล์จริง จะทำให้นำเข้าพังโดยไม่มีกฎรองรับ

กลุ่มฟิลด์: วันที่สมัคร (ข้อความ BR-IMP-23) · ที่พัก/ค่าเช่า/ค่าใช้จ่าย/อุปกรณ์/รายได้เสริม · บิดา (อายุ อาชีพ รายได้ สภาพ) · มารดา (4 ฟิลด์) · สภาพบิดา-มารดา · คนออกเงินเรียน · ผู้อุปการะ (3) · พี่น้อง (3) · กยศ. · ทุนที่เคยได้รับ · ลิงก์แผนที่ที่พัก
ข้อความอิสระในตารางนี้ถูกล้างเมื่อครบ 6 ปี (BR-PDP-10)

### 3.10 `evaluations`
| คอลัมน์ | หมายเหตุ |
|---|---|
| applicantId, evaluatorId | **unique คู่กัน** → ห้ามประเมินซ้ำ BR-EVL-02 (MSG-17) |
| status | DRAFT → SUBMITTED; Submitted แล้วแก้ไม่ได้ BR-EVL-09 |
| totalScore | Int? ผลรวมคะแนน SCORED บันทึกตอน Submit |
| updatedAt | เวลา Auto-save ล่าสุด (Scope 1.3.3.4) |
| submittedAt | |

ไม่เก็บ `roundId` ซ้ำ เพราะหาได้จาก `applicant.roundId`
หลังรอบ Closed: Draft ที่ค้างยังอยู่ในตาราง แต่ถูกล็อกและไม่ถูกคำนวณ (BR-RND-13, BR-EVL-13) — บังคับที่ Backend

### 3.11 `evaluation_items`
| คอลัมน์ | หมายเหตุ |
|---|---|
| (evaluationId, subCriteriaId) | unique |
| score | Int? — **null = ยังไม่กรอก ไม่ใช่ 0** BR-EVL-07; ช่วง 0..maxScore ตรวจที่ Backend (MSG-15) |
| comment | เฉพาะข้อที่ `allowComment`; ไม่จำกัดความยาว |
| textValue | เฉพาะ TEXT; ไม่บังคับ |

### 3.12 `allocation_summaries`
1 รอบ : 1 แถว (`roundId` unique) สร้างตอนตั้งงบครั้งแรก พร้อมสถานะ EDITING และสร้าง `allocations` ให้ผู้สมัครทุกราย (BR-ALC-04)
| คอลัมน์ | หมายเหตุ |
|---|---|
| totalBudget | Decimal(14,2) > 0 BR-ALC-02; แก้ได้เมื่อยอดจัดสรรแล้ว = 0 BR-ALC-03 |
| status | EDITING / FINALIZED |
| statusChangedById, statusChangedAt | ผู้ดำเนินการ + เวลา BR-ALC-13 |

### 3.13 `allocations`
| คอลัมน์ | หมายเหตุ |
|---|---|
| applicantId | **unique** (1 ผู้สมัคร 1 รายการ) |
| isAwarded | default false |
| amount | Decimal(14,2) default 0 (บาท ทศนิยม ≤ 2) BR-ALC-09 |

กฎที่ตรวจใน transaction เดียวก่อนบันทึก (NFR-DAT-02):
1. SUM(amount) ของรอบ ≤ totalBudget (MSG-23)
2. isAwarded ⇒ amount > 0; ไม่ได้รับ ⇒ amount = 0 (MSG-24)
3. คะแนนสุดท้าย = 0 ⇒ isAwarded ไม่ได้ (MSG-25) — คำนวณคะแนนจาก evaluations
4. สถานะ FINALIZED แก้ไม่ได้ (MSG-26)

### 3.14 `audit_logs`
| คอลัมน์ | หมายเหตุ |
|---|---|
| id | BigInt (log โตเร็ว เก็บ 6 ปี) |
| actorId | FK? — null = ระบบ (เช่น ตัดวันหมดอายุ) |
| action | AuditAction |
| entityType, entityId | เป้าหมายของการกระทำ |
| roundId | Int? ไม่ใช่ FK (ไม่ผูกกับวงจรชีวิตข้อมูล) |
| oldValue, newValue | JSON ทุกครั้งที่แก้ไข (รวมแก้ซ้ำหลังเปิด Finalized กลับมา) BR-PDP-02 |
| detail | เช่น จำนวนผู้สมัครที่ไม่มี Submitted ที่ Admin รับทราบตอนปิดรอบ FR-AUD-03; รหัสการจัดสรรที่ถูกดูเลขบัตร FR-ALC-10 |

ข้อกำหนด: ไม่มีเลขบัตรเต็มใน log ใด ๆ (NFR-PRV-02) · ไม่มี API ดู/แก้/ลบใน SEMS (FR-AUD-06, NFR-PRV-03) · เก็บ 6 ปี (BR-PDP-08)

---

## 4. Constraint เพิ่มเติม (raw SQL ใน migration)

Prisma ยังไม่รองรับ CHECK constraint ใน schema ให้เพิ่มใน migration ด้วย SQL (เป็นด่านสุดท้ายต่อจากการตรวจที่ Backend):

```sql
-- เกณฑ์ย่อย
ALTER TABLE sub_criteria ADD CONSTRAINT chk_sub_criteria_scored
  CHECK (
    ("type" = 'SCORED' AND "maxScore" BETWEEN 1 AND 100)
    OR ("type" = 'TEXT' AND "maxScore" IS NULL AND "allowComment" = false)
  );

-- รอบทุน
ALTER TABLE scholarship_rounds ADD CONSTRAINT chk_round_year
  CHECK ("academicYear" BETWEEN 2550 AND 2700);
ALTER TABLE scholarship_rounds ADD CONSTRAINT chk_round_semester
  CHECK ("semester" IN (1, 2));

-- ผู้สมัคร
ALTER TABLE applicants ADD CONSTRAINT chk_applicant_year CHECK ("studyYear" BETWEEN 1 AND 4);
ALTER TABLE applicants ADD CONSTRAINT chk_applicant_gpa  CHECK ("gpa" BETWEEN 0.00 AND 4.00);

-- งบและการจัดสรร
ALTER TABLE allocation_summaries ADD CONSTRAINT chk_budget_positive CHECK ("totalBudget" > 0);
ALTER TABLE allocations ADD CONSTRAINT chk_allocation_amount
  CHECK (("isAwarded" = true AND "amount" > 0) OR ("isAwarded" = false AND "amount" = 0));

-- ผลประเมิน: คะแนนไม่ติดลบ (ช่วงบน = maxScore ตรวจที่ Backend เพราะอ้างตารางอื่น)
ALTER TABLE evaluation_items ADD CONSTRAINT chk_item_score_nonneg CHECK ("score" IS NULL OR "score" >= 0);

-- Audit Log: ให้ role ของแอปเพิ่มได้อย่างเดียว (NFR-PRV-03)
-- REVOKE UPDATE, DELETE ON audit_logs FROM <app_role>;
```

ชื่อตาราง/คอลัมน์ใน SQL ตรงกับที่ Prisma สร้าง (`@@map` เป็น snake_case, คอลัมน์คง camelCase ตามชื่อฟิลด์) — ตรวจชื่อจริงจาก migration ที่สร้างก่อนรัน

---

## 5. กฎที่ต้องบังคับที่ Backend (Schema ทำเองไม่ได้)

| กฎ | ที่มา |
|---|---|
| บทบาทเปลี่ยนไม่ได้หลังสร้าง | BR-USR-03 |
| อีเมลต้องเป็นโดเมน kku.ac.th/kkumail.com | BR-USR-02 |
| ปิดบัญชีตนเอง/Admin คนสุดท้ายไม่ได้ | BR-USR-14 |
| ปิดบัญชี Evaluator ที่มี Draft ในรอบ Open ไม่ได้; เลื่อนปิดอัตโนมัติ | BR-USR-09/10 |
| สถานะรอบเปลี่ยนทางเดียว + optimistic check (`UPDATE ... WHERE status = :expected`) | BR-RND-04, NFR-DAT-03 |
| แก้รอบ/เกณฑ์/ผู้สมัคร/ผูกเกณฑ์ ได้เฉพาะ Draft; เกณฑ์ที่ถูกใช้ใน Open/Closed แก้ไม่ได้ | BR-RND-05/10, BR-CRT-09 |
| ผลรวม maxScore ของ SCORED = 100 ทุกครั้งที่บันทึก/ก่อนเปิดรอบ | BR-CRT-06, BR-RND-08 |
| Evaluator เห็นเฉพาะผู้สมัครรอบ Open; ห้ามส่ง `applicant_contacts` ให้ Evaluator | BR-EVL-01, BR-PDP-05 |
| Submit ต้องกรอกคะแนนครบทุก SCORED; ห้ามแก้ Submitted; ห้าม Submit หลังรอบ Closed (race กับปิดรอบ) | BR-EVL-11/12/14, NFR-DAT-04 |
| คะแนนเฉลี่ย/อันดับ: ใช้ Decimal เทียบก่อนปัดเศษ ปัดแสดง 2 ตำแหน่ง | NFR-DAT-06 |
| ตั้งงบ/แก้ผลจัดสรรเฉพาะรอบ Closed และ allocation ไม่ Finalized | BR-ALC-01/12 |
| ส่งออกรายงานตามสถานะ (สรุปผล: Closed; จัดสรร: Finalized) | BR-EXP-01/02 |
| การดูเลขบัตรเต็มต้องเขียน `VIEW_CITIZEN_ID` ก่อนคืนค่า | BR-PDP-04 |

---

## 6. ข้อสมมติและประเด็นที่ยังเปิด

| # | ประเด็น | ที่ผมตัดสินใจใน schema |
|---|---|---|
| 1 | Audit Log เก็บที่ไหน | **ตารางใน DB** ตามที่คุณยืนยัน (เอกสารต้นทางบอกตรวจนอก SEMS แต่ไม่ระบุที่เก็บ) |
| 2 | อัลกอริทึม/กุญแจเข้ารหัสเลขบัตร | `[TBD]` — คอลัมน์เป็น String (ciphertext) เปลี่ยนวิธีได้โดยไม่แก้ schema |
| 3 | ฟิลด์ประกอบการพิจารณาเป็น String ทั้งหมด | เพราะไม่มีกฎตรวจเนื้อหา; ถ้าต้องการสถิติ/เรียงตามตัวเลข ให้แยกคอลัมน์ตัวเลขภายหลัง |
| 4 | `citizenIdMasked` เก็บสำเร็จรูป | แลกพื้นที่เล็กน้อยกับไม่ต้องถอดรหัสทุกครั้งที่แสดง; ลบคอลัมน์นี้ได้หากต้องการให้มีเลขเต็มที่เดียว |
| 5 | `user_sessions` | ใส่เพื่อรองรับเซสชันเดียว/idle timeout; ตัดได้หากใช้ session store อื่น |
| 6 | `import_batches` เก็บประวัติทุกครั้ง | เอกสารต้องการแค่ "ครั้งล่าสุด" แต่เก็บประวัติช่วยตรวจสอบย้อนหลัง; Retention 6 ปีนับจาก batch ล่าสุด (BR-PDP-09) |
| 7 | อันดับ/คะแนนสุดท้าย ไม่เก็บ | ถ้าผู้สมัครต่อรอบมีมาก และ Realtime ช้า (NFR-PRF-03 ยัง TBD) ค่อยเพิ่ม materialized view/cache ได้ภายหลัง |
| 8 | FR-EVL-14 (Evaluator ดูผลของตน) | ไม่ต้องเพิ่มตาราง ใช้ `evaluations`/`evaluation_items` เดิม (ยังไม่อยู่ใน Scope) |
| 9 | ขนาดฟิลด์/ความยาว | ไม่กำหนดตามคำตัดสิน E5 (String = text ใน PostgreSQL) |
| 10 | Anonymize เมื่อครบ 6 ปี | ออกแบบให้ทำได้: `applicants` (ชื่อ/รหัส), `applicant_contacts` (ลบทั้งแถว), `applicant_supporting_info` (ล้างข้อความ), `evaluation_items.comment/textValue` (ล้าง), คง `evaluation_items.score`, `allocations`, `scholarship_rounds`, `criteria` ไว้เชิงสถิติ — ต้องมีสคริปต์และเอกสารส่งมอบ (NFR-OPS-03) |

---

## 7. การใช้งาน

```bash
npm i -D prisma && npm i @prisma/client
# ตั้ง DATABASE_URL ใน .env เช่น postgresql://user:pass@localhost:5432/sems
npx prisma format
npx prisma validate
npx prisma migrate dev --name init   # แล้วเพิ่ม raw SQL ในหัวข้อ 4 ลงไฟล์ migration.sql
```
