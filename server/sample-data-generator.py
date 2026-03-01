#!/usr/bin/env python3
"""
Medical Records Sample Data Generator
Creates realistic sample data for testing and demonstration
"""

import random
import string
from datetime import datetime, timedelta
import json
import hashlib

class MedicalDataGenerator:
    def __init__(self):
        self.first_names = [
            "James", "John", "Robert", "Michael", "William", "David", "Richard", "Charles", "Joseph", "Thomas",
            "Mary", "Patricia", "Jennifer", "Linda", "Elizabeth", "Barbara", "Susan", "Jessica", "Sarah", "Karen"
        ]
        
        self.last_names = [
            "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez",
            "Wilson", "Anderson", "Taylor", "Thomas", "Moore", "Jackson", "Martin", "Lee", "Thompson"
        ]
        
        self.medical_conditions = [
            "Hypertension", "Diabetes Type 2", "Asthma", "Heart Disease", "Arthritis", "COPD", "Depression", "Anxiety",
            "High Cholesterol", "Migraines", "Allergies", "Osteoporosis", "Kidney Disease", "Liver Disease"
        ]
        
        self.medications = [
            "Lisinopril", "Metformin", "Albuterol", "Atorvastatin", "Amlodipine", "Omeprazole", "Sertraline", "Levothyroxine",
            "Metoprolol", "Hydrochlorothiazide", "Simvastatin", "Losartan", "Gabapentin", "Amoxicillin", "Ibuprofen", "Acetaminophen"
        ]
        
        self.blood_types = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]
        
        self.departments = [
            "Internal Medicine", "Emergency", "Cardiology", "Pediatrics", "Obstetrics", "Surgery", "Radiology", "Pathology"
        ]
        
        self.test_types = [
            "Complete Blood Count", "Comprehensive Metabolic Panel", "Lipid Panel", "Hemoglobin A1c", "Thyroid Panel",
            "Urinalysis", "Chest X-Ray", "EKG", "MRI", "CT Scan", "Ultrasound", "Stress Test"
        ]

    def generate_id(self, prefix):
        """Generate unique ID with prefix"""
        timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
        random_str = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
        return f"{prefix}-{timestamp}-{random_str}"

    def generate_phone_number(self):
        """Generate random US phone number"""
        area_code = random.choice([555, 666, 777, 888, 999])
        exchange = random.randint(200, 999)
        number = random.randint(1000, 9999)
        return f"({area_code}) {exchange}-{number}"

    def generate_email(self, first_name, last_name):
        """Generate email address"""
        domains = ["gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "aol.com"]
        domain = random.choice(domains)
        return f"{first_name.lower()}.{last_name.lower()}@{domain}"

    def generate_date_of_birth(self, age_min=18, age_max=95):
        """Generate random date of birth"""
        today = datetime.now()
        age = random.randint(age_min, age_max)
        dob = today - timedelta(days=age * 365.25)
        return dob.strftime("%Y-%m-%d")

    def generate_address(self):
        """Generate random address"""
        street_numbers = [str(random.randint(1, 9999))]
        street_names = ["Main St", "Oak Ave", "Elm St", "Maple Dr", "Pine St", "Cedar Ave", "Washington St", "Park Ave"]
        cities = ["Springfield", "Riverside", "Franklin", "Georgetown", "Madison", "Clinton", "Greenville", "Troy"]
        states = ["CA", "NY", "TX", "FL", "IL", "PA", "OH", "GA", "NC", "MI"]
        zips = [str(random.randint(10000, 99999))]
        
        return f"{random.choice(street_numbers)} {random.choice(street_names)}, {random.choice(cities)}, {random.choice(states)} {random.choice(zips)}"

    def generate_patients(self, count=100):
        """Generate patient records"""
        patients = []
        
        for _ in range(count):
            first_name = random.choice(self.first_names)
            last_name = random.choice(self.last_names)
            
            patient = {
                "Id": self.generate_id("PAT"),
                "FirstName": first_name,
                "LastName": last_name,
                "DateOfBirth": self.generate_date_of_birth(),
                "Gender": random.choice(["Male", "Female", "Other"]),
                "PhoneNumber": self.generate_phone_number(),
                "Email": self.generate_email(first_name, last_name),
                "Address": self.generate_address(),
                "BloodType": random.choice(self.blood_types),
                "EmergencyContact": self.generate_phone_number(),
                "Allergies": random.choice(["None", "Penicillin", "Latex", "Pollen", "Dust Mites", "Shellfish"]),
                "MedicalHistory": random.choice(self.medical_conditions),
                "CurrentMedications": random.choice(self.medications),
                "InsuranceProvider": random.choice(["Blue Cross", "Aetna", "UnitedHealth", "Cigna", "Humana"]),
                "InsurancePolicyNumber": f"POL-{random.randint(100000, 999999)}",
                "PrimaryCarePhysician": f"Dr. {random.choice(self.last_names)}",
                "Notes": random.choice(["Regular checkups", "Chronic condition management", "Post-surgery follow-up", "Medication monitoring"]),
                "HospitalId": "HOSPITAL-001",
                "CreatedBy": "SYSTEM",
                "CreatedAt": datetime.now().isoformat(),
                "UpdatedAt": datetime.now().isoformat()
            }
            patients.append(patient)
        
        return patients

    def generate_medical_records(self, patient_ids, doctor_ids, count=200):
        """Generate medical records"""
        records = []
        
        for _ in range(count):
            patient_id = random.choice(patient_ids)
            doctor_id = random.choice(doctor_ids)
            
            record = {
                "Id": self.generate_id("MR"),
                "PatientId": patient_id,
                "DoctorId": doctor_id,
                "RecordType": random.choice(["Consultation", "Follow-up", "Emergency", "Routine Checkup"]),
                "VisitDate": (datetime.now() - timedelta(days=random.randint(0, 365))).isoformat(),
                "ChiefComplaint": random.choice(["Headache", "Chest Pain", "Fever", "Cough", "Abdominal Pain", "Fatigue"]),
                "HistoryOfPresentIllness": f"Patient reports {random.choice(['acute', 'chronic'])} onset of symptoms",
                "PhysicalExamination": random.choice(["Normal examination", "Mild abnormalities detected", "Significant findings"]),
                "Assessment": random.choice(self.medical_conditions),
                "Plan": random.choice(["Continue current treatment", "Start new medication", "Refer to specialist", "Schedule follow-up"]),
                "Diagnosis": random.choice(self.medical_conditions),
                "Treatment": random.choice(self.medications),
                "FollowUpInstructions": random.choice(["Return in 1 week", "Return in 1 month", "Call if symptoms worsen", "Continue as directed"]),
                "VitalSigns": f"BP: {random.randint(110, 180)}/{random.randint(70, 120)}, HR: {random.randint(60, 100)}, Temp: {random.randint(36, 38)}°C",
                "HospitalId": "HOSPITAL-001",
                "CreatedBy": doctor_id,
                "CreatedAt": datetime.now().isoformat(),
                "UpdatedAt": datetime.now().isoformat()
            }
            records.append(record)
        
        return records

    def generate_appointments(self, patient_ids, doctor_ids, count=300):
        """Generate appointments"""
        appointments = []
        
        for _ in range(count):
            patient_id = random.choice(patient_ids)
            doctor_id = random.choice(doctor_ids)
            appointment_date = datetime.now() + timedelta(days=random.randint(-30, 90))
            
            start_time = f"{random.randint(8, 17):02d}"
            end_time = f"{random.randint(int(start_time[:2]) + 1, 18):02d}"
            
            appointment = {
                "Id": self.generate_id("APT"),
                "PatientId": patient_id,
                "DoctorId": doctor_id,
                "AppointmentDate": appointment_date.strftime("%Y-%m-%d"),
                "StartTime": start_time,
                "EndTime": end_time,
                "Status": random.choice(["Scheduled", "Confirmed", "Completed", "Cancelled", "No Show"]),
                "AppointmentType": random.choice(["Consultation", "Follow-up", "Emergency", "Routine Checkup", "Surgery"]),
                "Reason": random.choice(["Regular checkup", "Follow-up visit", "New symptoms", "Medication review", "Test results"]),
                "Notes": random.choice(["Patient on time", "Patient late", "Rescheduled", "Virtual appointment"]),
                "RoomNumber": f"Room {random.randint(100, 999)}",
                "Department": random.choice(self.departments),
                "IsVirtual": random.choice([True, False]),
                "VirtualMeetingLink": f"https://meet.jit.si/{self.generate_id('MEET')}" if random.choice([True, False]) else None,
                "ReminderSent": random.choice(["SMS", "Email", "Phone", "None"]),
                "HospitalId": "HOSPITAL-001",
                "CreatedBy": doctor_id,
                "CreatedAt": datetime.now().isoformat(),
                "UpdatedAt": datetime.now().isoformat()
            }
            appointments.append(appointment)
        
        return appointments

    def generate_prescriptions(self, patient_ids, doctor_ids, count=250):
        """Generate prescriptions"""
        prescriptions = []
        
        for _ in range(count):
            patient_id = random.choice(patient_ids)
            doctor_id = random.choice(doctor_ids)
            
            prescription = {
                "Id": self.generate_id("RX"),
                "PatientId": patient_id,
                "DoctorId": doctor_id,
                "MedicationName": random.choice(self.medications),
                "Dosage": f"{random.randint(5, 500)}{random.choice(['mg', 'mcg', 'ml'])}",
                "Frequency": random.choice(["Once daily", "Twice daily", "Three times daily", "As needed", "Every 4 hours"]),
                "Route": random.choice(["Oral", "IV", "IM", "Topical", "Inhalation"]),
                "Instructions": random.choice(["Take with food", "Take on empty stomach", "Take at bedtime", "Take as needed"]),
                "Duration": f"{random.randint(1, 30)} {random.choice(['days', 'weeks', 'months'])}",
                "PrescriptionDate": datetime.now().isoformat(),
                "StartDate": (datetime.now() - timedelta(days=random.randint(0, 30))).strftime("%Y-%m-%d"),
                "EndDate": (datetime.now() + timedelta(days=random.randint(1, 90))).strftime("%Y-%m-%d"),
                "Refills": str(random.randint(0, 5)),
                "Status": random.choice(["Active", "Completed", "Cancelled", "Expired"]),
                "Notes": random.choice(["Take as prescribed", "Monitor for side effects", "Follow up in 1 month"]),
                "Pharmacy": random.choice(["CVS", "Walgreens", "Rite Aid", "Walmart Pharmacy"]),
                "PharmacyPhone": self.generate_phone_number(),
                "Diagnosis": random.choice(self.medical_conditions),
                "SideEffects": random.choice(["None", "Drowsiness", "Nausea", "Headache", "Dizziness"]),
                "DrugInteractions": random.choice(["None", "Alcohol", "Grapefruit", "Dairy products"]),
                "HospitalId": "HOSPITAL-001",
                "CreatedBy": doctor_id,
                "CreatedAt": datetime.now().isoformat(),
                "UpdatedAt": datetime.now().isoformat()
            }
            prescriptions.append(prescription)
        
        return prescriptions

    def generate_lab_results(self, patient_ids, doctor_ids, count=200):
        """Generate lab results"""
        lab_results = []
        
        for _ in range(count):
            patient_id = random.choice(patient_ids)
            doctor_id = random.choice(doctor_ids)
            test_date = datetime.now() - timedelta(days=random.randint(0, 30))
            
            result = {
                "Id": self.generate_id("LAB"),
                "PatientId": patient_id,
                "DoctorId": doctor_id,
                "TestName": random.choice(self.test_types),
                "TestCategory": random.choice(["Hematology", "Chemistry", "Immunology", "Microbiology", "Radiology"]),
                "TestType": random.choice(["Routine", "Stat", "Urgent", "Screening"]),
                "TestDate": test_date.isoformat(),
                "ResultDate": (test_date + timedelta(days=random.randint(1, 3))).isoformat(),
                "Result": random.choice(["Normal", "Abnormal", "Borderline", "Critical"]),
                "Unit": random.choice(["mg/dL", "mmol/L", "cells/μL", "pg/mL", "ng/mL"]),
                "ReferenceRange": f"{random.randint(70, 120)}-{random.randint(121, 200)}",
                "Status": random.choice(["Completed", "Pending", "Cancelled", "Critical"]),
                "AbnormalFlag": random.choice(["", "H", "L", "HH", "LL"]),
                "Interpretation": random.choice(["Within normal limits", "Mildly abnormal", "Moderately abnormal", "Severely abnormal"]),
                "Laboratory": random.choice(["Hospital Lab", "Quest Diagnostics", "LabCorp", "Mayo Clinic"]),
                "Technician": f"Tech {random.choice(self.last_names)}",
                "Pathologist": f"Dr. {random.choice(self.last_names)}",
                "Notes": random.choice(["Sample quality good", "Hemolysis present", "Insufficient sample", "Repeat testing recommended"]),
                "Comments": random.choice(["Routine testing", "Follow-up recommended", "Clinical correlation advised"]),
                "Urgency": random.choice(["Routine", "Stat", "Urgent", "Critical"]),
                "SpecimenType": random.choice(["Blood", "Urine", "Swab", "Tissue", "CSF"]),
                "SpecimenCollectionDate": (test_date - timedelta(hours=random.randint(1, 24))).strftime("%Y-%m-%d"),
                "AccessionNumber": f"ACC-{random.randint(100000, 999999)}",
                "HospitalId": "HOSPITAL-001",
                "CreatedBy": doctor_id,
                "CreatedAt": datetime.now().isoformat(),
                "UpdatedAt": datetime.now().isoformat()
            }
            lab_results.append(result)
        
        return lab_results

    def generate_audit_logs(self, user_ids, count=500):
        """Generate audit logs"""
        audit_logs = []
        
        actions = ["LOGIN", "LOGOUT", "CREATE", "UPDATE", "DELETE", "VIEW", "SEARCH", "EXPORT", "PRINT"]
        entities = ["Patient", "MedicalRecord", "Appointment", "Prescription", "LabResult", "User", "Security"]
        statuses = ["Success", "Failed", "Warning", "Error"]
        severities = ["Info", "Warning", "Error", "Critical"]
        
        for _ in range(count):
            user_id = random.choice(user_ids)
            action = random.choice(actions)
            entity = random.choice(entities)
            status = random.choice(statuses)
            severity = random.choice(severities)
            
            audit_log = {
                "Id": self.generate_id("AUDIT"),
                "UserId": user_id,
                "UserName": f"User_{random.randint(1, 999)}",
                "Action": action,
                "EntityType": entity,
                "EntityId": self.generate_id(entity[:3].upper()),
                "Description": f"{action} operation on {entity}",
                "OldValues": json.dumps({"field": "old_value"}) if action in ["UPDATE", "DELETE"] else None,
                "NewValues": json.dumps({"field": "new_value"}) if action in ["CREATE", "UPDATE"] else None,
                "IpAddress": f"192.168.1.{random.randint(1, 254)}",
                "UserAgent": "WPF Application",
                "Status": status,
                "ErrorMessage": None if status == "Success" else f"Error in {action} operation",
                "Severity": severity,
                "HospitalId": "HOSPITAL-001",
                "Timestamp": (datetime.now() - timedelta(hours=random.randint(0, 720))).isoformat()
            }
            audit_logs.append(audit_log)
        
        return audit_logs

    def save_to_files(self, data, output_dir="sample_data"):
        """Save generated data to JSON files"""
        import os
        
        if not os.path.exists(output_dir):
            os.makedirs(output_dir)
        
        for table_name, records in data.items():
            filename = f"{output_dir}/{table_name.lower()}.json"
            with open(filename, 'w') as f:
                json.dump(records, f, indent=2, default=str)
            print(f"Generated {len(records)} {table_name} records in {filename}")

def main():
    """Main function to generate all sample data"""
    generator = MedicalDataGenerator()
    
    print("Generating sample medical data...")
    
    # Generate IDs for relationships
    patient_ids = [generator.generate_id("PAT") for _ in range(100)]
    doctor_ids = [generator.generate_id("USER") for _ in range(20)]
    user_ids = doctor_ids + [generator.generate_id("USER") for _ in range(30)]
    
    # Generate all data
    data = {
        "Patients": generator.generate_patients(100),
        "Users": [
            {
                "Id": user_ids[0],
                "Username": "admin",
                "Email": "admin@hospital.com",
                "FirstName": "System",
                "LastName": "Administrator",
                "Role": "Administrator",
                "Department": "IT",
                "HospitalId": "HOSPITAL-001",
                "IsActive": True,
                "CreatedBy": "SYSTEM",
                "CreatedAt": datetime.now().isoformat(),
                "UpdatedAt": datetime.now().isoformat()
            }
        ] + [
            {
                "Id": user_id,
                "Username": f"doctor_{i+1}",
                "Email": f"doctor{i+1}@hospital.com",
                "FirstName": random.choice(generator.first_names),
                "LastName": random.choice(generator.last_names),
                "Role": "Doctor",
                "Department": random.choice(generator.departments),
                "HospitalId": "HOSPITAL-001",
                "IsActive": True,
                "CreatedBy": "USER-001",
                "CreatedAt": datetime.now().isoformat(),
                "UpdatedAt": datetime.now().isoformat()
            }
            for i, user_id in enumerate(doctor_ids)
        ],
        "MedicalRecords": generator.generate_medical_records(patient_ids, doctor_ids, 200),
        "Appointments": generator.generate_appointments(patient_ids, doctor_ids, 300),
        "Prescriptions": generator.generate_prescriptions(patient_ids, doctor_ids, 250),
        "LabResults": generator.generate_lab_results(patient_ids, doctor_ids, 200),
        "AuditLogs": generator.generate_audit_logs(user_ids, 500)
    }
    
    # Save to files
    generator.save_to_files(data)
    
    print("\nSample data generation complete!")
    print(f"Generated data for {len(data)} tables")
    print("Files saved to 'sample_data' directory")
    
    # Generate summary statistics
    print("\n=== Data Summary ===")
    for table_name, records in data.items():
        print(f"{table_name}: {len(records)} records")

if __name__ == "__main__":
    main()
