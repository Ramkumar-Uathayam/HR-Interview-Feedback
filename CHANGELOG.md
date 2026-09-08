# Changelog

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
