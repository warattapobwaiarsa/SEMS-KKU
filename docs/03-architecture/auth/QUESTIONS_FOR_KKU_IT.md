# QUESTIONS_FOR_KKU_IT.md — ข้อมูลที่ต้องขอจาก KKU IT สำหรับการเชื่อมต่อ KKU SSO

> **Status:** Unconfirmed Information Request List (Read-Only Mission 02)  
> **Important Notice:** รายการทั้งหมดในเอกสารนี้คือ **ข้อมูลที่ต้องสอบถามและขอรับการยืนยันจาก KKU IT** — **ไม่ใช่ข้อมูลที่ยืนยันแล้ว** และห้ามนำไปสมมติเพื่อ Implement ก่อนได้รับการยืนยันอย่างเป็นทางการ

---

## 1. Verified Findings (สถานะปัจจุบัน)

1. จากการตรวจสอบ Source Code และเอกสารข้อกำหนด (`NFR-CMP-01`, `FR-AUTH-01`):
   - ปัจจุบันระบบยังไม่มีข้อมูล Technical Specification ของ KKU SSO จาก KKU IT
   - `NFR-CMP-01` ระบุ `[TBD: ระบุโปรโตคอล เช่น OAuth2/OIDC/SAML และขั้นตอนลงทะเบียนแอป]`
   - โค้ดปัจจุบันยังไม่มี SSO Adapter, Client ID, Client Secret, หรือ Endpoint ใดๆ ของ KKU SSO

---

## 2. Proposed Design (แบบสอบถามทางเทคนิคสำหรับส่งให้ KKU IT)

| # | หัวข้อที่ต้องขอข้อมูล | คำถามเฉพาะเจาะจง (ข้อมูลที่ต้องขอ — ยังไม่ยืนยัน) | เหตุผลทางสถาปัตยกรรม |
| :--- | :--- | :--- | :--- |
| **1** | **Supported Protocol** | KKU SSO รองรับโปรโตคอลใดบ้างสำหรับระบบภายในคณะ (เช่น OIDC, OAuth 2.0, SAML 2.0, CAS หรืออื่นๆ)? และมีโปรโตคอลแนะนำสำหรับ Web App (Next.js + NestJS) หรือไม่? | ใช้เลือก/พัฒนา `KkuSsoAdapter` ให้ตรงมาตรฐาน |
| **2** | **Discovery / Metadata URL** | ขอ URL สำหรับ Discovery Document / Metadata (เช่น OIDC `.well-known/openid-configuration` หรือ SAML IdP Metadata XML URL) ทั้งสภาพแวดล้อม Test และ Production | ใช้ตั้งค่า `AuthProvider.configJson` แบบ Dynamic |
| **3** | **Protocol Endpoints** | ขอ Endpoint ที่ต้องใช้งานตามโปรโตคอลที่รองรับ (เช่น Authorization / Login Endpoint, Token Endpoint, UserInfo / Attribute Endpoint, Introspection / JWKS Endpoint หรือ SSO/SLO Endpoints) | ใช้กำหนด Redirect และ Backend Token/Assertion Exchange |
| **4** | **Client Registration Process** | ขั้นตอน เอกสาร แบบฟอร์ม และระยะเวลาในการขอลงทะเบียน Application (`Client ID` / `Client Secret` หรือ `Entity ID` / Certificate) รวมถึงข้อกำหนดของ Callback / Redirect URI | ใช้ยื่นขออนุมัติกับ KKU IT ล่วงหน้า |
| **5** | **Required Claims / Attributes** | ขอรายการ Claims / Attributes ที่ IdP ส่งกลับมาให้ได้จริง (เช่น Email, ชื่อ-นามสกุล ภาษาไทย/อังกฤษ, ประเภทบุคลากร/นักศึกษา, คณะ/หน่วยงาน) และ Scope ที่ต้องขอ | ใช้สร้าง Claims Mapping โดยไม่สมมติชื่อ Field |
| **6** | **Unique User Identifier** | ฟิลด์ใดที่เป็น **Immutable Unique Identifier** ของผู้ใช้ (ไม่เปลี่ยนแปลงแม้ผู้ใช้เปลี่ยนชื่อหรืออีเมล)? ระบบอนุญาตให้จับคู่ผู้ใช้ด้วย Email (`@kku.ac.th` / `@kkumail.com` ตาม `BR-USR-02`) ได้หรือไม่? | ใช้ผูก `ExternalIdentity.externalSubject` อย่างปลอดภัย |
| **7** | **Logout Requirements** | KKU SSO รองรับหรือบังคับใช้ Single Logout (SLO / RP-Initiated Logout / Back-Channel Logout) หรือไม่? หากใช่ ขอ Logout Endpoint และ Redirect Policy | ใช้กำหนดพฤติกรรม `POST /auth/logout` (`FR-AUTH-05`) |
| **8** | **Test / Staging Environment** | มี Sandbox / Staging SSO สำหรับนักพัฒนาทดสอบหรือไม่? ขอรายละเอียดบัญชีทดสอบ (Test Accounts) และข้อจำกัดของ Redirect URI (เช่น `localhost` ได้หรือไม่) | ใช้ทดสอบ Integration ก่อนขึ้น Production |
| **9** | **Certificate / Key Rotation** | นโยบายการหมุนเวียน Signing Key / Certificate (เช่น JWKS rotation หรือ SAML cert expiry) มีความถี่อย่างไร และแจ้งเตือนล่วงหน้าผ่านช่องทางใด? | ป้องกันระบบล่มเมื่อ IdP เปลี่ยน Key |
| **10** | **Session Timeout & Policy Alignment** | มหาวิทยาลัยมีข้อกำหนดความมั่นคงปลอดภัยสารสนเทศด้าน Session Idle Timeout / Absolute Timeout หรือ MFA ที่ระบบ SEMS ต้องปฏิบัติตามหรือไม่? (`NFR-SEC-12`) | ยืนยันค่า Timeout 60 นาที (`FR-AUTH-07`) |
| **11** | **Network & Firewall Constraints** | Backend ของ SEMS ต้องติดต่อ KKU SSO ผ่านเครือข่ายภายในมหาวิทยาลัย / VPN หรือ Public Internet และต้อง Whitelist IP ของ Server หรือไม่? | ใช้กำหนด Network/Docker Deployment |
| **12** | **Support Contact & SLA** | ขอชื่อหน่วยงาน/ผู้ประสานงาน อีเมล/ช่องทางติดต่อฉุกเฉิน และ SLA กรณี KKU SSO ขัดข้อง | ใช้ประกอบแผนปฏิบัติการและการกู้คืนระบบ |

---

## 3. Assumptions

1. KKU IT มีกระบวนการลงทะเบียน Application และให้ข้อมูล Metadata/Endpoints อย่างเป็นทางการเมื่อส่งคำขอ

---

## 4. Open Questions

1. ใครคือผู้ประสานงานหลักของโครงการ SEMS-KKU ที่จะเป็นผู้ส่งแบบสอบถามนี้ไปยัง KKU IT (อาจารย์ที่ปรึกษา / คณะวิศวกรรมศาสตร์ / ทีมพัฒนา)?

---

## 5. Risks

| Risk | Impact | Mitigation |
| :--- | :--- | :--- |
| **การอนุมัติจาก KKU IT ล่าช้า** | ไม่สามารถเปิด SSO ทันกำหนดส่งมอบ | ใช้ Local Authentication (Phase 1) เปิดใช้งานจริงไปก่อนได้ตามสถาปัตยกรรมที่ออกแบบไว้ |
| **KKU SSO ไม่ส่ง `email` หรือส่ง Format ต่างจาก `User.email`** | จับคู่บัญชีไม่ได้ | ขอตัวอย่าง Payload/Claims จริงจาก Staging ก่อนเขียน Mapper |

---

## 6. Decisions Required from Developer

1. **อนุมัติรายการคำถามทั้ง 12 ข้อ** เพื่อใช้ส่งประสานงานกับ KKU IT อย่างเป็นทางการ
2. **ระบุผู้รับผิดชอบการติดต่อ KKU IT** และกำหนดเวลาที่คาดว่าจะได้รับคำตอบ
