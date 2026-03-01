const { io } = require("socket.io-client");

const socket = io("http://localhost:3000");

// ----------------------
// CONNECT
// ----------------------
socket.on("connect", () => {
  console.log("✅ Connected to backend");

  // ----------------------
  // LOGIN AS DOCTOR
  // ----------------------
  socket.emit(
    "login",
    { username: "doctor", password: "doctor123" },
    (res) => {
      console.log("🔐 Login Response:", res);

      if (!res.success) return;

      // ----------------------
      // GET PATIENTS
      // ----------------------
      socket.emit("getPatients", (patientsRes) => {
        console.log("🧑‍⚕️ Patients:", patientsRes);

        const patientId = patientsRes.patients[0].patient_id;

        // ----------------------
        // GET RECORDS
        // ----------------------
        socket.emit("getRecords", patientId, (recordsRes) => {
          console.log("📁 Records:", recordsRes);

          const recordId = recordsRes.records[0].record_id;

          // ----------------------
          // VIEW RECORD
          // ----------------------
          socket.emit("viewRecord", recordId, (recordRes) => {
            console.log("📄 View Record:", recordRes);

            // ----------------------
            // ADD RECORD (Doctor only)
            // ----------------------
            socket.emit(
              "addRecord",
              {
                patientId,
                type: "Blood Test",
                filePath: "/secure/reports/blood_test.pdf"
              },
              (addRes) => {
                console.log("➕ Add Record:", addRes);
                socket.disconnect();
              }
            );
          });
        });
      });
    }
  );
});

// ----------------------
socket.on("disconnect", () => {
  console.log("❌ Disconnected");
});
