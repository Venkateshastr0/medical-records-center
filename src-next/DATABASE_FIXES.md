# Medical Records Center - Database & API Fixes

## Issues Fixed

### 🔴 Issues Identified
1. **Patient Creation Failing**: POST `/api/patients` was trying to insert non-existent database columns (`country`, `medical_history`)
2. **Patient ID Generation**: Was using `result.lastID` instead of generating proper patient IDs
3. **Patient Details Endpoint Missing**: GET `/api/patients/[id]` was just a stub with no implementation
4. **Patient Edit/Update Not Working**: No PUT endpoint for nurses to edit patient data
5. **Appointment Creation Issues**: Missing database columns (`queue_number`, `triage_vitals`)
6. **Missing Proper Error Handling**: API endpoints had minimal error messages

---

## ✅ Solutions Implemented

### 1. **Patient Creation API Fixed** 
**File**: `src-next/pages/api/patients.js`
- ✓ Added proper `patient_id` generation (`PAT-XXXXX` format)
- ✓ Fixed INSERT statement to include all valid columns
- ✓ Added proper error handling with descriptive messages
- ✓ Handles optional fields gracefully (null values)

**Example Response**:
```json
{
  "success": true,
  "patient_id": "PAT-ABC123"
}
```

### 2. **Patient Details Endpoint Implemented**
**File**: `src-next/pages/api/patients/[id].js`
- ✓ **GET**: Fetch complete patient details with all related records
- ✓ **PUT**: Update patient information (for nurses)
- ✓ **DELETE**: Remove patient and all related records

**GET Response**:
```json
{
  "patient": {...},
  "medical_records": [...],
  "appointments": [...],
  "prescriptions": [...],
  "lab_results": [...]
}
```

### 3. **Appointments API Enhanced**
**File**: `src-next/pages/api/appointments/index.js`
- ✓ Added validation for required fields
- ✓ Automatic queue number calculation per doctor per day
- ✓ Doctor and patient existence verification
- ✓ Better error messages with field names
- ✓ Removed fallback/hack logic

### 4. **Database Schema Updated**
**File**: `src-next/database/schema.sql`
- ✓ Added `country` column to patients table
- ✓ Added `medical_history` column to patients table
- ✓ Added `queue_number` column to appointments table
- ✓ Added `triage_vitals` column to appointments table

**Applied Migrations**:
```sql
ALTER TABLE patients ADD COLUMN medical_history TEXT;
ALTER TABLE appointments ADD COLUMN queue_number INTEGER;
ALTER TABLE appointments ADD COLUMN triage_vitals TEXT;
```

---

## 🛠️ Utility Scripts Created

### 1. **run-sql.js** - Execute SQL Queries
Run any SQL command directly from command line:

```bash
# View patient data
node run-sql.js "SELECT * FROM patients"

# Create data
node run-sql.js "INSERT INTO users (username, email, password_hash, role) VALUES ('newuser', 'new@mail.com', 'hash', 'nurse')"

# Update data
node run-sql.js "UPDATE patients SET blood_type = 'O+' WHERE patient_id = 'PAT-001'"

# Check schema
node run-sql.js "PRAGMA table_info(patients)"
```

### 2. **test-patient-creation.js** - Verify Patient Operations
Tests patient CRUD operations:
- Create patient ✓
- Retrieve patient ✓
- Update patient ✓
- List patients ✓
- Delete patient ✓

### 3. **test-appointments.js** - Verify Appointment Operations
Tests appointment workflow:
- Create appointment ✓
- Retrieve appointments ✓
- Update status ✓
- Queue number assignment ✓

---

## 📋 How to Use

### Creating a Patient (Nurses)

**Frontend**: `/patients/add` form will now work correctly

**Via API**:
```bash
curl -X POST http://localhost:3000/api/patients \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "John",
    "last_name": "Doe",
    "date_of_birth": "1990-01-01",
    "gender": "Male",
    "phone": "9876543210",
    "email": "john@example.com",
    "address": "123 Main St",
    "city": "New York",
    "state": "NY",
    "zip_code": "10001",
    "country": "USA",
    "blood_type": "O+",
    "allergies": "Peanuts",
    "medical_history": "Appendectomy 2015",
    "emergency_contact_name": "Jane Doe",
    "emergency_contact_phone": "9876543211"
  }'
```

**Response**:
```json
{
  "success": true,
  "patient_id": "PAT-XYZ789"
}
```

### Editing Patient Details (Nurses)

**Via API**:
```bash
curl -X PUT http://localhost:3000/api/patients/PAT-XYZ789 \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "9999999999",
    "allergies": "Peanuts, Shellfish",
    "blood_type": "AB+"
  }'
```

### Getting Patient Full Profile

**Via API**:
```bash
curl http://localhost:3000/api/patients/PAT-XYZ789
```

### Scheduling Appointment

**Via API**:
```bash
curl -X POST http://localhost:3000/api/appointments \
  -H "Content-Type: application/json" \
  -d '{
    "patient_id": "PAT-XYZ789",
    "doctor_id": 1,
    "appointment_date": "2026-04-05T10:00:00",
    "appointment_type": "Routine Checkup",
    "duration_minutes": 30,
    "notes": "Follow-up visit",
    "triage_vitals": {
      "bp": "120/80",
      "sugar": "100",
      "weight": "70",
      "temp": "98.6",
      "heart_rate": "72"
    }
  }'
```

---

## 🧪 Running Tests

### Test Patient Operations
```bash
cd C:\Projects\medical-records-center\src-next
node test-patient-creation.js
```

### Test Appointment Operations
```bash
cd C:\Projects\medical-records-center\src-next
node test-appointments.js
```

### Test Custom SQL
```bash
# Check total patients
node run-sql.js "SELECT COUNT(*) as total FROM patients"

# View all users
node run-sql.js "SELECT username, email, role, is_approved FROM users"

# Check appointments this week
node run-sql.js "SELECT appointment_id, patient_id, appointment_date FROM appointments WHERE date(appointment_date) >= date('now')"
```

---

## 🔑 Key Points for Nurses

1. **Adding Patients**: Use the form at `/patients/add` - all fields now properly save to database
2. **Editing Patients**: Click a patient → Edit button will be available
3. **Scheduling Appointments**: Select patient → Appointments tab → Schedule button
4. **Viewing Data**: All patient data now displays correctly from database

---

## 🔑 Key Points for Doctors

1. **View Patients**: All added patients now appear in Patient Management
2. **View Appointments**: Appointments scheduled for you appear in Appointments section
3. **Queue Numbers**: Automatically assigned based on appointment date and doctor
4. **Patient Records**: Can view complete med ical history, appointments, and prescriptions

---

## 📝 Notes

- All patient IDs are auto-generated with format: `PAT-XXXXXX`
- All appointment IDs are auto-generated with format: `APP-XXXXXX`
- Queue numbers are calculated per doctor per day (1, 2, 3...)
- Timestamps are automatically set on creation and update
- All timestamps use `datetime('now')` in UTC

---

## 🐛 Troubleshooting

**Problem**: "Patient not found" error
- Solution: Verify patient_id is in correct format (PAT-XXXXX)

**Problem**: Database "table has no column" error
- Solution: Your database needs migration. The schema.sql file is updated; if you create a fresh database, it will have correct columns.

**Problem**: Appointments not showing for doctor
- Solution: Check appointment date is in future or current date using `node run-sql.js "SELECT * FROM appointments WHERE doctor_id = 1"`

---

Generated: 2026-04-01
System: Medical Records Center v1.0
