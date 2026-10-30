# PawCircle — Team Requirements & MVP Specification

**Version:** 2.0 (planning draft)  
**Status:** For team review; no build has been executed  
**Timeline:** 3 days  
**Budget:** ₹0  
**Team:** 3 contributors  
**Tagline:** *Find trusted care. Track every task. Reward every effort.*

## 1. Product vision

PawCircle is a **pet-care marketplace with an integrated care-management dashboard**. Pet owners post paid opportunities to care for their pets. People with pet-care experience apply, owners choose a caretaker, and the selected caretaker completes feeding, walking, grooming, and other assigned routines. Owners can monitor progress, review completed work, and approve earnings.

**Primary selling point:** People can **apply for paid pet-care opportunities**, perform the assigned care, and track earnings; owners gain visibility into whether their pets are being cared for.

The original **Pet Care Companion** assignment remains in scope: pet profiles, feeding/walking routines, vaccinations, grooming, vet appointments, and genuinely AI-generated, editable care checklists. The **Family Care Hub**, **PetTime Capsule**, and **Care-to-Memory** features differentiate the product.

## 2. Marketplace model and assumptions

**Proposed MVP model (requires team confirmation):** **Owners post jobs; caretakers apply.** This is the model most directly aligned with the stated selling point. A caretaker-service directory and direct booking are possible later enhancements, not assumed MVP commitments.

**Critical limitation:** The 3-day, ₹0 MVP will use a **local demo role switcher** and **simulated payments/earnings**. It will demonstrate the full owner-to-caretaker workflow on one device, but **will not** provide real cross-device accounts, real-time synchronization, identity verification, or transfer money. Do not label it as a live marketplace or claim that any payment was processed.

## 3. User roles

### Pet owner
- Create and manage pet profiles and health information.
- Post paid care opportunities with pet, dates, instructions, tasks, and offered amount in INR.
- Review caretaker applications and choose an applicant.
- Assign and monitor routines; see timestamps and completion notes.
- Approve completed work and mark the agreed amount as approved/paid **in the demo ledger only**.
- Use AI to draft editable care checklists.
- Manage family members and preserve pet memories.

### Pet caretaker
- Create an experience profile: name, bio, claimed years of experience, skills, availability, and optional profile photo.
- Browse open care opportunities and apply with a short message.
- View application status (applied, selected, rejected).
- Accept an offered assignment, see instructions, and complete assigned tasks.
- Add completion notes and optional photos.
- View agreed, pending-approval, approved, and demo-marked-paid earnings.

### Family member
- Help the owner with routine assignments and view relevant activity in the Family Care Hub.
- Family profiles in v1 are local profiles, not authenticated user accounts.

## 4. Core workflow — must work end to end

1. Owner creates a pet profile.
2. Owner posts a **paid care opportunity** (e.g., “Weekend care for Bruno — ₹800”).
3. Caretaker switches to caretaker mode, sees the opportunity, and applies.
4. Owner reviews applicants and selects one.
5. Caretaker accepts the assignment.
6. Assigned feeding/walking/other routines appear on the caretaker dashboard.
7. Caretaker marks tasks complete with timestamp, notes, and optional photo.
8. Owner sees updates on their dashboard and reviews work.
9. Owner approves the completed assignment; earnings status changes in the **simulated ledger**.
10. Optionally, a completed care activity is saved to the pet's Time Capsule as a memory.

**Important:** Application, hiring, completion, approval, and earnings states must come from persisted data, not hardcoded UI counters.

## 5. MVP feature requirements

| Priority | Module | Requirements |
|---|---|---|
| P0 | Role switcher | Owner / Caretaker demo views, clearly marked as local demo mode |
| P0 | Pet profiles | CRUD, species, breed, age/birth date, notes, compressed photo |
| P0 | Care opportunities | Owner posts/edits/closes job; pet, schedule, instructions, offered amount, status |
| P0 | Caretaker profiles | Experience, skills, availability, short bio |
| P0 | Applications | Apply, view status, owner selects/rejects applicants; prevent duplicate applications |
| P0 | Assignments | Accepted hire links pet, job, caretaker, routines, agreed compensation |
| P0 | Routine tracking | Feeding, walking, grooming, play; recurring schedules, assignee, task completion history |
| P0 | Owner dashboard | Active jobs, applicants, hired caretaker, tasks completed/pending, upcoming care |
| P0 | Caretaker dashboard | Available jobs, applications, assigned tasks, completion log, earnings |
| P0 | Health records | Vaccinations, grooming history, vet appointments, notes and due dates |
| P0 | AI checklists | Gemini-generated structured tasks from owner instructions; editable and owner-approved before saving |
| P0 | Earnings ledger | Agreed amount, pending approval, approved, demo-marked-paid; **no payment processing** |
| P0 | Local persistence | IndexedDB; data survives browser refresh |
| P0 | Demo data | 2 pets, 3 family members, sample caretaker(s), job postings, applications, assignments, care history, health records, memories |
| P1 | Family Care Hub | Assign family responsibilities, view completions and contribution summaries |
| P1 | PetTime Capsule | Memory timeline with captions, milestones, compressed photos |
| P1 | Care-to-Memory | Convert completed care task into a linked memory |
| P1 | Backup / restore | Export/import records and photos; validate imports |
| Later | Live marketplace | Real accounts, remote sync, messaging, verification, payments, reviews, notifications |

**Scope protection:** All original assignment requirements remain essential. If time is short, simplify decorative charts, animations, and advanced marketplace filters before cutting core flows. At minimum, demonstrate one complete owner → application → hire → care → approval journey.

## 6. Screens and navigation

- **Owner Dashboard:** Pets, active jobs, applicants, selected caretaker, routine progress, health reminders.
- **My Pets:** Pet profiles and detail pages.
- **Care Opportunities:** Post/edit job, view applications, select caretaker.
- **Caretaker Dashboard:** Available opportunities, applications, active assignments, tasks, earnings.
- **Caretaker Profile:** Skills, experience, availability, bio.
- **Care Schedule:** Routines, assigned tasks, completion logs.
- **Health Records:** Vaccinations, grooming, appointments.
- **Family Hub:** Family profiles and responsibilities.
- **AI Checklists:** Generate, preview, edit, approve and save.
- **Time Capsule:** Milestones and photos; Care-to-Memory.
- **Settings:** Demo reset, export/import, local-only disclosure, AI usage information.

## 7. Data model — shared contract

Every entity has `id` (UUID), `createdAt`, and `updatedAt` unless otherwise justified.

| Entity | Key fields |
|---|---|
| Household | `id`, `name` |
| FamilyMember | `id`, `householdId`, `name`, `role` |
| Pet | `id`, `householdId`, `name`, `species`, `breed`, `birthDate?`, `notes?`, `photoId?` |
| CaretakerProfile | `id`, `displayName`, `bio`, `experienceYears?`, `skills[]`, `availability?`, `photoId?` |
| CareOpportunity | `id`, `ownerHouseholdId`, `petId`, `title`, `description`, `startAt`, `endAt`, `offeredAmountINR`, `status` |
| Application | `id`, `opportunityId`, `caretakerId`, `message`, `status`, `appliedAt` |
| Assignment | `id`, `opportunityId`, `caretakerId`, `applicationId`, `agreedAmountINR`, `status`, `acceptedAt?` |
| Routine | `id`, `petId`, `assignmentId?`, `title`, `type`, `time`, `recurrence`, `assignedMemberId?`, `active` |
| CareTask | `id`, `petId`, `routineId?`, `assignmentId?`, `title`, `dueAt`, `status` |
| TaskCompletion | `id`, `taskId`, `completedByProfileId`, `completedAt`, `notes?`, `photoIds?` |
| CareRecord | `id`, `petId`, `type`, `title`, `eventDate`, `nextDueDate?`, `notes?` |
| EarningsEntry | `id`, `assignmentId`, `caretakerId`, `amountINR`, `status`, `approvedAt?`, `markedPaidAt?` |
| Memory | `id`, `petId`, `title`, `caption`, `occurredAt`, `photoIds[]`, `linkedCompletionId?` |
| Photo | `id`, `mimeType`, `blob`, `sizeBytes` |
| Checklist | `id`, `petId`, `sourceInstructions`, `status`, `items[]` |

**Suggested statuses:**
- Opportunity: `open`, `filled`, `closed`.
- Application: `submitted`, `selected`, `rejected`, `withdrawn`.
- Assignment: `offered`, `accepted`, `in_progress`, `submitted_for_review`, `approved`, `cancelled`.
- Earnings: `pending`, `approved`, `marked_paid` (demo only).

Rules: only one selected active caretaker per single-slot opportunity; prevent duplicate applications by the same caretaker; don't approve earnings until owner review; preserve completion history; don't erase task completion when a linked memory is deleted; never expose unrelated pet health data in a public listing.

## 8. Architecture and security

- **Frontend:** React + TypeScript + Vite, Tailwind CSS, React Router, Lucide React.
- **Local storage:** IndexedDB via Dexie; repository/service layer between UI and persistence.
- **Images:** Browser-side compression, maximum upload 10 MB, resize to 1600 px max dimension, WebP ~80% quality; store blobs in IndexedDB.
- **AI backend:** Small Node.js/Express service to proxy Gemini requests.
- **AI model:** Prefer `gemini-2.5-flash-lite` subject to availability and the project's actual quota.
- **Validation:** Zod for input and AI-generated structured output.
- **Secrets:** `GEMINI_API_KEY` only in server-side ignored `.env`; never in frontend bundles, screenshots, or GitHub.
- **AI safety:** User supplies instructions; AI suggests editable checklist; owner reviews before saving; never fabricate veterinary guidance, medication doses, or vaccine schedules.
- **Quota policy:** No automatic retries, explicit Generate action, one concurrent request, conservative local budget of up to 10 requests/day; verify actual provider limits independently.
- **Future-ready:** UUIDs, timestamps, service interfaces and owner/caretaker relationships to support later cloud accounts and synchronization.

**Security limitation:** A local role switcher is not access control. This is a single-device prototype and must not be deployed as a real multi-user marketplace without authentication, authorization, privacy protections, identity checks, and payment security.

## 9. Fictional demo dataset

- **Pets:** Bruno, a 3-year-old Golden Retriever; Luna, a 2-year-old Domestic Shorthair cat.
- **Family:** Alex (owner/primary caretaker), Sam (walks/play), Jamie (grooming/memories).
- **Caretaker:** Riya, fictional pet sitter with 3 years of claimed experience, dog walking/feeding/grooming-assistance skills.
- **Example job:** “Weekend care for Bruno”, feeding, walks and companionship, **₹800** offered.
- **Example application:** Riya applies; owner selects her; assigned tasks appear on caretaker dashboard.
- **Example care progress:** Morning feeding and walk completed, evening feeding pending.
- **Example earnings:** ₹800 pending approval; on owner approval becomes approved; optional manual mark-paid status explicitly demo-only.
- **Health:** Fictional vaccination records, grooming history, and vet appointments for both pets; clearly marked as examples.
- **Memories:** Bruno's first beach trip, Luna's first birthday, plus other fictional milestones and a Care-to-Memory example.

Seed data once only. Use dates relative to initialization so dashboards remain useful. Provide a confirmed reset that does not silently overwrite user data.

## 10. Three-person team plan

| Contributor | Responsibility | Branch |
|---|---|---|
| Member 1 / Lead | Repository, shared schema, navigation, owner dashboard, pet profiles, integration and merges | `feature/core-app` |
| Member 2 | Care opportunities, caretaker profiles, applications, hiring, routines, health records, Family Hub | `feature/marketplace-care` |
| Member 3 | Caretaker dashboard, earnings ledger, Time Capsule, Care-to-Memory, Gemini checklists | `feature/caretaker-ai-memories` |

**Workflow:** Create one private GitHub repository; invite both teammates; verify both can clone, create branches, push and open pull requests. Lead establishes shared types and repository interfaces first. Then teammates branch from the tested baseline. No direct pushes to `main`; merge tested PRs one at a time. Do not have independent AI builders regenerate separate applications.

## 11. Three-day execution plan

**Day 1 — Foundation:** GitHub access test, app shell, shared schema, pet profiles, demo seeding, owner/caretaker role switcher, initial job posting and application flow.

**Day 2 — Marketplace + care:** Applicant selection, assignment acceptance, routines, completion logging, health records, owner/caretaker dashboards, earnings statuses, AI checklist generation.

**Day 3 — Differentiation + reliability:** Family Hub, Time Capsule, Care-to-Memory, backup/restore where feasible, end-to-end testing, responsive polish, demo rehearsal.

**Fallback order:** Preserve the complete paid-care application workflow and original assignment requirements. Simplify secondary analytics, visual effects, advanced filtering, and nonessential settings if behind schedule.

## 12. Acceptance criteria

- [ ] All three contributors can access the private repository and use feature branches/PRs.
- [ ] App starts on Windows localhost and builds without TypeScript errors.
- [ ] Demo data seeds once and persists after refresh.
- [ ] Owner can create/edit pet profiles and attach compressed photos.
- [ ] Owner can post a paid pet-care opportunity with amount and instructions.
- [ ] Caretaker can create a profile and apply to the opportunity.
- [ ] Owner can review applications and select a caretaker.
- [ ] Selected caretaker can accept the assignment and see assigned routines.
- [ ] Caretaker can complete routines with notes; owner dashboard updates from persisted records.
- [ ] Owner can approve work; simulated earnings update correctly.
- [ ] Vaccinations, grooming records and vet appointments are editable.
- [ ] Gemini can generate an editable checklist that requires owner approval before saving.
- [ ] Family Hub shows assigned responsibilities and completed activities.
- [ ] Time Capsule can save photos/milestones; Care-to-Memory links a real completion.
- [ ] Non-AI features remain usable without internet.
- [ ] No API key is committed or exposed in frontend code.
- [ ] Backup/restore preserves relationships and photos, if included in final MVP.
- [ ] No interface falsely implies real money has been transferred.
- [ ] A five-minute end-to-end demonstration works without errors.

## 13. Five-minute demo script

1. **0:00–0:40:** Introduce PawCircle and show owner dashboard, Bruno and Luna.
2. **0:40–1:25:** Owner posts “Weekend care for Bruno — ₹800”.
3. **1:25–2:10:** Switch to caretaker Riya; show profile and apply for the job.
4. **2:10–2:55:** Switch to owner; review application and select Riya.
5. **2:55–3:40:** Riya accepts and completes feeding/walking; show owner dashboard update.
6. **3:40–4:15:** Owner approves work; show **simulated** earnings status.
7. **4:15–5:00:** Show AI checklist, health records and Care-to-Memory; refresh to prove persistence.

## 14. Decisions pending team confirmation

1. **Marketplace interaction:** Confirm owner-posts-jobs / caretaker-applies as the MVP model, rather than direct caretaker bookings or both.
2. **Priority under deadline:** Confirm whether Family Hub, Time Capsule and backup/restore remain required in the three-day deliverable or become stretch goals if integration is delayed.
3. **Simulated compensation:** Confirm no actual payment processing in the assignment MVP.

**Do not submit code-generation prompts until the team agrees on these decisions and the shared GitHub repository is accessible to everyone.**
