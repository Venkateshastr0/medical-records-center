# Software Requirements Specification (SRS) — MRC Next.js Migration

## 1. Introduction
### 1.1 Purpose
This document specifies the requirements for migrating the Medical Records Center (MRC) from an Electron/Express architecture to a unified **Next.js** web application wrapped in **Tauri**. The goal is to maintain high security (Zero-Trust) and local-first data residency while improving scalability and ease of deployment.

### 1.2 Scope
The application will serve as a central medical data hub ("Service Server") accessible by authenticated clients ("Staff") over a Local Area Network (LAN). The Admin will use a native **Tauri** application on the host laptop, while Staff access the service via web browsers on the LAN.

---

## 2. Functional Requirements

### 2.1 Core Clinical Modules
- **F-1: Patient Management**: CRUD operations for 1,000+ patient records with historical data tracking.
- **F-2: Clinical Documentation**: Support for medical encounters, prescriptions, and lab result entry.
- **F-3: Secure Messenger**: Real-time WebSocket-based messaging between user roles.
- **F-4: Audit Engine**: Automated, tamper-evident logging of all PHI access and modifications.

### 2.2 Role-Based Access Control (RBAC)
Support for 7 distinct roles with hierarchical permissions:
- **Doctor**: Clinical entry/view for assigned hospitals.
- **Receptionist**: Registration and queue management.
- **Admin**: System configuration and user management via the Tauri host app.
- **Team Lead/Analyst/Production**: Data analysis and processing workflows (SIP).
- **Developer**: System maintenance and debugging.

### 2.3 Managed Service Model
- **Centralized Database**: A single Next.js/SQLite instance on the Admin laptop hosts the data.
- **Tauri Wrapper**: Provides native system integration for the Admin (tray icons, system-level security).
- **LAN Accessibility**: Other machines connect via IP/Hostname to the Next.js server.

---

## 3. Non-Functional Requirements

### 3.1 Security (Zero-Trust Framework)
- **Authentication**: JWT-based session management with MFA support.
- **Identity & Device Trust**: Fingerprinting and trust-score calculation per request.
- **Network Trust**: IP-based reputation and VPN detection.
- **At-Rest Encryption**: SQLite field-level encryption (AES-256) for all PII/PHI.

### 3.2 Performance & Scalability
- **Lightweight Payload**: Tauri bundle size (<10MB) vs Electron (>100MB).
- **Data Load**: Handle 60,000+ active records with sub-second query times.
- **Concurrent Users**: Support up to 50 simultaneous LAN clients.

### 3.3 Compliance
- **HIPAA**: Full audit trail, access controls, and data protection at rest/in transit.

---

## 4. Technical Migration Requirements
- **Frontend**: Next.js (App Router) + React.
- **Native Layer**: Tauri v2 for OS-level integration.
- **Backend API**: Next.js API Routes (Node.js runtime).
- **State Management**: React Context/Hooks + Socket.io.
- **Styling**: Tailwind CSS + GSD Design System.
