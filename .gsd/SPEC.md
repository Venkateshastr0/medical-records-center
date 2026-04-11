# Specification — LAN Client-Server Access

**Status: FINALIZED**

## Overview

The Medical Records Center application must support a multi-user environment where a single "Admin" laptop (the Server) hosts the central database, while other machines (the Clients) access this data over a Local Area Network (LAN). This enables a service-based business model for the medical company.

## Requirements

### R1: Centralized Data Hosting
- The Admin's laptop will act as the single source of truth for the SQLite database.
- The Express server on the Admin machine must listen on all network interfaces (`0.0.0.0`).

### R2: Mode Switching (Server vs. Client)
- The Electron application must be configurable to run in either "Server Mode" or "Client Mode".
- **Server Mode (Admin)**: Starts the local Express/Node.js process and loads `http://localhost:3000`.
- **Client Mode (Staff)**: Skips starting the local Express process and loads `http://{ADMIN_IP}:3000`.

### R3: Network Discovery
- Upon startup in Server Mode, the application must display its LAN IP address to the Admin so they can share it with other users.

### R4: Configuration Persistence
- Mode and Server IP must be stored in a local configuration file (`config.json` or similar) to survive app restarts.

## Constraints
- **Zero-Trust**: All LAN communication must still adhere to the system's security tokens and identity verification.
- **Privacy**: No external cloud storage; data must remain strictly on the Admin's laptop.

## Success Criteria
- [ ] Admin starts app; it says "Listening on 192.168.1.XX".
- [ ] Another machine starts app with Admin's IP; it successfully connects and loads the dashboard.
- [ ] Data created on the Client machine is visible on the Admin machine in real-time.
