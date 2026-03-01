const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../db/database');
const fieldEncryption = require('../utils/field-encryption');
const hipaaCompliance = require('../utils/hipaa-compliance');
const { logAudit } = require('../utils/audit');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/messages');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allowed file types
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif',
      'application/pdf', 'text/plain',
      'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'), false);
    }
  }
});

// Get conversations for a user
router.get('/conversations', async (req, res) => {
  try {
    const userId = req.user.userId;

    const conversations = await new Promise((resolve, reject) => {
      db.all(`
        SELECT c.*, 
               u1.name as participant1_name, u1.email as participant1_email, u1.phone as participant1_phone, u1.ip_address as participant1_ip,
               u2.name as participant2_name, u2.email as participant2_email, u2.phone as participant2_phone, u2.ip_address as participant2_ip
        FROM Conversations c
        JOIN Users u1 ON c.participant1_id = u1.user_id
        JOIN Users u2 ON c.participant2_id = u2.user_id
        WHERE c.participant1_id = ? OR c.participant2_id = ?
        ORDER BY c.updated_at DESC
      `, [userId, userId], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    // Filter conversations to show only relevant participant info
    const formattedConversations = rows.map(conv => {
      const otherParticipant = conv.participant1_id === userId ? 
        { 
          id: conv.participant2_id,
          name: conv.participant2_name, 
          email: conv.participant2_email,
          phone: conv.participant2_phone,
          ipAddress: conv.participant2_ip
        } :
        { 
          id: conv.participant1_id,
          name: conv.participant1_name, 
          email: conv.participant1_email,
          phone: conv.participant1_phone,
          ipAddress: conv.participant1_ip
        };

      return {
        conversationId: conv.conversation_id,
        otherParticipant,
        lastMessage: conv.last_message,
        lastMessageTime: conv.last_message_time,
        updatedAt: conv.updated_at
      };
    });

    res.json({
      success: true,
      conversations: formattedConversations
    });

  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Get messages for a conversation
router.get('/conversations/:conversationId/messages', async (req, res) => {
  try {
    const conversationId = req.params.conversationId;
    const userId = req.user.userId;

    // Verify user is part of this conversation
    db.get(
      `SELECT * FROM Conversations WHERE conversation_id = ? AND (participant1_id = ? OR participant2_id = ?)`,
      [conversationId, userId, userId],
      (err, conversation) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({
            success: false,
            message: 'Database error'
          });
        }

        if (!conversation) {
          return res.status(403).json({
            success: false,
            message: 'Access denied'
          });
        }

        // Get messages
        db.all(
          `SELECT m.*, 
                  u.name as sender_name, u.role as sender_role
           FROM Messages m
           LEFT JOIN Users u ON m.sender_id = u.user_id
           WHERE (m.sender_id = ? AND m.receiver_id = ?) OR (m.sender_id = ? AND m.receiver_id = ?)
           ORDER BY m.created_at ASC`,
          [conversation.participant1_id, conversation.participant2_id, conversation.participant2_id, conversation.participant1_id],
          (err, messages) => {
            if (err) {
              console.error('Database error:', err);
              return res.status(500).json({
                success: false,
                message: 'Database error'
              });
            }

            res.json({
              success: true,
              messages
            });
          }
        );
      }
    );

  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Send message
router.post('/send', upload.single('file'), async (req, res) => {
  try {
    const { receiverId, subject, message, priority = 'normal' } = req.body;
    const senderId = req.user.userId;

    if (!receiverId || !message) {
      return res.status(400).json({
        success: false,
        message: 'Receiver and message are required'
      });
    }

    let messageType = 'text';
    let filePath = null;
    let fileName = null;
    let fileSize = null;
    let fileType = null;

    // Handle file upload
    if (req.file) {
      messageType = 'file';
      filePath = req.file.path;
      fileName = req.file.originalname;
      fileSize = req.file.size;
      fileType = req.file.mimetype;

      // Encrypt file path for security
      filePath = fieldEncryption.encryptField(filePath, 'file_path');
    }

    // Get or create conversation
    db.get(
      `SELECT conversation_id FROM Conversations 
       WHERE (participant1_id = ? AND participant2_id = ?) OR (participant1_id = ? AND participant2_id = ?)`,
      [senderId, receiverId, receiverId, senderId],
      (err, conversation) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({
            success: false,
            message: 'Database error'
          });
        }

        let conversationId;
        
        if (conversation) {
          conversationId = conversation.conversation_id;
        } else {
          // Create new conversation
          db.run(
            `INSERT INTO Conversations (participant1_id, participant2_id) VALUES (?, ?)`,
            [senderId, receiverId],
            function(err) {
              if (err) {
                console.error('Database error:', err);
                return res.status(500).json({
                  success: false,
                  message: 'Database error'
                });
              }
              conversationId = this.lastID;
            }
          );
        }

        // Send message
        db.run(
          `INSERT INTO Messages (sender_id, receiver_id, subject, message, file_path, file_name, file_size, file_type, message_type, priority)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [senderId, receiverId, subject, message, filePath, fileName, fileSize, fileType, messageType, priority],
          function(err) {
            if (err) {
              console.error('Database error:', err);
              return res.status(500).json({
                success: false,
                message: 'Database error'
              });
            }

            // Update conversation
            db.run(
              `UPDATE Conversations SET last_message_id = ?, updated_at = CURRENT_TIMESTAMP WHERE conversation_id = ?`,
              [this.lastID, conversationId]
            );

            // Log audit
            logAudit(senderId, 'SEND_MESSAGE', this.lastID, `Sent message to user ${receiverId}`);

            // Log HIPAA event if medical data
            if (fileType && fileType.includes('medical') || message.toLowerCase().includes('patient')) {
              hipaaCompliance.logHIPAAEvent({
                userId: senderId,
                eventType: 'MESSAGE',
                resourceType: 'medical_communication',
                action: 'SEND',
                ipAddress: req.ip,
                userAgent: req.get('User-Agent'),
                details: `Sent medical communication to user ${receiverId}`
              });
            }

            res.json({
              success: true,
              messageId: this.lastID,
              message: 'Message sent successfully'
            });
          }
        );
      }
    );

  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Mark message as read
router.put('/messages/:messageId/read', async (req, res) => {
  try {
    const messageId = req.params.messageId;
    const userId = req.user.userId;

    db.run(
      `UPDATE Messages SET read_at = CURRENT_TIMESTAMP, status = 'read' 
       WHERE message_id = ? AND receiver_id = ?`,
      [messageId, userId],
      function(err) {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({
            success: false,
            message: 'Database error'
          });
        }

        res.json({
          success: true,
          message: 'Message marked as read'
        });
      }
    );

  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Get unread message count
router.get('/unread-count', async (req, res) => {
  try {
    const userId = req.user.userId;

    db.get(
      `SELECT COUNT(*) as count FROM Messages WHERE receiver_id = ? AND status = 'sent'`,
      [userId],
      (err, row) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({
            success: false,
            message: 'Database error'
          });
        }

        res.json({
          success: true,
          unreadCount: row.count
        });
      }
    );

  } catch (error) {
    console.error('Unread count error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Download file
router.get('/download/:messageId', async (req, res) => {
  try {
    const messageId = req.params.messageId;
    const userId = req.user.userId;

    db.get(
      `SELECT * FROM Messages WHERE message_id = ? AND (sender_id = ? OR receiver_id = ?)`,
      [messageId, userId, userId],
      (err, message) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({
            success: false,
            message: 'Database error'
          });
        }

        if (!message || !message.file_path) {
          return res.status(404).json({
            success: false,
            message: 'File not found'
          });
        }

        // Decrypt file path
        const filePath = fieldEncryption.decryptField(message.file_path, 'file_path');

        // Check if file exists
        if (!fs.existsSync(filePath)) {
          return res.status(404).json({
            success: false,
            message: 'File not found on server'
          });
        }

        // Log file download
        logAudit(userId, 'DOWNLOAD_FILE', messageId, `Downloaded file: ${message.file_name}`);

        res.download(filePath, message.file_name);
      }
    );

  } catch (error) {
    console.error('Download file error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
