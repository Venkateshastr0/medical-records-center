# Project Roadmap

## Phases

### Phase 1: Realistic Dataset Completion [FINISHED]
- **Goal:** Generate 60,000+ records with realistic demographics and diseases.
- **Outcome:** Script `realistic-data-generator.js` created and executed.

### Phase 2: LAN Client-Server Transition [SKIPPED]
- **Goal:** Enable multi-user access over LAN.
- **Tasks:**
    - [x] Update `main.js` for Mode Switching. (Replaced by Tauri)
    - [x] Implement `config.json` support. (Replaced by Next.js env)
    - [x] Enhance server startup logs with LAN IP. 
    - [x] Verify cross-device connectivity.

### Phase 4: Next.js Migration (Pivot) [FINISHED]
- **Goal:** Move entire stack to Next.js for high-fidelity performance.
- **Tasks:**
    - [x] Setup Next.js Pages Router Structure.
    - [x] Port Zero-Trust Middleware.
    - [x] Implement Unified Dashboard (React).
    - [x] Migrate SQLite API Layer.
- [x] All phases complete.
- [x] Multi-user verification documented.
- [x] HIPAA compliance validated in LAN mode.
