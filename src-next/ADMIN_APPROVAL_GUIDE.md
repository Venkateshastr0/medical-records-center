# 🔐 Admin User Management & Approval Workflow

## System Overview

The Medical Records Center has a **two-step user approval system**:

```
User Signup → Pending Approval → Admin Approves → User Can Login
```

---

## ✅ System Status Check

### Database Summary
- **Total Users**: 68
- **Approved Users**: 65 ✅
- **Pending Approval**: 3 ⏳

**Pending Users Waiting for Approval:**
1. Test (admin) - admin
2. New User (newuser591790738) - staff  
3. Venkatesh (9922008184) - doctor

---

## 🚀 Complete Workflow

### **Phase 1: New User Registers**
1. New user visits `/register`
2. Fills in: username, email, password, name, role (doctor/nurse/staff)
3. Clicks "Register"
4. ✅ User data saved to database with `is_approved = 0`
5. User sees message: "Account created! Please wait for admin approval"

### **Phase 2: Admin Approves User**
1. Admin logs in with credentials:
   - **Username**: `venkatesh`
   - **Password**: `Hentailover0714`
   - **Role**: admin

2. Admin goes to `/security` (Admin & Security page)

3. In "User Management" tab, admin sees all users:
   - ✅ AUTHORIZED (approved, can login)
   - ⏳ PENDING (waiting for approval)

4. Admin toggles the switch for pending users to approve them

5. User status changes from "PENDING" → "AUTHORIZED" ✅

### **Phase 3: User Can Login**
1. Once approved by admin, user can login
2. User visits `/login`
3. Enters username and password
4. System checks:
   - ✅ Password is correct
   - ✅ Account `is_active` = 1
   - ✅ Account `is_approved` = 1 (approved by admin)
5. Login successful! 🎉

---

## 🔧 Admin Panel Access

### Access Admin Panel
1. **URL**: `/security`
2. **Authentication**: Must be logged in as admin user

### Requires Admin Role
- User `role` must be `admin`
- User `is_approved` must be `1`
- User `is_active` must be `1`

### Two Tabs Available

#### **Tab 1: User Management**
Shows all hospital staff (68 users)

**Columns:**
- Staff Member (name, email)
- Role (admin, doctor, nurse, pharmacist, staff)
- Status (AUTHORIZED ✅ or PENDING ⏳)
- Access Control (toggle to approve/deny)
- Joined (registration date)

**Actions:**
- ✅ Toggle to approve pending users
- ❌ Delete users (except admins)

#### **Tab 2: Security Logs**
Shows login history and audit trails

---

## 🐛 Troubleshooting

### Issue: "Failed to load users" in Admin Panel

**Solution 1: Verify Admin Login**
- Make sure you're logged in as `venkatesh` (admin user)
- Check browser console (F12) for errors
- Token should be stored in localStorage

**Solution 2: Check Browser Storage**
```javascript
// In browser console (F12 → Console tab):
console.log(localStorage.getItem('token')); // Should have a long JWT token
console.log(localStorage.getItem('user'));   // Should have admin user data
```

**Solution 3: Verify Token**
- Token must be sent in API request: `Authorization: Bearer <token>`
- Token must be valid (not expired)
- Token subject must have `role: 'admin'`

### Issue: New User Can't Login After Approval

**Check:** Did admin actually toggle the approval switch?
- User must move from PENDING to AUTHORIZED
- The database field `is_approved` must change from `0` to `1`

**Verify:** Run this in terminal:
```bash
node -e "
const db = require('./lib/database');
db.query('SELECT username, is_approved FROM users WHERE username = \"<username>\"')
  .then(r => console.log(r[0]));
"
```

---

## 📊 Database Tables Structure

### `users` Table
```sql
id              INTEGER PRIMARY KEY
username        TEXT UNIQUE
email           TEXT UNIQUE
password_hash   TEXT
first_name      TEXT
last_name       TEXT
role            TEXT (admin|doctor|nurse|pharmacist|staff)
is_approved     INTEGER (0=pending, 1=approved)
is_active       INTEGER (0=deactivated, 1=active)
created_at      TEXT
last_login      TEXT
```

---

## ✨ Key Features Working

✅ User registration saves to database  
✅ Pending users appear in admin panel  
✅ Admin can approve/deny users  
✅ Login checks `is_approved` status  
✅ Unapproved users cannot login  
✅ User list shows both approved and pending  

---

## 🔐 Security Checks

The system implements these security measures:

1. **Registration**: New users start with `is_approved = 0`
2. **Approval**: Only admins can approve users
3. **Login**: System verifies:
   - Password is correct
   - Account is active (`is_active = 1`)
   - Account is approved (`is_approved = 1`)
4. **API Access**: All admin APIs require valid JWT token with `role = admin`

---

## 📝 Admin User Credentials

**System Admin User** (pre-created):
- **Username**: venkatesh
- **Email**: astroieant997@gmail.com
- **Password**: Hentailover0714
- **Role**: admin
- **Status**: Approved ✅

---

## 🎯 Quick Commands

### Test Admin Login
```bash
node -e "
const auth = require('./lib/auth');
auth.login('venkatesh', 'Hentailover0714')
  .then(r => console.log('✅ Login OK', r.user.username))
  .catch(e => console.log('❌ Login failed', e.message));
"
```

### Check Pending Users
```bash
node -e "
const db = require('./lib/database');
db.query('SELECT id, username, first_name, role FROM users WHERE is_approved = 0')
  .then(r => console.log(r));
"
```

### Approve User by ID
```bash
node -e "
const db = require('./lib/database');
db.run('UPDATE users SET is_approved = 1 WHERE id = 128')
  .then(() => console.log('✅ User approved'));
"
```

### Check All Users
```bash
node -e "
const db = require('./lib/database');
db.query('SELECT COUNT(*) as total, SUM(is_approved) as approved FROM users')
  .then(r => console.log('Total:', r[0].total, 'Approved:', r[0].approved));
"
```

---

## 🚀 Next Steps

1. **Login as Admin**
   - Go to `/login`
   - Username: `venkatesh`
   - Password: `Hentailover0714`

2. **Go to Admin Panel**
   - Navigate to `/security`
   - Click "User Management" tab

3. **Approve Pending Users**
   - Find users with ⏳ PENDING status
   - Toggle the "Access Control" switch
   - They become ✅ AUTHORIZED

4. **Test New User Login**
   - Tell the user they're approved
   - They can now login at `/login`

---

**System is fully functional!** ✅
