# Implementation Plan — Tauri + Next.js Migration

## Goal
Migrate the MRC project to a unified **Next.js** architecture wrapped in **Tauri** to provide a high-performance "Laptop as Server" service model.

## Proposed Changes

### [Component] Tauri & Next.js Scaffold
- [NEW] Initialize Tauri v2 in the project root.
- [NEW] Setup Next.js App Router structure (`app/` directory).
- [NEW] Configure Tauri for "App Path" and native API access.

### [Component] Unified API Layer
- [NEW] Migrate Express routes to Next.js API Routes (Serverless/Node).
- [MODIFY] Update `server/db/database.js` to be compatible with Next.js runtime.
- [NEW] Implement Next.js Middleware for Zero-Trust verification.

### [Component] Native System Integration
- [NEW] Implement Tauri plugin for database encryption/decryption in Rust (optional for performance).
- [NEW] Setup Tauri system tray for "Server Monitoring" status.

### [Component] Real-time Messaging
- [MODIFY] Integrate Socket.io with Next.js custom server or standalone service accessible by Tauri and LAN clients.

## Verification Plan

### Automated Tests
- Run `npm run tauri build` to verify native compilation.
- Execute API unit tests for CRUD operations.

### Manual Verification
1.  Verify Admin login on the **Tauri App**.
2.  Verify Staff login from a separate machine over LAN using a browser.
3.  Verify 60,000+ records load within the React-based UI.
