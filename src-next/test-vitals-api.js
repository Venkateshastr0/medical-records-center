// Test script for vital signs functionality
const testVitalsAPI = async () => {
  console.log("🧪 Testing Vital Signs API\n");
  
  // First, get an appointment to test with
  try {
    const appointmentsRes = await fetch('http://localhost:3000/api/appointments');
    const appointmentsData = await appointmentsRes.json();
    
    if (!appointmentsData.data || appointmentsData.data.length === 0) {
      console.log("❌ No appointments found to test with");
      return;
    }
    
    const testAppointment = appointmentsData.data[0];
    console.log(`📋 Using appointment: ${testAppointment.appointment_id} for ${testAppointment.patient_name}`);
    
    // Test 1: Get current vitals
    console.log("\n--- Test 1: Get Current Vitals ---");
    const getRes = await fetch(`http://localhost:3000/api/appointments/vitals?appointmentId=${testAppointment.appointment_id}`);
    const getVitals = await getRes.json();
    
    if (getRes.ok) {
      console.log("✅ GET vitals successful:", getVitals.triage_vitals);
    } else {
      console.log("❌ GET vitals failed:", getVitals.error);
    }
    
    // Test 2: Update vitals
    console.log("\n--- Test 2: Update Vitals ---");
    const testVitals = {
      bp: "120/80",
      sugar: "95",
      weight: "70",
      height: "175",
      temp: "98.6",
      heart_rate: "72"
    };
    
    const updateRes = await fetch(`http://localhost:3000/api/appointments/vitals?appointmentId=${testAppointment.appointment_id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ triage_vitals: testVitals })
    });
    
    const updateResult = await updateRes.json();
    
    if (updateRes.ok) {
      console.log("✅ UPDATE vitals successful:", updateResult.triage_vitals);
    } else {
      console.log("❌ UPDATE vitals failed:", updateResult.error);
    }
    
    // Test 3: Verify the update
    console.log("\n--- Test 3: Verify Update ---");
    const verifyRes = await fetch(`http://localhost:3000/api/appointments/vitals?appointmentId=${testAppointment.appointment_id}`);
    const verifyVitals = await verifyRes.json();
    
    if (verifyRes.ok) {
      console.log("✅ Verification successful:", verifyVitals.triage_vitals);
      
      // Check if all fields are present
      const expectedFields = ['bp', 'sugar', 'weight', 'height', 'temp', 'heart_rate'];
      const missingFields = expectedFields.filter(field => !verifyVitals.triage_vitals[field]);
      
      if (missingFields.length === 0) {
        console.log("✅ All vital signs fields are present");
      } else {
        console.log("⚠️ Missing fields:", missingFields);
      }
    } else {
      console.log("❌ Verification failed:", verifyVitals.error);
    }
    
    console.log("\n🎯 Vitals API testing completed!");
    
  } catch (error) {
    console.error("💥 Test error:", error.message);
  }
};

// Export for use in browser or Node
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { testVitalsAPI };
} else {
  // Browser environment
  window.testVitalsAPI = testVitalsAPI;
}
