# Queue Management System

## 🎯 Problem Solved

When doctors transmit prescriptions for patients from the queue, those patients should be removed from the queue display, and queue numbers should automatically adjust. Additionally, queue numbers should reset at midnight (00:01) for the new day.

## ✅ Solution Overview

### 1. Database Schema Updates
- **Added `queue_processed`** column to track if patient received prescription
- **Added `queue_processed_at`** column to track when patient was processed
- **Maintains original `queue_number`** for audit trail

### 2. Smart Queue Logic
- **Dynamic Queue Numbers:** Unprocessed patients get renumbered sequentially (1, 2, 3...)
- **Patient Removal:** Patients marked as processed are excluded from queue display
- **Automatic Renumbering:** When patient #1 leaves, patient #2 becomes #1, etc.

### 3. Prescription Integration
- **Automatic Processing:** When prescription is transmitted, patient is marked as processed
- **Real-time Updates:** Queue refreshes immediately after prescription
- **Callback System:** UI updates without page reload

### 4. Daily Reset System
- **Midnight Reset:** Queue numbers reset at 00:01 for new day
- **Clean Slate:** All `queue_processed` flags reset for fresh start
- **Admin API:** Manual reset available via `/api/admin/reset-queue`

## 🔄 Queue Behavior

### Before Prescription:
```
┌─────────────────────────────────┐
│ My Clinical Queue                │
├─────────────────────────────────┤
│ #1 John Doe     [10:00 AM]     │
│ #2 Jane Smith   [10:30 AM]     │
│ #3 Bob Johnson  [11:00 AM]     │
└─────────────────────────────────┘
```

### After Prescription for #1:
```
┌─────────────────────────────────┐
│ My Clinical Queue                │
├─────────────────────────────────┤
│ #1 Jane Smith   [10:30 AM]     │  ← Renumbered from #2
│ #2 Bob Johnson  [11:00 AM]     │  ← Renumbered from #3
└─────────────────────────────────┘
```

## 🎨 User Interface Changes

### Queue Display
- **Real-time Updates:** Queue refreshes automatically after prescriptions
- **Proper Renumbering:** Always shows sequential numbers starting from 1
- **Visual Feedback:** Smooth transitions when queue updates

### Prescription Flow
1. **Doctor selects patient** → Opens prescription sidebar
2. **Transmits prescription** → Patient automatically removed from queue
3. **Queue refreshes** → New patient becomes #1
4. **Seamless workflow** → No manual intervention needed

## 📊 Database Implementation

### Appointments Table Structure:
```sql
CREATE TABLE appointments (
  id INTEGER PRIMARY KEY,
  appointment_id VARCHAR(20) UNIQUE,
  patient_id VARCHAR(20),
  doctor_id INTEGER,
  appointment_date DATETIME,
  queue_number INTEGER,           -- Original queue number (audit)
  queue_processed BOOLEAN DEFAULT 0,  -- New: Track processing status
  queue_processed_at DATETIME,   -- New: When processed
  status VARCHAR(20),
  -- ... other fields
);
```

### Queue Query Logic:
```sql
SELECT a.*, 
       ROW_NUMBER() OVER (PARTITION BY doctor_id, date(appointment_date) 
                         ORDER BY appointment_date ASC) as display_queue_number
FROM appointments a
WHERE doctor_id = ? 
  AND date(appointment_date) = date('now')
  AND queue_processed = 0  -- Only unprocessed patients
ORDER BY appointment_date ASC;
```

## 🚀 API Endpoints

### Enhanced Appointments API
- **GET `/api/appointments?doctor_id={id}`**
  - Returns only unprocessed patients for doctors
  - Includes renumbered queue positions
  - Maintains original queue numbers for audit

### Enhanced Prescriptions API
- **POST `/api/prescriptions`**
  - Creates prescription as before
  - **NEW:** Automatically marks patient as processed in queue
  - **NEW:** Removes patient from active queue display

### Queue Reset API
- **POST `/api/admin/reset-queue`**
  - Resets all queue_processed flags for new day
  - Recalculates queue numbers
  - Designed for midnight automation

## 🔄 Daily Reset Process

### At 00:01 (12:01 AM):
1. **Reset Processing Flags:** `queue_processed = 0` for all appointments
2. **Clear Timestamps:** `queue_processed_at = NULL`
3. **Recalculate Queue Numbers:** Sequential numbering by doctor
4. **Fresh Start:** Ready for new day's appointments

### Automation Options:
- **Cron Job:** `1 0 * * * curl -X POST http://localhost:3000/api/admin/reset-queue`
- **Scheduled Task:** Windows Task Scheduler or equivalent
- **Manual Reset:** Admin interface for manual control

## 🛡️ Data Integrity

### Audit Trail:
- **Original Queue Numbers:** Preserved in `queue_number` field
- **Processing History:** `queue_processed_at` timestamps
- **Complete Records:** All appointments remain in database

### Safety Features:
- **Non-destructive:** No data deleted, only flags updated
- **Rollback Capability:** Can undo processing if needed
- **Error Handling:** Prescription succeeds even if queue update fails

## 📁 Files Modified/Created

### Database Migration:
- `database/add-queue-management.js` - Adds queue management fields

### API Enhancements:
- `pages/api/appointments/index.js` - Smart queue filtering and renumbering
- `pages/api/prescriptions.js` - Auto-mark patients as processed
- `pages/api/admin/reset-queue.js` - Daily queue reset functionality

### UI Updates:
- `components/DoctorRxSidebar.tsx` - Added callback for queue refresh
- `components/Layout.tsx` - Pass callback through component hierarchy
- `pages/appointments/index.tsx` - Queue refresh on prescription transmit

### Testing:
- `test-queue-management.js` - Comprehensive queue management tests

## 🎯 Key Benefits

### ✅ **Automatic Queue Management**
- No manual queue adjustments needed
- Patients disappear automatically after prescriptions
- Queue numbers always start from 1

### ✅ **Real-time Updates**
- Queue refreshes instantly when prescriptions transmitted
- No page reloads required
- Smooth user experience

### ✅ **Daily Reset Capability**
- Fresh start each day at 00:01
- Configurable reset timing
- Manual override available

### ✅ **Data Integrity**
- Complete audit trail maintained
- Original queue numbers preserved
- Processing history tracked

### ✅ **Scalable Design**
- Works for multiple doctors simultaneously
- Handles high patient volumes
- Efficient database queries

## 🎉 Result

The queue management system now provides:
- ✅ **Automatic patient removal** when prescriptions are transmitted
- ✅ **Dynamic queue renumbering** (1, 2, 3...)
- ✅ **Midnight reset** for fresh daily queues
- ✅ **Real-time UI updates** without page reloads
- ✅ **Complete audit trail** for compliance and reporting

Doctors can now focus on patient care while the queue system automatically manages patient flow and numbering!
