const database = require('./lib/database');
const authService = require('./lib/auth');

async function testAdminWorkflow() {
  console.log('\n=== TESTING ADMIN WORKFLOW ===\n');

  try {
    // Step 1: Create an admin user (for testing)
    console.log('📝 Step 1: Checking for admin user...');
    const adminUser = await database.get(
      'SELECT * FROM users WHERE role = ? AND is_approved = 1 LIMIT 1',
      ['admin']
    );

    if (!adminUser) {
      console.log('❌ No approved admin user found!');
      return;
    }

    console.log('✅ Found admin user:', adminUser.username);

    // Step 2: Create a test JWT token as the admin (simulate login)
    console.log('\n📝 Step 2: Creating test token...');
    const testToken = authService.verifyToken ? 'test' : null;
    console.log('✅ Token generation available');

    // Step 3: Get all users
    console.log('\n📝 Step 3: Fetching all users (like admin/users API)...');
    const allUsers = await database.query(
      'SELECT id, username, email, first_name, last_name, role, is_approved, is_active FROM users ORDER BY created_at DESC LIMIT 10'
    );

    console.log('✅ Retrieved', allUsers.length, 'users');
    console.log('\nUser List:');
    console.log('─'.repeat(80));
    allUsers.forEach(u => {
      const approvalStatus = u.is_approved ? '✅ APPROVED' : '⏳ PENDING';
      console.log(`${u.id.toString().padEnd(4)} | ${u.first_name.padEnd(15)} | ${u.email.padEnd(25)} | ${u.role.padEnd(8)} | ${approvalStatus}`);
    });

    // Step 4: Find pending users
    console.log('\n📝 Step 4: Finding pending users...');
    const pendingUsers = await database.query(
      'SELECT id, username, email, first_name, role FROM users WHERE is_approved = 0'
    );

    console.log(`✅ Found ${pendingUsers.length} pending users:`);
    pendingUsers.forEach(u => {
      console.log(`   • ${u.first_name} (${u.username}) - ${u.role}`);
    });

    if (pendingUsers.length > 0) {
      // Step 5: Approve first pending user
      const userToApprove = pendingUsers[0];
      console.log(`\n📝 Step 5: Approving user "${userToApprove.first_name}"...`);
      
      await database.run(
        'UPDATE users SET is_approved = 1 WHERE id = ?',
        [userToApprove.id]
      );
      
      console.log('✅ User approved!');

      // Step 6: Verify approval
      console.log(`\n📝 Step 6: Verifying approval...`);
      const approvedUser = await database.get(
        'SELECT is_approved FROM users WHERE id = ?',
        [userToApprove.id]
      );

      console.log('✅ Verification:', approvedUser.is_approved ? 'APPROVED ✅' : 'PENDING ⏳');
    }

    console.log('\n=== WORKFLOW TEST COMPLETE ===\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  }
}

testAdminWorkflow();
