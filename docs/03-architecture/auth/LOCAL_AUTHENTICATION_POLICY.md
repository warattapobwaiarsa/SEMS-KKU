# LOCAL_AUTHENTICATION_POLICY.md — Interim Local Authentication Policy

> **Status:** Architecture & Policy Design Only (Read-Only Mission 02)  
> **Purpose:** กำหนดมาตรฐานความปลอดภัยสำหรับ Local Authentication ในระยะแรก (Phase 1) ระหว่างรอข้อมูล KKU SSO จาก KKU IT

---

## 1. Verified Findings (ตรวจสอบจาก Source Code และข้อกำหนด)

1. `docs/02-requirements/sems-functional-requirements.md` (`FR-AUTH-01`) และ `sems-business-rules.md` (`BR-USR-01`) ระบุให้เข้าสู่ระบบผ่าน KKU SSO เท่านั้น
2. ปัจจุบัน Backend ไม่มีระบบ Password, Hashing, Rate Limiting, หรือ Lockout ใดๆ ใน `backend/src/` และ `backend/package.json`
3. `backend/prisma/seed.ts` สร้างผู้ใช้ตัวอย่าง 4 บัญชี (`admin@kku.ac.th`, `evaluator1..3@kku.ac.th`) โดยไม่มีรหัสผ่าน

---

## 2. Proposed Design (Local Authentication Security Policy)

### 2.1 User Account & Domain Rules
- บัญชีผู้ใช้ต้องถูกสร้างโดย `ADMIN` ในระบบเท่านั้น (ไม่มี Self-Registration)
- Email ต้องเป็นโดเมน `@kku.ac.th` หรือ `@kkumail.com` (`BR-USR-02`) และไม่ซ้ำกัน
- สถานะบัญชี: ต้องมี `isActive = true` และตรวจ `expiresAt` สำหรับ `EVALUATOR` (`BR-USR-06`, `BR-USR-10`, `BR-USR-11`)

### 2.2 Password Hashing Algorithm: **Argon2id (Recommended)** vs bcrypt

| Criteria | **Argon2id (Recommended)** | **bcrypt** |
| :--- | :--- | :--- |
| **Security Standard** | ชนะการแข่งขัน PHC, OWASP แนะนำเป็นอันดับ 1 | มาตรฐานเดิมที่เชื่อถือได้ แต่อ่อนไหวต่อ GPU/ASIC มากกว่า |
| **Memory-Hardness** | **Memory-hard** (ต้านทาน GPU/ASIC cracking ได้ดีมาก) | ใช้ memory น้อย (~4 KB) |
| **Input Length Limit** | ไม่จำกัดความยาว 72 bytes | ตัดที่ 72 bytes (เสี่ยง truncation หากไม่ระวัง) |
| **Recommended Params** | `memoryCost: 19456` (19 MiB), `timeCost: 2`, `parallelism: 1` (OWASP minimum) หรือ `65536` (64 MiB) หาก RAM เพียงพอ | `cost factor >= 12` |

**ข้อเสนอ:** เลือก **Argon2id** (`argon2` npm package) โดยใช้ `memoryCost >= 19 MiB`, `timeCost >= 2`, `parallelism = 1`

### 2.3 Password Policy
- ความยาวขั้นต่ำ: **12 ตัวอักษร** (สูงสุด 128 ตัวอักษร เพื่อป้องกัน DoS จากการ Hash ข้อความยาวเกิน)
- ความซับซ้อน: ต้องประกอบด้วยตัวอักษรอย่างน้อย 3 ใน 4 กลุ่ม (ตัวพิมพ์ใหญ่, ตัวพิมพ์เล็ก, ตัวเลข, อักขระพิเศษ) หรือ Passphrase ที่ไม่ตรงกับ Common/Breached password list
- ห้ามใช้ Email หรือส่วนหนึ่งของชื่อผู้ใช้เป็นรหัสผ่าน
- บังคับเปลี่ยนรหัสผ่าน (`mustChangePassword = true`) เมื่อเข้าสู่ระบบครั้งแรกหลัง Admin สร้าง/รีเซ็ตให้

### 2.4 Login Validation, Rate Limiting & Brute-Force Protection
- **Generic Error Message:** เมื่อ Email หรือ Password ผิด หรือบัญชีไม่มีอยู่ ให้ตอบข้อความเดียวกัน (`อีเมลหรือรหัสผ่านไม่ถูกต้อง`) เพื่อป้องกัน **Account Enumeration**
- **Rate Limiting (`@nestjs/throttler` หรือเทียบเท่า):**
  - Per-IP: สูงสุด **20 requests / นาที** บน `POST /api/v1/auth/login`
  - Per-Email + IP: สูงสุด **5 requests / นาที**
- **Account Lockout Policy:**
  - หากล็อกอินผิดติดต่อกัน **5 ครั้ง** ภายใน 15 นาที → ล็อกบัญชีชั่วคราว **15 นาที** (`lockedUntil = now + 15m`)
  - บันทึก `AuditLog` (`AUTH_ACCOUNT_LOCKED`)
  - การล็อกอินสำเร็จจะรีเซ็ต `failedAttempts = 0` และ `lockedUntil = null`

### 2.5 Password Reset Strategy
เนื่องจากระบบยังไม่มีการเชื่อมต่อ SMTP/Email Server ใน Source Code ปัจจุบัน:
- **Phase 1 (Admin-Assisted Reset — Recommended for Interim):**
  - ผู้ใช้ที่ลืมรหัสผ่านแจ้ง `ADMIN` เพื่อสั่ง Reset ผ่านหน้าจัดการผู้ใช้
  - ระบบสร้าง Temporary Password แบบสุ่ม (CSPRNG ≥ 16 ตัวอักษร) แสดงให้ Admin เพียงครั้งเดียว (One-time display) พร้อมตั้ง `mustChangePassword = true` และเพิกถอน Session เดิมทันที
  - ผู้ใช้ที่ล็อกอินอยู่สามารถเปลี่ยนรหัสผ่านตนเองได้ที่ `POST /api/v1/auth/change-password` (ต้องกรอกรหัสผ่านเดิม)
- *(Optional)* หากมี SMTP Server ของคณะในอนาคต สามารถเพิ่ม Self-Service Email Reset Token (อายุ 15 นาที, ใช้ได้ครั้งเดียว, เก็บ hash ใน DB) ได้

### 2.6 Initial Admin Provisioning (No Hardcoded Default Password)
- **ข้อห้ามเด็ดขาด:** ห้ามกำหนด Default Admin Password ไว้ใน Source Code, `seed.ts`, Migration, หรือ `docker-compose*.yml`
- **กลไกที่เสนอ:**
  - สร้าง CLI Bootstrap Script (รันตอน Deploy ครั้งแรกเท่านั้น เช่น `npm run auth:bootstrap-admin`)
  - รับ Email จาก `BOOTSTRAP_ADMIN_EMAIL` และรหัสผ่านจาก `BOOTSTRAP_ADMIN_PASSWORD` (หรือ Interactive TTY prompt) เฉพาะเมื่อยังไม่มี Admin ที่มี `LocalCredential` ในระบบ
  - ตั้ง `mustChangePassword = true` เพื่อบังคับเปลี่ยนรหัสผ่านทันทีเมื่อ Admin ล็อกอินครั้งแรก

### 2.7 Audit Logging
บันทึกทุกเหตุการณ์สำคัญลง `AuditLog` (ไม่บันทึกรหัสผ่านหรือ token):
- `AUTH_LOGIN_SUCCESS` (actorId, IP, userAgent, provider: `'local'`)
- `AUTH_LOGIN_FAILED` (email attempted, reason code, IP)
- `AUTH_ACCOUNT_LOCKED` (target userId, failedAttempts, lockedUntil, IP)
- `AUTH_LOGOUT` (actorId)
- `AUTH_SESSION_REVOKED` (target userId, reason: `'new_login' | 'admin_deactivate' | 'password_change'`)
- `AUTH_PASSWORD_CHANGED` / `AUTH_PASSWORD_RESET` (actorId, target userId)

### 2.8 ข้อจำกัดของ Local Authentication ที่ต้องให้เจ้าของระบบ/ผู้ดูแลระบบอนุมัติ
1. **การเบี่ยงเบนชั่วคราวจาก `FR-AUTH-01`:** `FR-AUTH-01` ระบุให้ใช้ KKU SSO เท่านั้น การใช้ Local Auth เป็นมาตรการชั่วคราวระหว่างรอ KKU IT
2. **ไม่มี Self-Service Password Reset ผ่านอีเมลในระยะแรก:** ผู้ใช้ต้องติดต่อ Admin เพื่อรีเซ็ตรหัสผ่าน (จนกว่าจะมี SMTP/SSO)
3. **การจัดการรหัสผ่านแยกจากบัญชีมหาวิทยาลัย:** ผู้ใช้ต้องจำรหัสผ่านเฉพาะของ SEMS จนกว่าจะ Switch ไปใช้ KKU SSO

---

## 3. Assumptions

1. Server Production มี RAM เพียงพอสำหรับ Argon2id (`19–64 MiB` ต่อ 1 concurrent login; rate limit ป้องกัน memory exhaustion)
2. Admin สามารถสื่อสาร Temporary Password ให้ Evaluator ผ่านช่องทางที่ปลอดภัยของคณะ (เช่น อีเมลทางการหรือส่งมอบโดยตรง)

---

## 4. Open Questions

1. คณะวิศวกรรมศาสตร์ มข. มี SMTP Relay ที่พร้อมใช้งานสำหรับ Self-Service Password Reset หรือไม่ หรือให้ใช้ Admin-Assisted Reset ไปก่อนจนกว่า KKU SSO จะพร้อม?
2. ต้องการกำหนด Password Expiration (เช่น 90 วัน) สำหรับ Local Auth หรือไม่ (NIST SP 800-63B ไม่แนะนำให้บังคับเปลี่ยนตามรอบเวลาหากไม่มีเหตุสงสัยว่าถูกขโมย)?

---

## 5. Risks

| Risk | Impact | Mitigation |
| :--- | :--- | :--- |
| **Argon2id Memory Exhaustion (DoS)** | Server ช้าหรือ OOM เมื่อถูกยิง Login พร้อมกัน | ใช้ Rate Limiting (Per-IP & Per-Email) + จำกัด concurrency |
| **Temporary Password รั่วไหลระหว่างส่งต่อ** | บัญชีถูกเข้าถึงโดยมิชอบ | บังคับ `mustChangePassword = true` และกำหนดอายุ Temporary Password (เช่น 24 ชม.) |

---

## 6. Decisions Required from Developer

1. **อนุมัติการใช้ Local Authentication ชั่วคราว** พร้อมรับทราบข้อจำกัด 3 ข้อในหัวข้อ 2.8
2. **อนุมัติ Argon2id** และค่า Policy (ความยาวขั้นต่ำ 12 ตัว, Lockout 5 ครั้ง / 15 นาที)
3. **อนุมัติ Admin-Assisted Password Reset** และ **CLI Bootstrap Script** (ไม่มี Hardcoded Password) สำหรับ Phase 1
