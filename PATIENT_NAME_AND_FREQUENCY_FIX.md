# Patient Name & Frequency Display Fix - Complete Guide

## What Was Fixed ✅

### 1. **Patient Name Showing as "Unknown Patient"**
**Root Cause:** The patient search was returning the wrong ID field
- Was returning: `id` (INTEGER auto-increment: 1, 2, 3...)
- Should return: `patient_id` (VARCHAR unique identifier: P001, P002, Q1...)

**Fix Applied:** Updated patient search API to return `patient_id` instead of `id`
- Doctor now selects patient with correct `patient_id`
- Prescription saves with correct `patient_id`
- Database JOIN now matches correctly

### 2. **Frequency Showing Full Names Instead of Abbreviations**
**Previous:** Frequency stored as "Morning, Afternoon, Night"
**Now:** Frequency abbreviated to "M/A/N" format

**Abbreviation Logic:**
- Morning → M
- Afternoon → A
- Night → N
- All selected: M/A/N
- Just two: M/A or M/N or A/N

**Example:**
- User selects: Morning + Afternoon
- Stored as: "M/A"
- Displays as: "M/A"

---

## Why Patient Names Are Still "Unknown Patient"

### **Root Cause #1: No Patient Data in Database**
When you first start the application, the `patients` table is empty (or has only sample data).

**Symptoms:**
- Doctor searches for patient → No results appear
- Doctor transmits prescription anyway → Pharmacy shows "Unknown Patient"
- Pharmacy queue is empty or shows generic patients

**Solution:** Import sample patient data

### **Root Cause #2: Patient Doesn't Exist Yet**
If a prescription shows "Unknown Patient", it means:
- The `patient_id` in that prescription doesn't match any row in the `patients` table
- This can happen if you submitted a prescription without finding a real patient first

---

## How to Create/Add Patients

### **Option 1: Import Sample Data (RECOMMENDED)**
```bash
cd src-next
npm run import:vitalis
```
This loads ~1000+ sample patients into the database.

### **Option 2: Check Existing Patients**
1. Go to **Patients** page in the app
2. You'll see a list of all available patients
3. Use their names when searching in the prescription form

### **Option 3: Ensure Database is Properly Initialized**
Check if the database exists and has patient data:
```bash
node check_counts.js
```
This will show:
```
Total Patients: 1234
Total Medical Records: 456
Total Appointments: 789
```

If shows 0, you need to run the import.

---

## Step-by-Step Testing Guide

### **Test 1: Verify Patient Data Exists**
```bash
npm run check:counts
```
Expected output: `Total Patients: 1000+`

### **Test 2: Search for a Patient**
1. Go to Patients page
2. You see a list like:
   - John Smith (P001)
   - Sarah Johnson (P002)
   - etc.

If list is empty → Run data import

### **Test 3: Add Prescription with Real Patient**
1. As doctor, click prescription FAB button (red capsule, bottom-right)
2. In "PATIENT DISCOVERY" field, type:
   - A number like `1` (queue number), OR
   - Patient name like `John`, OR
   - Phone number

3. Click the patient from results
4. Fill medication details:
   - Medication: Amoxicillin
   - Dosage: 1 capsule
   - Frequency: Select Morning + Afternoon (will save as "M/A")
   - Route: Oral
   - Duration: 7 Days

5. Click "TRANSMIT TO PHARMACY"

### **Test 4: Verify in Pharmacy Queue**
1. Login as pharmacist (pharmacy_demo / password123)
2. Go to **Pharmacy** page
3. Click "REFRESH QUEUE"
4. In the table, look for the prescription:
   - **Patient Name:** Should show actual name (e.g., "John Smith"), NOT "Unknown Patient"
   - **Medication:** "Amoxicillin"
   - **Frequency:** "M/A" (abbreviation, not full names)
   - **Date:** Today's date

---

## Frequency Format Examples

| User Selects | Stored As | Displays As |
|--------------|-----------|-------------|
| Morning only | M | M |
| Afternoon only | A | A |
| Night only | N | N |
| Morning + Afternoon | M/A | M/A |
| Morning + Night | M/N | M/N |
| Afternoon + Night | A/N | A/N |
| All three | M/A/N | M/A/N |

---

## Troubleshooting

### **Problem: Pharmacy Still Shows "Unknown Patient"**

**Checklist:**
1. ✅ Run `npm run import:vitalis` to add patient data
2. ✅ Verify patients exist by going to Patients page
3. ✅ When prescribing, actually SELECT a patient from search results (don't skip this)
4. ✅ Verify patient_id was saved with prescription

**Debug:**
Check browser console when submitting prescription:
```javascript
console.log('Prescription payload:', payload)
// Should show: { ..., patient_id: "P001", ... }
// NOT: { ..., patient_id: "7", ... }
```

### **Problem: Patient Search Returns No Results**

**Checklist:**
1. ✅ Database has patient data (run check_counts.js)
2. ✅ Try searching by exact first name
3. ✅ Try entering a phone number
4. ✅ Try queue number if in appointments

### **Problem: Frequency Shows Wrong Format**

The frequency will now show as:
- M/A/N (good ✅)
- NOT "Morning, Afternoon, Night" (old format ❌)

If still showing old format, clear browser cache and refresh.

---

## Data Flow Diagram

```
Doctor Side:
┌─────────────────┐
│ Search Patient  │ → Types "John" or "1" (queue#)
└────────┬────────┘
         ↓
┌─────────────────────────────────┐
│ Search Results                  │
│ ✓ John Smith (ID: P001)         │ ← Shows PATIENT_ID, not internal ID
│ ✓ Jonathan Doe (ID: P002)       │
└────────┬────────────────────────┘
         ↓ (Clicks on John Smith)
┌─────────────────────────────────┐
│ Selected Patient: John Smith     │
│ ID: P001                         │ ← Showing patient_id
└────────┬────────────────────────┘
         ↓
┌─────────────────────────────────┐
│ Fill Prescription:              │
│ - Medication: Amoxicillin       │
│ - Frequency: M/A (Morning/Afternoon) │
└────────┬────────────────────────┘
         ↓
┌─────────────────────────────────┐
│ Submit to pharmacy server        │
│ POST /api/prescriptions          │
│ { patient_id: "P001",            │ ← Uses PATIENT_ID!
│   frequency: "M/A", ... }        │
└────────┬────────────────────────┘

Pharmacy Side:
         ↓
┌─────────────────────────────────┐
│ Pharmacy Queue                  │
│ SELECT p.*,                     │
│   pat.first_name || ' ' || pat.last_name │
│ FROM prescriptions p            │
│ LEFT JOIN patients pat ON       │
│   p.patient_id = pat.patient_id │ ← Successful JOIN!
└────────┬────────────────────────┘
         ↓
┌─────────────────────────────────┐
│ Display on Pharmacy Page:       │
│ Patient: John Smith ✅          │
│ Med: Amoxicillin               │
│ Frequency: M/A ✅              │
└─────────────────────────────────┘
```

---

## Code Changes Summary

### **1. Patient Search API** (`src-next/pages/api/patients/search.js`)
```javascript
✅ Now returns patient_id instead of id
✅ Correct JOIN with appointments table
```

### **2. Doctor Rx Sidebar** (`src-next/components/DoctorRxSidebar.tsx`)
```javascript
✅ Converts frequency: "Morning, Afternoon" → "M/A"
✅ Uses patient_id when submitting prescription
✅ Shows patient_id in UI (not internal id)
✅ Function: convertFrequencyToAbbrev()
```

### **3. Prescriptions API** (`src-next/pages/api/prescriptions.js`)
```javascript
✅ Already has CASE WHEN for patient names
✅ Joins on patient_id (VARCHAR)
✅ Returns patient_name with fallback to "Unknown Patient"
```

---

## Quick Start Commands

```bash
# 1. Install/Setup
npm install

# 2. Import sample patient data
cd src-next && npm run import:vitalis

# 3. Check data was imported
node check_counts.js

# 4. Start development
npm run dev

# 5. Test the flow
# - Login as doctor_demo
# - Create prescription
# - Verify in pharmacy_demo view
```

---

## Expected Results After Fix

✅ **Doctor prescribes for patient "John Smith"**
→ Searches for "John", selects from list
→ Fillsmedication as "Amoxicillin"
→ Selects "Morning" and "Afternoon" frequency
→ Submits prescription

✅ **Pharmacist sees prescription**
→ Patient Name: "John Smith" (NOT "Unknown Patient")
→ Medication: "Amoxicillin"
→ Frequency: "M/A" (NOT "Morning, Afternoon")
→ Date: Today

🎉 **All Fixed!**
