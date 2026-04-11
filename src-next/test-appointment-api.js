// Test script for the context-aware appointment system
const testCases = [
  {
    name: "Valid Consultation",
    data: {
      patient_id: "demo-patient-1",
      doctor_id: "demo-1", 
      appointment_date: "2026-04-06T10:00:00",
      appointment_type: "Consultation",
      extra_data: {
        reason_for_visit: "Annual checkup and preventive care",
        notes: "Patient requests vaccination discussion"
      }
    }
  },
  {
    name: "Valid Follow-up",
    data: {
      patient_id: "demo-patient-1",
      doctor_id: "demo-1",
      appointment_date: "2026-04-06T11:00:00", 
      appointment_type: "Follow-up",
      extra_data: {
        previous_visit_id: "123",
        progress_notes: "Patient reports improvement in symptoms"
      }
    }
  },
  {
    name: "Valid Urgent Care",
    data: {
      patient_id: "demo-patient-2",
      doctor_id: "demo-2",
      appointment_date: "2026-04-06T14:00:00",
      appointment_type: "Urgent Care", 
      extra_data: {
        urgency_description: "Severe abdominal pain for 2 hours",
        severity_level: "Severe"
      }
    }
  },
  {
    name: "Valid Vaccination",
    data: {
      patient_id: "demo-patient-1",
      doctor_id: "demo-3",
      appointment_date: "2026-04-06T15:30:00",
      appointment_type: "Vaccination",
      extra_data: {
        vaccine_name: "COVID-19 Booster",
        dose_number: "4"
      }
    }
  },
  {
    name: "Invalid Appointment Type",
    data: {
      patient_id: "demo-patient-1",
      doctor_id: "demo-1",
      appointment_date: "2026-04-06T10:00:00",
      appointment_type: "Invalid Type",
      extra_data: {}
    }
  },
  {
    name: "Missing Required Field",
    data: {
      patient_id: "demo-patient-1", 
      doctor_id: "demo-1",
      appointment_date: "2026-04-06T10:00:00",
      appointment_type: "Consultation",
      extra_data: {} // Missing reason_for_visit
    }
  }
];

async function runTests() {
  console.log("🧪 Testing Context-Aware Appointment System\n");
  
  for (const testCase of testCases) {
    console.log(`\n--- Testing: ${testCase.name} ---`);
    
    try {
      const response = await fetch('http://localhost:3000/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testCase.data)
      });
      
      const result = await response.json();
      
      if (response.ok) {
        console.log("✅ SUCCESS:", result.message);
        console.log(`   Appointment ID: ${result.appointment_id}`);
        console.log(`   Type: ${result.appointment_type}`);
        console.log(`   Extra Data:`, result.extra_data);
      } else {
        console.log("❌ FAILED:", result.error);
      }
      
    } catch (error) {
      console.log("💥 ERROR:", error.message);
    }
  }
  
  console.log("\n🎯 Test completed!");
}

// Export for use in browser or Node
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { testCases, runTests };
} else {
  // Browser environment - you can call runTests() from console
  window.runTests = runTests;
}
