# 🔄 Inter-Server Communication System

## 🏥 Hospital ↔ 🏢 Company Data Exchange

### **Purpose:**
Enable secure data sharing between hospital and company servers while maintaining maximum security and data integrity.

---

## 🔄 Workflow Scenarios

### **Scenario 1: Hospital → Company (Medical Reports)**
**Use Case:** Doctor creates medical reports → Sends to company for analysis/insurance

#### **Hospital Server Actions:**
1. **Doctor** creates medical reports for patients
2. **Select reports** to send to company/insurance
3. **Click "Send to Company"** → Data encrypted and transmitted
4. **Automatic save** of sent reports on hospital server
5. **Company server** receives, decrypts, and saves securely

#### **Code Example:**
```javascript
// Send medical reports to company
await interServerClient.sendMedicalReports([1, 2, 3], 'insurance');
```

---

### **Scenario 2: Company → Hospital (Admin Updates)**
**Use Case:** Admin sends system updates → Hospital receives and applies

#### **Company Server Actions:**
1. **Admin** creates system updates
2. **Select target role** (Doctor/Reception)
3. **Click "Send Updates"** → Data encrypted and transmitted
4. **Hospital server** receives, decrypts, and saves securely
5. **Automatic backup** of received updates

#### **Code Example:**
```javascript
// Send admin updates to hospital
await interServerClient.sendAdminUpdates('system-update', updateData, 'doctor');
```

---

## 🔒 Security Features

### **1. End-to-End Encryption:**
- **AES-256 encryption** for all inter-server data
- **Unique encryption keys** per server deployment
- **Checksum verification** for data integrity
- **Secure key management** via environment variables

### **2. API Authentication:**
- **API key validation** for all requests
- **Server-specific keys** prevent unauthorized access
- **Request signing** with timestamps
- **IP whitelisting** capabilities

### **3. Data Integrity:**
- **SHA-256 checksums** for all transmitted data
- **Automatic verification** on receipt
- **Tamper detection** with rejection alerts
- **Audit logging** of all transmissions

### **4. Secure Storage:**
- **Encrypted local storage** of received data
- **Timestamped filenames** for organization
- **Access control** for received files
- **Automatic cleanup** of old data

---

## 📁 File Structure

### **Received Data Storage:**
```
secure-data-received/
├── medical-reports-hospital-2024-02-06T10-30-00-000Z.json
├── admin-updates-company-2024-02-06T11-15-00-000Z.json
└── system-settings-company-2024-02-06T14-20-00-000Z.json
```

### **Data Format:**
```json
{
  "type": "medical-reports",
  "source": "hospital",
  "timestamp": "2024-02-06T10:30:00.000Z",
  "data": {
    "reports": [...],
    "sentBy": "Hospital Server"
  },
  "checksum": "sha256-hash-here"
}
```

---

## 🚀 Implementation Guide

### **Setup Environment Variables:**
```bash
# Hospital Server
export HOSPITAL_PORT=3001
export HOSPITAL_API_KEY="hospital-secure-key-2024"

# Company Server  
export COMPANY_PORT=3002
export COMPANY_API_KEY="company-secure-key-2024"

# Inter-Server Communication
export INTER_SERVER_KEY="med-records-inter-server-encryption-2024"
```

### **Start Both Servers:**
```bash
# Terminal 1 - Hospital Server
cd hospital-server
npm start

# Terminal 2 - Company Server
cd company-server  
npm start
```

---

## 🎯 Benefits Achieved

### **1. Secure Data Exchange:**
- **Encrypted transmission** prevents interception
- **Integrity verification** prevents tampering
- **Authentication** prevents unauthorized access
- **Audit trails** for compliance

### **2. Operational Efficiency:**
- **Real-time data sharing** between servers
- **Automatic backups** of all transmissions
- **File organization** with timestamps
- **Cross-server collaboration**

### **3. Compliance & Security:**
- **HIPAA compliance** for medical data
- **Data separation** maintained
- **Access logging** for all operations
- **Secure key management**

---

## 🧪 Testing the System

### **Test Hospital → Company:**
1. Start hospital server (port 3001)
2. Start company server (port 3002)
3. Login as doctor on hospital server
4. Create medical report
5. Send to company server
6. Verify receipt on company server

### **Test Company → Hospital:**
1. Start both servers
2. Login as admin on company server
3. Create system update
4. Send to hospital server
5. Verify receipt on hospital server

---

**🎯 This system enables secure, efficient data sharing between your hospital and company servers while maintaining maximum security!**
