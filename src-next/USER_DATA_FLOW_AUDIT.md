# User Data Flow Audit - Registration → Approval → Login

## Current Data Flow Analysis

### 🔄 COMPLETE USER LIFECYCLE FLOW

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          1. USER REGISTRATION (SIGN UP)                      │
└─────────────────────────────────────────────────────────────────────────────┘

USER FILLS FORM ON: /register
├─ First Name
├─ Last Name  
├─ Email
├─ Mobile
├─ Role (Doctor, Nurse, Pharmacist)
├─ Password
└─ Confirm Password

     ↓ POSTS TO /api/auth/register

DATABASE INSERT IN: users table
├─ username: Generated from email
├─ email: User input
├─ password_hash: Bcrypt hashed
├─ first_name: User input
├─ last_name: User input
├─ mobile_number: User input
├─ role: User selected role
├─ is_approved: 🔴 ISSUE #1 - Set during registration, not awaiting admin approval
├─ is_active: 1 (active)
└─ created_at: CURRENT_TIMESTAMP

RESPONSE: ✅ "User registered successfully"
└─ User ID returned
```

---

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        2. ADMIN APPROVAL PROCESS                             │
└─────────────────────────────────────────────────────────────────────────────┘

ADMIN GOES TO: /security (Admin & Security page)
├─ Sees all pending users in "User Management" tab
├─ Pending users marked with is_approved = 0
├─ Admin clicks "APPROVE" or "DENY" button

     ↓ POSTS TO /api/admin/approve-user
     
REQUEST BODY:
├─ userId: User ID
├─ approve: true/false
└─ Authorization: Bearer JWT_TOKEN

DATABASE UPDATE IN: users table
└─ is_approved: 1 (approved) or 0 (denied)

RESPONSE: ✅ "User approved/unapproved successfully"
```

---

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      3. USER LOGIN - 🔴 CRITICAL ISSUE FOUND                 │
└─────────────────────────────────────────────────────────────────────────────┘

USER FILLS LOGIN FORM ON: /login
├─ Username OR Email
└─ Password

     ↓ POSTS TO /api/auth/login

VALIDATION CHECKS IN authService.login():
├─ ✅ User exists? (SELECT by username)
├─ ✅ is_active = 1?
├─ ✅ Password matches password_hash?
├─ 🔴 is_approved = 1? ← **NOT CHECKED - SECURITY BUG!**

     ↓ IF ALL PASS (currently without approval check):

JWT TOKEN CREATED:
├─ user.id
├─ user.username  
├─ user.role

COOKIES SET:
├─ token: JWT (httpOnly, 24h)
└─ user: Safe user data

RESPONSE: ✅ Login successful
└─ User can now access system WITHOUT admin approval!
```

---

## 🔴 CRITICAL ISSUES FOUND

### Issue #1: is_approved Set During Registration (Partial)
**Location**: `lib/auth.js` line 24
```javascript
is_approved: role === 'admin' ? 1 : 0
```
**Problem**: Non-admin users get `is_approved = 0`, but this is never checked during login
**Impact**: Users can login without waiting for admin approval

---

### Issue #2: LOGIN DOES NOT CHECK is_approved ⚠️ CRITICAL SECURITY BUG
**Location**: `pages/api/auth/login.js` 
**Code**:
```javascript
// MISSING: Check if user.is_approved === 1
if (!user.is_active) {
  throw new Error('Account is deactivated');
}
// 🔴 NO CHECK FOR is_approved HERE
if (!isValidPassword) {
  throw new Error('Invalid username or password');
}
```

**Problem**: Login validates:
- ✅ User exists
- ✅ is_active = 1
- ✅ Password correct
- ❌ is_approved = 1 (NOT CHECKED)

**Current Result**: User can login immediately after registration WITHOUT admin approval!

**Expected Result**: User should get error "Account pending admin approval"

**Attack Surface**: 
- Unauthorized users could create accounts and bypass approval
- No actual enforcement of admin approval workflow
- Admin approval button becomes non-functional

---

## ✅ DATA TRANSFER VERIFICATION

### What IS Working Correctly:

#### ✅ Registration Data Transfer
```
User Form Data → /api/auth/register → authService.register() → Database
├─ All fields properly captured
├─ Email validation ✓
├─ Password hashing ✓
├─ Duplicate check ✓
└─ User created successfully ✓
```

#### ✅ Admin Approval API
```
Admin Action → /api/admin/approve-user → Database UPDATE is_approved
├─ Admin token verified ✓
├─ Admin role verified ✓
├─ User found by ID ✓
├─ is_approved flag updated ✓
└─ Response indicates success ✓
```

#### ✅ Login Data Retrieval
```
Login Credentials → /api/auth/login → authService.login() → Check database
├─ User found by username ✓
├─ Password verified ✓
├─ User data retrieved ✓
├─ JWT token created ✓
└─ Cookies set ✓
```

#### ❌ Missing Authorization Check
```
Login Validation
├─ is_active check ✓
├─ Password check ✓
└─ is_approved check ❌ MISSING
```

---

## 📋 Complete Current Database State

When new user registers:
```sql
SELECT username, email, role, is_approved, is_active 
FROM users 
WHERE created_at = TODAY;

-- Result:
-- newuser_123 | user@mail.com | doctor | 0 | 1
--          ↑                          ↑
--     FOUND IN DB              NOT APPROVED YET,
--                              BUT CAN LOGIN ANYWAY!
```

After admin approves:
```sql
UPDATE users SET is_approved = 1 WHERE id = 123;

-- Updated, but login code doesn't even check this value!
```

---

## 🔧 HOW TO FIX

### Fix #1: Add is_approved Check to Login

**File**: `pages/api/auth/login.js`

**Add this validation after password check**:
```javascript
// Verify account is approved by admin
if (!user.is_approved) {
  throw new Error('Account is pending admin approval. Please wait for administrator to grant access.');
}
```

**Complete Check Order**:
1. User exists? ✓
2. is_active? ✓
3. Password valid? ✓
4. **is_approved? ← ADD THIS** ✓
5. Create token

### Fix #2: Update authService.login() 

**File**: `lib/auth.js` lines 35-48

Replace:
```javascript
if (!user.is_active) {
  throw new Error('Account is deactivated');
}

// Verify password
const isValidPassword = await bcrypt.compare(password, user.password_hash);
```

With:
```javascript
if (!user.is_active) {
  throw new Error('Account is deactivated');
}

if (!user.is_approved) {
  throw new Error('Account is pending admin approval. Please wait for administrator to grant access.');
}

// Verify password
const isValidPassword = await bcrypt.compare(password, user.password_hash);
```

---

## 🧪 TEST CASES TO VERIFY FIX

### Test 1: Registration → Pending Approval
```bash
# Register new user
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "Test@12345",
    "firstName": "Test",
    "lastName": "User",
    "mobile": "9999999999",
    "role": "doctor"
  }'

# Result: ✅ User created with is_approved = 0
node run-sql.js "SELECT is_approved FROM users WHERE username = 'testuser'"
# Should show: is_approved = 0
```

### Test 2: Login Before Approval (Should Fail After Fix)
```bash
# Try to login BEFORE admin approval
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "Test@12345"
  }'

# BEFORE FIX: ❌ Login succeeds (BUG)
# AFTER FIX: ✅ Returns error "Account is pending admin approval"
```

### Test 3: Admin Approves User
```bash
# Get admin token
ADMIN_TOKEN=$(curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"venkatesh","password":"Hentailover0714"}' | jq -r '.token')

# Admin approves testuser
curl -X POST http://localhost:3000/api/admin/approve-user \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"userId": 123, "approve": true}'

# Result: ✅ is_approved = 1
node run-sql.js "SELECT is_approved FROM users WHERE username = 'testuser'"
# Should show: is_approved = 1
```

### Test 4: Login After Approval (Should Succeed)
```bash
# Try to login AFTER admin approval
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "Test@12345"
  }'

# Result: ✅ Login succeeds, token returned
```

---

## 📊 Data Flow Diagram

```
REGISTRATION                ADMIN APPROVAL              LOGIN
═════════════════          ════════════════════        ═════════

User Signup Form           Admin Security Page        Login Form
         │                         │                        │
         ├─→ /register            ├─→ GET users             ├─→ /login
         │                        │                         │
         └─→ DB: users           └─→ Sees: is_approved=0   │
             created                                        │
             is_approved=0                                  │
                 │                   │                      │
                 │ (Admin reviews)    │                      │
                 │                 ┌──┘                      │
                 │              Approve?                     │
                 │                 yes                       │
                 │                  │                        │
                 │              /approve-user ───────────────┼─→ CHECK:
                 │                  │                        │    ✓ User exists
                 │              UPDATE                       │    ✓ is_active
                 │              is_approved=1                │    ✓ Password
                 │                  │                        │    ❌ is_approved
                 ↓                  ↓                        ↓
             ┌─────────────────────────────────────────┐
             │   CURRENTLY: USER CAN LOGIN ANYWAY!    │ ← BUG
             │   SHOULD BE: Wait for is_approved = 1   │
             └─────────────────────────────────────────┘
```

---

## ✅ RECOMMENDED ACTION

1. **Apply Fix #1 & #2** above
2. **Update error messages** to guide users
3. **Test with all 4 test cases**
4. **Update documentation** for admin approval workflow
5. **Consider: Email notification** when user is approved

---

## 📝 Data Integrity Summary

| Data Point | Registration | Admin Approval | Login | Status |
|-----------|-------|------------|-------|--------|
| User saved to DB | ✅ | - | - | ✅ Works |
| is_approved set | ✅ | ✅ | ❌ | ⚠️ Not enforced |
| role stored | ✅ | - | ✅ | ✅ Works |
| password hashed | ✅ | - | ✅ | ✅ Works |
| is_active enforced | - | - | ✅ | ✅ Works |
| Approval required | ❌ Set only | ✅ Updated | ❌ Not checked | 🔴 BROKEN |

---

Generated: 2026-04-01
System: Medical Records Center v1.0
