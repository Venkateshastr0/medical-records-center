# 👩‍⚕️ Nurse Operations Guide - Medical Records Management

## Quick Start for Nurses

### Adding a New Patient

**Step 1**: Go to `/patients/add` (Click "Add Patient" button)

**Step 2**: Fill in required fields:
- ✓ First Name
- ✓ Last Name
- ✓ Date of Birth
- ✓ Gender (Male/Female/Other)

**Step 3**: Fill recommended fields:
- Phone number
- Email address
- Blood type
- Allergies
- Medical history

**Step 4**: Click "Create Patient"

**What gets saved**:
- Patient ID auto-generated (PAT-XXXXX)
- All details in database
- Patient appears in Patient Management immediately

---

## Managing Patient Information

### Viewing Patient Details

**Steps**:
1. Go to `/patients` (Patient Management)
2. Search or scroll to find patient
3. Click on patient name
4. See complete profile with:
   - Basic info (age, contact, insurance)
   - Medical history
   - Recent medical records
   - Appointments
   - Prescriptions
   - Lab results

### Editing Patient Details

**Steps**:
1. Open patient profile
2. Click "Edit" button (pencil icon)
3. Update any information:
   - Phone, email, address
   - Blood type, allergies
   - Medical history
   - Emergency contact
   - Insurance info
4. Click "Save"

**What you CAN edit**:
- Contact information
- Medical details
- Emergency contact
- Insurance information

**What you CANNOT change**:
- Patient ID (auto-generated)
- First/Last Name (ask doctor)
- Date of Birth (ask doctor)

---

## Managing Appointments

### Scheduling an Appointment

**For a Patient**:
1. Open patient profile
2. Go to "Appointments" tab
3. Click "+ Schedule Appointment"
4. Fill in:
   - Select doctor (from dropdown)
   - Appointment date & time
   - Type: Routine Checkup, Follow-up, Urgent Care, etc.
   - Duration: 15, 30, 45, 60 minutes
   - Notes (optional)
5. Click "Schedule"

**What happens**:
- Appointment ID auto-generated (APP-XXXXX)
- Queue number assigned (1, 2, 3... based on time)
- Doctor gets notified
- Appears on Doctor's schedule

### Updating Appointment Status

**Statuses**:
- **Scheduled**: Initial state when booked
- **Confirmed**: Patient confirmed attendance
- **Completed**: Appointment happened
- **Cancelled**: Appointment cancelled
- **No-Show**: Patient didn't show up

**To Update**:
1. Find appointment in calendar/list
2. Click appointment
3. Change status from dropdown
4. Save

---

## Taking Triage Vitals

When patient arrives for appointment, record vitals:

```
Blood Pressure: 120/80 mmHg
Heart Rate: 72 bpm
Temperature: 98.6°F
Weight: 70 kg
Blood Sugar: 100 mg/dL
```

**To Record**:
1. Open patient appointment
2. Click "Add Vitals"
3. Enter each measurement
4. Save

Doctor will see vitals in their consultation view.

---

## Common Nurse Tasks

### Task 1: Check Daily Appointments

```sql
-- Using the database tool:
node run-sql.js "SELECT a.queue_number, p.first_name || ' ' || p.last_name as patient, 
a.appointment_type FROM appointments a 
JOIN patients p ON a.patient_id = p.patient_id 
WHERE date(a.appointment_date) = date('now') 
ORDER BY a.queue_number"
```

### Task 2: Find Patient by Name

**Using GUI**: 
1. Go to Patient Management
2. Type name in search box
3. Results appear instantly

**Using Database**:
```bash
node run-sql.js "SELECT patient_id, first_name, last_name, phone, email FROM patients 
WHERE first_name LIKE '%John%' OR last_name LIKE '%Doe%'"
```

### Task 3: Check Patient Allergies & Medical History

**Using GUI**:
1. Open patient → See allergies prominently displayed
2. Click "Medical History" section

**Using Database**:
```bash
node run-sql.js "SELECT first_name, last_name, allergies, medical_history FROM patients 
WHERE patient_id = 'PAT-000001'"
```

### Task 4: Manage Insurance Information

**Update Insurance**:
1. Open patient → Edit
2. Scroll to "Insurance" section
3. Update:
   - Insurance Provider
   - Policy Number
4. Save

**Find by Insurance**:
```bash
node run-sql.js "SELECT patient_id, first_name, last_name, insurance_provider, 
insurance_policy_number FROM patients WHERE insurance_provider LIKE '%Blue%'"
```

---

## Database Operations for Nurses

### View All Your Patients

```bash
node run-sql.js "SELECT patient_id, first_name, last_name, date_of_birth, gender, 
phone FROM patients ORDER BY created_at DESC LIMIT 20"
```

### Get Patient Statistics

```bash
node run-sql.js "SELECT 
COUNT(*) as total_patients,
COUNT(CASE WHEN gender = 'Male' THEN 1 END) as male,
COUNT(CASE WHEN gender = 'Female' THEN 1 END) as female,
COUNT(CASE WHEN allergies IS NOT NULL THEN 1 END) as has_allergies
FROM patients"
```

### Find Patients with Specific Allergies

```bash
node run-sql.js "SELECT patient_id, first_name, last_name, allergies FROM patients 
WHERE allergies IS NOT NULL AND allergies != '' LIMIT 20"
```

### Get Upcoming Appointments (Next 7 Days)

```bash
node run-sql.js "SELECT 
a.queue_number,
p.first_name || ' ' || p.last_name as patient_name,
a.appointment_date,
a.appointment_type,
a.status
FROM appointments a
JOIN patients p ON a.patient_id = p.patient_id
WHERE date(a.appointment_date) >= date('now')
AND date(a.appointment_date) <= date('now', '+7 days')
ORDER BY a.appointment_date ASC"
```

---

## Emergency Contact Management

When adding/editing patient:

1. **Emergency Contact Name**: Full name (e.g., "John Smith")
2. **Emergency Contact Phone**: 10-digit number (e.g., "9876543210")

**View Emergency Contacts**:
```bash
node run-sql.js "SELECT first_name, last_name, phone, emergency_contact_name, 
emergency_contact_phone FROM patients WHERE emergency_contact_name IS NOT NULL"
```

---

## Common Errors & Solutions

### Error: "Patient not found"
- **Cause**: Wrong patient ID (must be PAT-XXXXX)
- **Solution**: Use search feature instead, or verify patient ID
- **Database Check**: `node run-sql.js "SELECT patient_id FROM patients LIMIT 5"`

### Error: "Cannot create appointment - Doctor not found"
- **Cause**: Doctor not assigned to appointment or Doctor ID wrong
- **Solution**: 
  1. Verify doctor exists: `node run-sql.js "SELECT id, first_name, last_name FROM users WHERE role = 'doctor'"`
  2. Try selecting from dropdown instead of manual entry

### Error: "Failed to update patient"
- **Cause**: Database error, usually from invalid data
- **Solution**: 
  1. Check all required fields filled
  2. Check email format if entered
  3. Check phone is valid format

### Appointment not showing in schedule
- **Cause**: Wrong date, or appointment cancelled
- **Solution**: 
  1. Use calendar to verify appointment date
  2. Check status isn't "Cancelled"

---

## Tips & Best Practices

### ✓ DO:
- Record patient data accurately (used for medical records)
- Update patient contact info when they inform you
- Set appointment notes with chief complaint
- Record vitals at time of visit
- Check allergies BEFORE treatment
- Confirm appointment details before doctor sees patient

### ✗ DON'T:
- Create duplicate patient records (search first)
- Edit critical fields without doctor approval
- Delete patient records (permanently removes history)
- Schedule appointments without confirming available time with doctor
- Leave appointment notes empty

---

## Quick Reference Card

| Task | Location | Short Command |
|------|----------|---------------|
| Add Patient | `/patients/add` | `Form based` |
| Edit Patient | Patient profile | Click "Edit" |
| Schedule Appointment | Patient → Appointments | Click "+ Schedule" |
| View All Patients | `/patients` | Search/scroll |
| Check Today's Appointments | Calendar view | Filter by date |
| Record Vitals | Appointment detail | Click "Add Vitals" |

---

## System Capabilities

### ✅ What Nurses Can Do:
- ✓ Add new patients
- ✓ Edit patient demographics & medical info
- ✓ Schedule appointments
- ✓ Record vital signs
- ✓ View patient history
- ✓ Manage emergency contacts
- ✓ Update insurance information

### ❌ What Nurses Cannot Do:
- ✗ Create medical records (Doctor only)
- ✗ Write prescriptions (Doctor/Pharmacist only)
- ✗ View security logs
- ✗ Delete patients (System Admin only)
- ✗ Create user accounts

---

## Support

For database/SQL help:
```bash
# Navigate to src-next folder
cd C:\Projects\medical-records-center\src-next

# Run any SQL command
node run-sql.js "YOUR SQL HERE"

# Run test data
node test-patient-creation.js
```

Welcome to the Medical Records Center! 👋
