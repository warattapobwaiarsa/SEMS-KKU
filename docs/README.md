# SEMS Documentation Index (สารบัญเอกสารโครงการ)

ระบบบริหารจัดการการประเมินทุนการศึกษา (Scholarship Evaluation Management System: SEMS)  
จัดระเบียบโครงสร้างเอกสารตามกระบวนการพัฒนาซอฟต์แวร์ (Software Engineering Lifecycle) ดังนี้:

---

## 📁 โครงสร้างโฟลเดอร์เอกสาร

```
docs/
├── 00-project/          # ข้อมูลภาพรวมและขอบเขตโครงงาน
├── 01-planning/         # แผนงานและการติดตามความครอบคลุม (Traceability)
├── 02-requirements/     # ข้อกำหนดและความต้องการของระบบ (BR, FRS, NFR, UC, Flow)
├── 03-architecture/     # สถาปัตยกรรมระบบ สแตกเทคโนโลยี และการออกแบบฐานข้อมูล
├── 04-development/      # ทรัพยากรสำหรับงานพัฒนาและโค้ดต้นแบบ (Prisma schema)
└── 05-design/           # การออกแบบ UI/UX, Design System และ Wireframes
```

---

## 📑 รายละเอียดเอกสารแต่ละหมวดหมู่

### 📂 `00-project/` (ข้อมูลโครงการ)
* [sems-scope.md](file:///d:/SEMS-KKU/docs/00-project/sems-scope.md) — **ขอบเขตโครงงาน (Scope 1.3):** ภาพรวมระบบ, ผู้ใช้งาน 2 บทบาท (Admin, Evaluator), ฟังก์ชันการทำงานของระบบ

---

### 📂 `01-planning/` (การวางแผนและการติดตาม)
* [sems-traceability-matrix.md](file:///d:/SEMS-KKU/docs/01-planning/sems-traceability-matrix.md) — **Traceability Matrix:** ตารางตรวจสอบความเชื่อมโยงและความครอบคลุมระหว่าง Scope, Business Rules (BR), Use Case (UC), Functional Requirements (FR) และ Non-Functional Requirements (NFR)

---

### 📂 `02-requirements/` (ข้อกำหนดความต้องการ)
* [sems-business-rules.md](file:///d:/SEMS-KKU/docs/02-requirements/sems-business-rules.md) — **Business Rules (BR v1.2):** กฎทางธุรกิจและเงื่อนไขการทำงาน 14 หัวข้อ (127 ข้อ)
* [sems-functional-requirements.md](file:///d:/SEMS-KKU/docs/02-requirements/sems-functional-requirements.md) — **Functional Requirements (FRS v0.1):** ข้อกำหนดความต้องการเชิงฟังก์ชันตามมาตรฐาน ISO/IEC 29110 (127 ข้อ)
* [sems-non-functional-requirements.md](file:///d:/SEMS-KKU/docs/02-requirements/sems-non-functional-requirements.md) — **Non-Functional Requirements (NFR v0.1):** ข้อกำหนดความต้องการเชิงคุณภาพและคุณลักษณะตาม ISO/IEC 25010 (50 ข้อ)
* [sems-usecase-description.md](file:///d:/SEMS-KKU/docs/02-requirements/sems-usecase-description.md) — **Use Case Description:** รายละเอียด Use Case ทั้งหมด 23 กรณีใช้งาน
* [sems-user-flow.md](file:///d:/SEMS-KKU/docs/02-requirements/sems-user-flow.md) — **User Flow:** ผังและลำดับขั้นตอนการใช้งานของผู้ใช้แต่ละบทบาท (Admin 17 flow, Evaluator 3 flow, ระบบอัตโนมัติ 3 flow)

---

### 📂 `03-architecture/` (สถาปัตยกรรมและการออกแบบ)
* [sems-tech-stack.md](file:///d:/SEMS-KKU/docs/03-architecture/sems-tech-stack.md) — **Tech Stack & Architecture Principles:** เทคโนโลยีที่เลือกใช้ (Next.js, NestJS, PostgreSQL, Prisma), หลักการสถาปัตยกรรม และแนวทางการรักษาความปลอดภัย
* [sems-er-diagram.md](file:///d:/SEMS-KKU/docs/03-architecture/sems-er-diagram.md) — **ER Diagram:** แผนภาพความสัมพันธ์ของข้อมูล (Entity Relationship Diagram) ในรูปแบบ Mermaid
* [sems-schema.md](file:///d:/SEMS-KKU/docs/03-architecture/sems-schema.md) — **Database Schema:** รายละเอียดการออกแบบตาราง กฎเกณฑ์ ข้อสมมติ และ raw SQL
* [sems-schema-description.md](file:///d:/SEMS-KKU/docs/03-architecture/sems-schema-description.md) — **Schema Description (Data Dictionary):** คำอธิบายโครงสร้างฟิลด์ ชนิดข้อมูล และความหมายของ 14 ตาราง
* [sems-relationships.md](file:///d:/SEMS-KKU/docs/03-architecture/sems-relationships.md) — **Table Relationships:** ความสัมพันธ์ระหว่างตารางและรายการ Foreign Key (18 FKs)

---

### 📂 `04-development/` (งานพัฒนาและสคีมาโค้ด)
* [sems-schema.prisma](file:///d:/SEMS-KKU/docs/04-development/sems-schema.prisma) — **Prisma Schema:** ไฟล์ schema สำหรับ PostgreSQL ORM ที่ใช้ในการ Migrate ฐานข้อมูลและการสร้าง Prisma Client จริง

---

### 📂 `05-design/` (การออกแบบ UI/UX และ Wireframes)
* [DESIGN.md](file:///d:/SEMS-KKU/docs/05-design/sems-wireframe/sems_wireframe_system/DESIGN.md) — **Design System:** ข้อกำหนดสี Typography และ Component Styles สำหรับ SEMS
* [sems-wireframe/](file:///d:/SEMS-KKU/docs/05-design/sems-wireframe) — **UI Wireframes & Mockups:** หน้าจอต้นแบบ HTML และรูปภาพตัวอย่าง 50+ หน้าจอ ครบทุก Use Case (Admin, Evaluator, Authentication, Error States)
