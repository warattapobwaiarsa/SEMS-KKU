## 📌 Summary of Changes
<!-- Provide a clear, concise summary of the changes made and the problem being solved. -->


## 🔗 Related Issues & Traceability
<!-- Reference the related GitHub Issue and Requirement IDs from the SEMS documentation. -->
* **Closes Issue:** #
* **Functional Requirement (FR):** FR-
* **Business Rule (BR):** BR-
* **Use Case (UC):** UC-

---

## 🏷️ Type of Change
<!-- Select all that apply using [x]. -->
- [ ] 🚀 **New Feature** (non-breaking change adding functionality)
- [ ] 🐛 **Bug Fix** (non-breaking change fixing an issue)
- [ ] ♻️ **Refactoring** (code improvement without changing features)
- [ ] 🗄️ **Database Migration** (Prisma schema change / migration script)
- [ ] 📝 **Documentation** (updates to README or docs/ files)
- [ ] 🧪 **Testing** (adding or modifying unit/integration tests)
- [ ] 🔧 **Configuration / DevOps** (tooling, CI/CD, Docker)

---

## ✅ Quality Checklist
<!-- Complete this checklist before requesting peer review. -->
- [ ] My code adheres to the project's coding style guidelines (`.editorconfig`, ESLint, Prettier).
- [ ] I have executed local checks and confirmed zero linting/type errors (`npm run lint`, `tsc --noEmit`).
- [ ] I have written/updated unit tests covering the relevant business logic (if applicable).
- [ ] All automated tests pass locally.
- [ ] For UI changes: I have verified responsive design on both Desktop and Mobile viewports.
- [ ] For Database changes: Prisma migrations have been tested and verified locally.

---

## 🛡️ Security & PDPA Compliance Checklist
<!-- Crucial for SEMS compliance with personal data protection and access control. -->
- [ ] **No Secrets:** No `.env` files, API credentials, private keys, or passwords are committed.
- [ ] **PDPA & Privacy:** No plaintext citizen IDs or personal contact information are exposed in logs or APIs.
- [ ] **Masking:** Sensitive fields (Citizen ID) adhere to the required mask format (`1-2345-XXXXX-XX-3`).
- [ ] **Authorization:** Backend RBAC guards (Admin vs. Evaluator) are strictly enforced at the endpoint level.
- [ ] **No Mock Data Leak:** No real applicant or student data is used in test files.
