# Medical Records Center - Realistic Dataset Generation Prompt

## 🏥 Dataset Generation Requirements

### **📊 Scale Requirements:**
- **👥 Patients**: 1,000 unique patient records
- **📋 Medical Records**: 8,000+ clinical encounters
- **📅 Appointments**: 12,000+ scheduling records
- **💊 Prescriptions**: 10,000+ medication records
- **🧪 Lab Results**: 15,000+ laboratory tests
- **📊 Audit Logs**: 25,000+ activity logs

---

## 🎯 Realistic Data Characteristics

### **👥 Patient Demographics (1,000 Patients)**
- **Age Distribution**: 
  - 0-18 years: 15%
  - 19-35 years: 25%
  - 36-50 years: 30%
  - 51-65 years: 20%
  - 65+ years: 10%

- **Gender Distribution**:
  - Male: 48%
  - Female: 48%
  - Other: 4%

- **Ethnicity Distribution** (US-based):
  - Caucasian: 60%
  - Hispanic/Latino: 18%
  - African American: 12%
  - Asian: 6%
  - Other: 4%

- **Geographic Distribution**:
  - Urban: 45%
  - Suburban: 35%
  - Rural: 20%

- **Insurance Coverage**:
  - Private Insurance: 55%
  - Medicare: 25%
  - Medicaid: 15%
  - Self-pay: 5%

### **📋 Medical Conditions (Realistic Prevalence)**
- **Chronic Conditions** (per 1000 patients):
  - Hypertension: 320 patients (32%)
  - Diabetes Type 2: 280 patients (28%)
  - Hyperlipidemia: 250 patients (25%)
  - Asthma: 150 patients (15%)
  - COPD: 80 patients (8%)
  - Heart Disease: 70 patients (7%)
  - Arthritis: 200 patients (20%)
  - Depression: 180 patients (18%)
  - Anxiety: 160 patients (16%)
  - Osteoporosis: 60 patients (6%)

- **Acute Conditions** (per 8000 visits):
  - Upper Respiratory Infection: 1200 visits (15%)
  - Urinary Tract Infection: 800 visits (10%)
  - Gastroenteritis: 600 visits (7.5%)
  - Skin Infections: 500 visits (6.25%)
  - Injuries: 400 visits (5%)
  - Migraines: 350 visits (4.375%)
  - Back Pain: 300 visits (3.75%)
  - Eye Infections: 250 visits (3.125%)

### **💊 Medication Patterns (Realistic Prescriptions)**
- **Common Medications** (per 10000 prescriptions):
  - Lisinopril: 800 prescriptions (8%)
  - Metformin: 750 prescriptions (7.5%)
  - Atorvastatin: 700 prescriptions (7%)
  - Amlodipine: 650 prescriptions (6.5%)
  - Albuterol: 600 prescriptions (6%)
  - Omeprazole: 550 prescriptions (5.5%)
  - Sertraline: 500 prescriptions (5%)
  - Levothyroxine: 450 prescriptions (4.5%)
  - Metoprolol: 400 prescriptions (4%)
  - Hydrochlorothiazide: 350 prescriptions (3.5%)

- **Medication Classes**:
  - Antihypertensives: 25%
  - Diabetes Medications: 20%
  - Statins: 15%
  - Antidepressants: 12%
  - Respiratory: 10%
  - Pain Management: 8%
  - Thyroid: 5%
  - Others: 5%

### **🧪 Laboratory Tests (Realistic Distribution)**
- **Common Tests** (per 15000 results):
  - Complete Blood Count (CBC): 3000 tests (20%)
  - Comprehensive Metabolic Panel: 2500 tests (16.67%)
  - Lipid Panel: 2000 tests (13.33%)
  - Hemoglobin A1c: 1500 tests (10%)
  - Urinalysis: 1200 tests (8%)
  - Thyroid Panel: 1000 tests (6.67%)
  - Liver Function Tests: 800 tests (5.33%)
  - Kidney Function Tests: 700 tests (4.67%)
  - Electrolyte Panel: 600 tests (4%)
  - Vitamin D: 500 tests (3.33%)
  - PSA: 400 tests (2.67%)
  - Pregnancy Tests: 300 tests (2%)

- **Test Results Distribution**:
  - Normal: 65%
  - Borderline: 20%
  - Abnormal: 12%
  - Critical: 3%

### **📅 Appointment Patterns (Realistic Scheduling)**
- **Appointment Types** (per 12000 appointments):
  - Routine Checkup: 3600 appointments (30%)
  - Follow-up Visit: 3000 appointments (25%)
  - Urgent Care: 1800 appointments (15%)
  - Specialist Consultation: 1500 appointments (12.5%)
  - Lab Test: 900 appointments (7.5%)
  - Imaging: 600 appointments (5%)
  - Procedure: 300 appointments (2.5%)
  - Vaccination: 300 appointments (2.5%)

- **Time Distribution**:
  - Morning (8AM-12PM): 40%
  - Afternoon (12PM-5PM): 50%
  - Evening (5PM-8PM): 10%

- **Day Distribution**:
  - Monday: 18%
  - Tuesday: 20%
  - Wednesday: 22%
  - Thursday: 20%
  - Friday: 15%
  - Saturday: 3%
  - Sunday: 2%

---

## 🎯 Data Quality Requirements

### **📋 Patient Data Fields**
```json
{
  "demographics": {
    "firstName": "Realistic first names",
    "lastName": "Realistic last names",
    "dateOfBirth": "Valid dates matching age distribution",
    "gender": "Realistic gender distribution",
    "ssn": "Valid SSN format (encrypted)",
    "address": "Realistic addresses",
    "phoneNumber": "Valid phone numbers",
    "email": "Valid email addresses",
    "emergencyContact": "Real emergency contacts"
  },
  "medical": {
    "bloodType": "Realistic blood type distribution",
    "allergies": "Common allergies (penicillin, latex, etc.)",
    "medicalHistory": "Realistic chronic conditions",
    "currentMedications": "Realistic medication lists",
    "primaryCarePhysician": "Realistic doctor names"
  },
  "insurance": {
    "provider": "Real insurance companies",
    "policyNumber": "Valid policy formats",
    "coverageType": "Realistic coverage levels"
  }
}
```

### **📋 Medical Record Data Fields**
```json
{
  "encounter": {
    "visitDate": "Realistic date distribution",
    "chiefComplaint": "Common presenting complaints",
    "historyOfPresentIllness": "Realistic symptom descriptions",
    "physicalExamination": "Realistic exam findings",
    "assessment": "Realistic diagnoses",
    "plan": "Realistic treatment plans",
    "vitalSigns": "Realistic vital sign ranges"
  },
  "diagnosis": {
    "primaryDiagnosis": "ICD-10 codes",
    "secondaryDiagnoses": "Realistic comorbidities",
    "severity": "Realistic severity levels"
  },
  "treatment": {
    "medications": "Realistic prescriptions",
    "procedures": "Realistic procedures",
    "referrals": "Realistic specialist referrals",
    "followUp": "Realistic follow-up plans"
  }
}
```

### **🧪 Lab Result Data Fields**
```json
{
  "test": {
    "testName": "Realistic lab test names",
    "testCategory": "Realistic categories",
    "testDate": "Realistic collection dates",
    "resultDate": "Realistic reporting dates"
  },
  "results": {
    "value": "Realistic numeric ranges",
    "unit": "Appropriate units",
    "referenceRange": "Realistic reference ranges",
    "abnormalFlag": "Realistic abnormality indicators"
  },
  "interpretation": {
    "clinicalInterpretation": "Realistic interpretations",
    "pathologist": "Realistic doctor names",
    "technician": "Realistic lab tech names"
  }
}
```

---

## 🎯 Realistic Data Generation Rules

### **📅 Temporal Relationships**
- **Patient Age**: Must match date of birth
- **Medical History**: Chronic conditions should correlate with age
- **Medications**: Should align with medical conditions
- **Lab Results**: Should be consistent with diagnoses
- **Appointments**: Should follow logical care patterns

### **🔗 Data Consistency Rules**
- **Patient IDs**: Must be consistent across all tables
- **Doctor Assignments**: Should match specialties
- **Insurance Coverage**: Should match patient demographics
- **Medication Dosages**: Should be age and weight appropriate
- **Lab Values**: Should be clinically realistic

### **📊 Statistical Distributions**
- **Visit Frequency**: Patients should have realistic visit patterns
- **Medication Duration**: Should match treatment guidelines
- **Lab Test Ordering**: Should follow clinical guidelines
- **Appointment No-Shows**: Realistic cancellation rates (10-15%)
- **Follow-up Compliance**: Realistic follow-up rates (70-80%)

---

## 🎯 Specific Data Generation Instructions

### **👥 Patient Generation (1,000 Patients)**
```python
# Generate realistic patient demographics
def generate_patients(count=1000):
    patients = []
    
    # Age distribution
    age_groups = [
        (0, 18, 0.15),
        (19, 35, 0.25),
        (36, 50, 0.30),
        (51, 65, 0.20),
        (66, 95, 0.10)
    ]
    
    for i in range(count):
        # Select age group
        age_group = random.choices(age_groups, weights=[0.15, 0.25, 0.30, 0.20, 0.10])[0]
        age = random.randint(age_group[0], age_group[1])
        
        # Generate date of birth
        dob = datetime.now() - timedelta(days=age*365)
        
        # Generate realistic patient
        patient = {
            "id": f"PAT-{i+1:06d}",
            "firstName": random.choice(realistic_first_names),
            "lastName": random.choice(realistic_last_names),
            "dateOfBirth": dob.strftime("%Y-%m-%d"),
            "age": age,
            "gender": random.choices(["Male", "Female", "Other"], weights=[0.48, 0.48, 0.04])[0],
            "ssn": generate_realistic_ssn(),
            "address": generate_realistic_address(),
            "phoneNumber": generate_realistic_phone(),
            "email": generate_realistic_email(),
            "bloodType": random.choices(blood_types, weights=[0.40, 0.07, 0.07, 0.40, 0.03, 0.03])[0],
            "allergies": generate_realistic_allergies(),
            "medicalHistory": generate_chronic_conditions(age),
            "insurance": generate_realistic_insurance()
        }
        patients.append(patient)
    
    return patients
```

### **📋 Medical Record Generation (8,000+ Records)**
```python
def generate_medical_records(patients, doctors, avg_visits_per_patient=8):
    records = []
    
    for patient in patients:
        # Generate realistic visit frequency based on age and conditions
        visit_count = calculate_visit_frequency(patient)
        
        for i in range(visit_count):
            # Generate realistic visit date
            visit_date = generate_realistic_visit_date(patient)
            
            # Generate realistic chief complaint
            complaint = generate_realistic_complaint(patient, visit_date)
            
            # Generate realistic diagnosis
            diagnosis = generate_realistic_diagnosis(complaint, patient)
            
            # Generate realistic treatment plan
            treatment = generate_realistic_treatment(diagnosis, patient)
            
            record = {
                "id": f"MR-{len(records)+1:06d}",
                "patientId": patient["id"],
                "doctorId": random.choice(doctors)["id"],
                "visitDate": visit_date.strftime("%Y-%m-%d"),
                "chiefComplaint": complaint,
                "historyOfPresentIllness": generate_hpi(complaint),
                "physicalExamination": generate_exam_findings(complaint),
                "assessment": diagnosis,
                "plan": treatment,
                "vitalSigns": generate_vital_signs(patient, complaint),
                "hospitalId": "HOSPITAL-001"
            }
            records.append(record)
    
    return records
```

### **💊 Prescription Generation (10,000+ Records)**
```python
def generate_prescriptions(patients, doctors, medical_records):
    prescriptions = []
    
    for record in medical_records:
        # Generate prescriptions based on diagnosis
        meds = generate_medications_for_diagnosis(record["assessment"])
        
        for med in meds:
            prescription = {
                "id": f"RX-{len(prescriptions)+1:06d}",
                "patientId": record["patientId"],
                "doctorId": record["doctorId"],
                "medicationName": med["name"],
                "dosage": calculate_realistic_dosage(med, record["patientId"]),
                "frequency": generate_realistic_frequency(med),
                "route": generate_realistic_route(med),
                "duration": generate_realistic_duration(med),
                "prescriptionDate": record["visitDate"],
                "status": "Active",
                "refills": str(random.randint(0, 5)),
                "hospitalId": "HOSPITAL-001"
            }
            prescriptions.append(prescription)
    
    return prescriptions
```

### **🧪 Lab Result Generation (15,000+ Records)**
```python
def generate_lab_results(patients, doctors, medical_records):
    lab_results = []
    
    for record in medical_records:
        # Generate lab tests based on diagnosis
        tests = generate_tests_for_diagnosis(record["assessment"])
        
        for test in tests:
            # Generate realistic test values
            result_value = generate_realistic_lab_value(test, record["patientId"])
            
            # Determine if result is abnormal
            is_abnormal = is_result_abnormal(test, result_value)
            
            lab_result = {
                "id": f"LAB-{len(lab_results)+1:06d}",
                "patientId": record["patientId"],
                "doctorId": record["doctorId"],
                "testName": test["name"],
                "testCategory": test["category"],
                "testDate": (datetime.strptime(record["visitDate"], "%Y-%m-%d") + timedelta(days=1)).strftime("%Y-%m-%d"),
                "resultDate": (datetime.strptime(record["visitDate"], "%Y-%m-%d") + timedelta(days=2)).strftime("%Y-%m-%d"),
                "result": result_value,
                "unit": test["unit"],
                "referenceRange": test["reference_range"],
                "status": "Completed",
                "abnormalFlag": "H" if is_abnormal else "",
                "interpretation": generate_interpretation(test, result_value),
                "hospitalId": "HOSPITAL-001"
            }
            lab_results.append(lab_result)
    
    return lab_results
```

---

## 🎯 Data Validation Rules

### **📋 Patient Data Validation**
- **Age Range**: 0-95 years
- **Date Format**: YYYY-MM-DD
- **Phone Format**: (XXX) XXX-XXXX
- **Email Format**: Valid email addresses
- **SSN Format**: XXX-XX-XXXX (encrypted)
- **Blood Type**: Valid ABO/Rh combinations

### **📋 Medical Record Validation**
- **Visit Dates**: Logical chronological order
- **Diagnosis Codes**: Valid ICD-10 codes
- **Vital Signs**: Realistic ranges by age
- **Treatment Plans**: Clinically appropriate
- **Doctor Assignments**: Match specialties

### **💊 Prescription Validation**
- **Dosage Ranges**: Age and weight appropriate
- **Drug Interactions**: Check for conflicts
- **Duration**: Appropriate for conditions
- **Refill Limits**: Realistic prescription limits
- **Status**: Valid prescription statuses

### **🧪 Lab Result Validation**
- **Reference Ranges**: Age and gender appropriate
- **Units**: Correct for each test
- **Result Values**: Clinically realistic
- **Abnormal Flags**: Consistent with values
- **Test Dates**: Logical collection and reporting

---

## 🎯 Output Requirements

### **📊 File Formats**
- **JSON**: Primary format for all data
- **CSV**: Alternative format for easy import
- **SQL**: Database insert scripts
- **Documentation**: Complete data dictionary

### **📁 File Organization**
```
dataset/
├── patients/
│   ├── patients.json
│   ├── patients.csv
│   └── patients.sql
├── medical_records/
│   ├── medical_records.json
│   ├── medical_records.csv
│   └── medical_records.sql
├── prescriptions/
│   ├── prescriptions.json
│   ├── prescriptions.csv
│   └── prescriptions.sql
├── lab_results/
│   ├── lab_results.json
│   ├── lab_results.csv
│   └── lab_results.sql
├── appointments/
│   ├── appointments.json
│   ├── appointments.csv
│   └── appointments.sql
├── audit_logs/
│   ├── audit_logs.json
│   ├── audit_logs.csv
│   └── audit_logs.sql
└── documentation/
    ├── data_dictionary.md
    ├── generation_log.md
    └── validation_report.md
```

### **📊 Data Quality Metrics**
- **Completeness**: 100% required fields populated
- **Consistency**: 100% referential integrity
- **Accuracy**: 95%+ realistic values
- **Validity**: 100% format compliance
- **Uniqueness**: 100% unique identifiers

---

## 🎯 Implementation Instructions

### **🐍 Python Script Requirements**
```python
# Required libraries
import json
import csv
import random
from datetime import datetime, timedelta
import hashlib
from faker import Faker

# Initialize faker for realistic data
fake = Faker('en_US')

# Data generation functions
def generate_dataset():
    # Generate all data types
    patients = generate_patients(1000)
    doctors = generate_doctors(50)
    medical_records = generate_medical_records(patients, doctors)
    prescriptions = generate_prescriptions(patients, doctors, medical_records)
    lab_results = generate_lab_results(patients, doctors, medical_records)
    appointments = generate_appointments(patients, doctors)
    audit_logs = generate_audit_logs(patients, doctors)
    
    # Save to files
    save_to_files(patients, doctors, medical_records, prescriptions, lab_results, appointments, audit_logs)
    
    # Generate validation report
    generate_validation_report()

if __name__ == "__main__":
    generate_dataset()
```

### **📊 Validation Script**
```python
def validate_dataset():
    # Load all generated data
    patients = load_json("patients.json")
    medical_records = load_json("medical_records.json")
    prescriptions = load_json("prescriptions.json")
    lab_results = load_json("lab_results.json")
    
    # Perform validation checks
    validation_results = {
        "patient_validation": validate_patients(patients),
        "medical_record_validation": validate_medical_records(medical_records),
        "prescription_validation": validate_prescriptions(prescriptions),
        "lab_result_validation": validate_lab_results(lab_results),
        "referential_integrity": validate_relationships(patients, medical_records, prescriptions, lab_results)
    }
    
    # Generate validation report
    generate_validation_report(validation_results)
```

---

## 🎯 Success Criteria

### **📊 Dataset Quality**
- **✅ 1,000 unique patients** with realistic demographics
- **✅ 8,000+ medical records** with clinical accuracy
- **✅ 10,000+ prescriptions** with appropriate dosages
- **✅ 15,000+ lab results** with realistic values
- **✅ 12,000+ appointments** with logical scheduling
- **✅ 25,000+ audit logs** with complete audit trail

### **🔍 Data Realism**
- **✅ Demographic distributions** match real populations
- **✅ Medical conditions** reflect real prevalence
- **✅ Medication patterns** align with clinical practice
- **✅ Laboratory values** fall within realistic ranges
- **✅ Appointment patterns** follow real scheduling trends

### **📋 Technical Requirements**
- **✅ Data consistency** across all related tables
- **✅ Referential integrity** maintained
- **✅ Format compliance** for all fields
- **✅ Validation rules** satisfied
- **✅ Documentation** complete and accurate

---

## 🎯 Usage Instructions

### **🚀 Quick Start**
```bash
# Generate the complete dataset
python generate_medical_dataset.py

# Validate the generated data
python validate_dataset.py

# Import to database
python import_to_database.py

# Generate statistics report
python generate_statistics.py
```

### **📊 Customization Options**
- **Patient Count**: Adjust patient population size
- **Age Distribution**: Modify demographic profiles
- **Medical Conditions**: Customize disease prevalence
- **Geographic Region**: Adapt to local demographics
- **Time Period**: Set custom date ranges

---

This comprehensive prompt provides everything needed to generate a realistic, high-quality medical dataset that accurately represents real-world healthcare data while maintaining privacy and compliance standards.
