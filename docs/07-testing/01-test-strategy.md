# SEMS-KKU — กลยุทธ์การทดสอบระบบ (Software Testing Strategy)

**ฉบับ:** 1.0  
**อ้างอิงมาตรฐาน:** ISO/IEC 29110 (Software Engineering Lifecycle Profiles for Very Small Entities) และ ISO/IEC 25010 (System and Software Quality Models)  
**เป้าหมาย:** กำหนดมาตรฐาน แนวทางปฏิบัติ และเครื่องมือในการทดสอบระบบ SEMS-KKU ครบทั้ง 4 ระดับ

---

## 1. ขอบเขตและระดับการทดสอบ (Testing Hierarchy)

| ลำดับ | ระดับการทดสอบ (Level) | ขอบเขต (Scope) | ผู้รับผิดชอบ (Role) | เครื่องมือที่ใช้ (Tooling) | เกณฑ์การผ่าน (Success Criteria) |
|---|---|---|---|---|---|
| **1** | **Unit Testing** | ทดสอบแยกส่วนฟังก์ชันย่อย การคำนวณคะแนน ยูทิลิตี้ และคอมโพเนนต์ | Developers | Jest (Backend), Vitest (Frontend) | Test Suites ทั้งหมดผ่าน 100%, Coverage >= 70% |
| **2** | **Integration Testing** | ทดสอบการทำงานร่วมกันระหว่าง Layer (Controller ↔ Service ↔ DB, Frontend ↔ API) | Developers / Tech Lead | Supertest, Prisma Test Instance, MSW | ผ่านทุก Endpoint Contract & Transaction rollback |
| **3** | **System Testing (E2E)** | ทดสอบภาพรวมระบบทั้งระบบ จำลองพฤติกรรมผู้ใช้จริงตาม User Flows | QA / Developers | Playwright | รันผ่านแบบ Headless ใน CI ทุก Critical Flow |
| **4** | **User Acceptance Testing (UAT)** | ทดสอบความสอดคล้องตามโจทย์การทำงานจริงของผู้ใช้ปลายทาง | เจ้าหน้าที่ทุนฯ (Admin), กรรมการ (Evaluator) | UAT Sheet & Staging Environment | ข้อกำหนดสำคัญผ่าน 100%, ผู้ใช้ลงนามรับมอบ |

---

## 2. รายละเอียดการทดสอบแต่ละระดับ

### 2.1 Unit Testing
- **Backend (Jest):**
  - กฎทางธุรกิจ (Business Rules: 127 ข้อ) เช่น ผลรวมคะแนนเต็ม 100 (`[BR-CRT-04]`), การตัดสิทธิ์บัญชีเมื่อหมดอายุ (`[BR-USR-03]`)
  - อัลกอริทึมการคำนวณคะแนนเฉลี่ย และคะแนนรวม (`score-total.spec.ts`, `final-score.spec.ts`)
  - ฟังก์ชันถอดรหัส/เข้ารหัส AES-256-GCM (`crypto.util.spec.ts`)
  - ฟังก์ชันแปลงข้อมูลผู้สมัครจากไฟล์ Excel (`excel-parser.service.spec.ts`)
- **Frontend (Vitest + React Testing Library):**
  - ฟังก์ชันตกแต่งและซ่อนข้อมูลส่วนบุคคล (PDPA Masking)
  - Validation ของแบบฟอร์มกรอกคะแนน
  - คอมโพเนนต์ UI พื้นฐานและสภาวะการแสดงผล (Loading, Error, Empty State)

### 2.2 Integration Testing
- ตรวจสอบความถูกต้องของ API Envelope: `{ success, statusCode, data, meta / errorCode, error, timestamp }`
- ตรวจสอบมาตรการความปลอดภัยและสิทธิ์:
  - RBAC: Admin vs Evaluator (`roles.guard.spec.ts`)
  - Peer-blind evaluation: ผู้ประเมิน B ต้องไม่เห็นคะแนนและความเห็นของผู้ประเมิน A (`evaluation-privacy.e2e-spec.ts`)
  - Data Masking: ห้ามคืนค่า `citizenId`, `phone`, `email` ให้ผู้ประเมินที่ไม่ได้รับอนุญาต
- ตรวจสอบความสมบูรณ์ของฐานข้อมูล (Prisma Transactions): การบันทึกคะแนนต้องไม่สูญหายและย้อนคืน (Rollback) ได้เมื่อเกิด Error

### 2.3 System Testing (End-to-End)
- ติดตั้ง Playwright เพื่อรัน Browser Automation ทดสอบ 4 เส้นทางหลัก:
  1. **Lifecycle ของรอบทุน:** DRAFT → OPEN → IN_PROGRESS → CLOSED
  2. **กระบวนการประเมินคะแนน:** Auto-save Draft → Form Completeness Check → Submit Confirmation → Submitted Read-only State
  3. **การประมวลผลและการจัดสรรทุน:** คำนวณอันดับตามเกณฑ์ Tie-breaker → อนุมัติจัดสรรทุน → Export ไฟล์ผลลัพธ์
  4. **ความปลอดภัยและข้อยกเว้น:** ป้องกัน IDOR บน URL, ตัดสิทธิ์เมื่อ Session Timeout เกิน 60 นาที

### 2.4 User Acceptance Testing (UAT)
- ดำเนินการบน Staging Environment ที่มีข้อมูลจำลอง (Synthetic/Mock Data)
- ประเมินผลตามเอกสาร `docs/07-testing/02-uat-test-scenarios.md`

---

## 3. นโยบายการทดสอบใน CI/CD Pipeline
- **Pre-commit Hook (Husky):** รัน Lint และ Unit Tests ที่เกี่ยวข้อง
- **GitHub Actions (PR to develop/main):**
  - Step 1: Security Audit & Secret Scan
  - Step 2: Backend Unit Tests & E2E Privacy Tests
  - Step 3: Frontend Unit Tests & Typecheck & Build
  - Step 4: Playwright E2E Smoke Tests
