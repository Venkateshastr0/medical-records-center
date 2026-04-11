// Test script for queue management functionality
const testQueueManagement = async () => {
  console.log("🧪 Testing Queue Management System\n");
  
  try {
    // Test 1: Get current queue for a doctor
    console.log("--- Test 1: Get Current Queue ---");
    const queueRes = await fetch('http://localhost:3000/api/appointments?doctor_id=1');
    const queueData = await queueRes.json();
    
    if (queueRes.ok) {
      console.log(`✅ Current queue has ${queueData.data.length} patients`);
      queueData.data.forEach((appt, index) => {
        console.log(`   ${index + 1}. ${appt.patient_name} - Queue #${appt.queue_number}`);
      });
    } else {
      console.log("❌ Failed to get queue:", queueData.error);
      return;
    }
    
    // Test 2: Create a prescription (should remove patient from queue)
    if (queueData.data.length > 0) {
      console.log("\n--- Test 2: Transmit Prescription (Remove from Queue) ---");
      const testPatient = queueData.data[0];
      
      const prescriptionPayload = {
        patient_id: testPatient.patient_id,
        doctor_id: testPatient.doctor_id,
        medication_name: "Test Medication 500mg",
        dosage: "1 tablet",
        frequency: "M",
        route: "Oral",
        duration: "7 Days",
        instructions: "Take with water"
      };
      
      const rxRes = await fetch('http://localhost:3000/api/prescriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(prescriptionPayload)
      });
      
      const rxResult = await rxRes.json();
      
      if (rxRes.ok) {
        console.log(`✅ Prescription transmitted: ${rxResult.id}`);
        console.log(`📤 Patient ${testPatient.patient_name} should be removed from queue`);
      } else {
        console.log("❌ Prescription failed:", rxResult.error);
      }
      
      // Test 3: Verify queue updated
      console.log("\n--- Test 3: Verify Queue Updated ---");
      setTimeout(async () => {
        const updatedQueueRes = await fetch('http://localhost:3000/api/appointments?doctor_id=1');
        const updatedQueue = await updatedQueueRes.json();
        
        if (updatedQueueRes.ok) {
          console.log(`✅ Updated queue has ${updatedQueue.data.length} patients`);
          updatedQueue.data.forEach((appt, index) => {
            console.log(`   ${index + 1}. ${appt.patient_name} - Queue #${appt.queue_number}`);
          });
          
          // Check if patient was removed
          const patientStillInQueue = updatedQueue.data.some(appt => appt.patient_id === testPatient.patient_id);
          if (!patientStillInQueue) {
            console.log("✅ Patient successfully removed from queue!");
          } else {
            console.log("⚠️ Patient still appears in queue (may need refresh)");
          }
        } else {
          console.log("❌ Failed to get updated queue:", updatedQueue.error);
        }
      }, 1000); // Wait 1 second for database update
    }
    
    // Test 4: Test queue reset (admin endpoint)
    console.log("\n--- Test 4: Test Daily Queue Reset ---");
    const resetRes = await fetch('http://localhost:3000/api/admin/reset-queue', {
      method: 'POST'
    });
    
    const resetResult = await resetRes.json();
    
    if (resetRes.ok) {
      console.log("✅ Queue reset successful:", resetResult.message);
    } else {
      console.log("❌ Queue reset failed:", resetResult.error);
    }
    
    console.log("\n🎯 Queue management testing completed!");
    
  } catch (error) {
    console.error("💥 Test error:", error.message);
  }
};

// Export for use in browser or Node
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { testQueueManagement };
} else {
  // Browser environment
  window.testQueueManagement = testQueueManagement;
}
