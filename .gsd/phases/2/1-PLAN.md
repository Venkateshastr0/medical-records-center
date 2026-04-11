---
phase: 2
plan: 1
wave: 1
---

# Plan 2.1: Electron Mode Switching & Configuration

## Objective
Implement a configuration-driven mechanism in the Electron main process to switch between "Server Mode" (Admin) and "Client Mode" (Staff).

## Context
- .gsd/SPEC.md
- main.js
- server/index.js

## Tasks

<task type="auto">
  <name>Implement config.json support in main.js</name>
  <files>main.js, config.json</files>
  <action>
    - Add logic to read `config.json` at startup.
    - If `config.json` doesn't exist, default to "Server Mode" (localhost:3000).
    - If `serverAddress` is present in `config.json`, switch to "Client Mode": skip `startServer()` and load the provided IP.
    - Use `fs.readFileSync` for a blocking read before the window is created.
  </action>
  <verify>Run the app with and without `config.json` and check console logs for server startup status.</verify>
  <done>App skips server startup when `serverAddress` is configured.</done>
</task>

<task type="auto">
  <name>Enhance Server IP Discovery</name>
  <files>server/index.js</files>
  <action>
    - Ensure the server logs the exact LAN IP in a formatted banner upon startup.
    - This informs the Admin which IP to provide to the Staff.
  </action>
  <verify>Start the server and observe the console for the "Network access on http://..." log.</verify>
  <done>Server logs the current LAN IP clearly in the terminal.</done>
</task>

## Success Criteria
- [ ] Admin machine starts local server and loads localhost.
- [ ] Client machine (with config) skips local server and loads remote IP.
