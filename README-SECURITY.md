# 🔒 Medical Records Center - Secure Multi-Server Architecture

## 🏥 Hospital Server (Port 3001)
**Purpose:** Medical Operations & Patient Management
**Network:** Internal Hospital Network
**Users:** Doctor, Hospital Reception

### Access:
- **URL:** `http://localhost:3001`
- **Credentials:**
  - Doctor: `doctor` / `doctor123`
  - Reception: `reception` / `reception123`

### Features:
- ✅ Patient registration & management
- ✅ Medical report creation
- ✅ External reporting to companies
- ✅ HIPAA compliance logging
- ✅ Medical record access control

---

## 🏢 Company Server (Port 3002)
**Purpose:** Administrative Operations & System Management
**Network:** Corporate Network with VPN
**Users:** Admin, Team Lead, Analyst, Production

### Access:
- **URL:** `http://localhost:3002`
- **Credentials:**
  - Admin: `admin` / `admin123`
  - Team Lead: `teamlead` / `teamlead123`
  - Analyst: `analyst` / `analyst123`
  - Production: `production` / `production123`

### Features:
- ✅ User management & permissions
- ✅ System administration
- ✅ Data analysis & reporting
- ✅ Production deployment
- ✅ Audit log management

---

## 🛠️ Development Server (Port 3003)
**Purpose:** Code Development & System Updates
**Network:** Isolated Development Environment
**Users:** Developer

### Access:
- **URL:** `http://localhost:3003`
- **Credentials:**
  - Developer: `astro` / `dev123456`

### Features:
- ✅ Code deployment & updates
- ✅ System configuration
- ✅ Development database access
- ✅ Code signing requirements
- ✅ Isolated testing environment

---

## 🔒 Security Benefits

### 1. **Network Segmentation**
- **Breach Containment:** One server compromise doesn't affect others
- **Access Control:** Users only access relevant data
- **Traffic Monitoring:** Each network monitored separately

### 2. **Data Separation**
- **Medical Data:** Stays in hospital server
- **Administrative Data:** Stays in company server
- **Development Data:** Stays in dev server
- **Compliance Alignment:** Industry-specific regulations

### 3. **Access Control**
- **Physical Security:** Different server locations
- **Network Security:** Separate network segments
- **Authentication:** Role-based access per server
- **Authorization:** Minimum necessary permissions

### 4. **Compliance & Auditing**
- **HIPAA Compliance:** Medical data protection
- **Audit Trails:** Separate logs per server
- **Regulatory Alignment:** Industry standards
- **Data Retention:** Appropriate per data type

---

## 🚀 Quick Start Commands

### Start Hospital Server:
```bash
cd hospital-server
npm install
npm start
```

### Start Company Server:
```bash
cd company-server
npm install
npm start
```

### Start Development Server:
```bash
cd dev-server
npm install
npm start
```

---

## 📊 Server Architecture Overview

```
Medical Records Center
├── hospital-server/     (Port 3001)
│   ├── Doctor          (Medical Operations)
│   └── Reception      (Patient Management)
├── company-server/     (Port 3002)
│   ├── Admin           (System Administration)
│   ├── Team Lead       (Department Management)
│   ├── Analyst         (Data Analysis)
│   └── Production      (Deployment)
└── dev-server/        (Port 3003)
    └── Developer       (Code & Updates)
```

---

## 🔐 Security Best Practices Implemented

1. **Multi-Server Architecture** - Physical and logical separation
2. **Role-Based Access** - Users only access relevant data
3. **Network Isolation** - Separate network segments
4. **Compliance Logging** - HIPAA and industry standards
5. **Audit Trails** - Comprehensive activity tracking
6. **Data Encryption** - All sensitive data protected
7. **Access Monitoring** - Real-time threat detection
8. **Backup Systems** - Per-server backup strategies

---

**🎯 This architecture provides maximum security while maintaining operational efficiency!**
