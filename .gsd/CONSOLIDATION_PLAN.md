# Implementation Plan — Codebase Consolidation & Hygiene

## Goal
Reduce codebase complexity and cognitive load by archiving legacy folders, consolidating documentation, and preparing a lean structure for the Next.js/Tauri migration.

## Proposed Changes

### [Component] Legacy Archival
- [NEW] Create `legacy/` directory.
- [MOVE] Move all C# project folders (`MedicalRecordsCenter`, `MedicalRecordsCenter.Data`, `MedicalRecordsCenter.Security`) to `legacy/`.
- [MOVE] Move redundant standalone servers (`company-server`, `hospital-server`, `dev-server`) to `legacy/`.
- [MOVE] Move outdated configuration/sln files (`MedicalRecordsCenter.sln`) to `legacy/`.

### [Component] Documentation Consolidation
- [MOVE] Move all root-level security validation files (e.g., `ZERO-TRUST-ARCHITECTURE-VALIDATION.md`, `USER-ROLES-PERMISSIONS-VALIDATION.md`) to a new `docs/validation/` directory.
- [MOVE] Move architectural guides (`SIP-SECURITY-ARCHITECTURE.md`, `MAXIMUM-SECURITY-GUIDE.md`) to `docs/architecture/`.

### [Component] Root Cleanup
- [DELETE/ARCHIVE] Remove one-off test files (`test-messenger.html`, `test-password-reset.html`, `test-registration.html`) or move to `legacy/tests/`.
- [DELETE/ARCHIVE] Remove temporary scripts (`convert-icon.js`) once documented.

## Verification Plan

### Manual Verification
1. Verify that the core Electron application still runs (`npm start`) after moves.
2. Ensure all documentation links are updated or reasonably accessible in their new homes.
3. Confirm that the root directory is now clean, showing only the active project folders (`client`, `server`, `assets`, `.gsd`).
