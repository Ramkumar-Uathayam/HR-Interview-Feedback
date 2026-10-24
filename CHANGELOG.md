# Changelog

## v2.7.0 — 2026-10-23

### Added
- **Stall QR** section for HR (after login) with four tabs:
  - **Print** — enter or scan an Employee ID (`E25-02217` or `E2502217`) to print a 90 × 42 mm label (QR left, details right) with company name, company address, employee details and amount. Only the label is printed (exact page size, no blank extra labels). A second print of the same employee is blocked and offers an explicit **Reprint**, which prints a slip marked `REPRINT` with the copy number.
  - **Report** — total / printed / pending / reprint counts, search, company and status filters, Print/Reprint per row, Excel export.
  - **Import** — upload Excel (EmpCode, EmpName, Company, Department), validate (missing values, code format, duplicates, companies without address), then delete old data and import in one transaction. Template download included.
  - **Settings** — coupon amount and per-company print address.
- Backend `/api/stall/*` routes against `[BBLive].[dbo].StallEmployeeMaster` (database configurable via `STALL_DB` in `.env`). Auto-creates `StallCompanyAddress`, `StallPrintLog` and `StallSettings` in that database.
- QR content matches the `StallPrintEmployeeQR` procedure (`EmpCode|EmpName|Company|Department|Amount|dd-mm-yyyy`) but is generated in the browser instead of api.qrserver.com. Reprints keep the original amount and print date.

## v2.6.0 — 2026-09-07

### Added
- **Interview Location field** on the candidate feedback form — a required dropdown (Attayampalayam, Thindal, Vilarasampatti) alongside Designation and Department.
  - Stored end-to-end: `types.ts` (`InterviewFeedback.branch`), `constants.ts` (`BRANCHES` list), MSSQL `hrfeedbacks.branch` column (auto-migrated for existing databases via `ALTER TABLE ... IF COL_LENGTH IS NULL`), and `schema.sql` reference schema.
  - Visible in the Admin Dashboard's entry list, detail modal, and Excel export.
- **Full required-field validation** on the feedback form:
  - Submit is no longer silently disabled — clicking it always runs validation and highlights every incomplete field in red with an inline bilingual (EN/TA) error message.
  - Applies to Candidate Name, Mobile Number, Designation, Department, Interview Location, Address, all 10 evaluation ratings, and the referral Yes/No choice.
  - A summary banner appears at the top of the form when fields are missing: "Please fill in all required fields highlighted below before submitting."
  - Errors clear live as each field is corrected.

### Changed
- `RatingInput` now accepts an `error` prop to show a red border and inline message when a question is left unanswered.

---

## Earlier history
See `git log` for changes prior to this changelog (Quiz Contest, Interviewer Questionnaire, UI updates, percentage-calculation fixes, etc.).
