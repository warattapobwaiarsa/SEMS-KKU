# SEMS — ER Diagram

สร้างจาก `schema.prisma` (PostgreSQL) · อ้างอิง Scope, BR v1.2, FRS v0.1, NFR v0.1
เปิดดูได้ใน GitHub / VS Code (Mermaid preview) / mermaid.live

## 1. ER Diagram (ทั้งระบบ)

```mermaid
erDiagram
  users ||--o| user_sessions : "มีเซสชันเดียว"
  users ||--o{ import_batches : "นำเข้าโดย"
  users ||--o{ evaluations : "ประเมินโดย"
  users |o--o{ allocation_summaries : "เปลี่ยนสถานะโดย"
  users |o--o{ audit_logs : "ดำเนินการโดย"

  criteria ||--|{ sub_criteria : "ประกอบด้วย"
  criteria |o--o{ scholarship_rounds : "ใช้ในรอบ (1 รอบ ใช้ 1 เกณฑ์)"

  scholarship_rounds ||--o{ import_batches : "มีประวัตินำเข้า"
  scholarship_rounds ||--o{ applicants : "มีผู้สมัคร"
  scholarship_rounds ||--o| allocation_summaries : "มีงบ/สถานะจัดสรร"

  import_batches ||--o{ applicants : "นำเข้ามา"

  applicants ||--o| applicant_contacts : "ข้อมูลติดต่อ+เลขบัตร"
  applicants ||--o| applicant_supporting_info : "ข้อมูลประกอบการพิจารณา"
  applicants ||--o{ evaluations : "ถูกประเมิน"
  applicants ||--o| allocations : "ผลจัดสรร"

  evaluations ||--o{ evaluation_items : "คะแนนรายเกณฑ์ย่อย"
  sub_criteria ||--o{ evaluation_items : "อ้างถึง"

  allocation_summaries ||--o{ allocations : "รายการจัดสรร"

  users {
    int id PK
    string email UK "บัญชี @kku.ac.th / @kkumail.com"
    string name
    enum role "ADMIN | EVALUATOR"
    boolean isActive
    datetime expiresAt "เฉพาะ Evaluator"
    datetime createdAt
    datetime updatedAt
  }

  user_sessions {
    int id PK
    int userId FK,UK
    string sessionId UK
    datetime createdAt
    datetime lastActivityAt
  }

  criteria {
    int id PK
    string name UK
    datetime createdAt
    datetime updatedAt
  }

  sub_criteria {
    int id PK
    int criteriaId FK
    string title "ซ้ำได้"
    enum type "SCORED | TEXT"
    int maxScore "เฉพาะ SCORED 1-100"
    boolean allowComment "เฉพาะ SCORED"
    int sortOrder
  }

  scholarship_rounds {
    int id PK
    string name
    int academicYear "พ.ศ. 2550-2700"
    int semester "1 | 2"
    int criteriaId FK "nullable"
    enum status "DRAFT | OPEN | CLOSED"
    datetime createdAt
    datetime openedAt
    datetime closedAt
    datetime updatedAt
  }

  import_batches {
    int id PK
    int roundId FK
    string fileName
    int totalRows
    int validRows
    int invalidRows
    json errorDetails "ห้ามมีเลขบัตรเต็ม"
    int importedById FK
    datetime importedAt
  }

  applicants {
    int id PK
    int roundId FK
    int importBatchId FK
    int legacySeq "ลำดับจากระบบเดิม"
    string studentCode "UK คู่กับ roundId"
    string titlePrefix
    string firstName
    string lastName
    string faculty
    string major
    int studyYear "1-4"
    decimal gpa "0.00-4.00"
    datetime createdAt
    datetime anonymizedAt
  }

  applicant_contacts {
    int applicantId PK,FK
    string phone
    string email
    string citizenIdEncrypted "เข้ารหัส"
    string citizenIdMasked "1-2345-XXXXX-XX-3"
  }

  applicant_supporting_info {
    int applicantId PK,FK
    string applicationDate
    string accommodation
    string rent
    string personalExpense
    string fatherAge_Occupation_Income_Status "ฟิลด์บิดา 4 ตัว"
    string motherAge_Occupation_Income_Status "ฟิลด์มารดา 4 ตัว"
    string guardian_siblings_loan_scholarships "ฟิลด์อื่น ๆ"
    string accommodationMapUrl
  }

  evaluations {
    int id PK
    int applicantId FK "UK คู่กับ evaluatorId"
    int evaluatorId FK
    enum status "DRAFT | SUBMITTED"
    int totalScore "บันทึกตอน Submit"
    datetime createdAt
    datetime updatedAt "Auto-save ล่าสุด"
    datetime submittedAt
  }

  evaluation_items {
    int id PK
    int evaluationId FK "UK คู่กับ subCriteriaId"
    int subCriteriaId FK
    int score "null = ยังไม่กรอก"
    string comment
    string textValue
  }

  allocation_summaries {
    int id PK
    int roundId FK,UK
    decimal totalBudget "มากกว่า 0"
    enum status "EDITING | FINALIZED"
    int statusChangedById FK
    datetime statusChangedAt
    datetime createdAt
    datetime updatedAt
  }

  allocations {
    int id PK
    int summaryId FK
    int applicantId FK,UK
    boolean isAwarded
    decimal amount "ได้รับทุน มากกว่า 0 / ไม่ได้รับ = 0"
    datetime createdAt
    datetime updatedAt
  }

  audit_logs {
    bigint id PK
    int actorId FK "null = ระบบ"
    enum action
    string entityType
    string entityId
    int roundId "ไม่ใช่ FK"
    json oldValue
    json newValue
    json detail
    datetime createdAt
  }
```

> หมายเหตุการอ่าน: `applicant_supporting_info` ใน diagram ย่อฟิลด์ที่คล้ายกันเป็นกลุ่มเพื่อให้อ่านง่าย รายการฟิลด์เต็มอยู่ใน `schema.prisma` / `schema.md`

## 2. มุมมองแยกตามโดเมน

### 2.1 รอบทุน เกณฑ์ และผู้สมัคร

```mermaid
erDiagram
  criteria ||--|{ sub_criteria : has
  criteria |o--o{ scholarship_rounds : "used by"
  scholarship_rounds ||--o{ import_batches : has
  scholarship_rounds ||--o{ applicants : has
  import_batches ||--o{ applicants : produced
  applicants ||--o| applicant_contacts : "PII (Admin only)"
  applicants ||--o| applicant_supporting_info : "view-only for Evaluator"
```

### 2.2 การประเมินและอันดับ

อันดับและคะแนนสุดท้าย **ไม่มีตาราง** คำนวณจาก `evaluations` ที่ `status = SUBMITTED` (ค่าเฉลี่ยของ `totalScore`, ไม่มี Submitted = 0.00, เรียงคะแนนมาก→น้อย เท่ากันเรียง `studentCode` น้อย→มาก)

```mermaid
erDiagram
  users ||--o{ evaluations : evaluates
  applicants ||--o{ evaluations : "evaluated in"
  evaluations ||--o{ evaluation_items : contains
  sub_criteria ||--o{ evaluation_items : "scored on"
```

### 2.3 การจัดสรรทุน

ยอดจัดสรรแล้ว = SUM(`allocations.amount`), งบคงเหลือ = `totalBudget` − ยอดจัดสรรแล้ว (คำนวณ ไม่เก็บ)

```mermaid
erDiagram
  scholarship_rounds ||--o| allocation_summaries : "1 round : 1 summary"
  allocation_summaries ||--o{ allocations : has
  applicants ||--o| allocations : "1 applicant : 1 allocation"
  users |o--o{ allocation_summaries : "status changed by"
```

## 3. สรุป Cardinality ที่สำคัญ

| ความสัมพันธ์ | จำนวน | ที่มา |
|---|---|---|
| รอบทุน → เกณฑ์ | N : 0..1 (1 รอบใช้ 1 เกณฑ์ ใช้เกณฑ์ซ้ำหลายรอบได้) | BR-RND-07, BR-CRT-10 |
| เกณฑ์ → เกณฑ์ย่อย | 1 : N (ต้องมี SCORED ≥ 1) | BR-CRT-04 |
| รอบทุน → ผู้สมัคร | 1 : N (ผู้สมัครคนเดียวกันอยู่หลายรอบ = คนละแถว) | BR-IMP-09 |
| ผู้สมัคร ↔ Evaluator | M : N ผ่าน `evaluations` (unique ต่อคู่) | BR-EVL-02 |
| รอบทุน → สรุปจัดสรร | 1 : 0..1 (สร้างตอนตั้งงบครั้งแรก) | BR-ALC-04 |
| ผู้สมัคร → ผลจัดสรร | 1 : 0..1 | BR-ALC-04 |
