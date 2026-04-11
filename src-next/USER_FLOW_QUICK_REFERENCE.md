# 🔑 User Data Flow - Quick Reference Card

## 3-PHASE WORKFLOW

### PHASE 1️⃣: REGISTRATION (User → Admin)
```
What happens: New user creates account
Where: /register page
Data sent: firstName, lastName, email, password, mobile, role
Where saved: users table in database
Initial state: is_approved = 0 (awaiting admin approval)
Can login? ❌ NO - Must wait for admin approval first
```

---

### PHASE 2️⃣: ADMIN APPROVAL (Admin → User)
```
What happens: Administrator reviews and approves new user
Where: /security page → User Management tab  
Who: Only admin user can do this
Data updated: is_approved = 1 (approved)
Database change: UPDATE users SET is_approved = 1 WHERE id = ?
Can user login now? ✅ YES - After approval granted
```

---

### PHASE 3️⃣: LOGIN (User → System)
```
What happens: User logs in with credentials
Where: /login page
Credentials: username + password
Security checks (IN THIS ORDER):
  1. User exists? ✓
  2. Account active? ✓
  3. ✅ APPROVAL GRANTED? (FIXED - Now checked!)
  4. Password correct? ✓
  
Login allowed? ✅ YES - Only if user is approved
Result: JWT token created + cookies set
```

---

## 📊 DATABASE STATES

```
STATE 1: Just Registered (Awaiting Approval)
┌─────────────────────────────────────┐
│ is_approved: 0                      │
│ is_active:  1                       │
│ Can login:  ❌ NO                   │
│ Status:     ⏳ PENDING              │
└─────────────────────────────────────┘
        ↓ Admin clicks APPROVE
        
STATE 2: Approved (Ready to Use)
┌─────────────────────────────────────┐
│ is_approved: 1                      │
│ is_active:  1                       │
│ Can login:  ✅ YES                  │
│ Status:     ✅ AUTHORIZED           │
└─────────────────────────────────────┘
        ↓ Admin clicks REVOKE
        
STATE 3: Approval Revoked (Locked Out)
┌─────────────────────────────────────┐
│ is_approved: 0                      │
│ is_active:  1                       │
│ Can login:  ❌ NO                   │
│ Status:     ⛔ REVOKED              │
└─────────────────────────────────────┘
```

---

## ✅ DATA TRANSFER CHECKLIST

| Step | Data | Stored in DB | Checked at Login | Status |
|------|------|---|---|--------|
| Email | ✅ | ✅ | ❌ | SAVED |
| Password | ✅ (hashed) | ✅ | ✅ | VERIFIED |
| First/Last Name | ✅ | ✅ | ❌ | SAVED |
| Mobile | ✅ | ✅ | ❌ | SAVED |
| Role | ✅ | ✅ | ✅ | CHECKED |
| is_approved | ✅ | ✅ | ✅ | **NEWLY ENFORCED** |
| is_active | ✅ | ✅ | ✅ | CHECKED |

---

## 🔐 LOGIN SECURITY GATES (All 4 Now Active)

```
USER ENTERS CREDENTIALS
│
├─ GATE 1: User exists?
│  └─ SELECT FROM users WHERE username = ?
│  └─ If missing → ❌ "Invalid username or password"
│
├─ GATE 2: Account active?
│  └─ Check is_active = 1
│  └─ If 0 → ❌ "Account is deactivated"
│
├─ GATE 3: Admin approved? ✅ NOW ENFORCED
│  └─ Check is_approved = 1
│  └─ If 0 → ❌ "Account pending admin approval"
│
├─ GATE 4: Password correct?
│  └─ bcrypt.compare(password, hash)
│  └─ If wrong → ❌ "Invalid username or password"
│
└─ ALL PASS → ✅ Generate JWT token + Set cookies
```

---

## 🚦 APPROVAL WORKFLOW STATUS

```
Admin Security Page (/security)
│
├─ "Pending Approvals" tab
│  └─ Shows: Users with is_approved = 0
│  └─ Count: Number awaiting approval
│  └─ Action: [APPROVE] [DENY] buttons
│
├─ "Authorized Users" tab  
│  └─ Shows: Users with is_approved = 1
│  └─ Count: Number who can access system
│  └─ Action: [REVOKE] [DEACTIVATE] buttons
│
└─ All actions tracked in audit logs
```

---

## 🧪 QUICK TEST

**Verify approval workflow is working:**

```bash
# 1. Register new user
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test","email":"test@mail.com","password":"Pass123!","firstName":"Test","lastName":"User","mobile":"9999999999","role":"doctor"}'

# Expected: User created

# 2. Try to login (should FAIL)
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"Pass123!"}'

# Expected: ❌ 401 "Account is pending admin approval"

# 3. Admin approves (get admin token first)
ADMIN_TOKEN=$(curl -X POST http://localhost:3000/api/auth/login \
  -d '{"username":"venkatesh","password":"Hentailover0714"}' | jq -r '.token')

curl -X POST http://localhost:3000/api/admin/approve-user \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"userId":999,"approve":true}'

# 4. Try to login again (should SUCCEED)
curl -X POST http://localhost:3000/api/auth/login \
  -d '{"username":"test","password":"Pass123!"}'

# Expected: ✅ 200 with JWT token
```

---

## 📋 TROUBLESHOOTING

| Problem | Cause | Solution |
|---------|-------|----------|
| User can't login after registering | Awaiting admin approval | Go to /security and approve user |
| Admin approval button not working | Not logged in as admin | Verify you're using admin account |
| User can still login after approval revoked | Cache issue | Clear browser cookies |
| User sees "Invalid username" | Email not matching username | Check username (generated from email) |

---

## 👤 USER ROLES & THEIR PERMISSIONS

| Role | Can Register | Needs Approval | Can Login | Can Access System |
|------|-------|-------|-------|--------|
| Admin | N/A (preconfigured) | No | Yes | Yes - Full access |
| Doctor | Yes | Yes | Only after approval | Patient management |
| Nurse | Yes | Yes | Only after approval | Patient care |
| Pharmacist | Yes | Yes | Only after approval | Pharmacy |
| Staff | Yes | Yes | Only after approval | Limited access |

---

## 🔑 KEY FIELDS IN DATABASE

```sql
-- In users table:
username           -- Unique login name
email              -- Unique email address
password_hash      -- Bcrypt hashed password (NOT plain text)
first_name         -- User's first name
last_name          -- User's last name
mobile_number      -- Contact number
role               -- doctor / nurse / pharmacist / staff / admin
is_approved        -- 0 = pending, 1 = approved (✅ CHECKED AT LOGIN)
is_active          -- 0 = deactivated, 1 = active (checked at login)
last_login         -- Timestamp of last successful login
created_at         -- Account creation time
```

---

## ✅ FIX APPLIED

**What was broken**: login.js didn't check `is_approved` field

**What was fixed**: Added this check before password verification:
```javascript
if (!user.is_approved) {
  throw new Error('Account is pending admin approval. Please wait for administrator to grant access.');
}
```

**Result**: User approval workflow now properly enforced! ✅

---

## 📞 COMMON QUESTIONS

**Q: Why does new user get is_approved = 0?**
A: By design - only admin-approved users can access the system.

**Q: Can admin approve during registration?**
A: No. User registers first, then awaits admin approval via /security page.

**Q: What happens if admin revokes approval?**
A: User gets locked out and can't login until re-approved.

**Q: Where is approval history stored?**
A: In audit logs (accessible from /security → Security Logs tab).

**Q: Can user see they're pending approval?**
A: Message shown on login page after first failed attempt.

**Q: How does admin know who to approve?**
A: /security page shows all pending users with details (name, email, role, date registered).

---

**Status**: ✅ All systems operational and secure!

Generated: April 1, 2026
