# SEMS-KKU (ระบบบริหารจัดการการประเมินทุนการศึกษา มหาวิทยาลัยขอนแก่น)

> **เว็บแอปพลิเคชันบริหารจัดการการประเมินและการจัดสรรทุนการศึกษา มหาวิทยาลัยขอนแก่น**  
> พัฒนาขึ้นตามมาตรฐานวิศวกรรมซอฟต์แวร์ (ISO/IEC 29110, ISO/IEC 25010) และพระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล (PDPA)

---

## 📌 ภาพรวมระบบ (Overview)

**SEMS-KKU (Scholarship Evaluation Management System)** ออกแบบมาเพื่อยกระดับกระบวนการประเมินและจัดสรรทุนการศึกษาของมหาวิทยาลัยขอนแก่นให้มีประสิทธิภาพ ถูกต้อง โปร่งใส และตรวจสอบย้อนกลับได้ ทดแทนกระบวนการเดิมที่ใช้เอกสารกระดาษและสเปรดชีตที่กระจัดกระจาย

### บทบาทผู้ใช้งานหลัก (Key Roles)
* **ผู้ดูแลระบบ (Admin):** จัดการบัญชีผู้ใช้งานและผู้ประเมิน, ตั้งค่าชุดเกณฑ์การประเมิน (ผลรวมคะแนน 100 คะแนนเต็ม), นำเข้าข้อมูลผู้สมัครผ่านไฟล์ Excel (.xlsx), ควบคุมวงจรชีวิตของรอบทุน (Draft → Open → Closed), ตรวจสอบผลการประเมิน, บริหารจัดการงบประมาณและการจัดสรรทุน, และส่งออกรายงานสรุปแบบเข้ารหัสผ่าน
* **ผู้ประเมิน (Evaluator):** ตรวจสอบรายชื่อและข้อมูลประกอบการพิจารณาของผู้สมัครที่เปิดให้ประเมิน, บันทึกคะแนนตามเกณฑ์ย่อยและความคิดเห็นพร้อมระบบ Auto-save แบบร่าง, ตรวจสอบผลสรุปก่อนส่ง และยืนยันส่งผลการประเมิน
* **ระบบอัตโนมัติ (System Automation):** ยืนยันตัวตนผ่าน KKU Single Sign-On (SSO), บังคับใช้ Single Active Session (ตัดการเชื่อมต่อเมื่อไม่มีกิจกรรมเกิน 60 นาที), ตัดสิทธิ์บัญชีผู้ประเมินอัตโนมัติเมื่อหมดอายุ, คำนวณและจัดอันดับคะแนนพร้อมกฎ Tie-breaker, และบันทึก Audit Log แบบ Append-only จัดเก็บย้อนหลัง 6 ปีตามกฎหมาย PDPA

---

## 🛠️ สแตกเทคโนโลยี (Tech Stack)

| ส่วนของระบบ | เทคโนโลยีที่ใช้ | วัตถุประสงค์การใช้งาน |
|---|---|---|
| **Frontend** | [Next.js](https://nextjs.org/) (App Router), TypeScript, Tailwind CSS v4, Lucide Icons | ส่วนติดต่อผู้ใช้แบบ Responsive (Dual-View: Desktop Table & Mobile Cards), ระบบ Progressive Disclosure และ Micro-interactions อิงตาม Apple HIG & Framer Motion Spring Physics |
| **Backend** | [NestJS](https://nestjs.org/), TypeScript, REST API | จัดการ Business Logic, ยืนยันตัวตน, RBAC Authorization, คำนวณคะแนน, พร้อม Prisma Transaction & Audit Trail |
| **Database & ORM** | [PostgreSQL](https://www.postgresql.org/), [Prisma ORM](https://www.prisma.io/) | จัดเก็บฐานข้อมูลเชิงสัมพันธ์, จัดการ Schema และ Database Migrations |
| **Authentication** | KKU Single Sign-On (OAuth2/OIDC) | ระบบเข้าสู่ระบบส่วนกลางของมหาวิทยาลัย (`@kku.ac.th`, `@kkumail.com`) |
| **Data Processing** | ExcelJS / SheetJS | ตรวจสอบและนำเข้าข้อมูลผู้สมัครจากไฟล์ Excel รวมถึงสร้างไฟล์รายงาน |
| **Security & Privacy** | AES-256-GCM, Data Masking, Audit Logging | ความปลอดภัยตามมาตรฐาน PDPA, เข้ารหัสเลขประจำตัวประชาชน |
| **DevOps & Containers**| Docker, Docker Compose, GitHub Actions | ควบคุมสภาพแวดล้อมจำลอง (Containers) และระบบ CI/CD Pipeline |

---

## 📁 โครงสร้างโปรเจกต์ (Repository Structure)

โครงสร้างโฟลเดอร์ของระบบถูกจัดเรียงเป็นสัดส่วนเพื่อรองรับการพัฒนาร่วมกันเป็นทีม:

```text
SEMS-KKU/
├── backend/                 # ระบบ Backend REST API Server (NestJS)
│   ├── prisma/              # Prisma Schema และประวัติ Database Migrations
│   ├── src/                 # โมดูลระบบ Controllers, Services, Guards
│   ├── test/                # ชุดทดสอบ Unit Tests และ E2E Tests
│   └── package.json
│
├── frontend/                # ส่วนติดต่อผู้ใช้ Web Application (Next.js - กำลังพัฒนา)
│   ├── src/
│   │   ├── app/             # Routing หน้าจอตามบทบาท (admin, evaluator, auth)
│   │   ├── components/      # คอมโพเนนต์ UI และ Layouts
│   │   └── lib/             # API Client และ Utility Functions
│   └── package.json
│
├── docs/                    # คลังเอกสารข้อกำหนดและการออกแบบระบบฉบับสมบูรณ์
│   ├── 00-project/          # ขอบเขตโครงการ (Scope 1.3) และภาพรวม
│   ├── 01-planning/         # แผนงานและตาราง Traceability Matrix (ISO/IEC 29110)
│   ├── 02-requirements/     # ข้อกำหนดฟังก์ชัน (127 FRS), คุณภาพ (50 NFR), Business Rules (127 BR), UC, Flow
│   ├── 03-architecture/     # สถาปัตยกรรมระบบ, ER Diagram, พจนานุกรมข้อมูล, Tech Stack, REST API
│   ├── 04-development/      # สคีมาต้นแบบ Prisma Schema และแม่แบบงานพัฒนา
│   ├── 05-design/           # Design System และหน้าจอต้นแบบ UI Wireframes (50+ จอ)
│   └── 06-data/             # ข้อมูลตัวอย่าง แม่แบบนำเข้า (Excel, CSV, JSON) และระบบเดิม
│
├── .github/                 # เวิร์กโฟลว์ CI/CD และเทมเพลต Pull Request / Issue
├── docker-compose.yml       # คอนฟิกบริการ Local Development (PostgreSQL)
├── .editorconfig            # กฎจัดรูปแบบโค้ดสำหรับ Editors
└── .gitignore               # รายการไฟล์ที่ไม่ต้องการนำเข้าสู่ Git
```

---

## 📚 สารบัญเอกสารโครงการ (Documentation Index)

เอกสารข้อกำหนดการออกแบบและการวิเคราะห์ทั้งหมดถูกจัดเก็บไว้อย่างเป็นหมวดหมู่ใน [`docs/`](docs/README.md):

* **[ขอบเขตและภาพรวมระบบ (Scope & Overview)](docs/00-project/sems-scope.md):** ขอบเขตการทำงาน บทบาทผู้ใช้งาน และฟังก์ชันทั้งหมด (Scope 1.3)
* **[ตารางความครอบคลุม (Traceability Matrix)](docs/01-planning/sems-traceability-matrix.md):** แผนผังตรวจสอบความเชื่อมโยงระหว่าง BR, FRS, NFR และ Use Case
* **[กฎทางธุรกิจ (Business Rules)](docs/02-requirements/sems-business-rules.md):** เงื่อนไขและกฎทางธุรกิจ 127 ข้อ ครอบคลุม 14 หมวดหมู่
* **[ข้อกำหนดความต้องการเชิงฟังก์ชัน (FRS)](docs/02-requirements/sems-functional-requirements.md):** ข้อกำหนดความต้องการตามมาตรฐาน ISO/IEC 29110 (127 ข้อ)
* **[ข้อกำหนดความต้องการเชิงคุณภาพ (NFR)](docs/02-requirements/sems-non-functional-requirements.md):** ข้อกำหนดด้านประสิทธิภาพ ความปลอดภัย และการรองรับ (ISO/IEC 25010)
* **[รายละเอียดกรณีใช้งาน (Use Case Descriptions)](docs/02-requirements/sems-usecase-description.md):** รายละเอียดขั้นตอนทั้ง 23 Use Cases
* **[ผังขั้นตอนการใช้งาน (User Flow Diagrams)](docs/02-requirements/sems-user-flow.md):** ลำดับการใช้งานของผู้ดูแลระบบและผู้ประเมิน
* **[สถาปัตยกรรมระบบและเทคโนโลยี (Tech Stack)](docs/03-architecture/sems-tech-stack.md):** หลักการออกแบบสถาปัตยกรรมและข้อกำหนดความปลอดภัย
* **[แผนภาพ ERD และพจนานุกรมข้อมูล (Database Schema)](docs/03-architecture/sems-schema-description.md):** โครงสร้างตารางและฟิลด์ข้อมูลทั้งหมด 14 ตาราง
* **[โมเดลฐานข้อมูล Prisma (Prisma Schema)](docs/04-development/sems-schema.prisma):** สคีมาพร้อมใช้งานสำหรับการทำ Database Migration
* **[หน้าจอต้นแบบและ Design System (UI Wireframes)](docs/05-design/sems-wireframe/):** ดีไซน์หน้าจอต้นแบบ HTML/PNG กว่า 50+ หน้าจอ และข้อกำหนดดีไซน์
* **[ข้อมูลตัวอย่างและแม่แบบนำเข้า (Sample Data & Import Templates)](docs/06-data/README.md):** ไฟล์ Excel, CSV, JSON และข้อมูลเดิมสำหรับทดสอบระบบนำเข้าข้อมูลผู้สมัคร

---

## 🚀 เริ่มต้นใช้งานในสภาพแวดล้อมเครื่องตนเอง (Local Development)

### สิ่งที่จำเป็นต้องมีก่อนติดตั้ง (Prerequisites)
* [Node.js](https://nodejs.org/) (เวอร์ชัน 20 LTS ขึ้นไป)
* [Docker Desktop](https://www.docker.com/) และ Docker Compose
* [Git](https://git-scm.com/)

### 1. คัดลอก Repository (Clone)
```bash
git clone https://github.com/warattapobwaiarsa/SEMS-KKU.git
cd SEMS-KKU
```

### 2. เริ่มต้นฐานข้อมูล PostgreSQL ผ่าน Docker
```bash
docker compose up -d
```

### 3. ติดตั้งและเริ่มรันฝั่ง Backend
```bash
cd backend
npm install
cp .env.example .env
npx prisma migrate dev
npm run start:dev
```

### 4. ติดตั้งและเริ่มรันฝั่ง Frontend
```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

เมื่อเปิดใช้งานเรียบร้อย ระบบ Frontend จะรันอยู่ที่ `http://localhost:3000` และ Backend API จะรันอยู่ที่ `http://localhost:4000`

---

## 🌿 กระบวนการทำงานร่วมกันในทีมและ Git Workflow

เพื่อรักษามาตรฐานคุณภาพโค้ดและความเป็นระเบียบของการส่งมอบงาน:

### รูปแบบการตั้งชื่อ Branch (Branching Strategy)
* **`main`**: สำหรับเวอร์ชัน Production (ห้าม Push เข้าโดยตรง)
* **`develop`**: สำหรับรวมโค้ดและพัฒนาฟีเจอร์ร่วมกันในทีม
* **`feature/<FR-ID>-<ชื่อฟีเจอร์>`**: แตกออกมาจาก `develop` เพื่อพัฒนาแต่ละฟังก์ชัน
  * ตัวอย่าง: `feature/FR-RND-01-round-management`
  * ตัวอย่าง: `feature/FR-EVL-04-evaluation-form`
* **`bugfix/<issue-id>-<ชื่อการแก้ไข>`**: สำหรับแก้ไขข้อผิดพลาด แตกออกมาจาก `develop`

### ข้อตกลงการเขียนข้อความ Commit (Commit Message Conventions)
ใช้รูปแบบ [Conventional Commits](https://www.conventionalcommits.org/) พร้อมอ้างอิงรหัสความต้องการ (Requirement ID):
* `feat(round): implement round status transition [FR-RND-04]`
* `fix(criteria): enforce 100-point total validation [BR-CRT-04]`
* `test(evaluation): add test for peer-blind score calculation [BR-SCR-01]`
* `docs(readme): update local setup instructions`

### นโยบายการสร้าง Pull Request (PR Policy)
* การรวมโค้ดเข้าสู่ `develop` ต้องผ่าน Pull Request เสมอ
* ต้องผ่านการตรวจสอบและอนุมัติจากเพื่อนร่วมทีม (Peer Review) อย่างน้อย **1 คน**
* ต้องผ่านระบบทดสอบอัตโนมัติใน CI (Lint, Typecheck, Unit Tests, Prisma Validate) โดยไม่มีข้อผิดพลาด

---

## 🔒 มาตรการความปลอดภัยและการคุ้มครองข้อมูลส่วนบุคคล (PDPA)

1. **ห้ามนำข้อมูลสำคัญขึ้น Git:** ห้าม Commit ไฟล์ `.env`, API Keys, รหัสผ่าน หรือข้อมูลจริงของผู้สมัครโดยเด็ดขาด
2. **การเข้ารหัสและปกปิดเลขประจำตัวประชาชน:** เลขประจำตัวประชาชนต้องได้รับการเข้ารหัสด้วยอัลกอริทึม AES-256-GCM ในฐานข้อมูล และต้องแสดงผลแบบ Masking เสมอ (`1-2345-XXXXX-XX-3`) หากจำเป็นต้องดูฉบับเต็มจะถูกบันทึกประวัติการเข้าถึง
3. **การบันทึกประวัติกิจกรรม (Audit Trail):** ทุกการกระทำที่สำคัญของผู้ดูแลระบบ เช่น การเปลี่ยนสถานะรอบทุน การจัดสรรงบ และการส่งออกข้อมูล จะถูกบันทึกใน Audit Log แบบไม่สามารถแก้ไขได้ จัดเก็บไว้อย่างน้อย 6 ปี
4. **ใช้ข้อมูลจำลองในการทดสอบ:** ใช้ข้อมูลจำลอง (Mock Data) สำหรับการทดสอบนำเข้าไฟล์ Excel เท่านั้น ห้ามใช้ข้อมูลนักศึกษาจริง
