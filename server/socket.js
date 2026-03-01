const { authenticateUser } = require("./utils/auth");
const { logAudit } = require("./utils/audit");
const db = require("./db/database");
const { encrypt, decrypt } = require("./utils/crypto");
const adminApi = require("./api/admin");
const fieldEncryption = require("./utils/field-encryption");
const accessControl = require("./utils/access-control");
const hipaaCompliance = require("./utils/hipaa-compliance");

module.exports = function (io) {
  io.on("connection", (socket) => {
    console.log("🟢 Client connected:", socket.id);

    // =====================
    // LOGIN EVENT
    // =====================
    socket.on("login", async (data, callback) => {
      try {
        // Log login attempt
        await hipaaCompliance.logHIPAAEvent({
          userId: data.username,
          eventType: 'LOGIN',
          resourceType: 'user_accounts',
          action: 'ATTEMPT',
          timestamp: new Date().toISOString(),
          ipAddress: socket.handshake.address,
          userAgent: socket.handshake.headers['user-agent']
        });

        const user = await authenticateUser(data.username, data.password);

        if (!user) {
          // Log failed login
          await hipaaCompliance.logHIPAAEvent({
            userId: data.username,
            eventType: 'LOGIN',
            resourceType: 'user_accounts',
            action: 'FAILURE',
            timestamp: new Date().toISOString(),
            ipAddress: socket.handshake.address,
            userAgent: socket.handshake.headers['user-agent'],
            details: 'Invalid credentials'
          });

          return callback({ success: false, message: "Invalid credentials" });
        }

        // Check if user is approved
        if (user.status !== 'approved') {
          await hipaaCompliance.logHIPAAEvent({
            userId: user.user_id,
            eventType: 'LOGIN',
            resourceType: 'user_accounts',
            action: 'FAILURE',
            timestamp: new Date().toISOString(),
            ipAddress: socket.handshake.address,
            userAgent: socket.handshake.headers['user-agent'],
            details: `User status: ${user.status}`
          });

          return callback({ success: false, message: "Account not approved" });
        }

        socket.user = {
          id: user.user_id,
          role: user.role,
          email: user.email,
          name: user.name
        };

        // Generate secure session token
        const sessionToken = fieldEncryption.generateApiKey(user.user_id, '8h');

        await logAudit(user.user_id, "LOGIN", null, "User logged in");

        // Log successful login
        await hipaaCompliance.logHIPAAEvent({
          userId: user.user_id,
          eventType: 'LOGIN',
          resourceType: 'user_accounts',
          action: 'SUCCESS',
          timestamp: new Date().toISOString(),
          ipAddress: socket.handshake.address,
          userAgent: socket.handshake.headers['user-agent']
        });

        callback({
          success: true,
          user: {
            id: user.user_id,
            name: user.name,
            role: user.role,
            email: user.email
          },
          token: sessionToken
        });
      } catch (err) {
        console.error('Login error:', err);
        callback({ success: false, message: "Server error" });
      }
    });

    // =====================
    // GET PATIENTS
    // =====================
    socket.on("getPatients", async (callback) => {
      if (!socket.user) {
        return callback({ success: false, message: "Not authenticated" });
      }

      db.all("SELECT * FROM Patients", [], async (err, rows) => {
        if (err) return callback({ success: false });

        await logAudit(
          socket.user.id,
          "VIEW_PATIENTS",
          null,
          "Viewed patient list"
        );

        callback({ success: true, patients: rows });
      });
    });

    // =====================
    // GET RECORDS BY PATIENT
    // =====================
    socket.on("getRecords", async (patientId, callback) => {
      if (!socket.user) {
        return callback({ success: false, message: "Not authenticated" });
      }

      let query =
        "SELECT record_id, type, created_at FROM Records WHERE patient_id=?";

      // Doctor gets full metadata
      if (socket.user.role === "Doctor") {
        query = "SELECT * FROM Records WHERE patient_id=?";
      }

      db.all(query, [patientId], async (err, rows) => {
        if (err) return callback({ success: false });

        await logAudit(
          socket.user.id,
          "VIEW_RECORDS",
          null,
          `Viewed records of patient ${patientId}`
        );

        callback({ success: true, records: rows });
      });
    });

    // =====================
    // VIEW RECORD (DECRYPT)
    // =====================
    socket.on("viewRecord", async (recordId, callback) => {
      if (!socket.user) {
        return callback({ success: false, message: "Not authenticated" });
      }

      db.get(
        "SELECT * FROM Records WHERE record_id=?",
        [recordId],
        async (err, record) => {
          if (!record) {
            return callback({ success: false, message: "Record not found" });
          }

          // Role check
          if (
            !["Doctor", "Lawyer", "Insurance"].includes(socket.user.role)
          ) {
            return callback({ success: false, message: "Access denied" });
          }

          const decryptedPath = decrypt(record.encrypted_path);

          await logAudit(
            socket.user.id,
            "VIEW_RECORD",
            recordId,
            "Viewed medical record"
          );

          callback({
            success: true,
            record: {
              record_id: record.record_id,
              patient_id: record.patient_id,
              type: record.type,
              filePath: decryptedPath,
              created_at: record.created_at
            }
          });
        }
      );
    });

    // =====================
    // ADD RECORD (DOCTOR ONLY)
    // =====================
    socket.on("addRecord", async (data, callback) => {
      if (!socket.user || socket.user.role !== "Doctor") {
        return callback({ success: false, message: "Access denied" });
      }

      const encryptedPath = encrypt(data.filePath);

      db.run(
        `
        INSERT INTO Records 
        (patient_id, type, encrypted_path, created_by, created_at)
        VALUES (?, ?, ?, ?, datetime('now'))
        `,
        [
          data.patientId,
          data.type,
          encryptedPath,
          socket.user.id
        ],
        async function () {
          await logAudit(
            socket.user.id,
            "ADD_RECORD",
            this.lastID,
            "Added new medical record"
          );

          callback({ success: true, recordId: this.lastID });
        }
      );
    });

    // =====================
    // ADMIN WORKFLOW EVENTS
    // =====================

    // Get pending registrations
    socket.on("getPendingRegistrations", async (data, callback) => {
      if (!socket.user || !["Admin", "Developer"].includes(socket.user.role)) {
        return callback({ success: false, message: "Access denied" });
      }

      adminApi.getPendingRegistrations(callback);
    });

    // Approve registration
    socket.on("approveRegistration", async (data, callback) => {
      if (!socket.user || !["Admin", "Developer"].includes(socket.user.role)) {
        return callback({ success: false, message: "Access denied" });
      }

      adminApi.approveRegistration(data.registrationId, socket.user.id, callback);
    });

    // Reject registration
    socket.on("rejectRegistration", async (data, callback) => {
      if (!socket.user || !["Admin", "Developer"].includes(socket.user.role)) {
        return callback({ success: false, message: "Access denied" });
      }

      adminApi.rejectRegistration(data.registrationId, socket.user.id, data.reason, callback);
    });

    // Get all users
    socket.on("getAllUsers", async (data, callback) => {
      if (!socket.user || !["Admin", "Developer"].includes(socket.user.role)) {
        return callback({ success: false, message: "Access denied" });
      }

      adminApi.getAllUsers(callback);
    });

    // Get all organizations
    socket.on("getAllOrganizations", async (data, callback) => {
      if (!socket.user || !["Admin", "Developer"].includes(socket.user.role)) {
        return callback({ success: false, message: "Access denied" });
      }

      adminApi.getAllOrganizations(callback);
    });

    // Approve organization
    socket.on("approveOrganization", async (data, callback) => {
      if (!socket.user || !["Admin", "Developer"].includes(socket.user.role)) {
        return callback({ success: false, message: "Access denied" });
      }

      adminApi.approveOrganization(data.orgId, socket.user.id, callback);
    });

    // Forgot password request
    socket.on("forgotPassword", async (data, callback) => {
      try {
        // Check if email exists in database
        db.get(
          `SELECT email FROM Users WHERE email = ?`,
          [data.email],
          (err, user) => {
            if (err) {
              return callback({ success: false, message: 'Database error' });
            }

            if (!user) {
              // Don't reveal if email exists or not for security
              return callback({
                success: true,
                message: 'If your email is registered, you will receive password reset instructions.'
              });
            }

            // In production, generate actual reset token and send email
            // For now, just log the request
            console.log(`Password reset requested for: ${data.email}`);

            // Log audit
            logAudit(null, 'FORGOT_PASSWORD', null, `Password reset requested for ${data.email}`);

            callback({
              success: true,
              message: 'If your email is registered, you will receive password reset instructions.'
            });
          }
        );
      } catch (err) {
        callback({ success: false, message: 'Server error' });
      }
    });

    // Submit registration request
    socket.on("submitRegistration", async (data, callback) => {
      try {
        // Insert registration request into database
        db.run(
          `INSERT INTO UserRegistrations (name, username, email, phone, ip_address, role, organization, business_license)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            data.name,
            data.username,
            data.email,
            data.phone,
            data.ipAddress || socket.handshake.address,
            data.role,
            data.organization,
            data.businessLicense
          ],
          async function (err) {
            if (err) {
              return callback({ success: false, message: err.message });
            }

            // Log audit
            await logAudit(null, 'SUBMIT_REGISTRATION', null, `New registration from ${data.name} (${data.email})`);

            // Send notification based on role
            const notificationMessage = `New registration request from ${data.name} (${data.role}) - ${data.email}`;
            
            if (data.role === 'Admin') {
              // Send notification to all developers
              io.emit('newNotification', {
                type: 'registration_request',
                title: 'Admin Registration Request',
                message: notificationMessage,
                data: {
                  registrationId: this.lastID,
                  name: data.name,
                  email: data.email,
                  role: data.role,
                  organization: data.organization
                },
                timestamp: new Date().toISOString()
              });
              
              console.log(`📧 Admin registration notification sent to developers: ${notificationMessage}`);
            } else {
              // Send notification to all admins
              io.emit('newNotification', {
                type: 'registration_request',
                title: 'New User Registration',
                message: notificationMessage,
                data: {
                  registrationId: this.lastID,
                  name: data.name,
                  email: data.email,
                  role: data.role,
                  organization: data.organization
                },
                timestamp: new Date().toISOString()
              });
              
              console.log(`📧 User registration notification sent to admins: ${notificationMessage}`);
            }

            callback({
              success: true,
              message: 'Registration submitted successfully. Your request is pending approval.',
              registrationId: this.lastID
            });
          }
        );
      } catch (err) {
        callback({ success: false, message: 'Server error' });
      }
    });

    // Get system statistics
    socket.on("getSystemStats", async (data, callback) => {
      if (!socket.user || socket.user.role !== "Admin") {
        return callback({ success: false, message: "Access denied" });
      }

      adminApi.getSystemStats(callback);
    });

    // =====================
    // DISCONNECT
    // =====================
    socket.on("disconnect", () => {
      console.log("🔴 Client disconnected:", socket.id);
    });
  });
};
