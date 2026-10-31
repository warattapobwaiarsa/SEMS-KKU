# SEMS Backend API (ระบบบริการ REST API หลังบ้าน)

> **บริการ REST API สำหรับระบบบริหารจัดการการประเมินทุนการศึกษา มหาวิทยาลัยขอนแก่น (SEMS-KKU)**  
> พัฒนาด้วย NestJS, TypeScript, Prisma ORM และฐานข้อมูล PostgreSQL

---

## 🚀 ภาพรวมระบบ (Overview)

**SEMS Backend API** รับผิดชอบการประมวลผลตรรกะทางธุรกิจหลัก (Business Logic), ระบบยืนยันตัวตน (Authentication & KKU SSO), การควบคุมสิทธิ์การเข้าถึงตามบทบาท (RBAC), การบันทึกและคำนวณคะแนนประเมินตามเกณฑ์รูบริก, การควบคุม State Machine ของรอบทุนและการจัดสรรทุน, การนำเข้าและส่งออกข้อมูล (Excel Import/Export) และระบบบันทึกประวัติการใช้งาน (Audit Logging) สำหรับ SEMS-KKU

---

## 🛠️ สแตกเทคโนโลยีและไลบรารีหลัก (Tech Stack & Dependencies)

* **เฟรมเวิร์ก:** [NestJS](https://nestjs.org/) (TypeScript)
* **ORM:** [Prisma](https://www.prisma.io/)
* **ฐานข้อมูล:** PostgreSQL 16
* **การตรวจสอบความถูกต้องของข้อมูล (Validation):** `class-validator`, `class-transformer`
* **ความปลอดภัย (Security):** `@nestjs/throttler`, `helmet`, การเข้ารหัส AES-256-GCM (Node.js crypto)
* **การทดสอบ (Testing):** Jest

---

## 📁 โครงสร้างโฟลเดอร์ (Directory Structure)

```text
backend/
├── prisma/
│   ├── schema.prisma        # โมเดลฐานข้อมูลและความสัมพันธ์ (Entities & Relations)
│   └── migrations/          # ประวัติการทำ Database Migration
├── src/
│   ├── prisma/              # PrismaService และ PrismaModule
│   ├── app.controller.ts    # คอนโทรลเลอร์ราก (Root Controller)
│   ├── app.module.ts        # โมดูลหลัก (Root Module)
│   ├── app.service.ts       # เซอร์วิสหลัก (Root Service)
│   └── main.ts              # จุดเริ่มต้นการรันระบบ (Bootstrap & Global Pipes)
├── test/                    # ชุดทดสอบ End-to-End (E2E Tests)
├── .env.example             # ไฟล์ตัวอย่าง Environment Variables
└── package.json
```

---

## ⚙️ ขั้นตอนการติดตั้งและเริ่มต้นระบบ (Getting Started)

### 1. สิ่งที่ต้องเตรียม (Prerequisites)
ตรวจสอบให้แน่ใจว่าได้เปิดใช้งานฐานข้อมูล PostgreSQL เรียบร้อยแล้ว (สามารถเปิดผ่าน Docker Compose จาก Root โฟลเดอร์ได้):
```bash
docker compose up -d
```

### 2. ตั้งค่าสภาพแวดล้อม (Environment Setup)
คัดลอกไฟล์ `.env.example` เป็น `.env` ภายในโฟลเดอร์ `backend/`:
```bash
cp .env.example .env
```
ตรวจสอบและตั้งค่า `DATABASE_URL` ให้ตรงกับ PostgreSQL:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/sems_db?schema=public"
```

### 3. ติดตั้ง Dependencies
```bash
npm install
```

### 4. ซิงค์ฐานข้อมูลด้วย Prisma Migration & Generate Client
```bash
# รัน Migration ปรับปรุงโครงสร้างฐานข้อมูล
npx prisma migrate dev

# สั่งสร้าง Prisma Client
npx prisma generate

# (ทางเลือกเสริม) เปิดดูและจัดการข้อมูลผ่าน Prisma Studio UI
npx prisma studio
```

### 5. เริ่มต้นรันเซิร์ฟเวอร์ (Start Application)
```bash
# โหมดพัฒนา (Watch mode - รีโหลดอัตโนมัติเมื่อโค้ดเปลี่ยน)
npm run start:dev

# คอมไพล์และรันในโหมด Production
npm run build
npm run start:prod
```

ระบบ REST API จะพร้อมให้บริการที่ `http://localhost:4000` (หรือพอร์ตที่ระบุไว้ในคอนฟิก)

---

## 🧪 การรันชุดทดสอบ (Testing)

```bash
# รัน Unit Tests ทั้งหมด
npm run test

# รัน Unit Tests แบบเฝ้าดูการเปลี่ยนแปลง (Watch mode)
npm run test:watch

# ตรวจสอบเปอร์เซ็นต์ความครอบคลุมของการทดสอบ (Coverage)
npm run test:cov

# รัน End-to-End Tests (E2E)
npm run test:e2e
```

---

## 🛡️ แนวปฏิบัติด้านความปลอดภัยและ PDPA

* **การควบคุมสิทธิ์ตามบทบาท (RBAC):** ตรวจสอบและบังคับใช้สิทธิ์ระหว่าง `Admin` และ `Evaluator` อย่างเคร่งครัดในระดับ Controller และ Route Guard
* **การปกป้องข้อมูลส่วนบุคคล:** ข้อมูลเลขประจำตัวประชาชนต้องได้รับการเข้ารหัสด้วย AES-256-GCM ก่อนจัดเก็บลงฐานข้อมูลเสมอ
* **การบันทึกประวัติ (Audit Trail):** บันทึกการกระทำสำคัญ เช่น การล็อกอิน, การเปลี่ยนสิทธิ์, การส่งออกข้อมูลรายงาน, และการเปิด/ปิดรอบทุน ลงตาราง Audit Log เสมอ
* **ห้ามเปิดเผย Secrets:** ห้าม Commit ข้อมูล `.env` หรือ Credential ที่เป็นความลับขึ้นสู่ Git Repository
