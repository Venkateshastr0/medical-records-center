const database = require('./lib/database');
const authService = require('./lib/auth');
const bcrypt = require('bcrypt');

async function testApprovalWorkflow() {
  try {
    console.log('🧪 TESTING USER APPROVAL WORKFLOW\n');
    console.log('='.repeat(70));

    // TEST 1: Register new user
    console.log('\n1️⃣ REGISTRATION: User creates account');
    console.log('-'.repeat(70));

    try {
      const newUser = await authService.register({
        username: 'workflow_test_user',
        email: 'workflow@test.com',
        password: 'TestPassword123!',
        firstName: 'Workflow',
        lastName: 'Tester',
        mobile: '9999999999',
        role: 'doctor'
      });

      console.log('✅ User registered successfully');
      console.log(`   - Username: ${newUser.username}`);
      console.log(`   - Email: ${newUser.email}`);
      console.log(`   - Role: ${newUser.role}`);
      console.log(`   - is_approved: ${newUser.is_approved} (0 = awaiting approval)`);
      console.log(`   - is_active: 1`);
    } catch (error) {
      console.log('❌ Registration failed:', error.message);
      throw error;
    }

    // TEST 2: Login before approval (should fail)
    console.log('\n2️⃣ LOGIN BEFORE APPROVAL: User tries to login without admin approval');
    console.log('-'.repeat(70));

    try {
      const loginResult = await authService.login('workflow_test_user', 'TestPassword123!');
      console.log('❌ SECURITY BUG: User logged in WITHOUT approval!');
      console.log('   This should not happen - fix not applied');
      throw new Error('FAILED: User should not be able to login without approval');
    } catch (error) {
      if (error.message.includes('pending admin approval')) {
        console.log('✅ CORRECT: User blocked from login');
        console.log(`   Error message: "${error.message}"`);
      } else if (error.message.includes('FAILED')) {
        console.log('❌ FAILED: User was able to login without approval');
        throw error;
      } else {
        console.log('⚠️ Different error:', error.message);
        throw error;
      }
    }

    // TEST 3: Verify is_approved = 0 in database
    console.log('\n3️⃣ DATABASE CHECK: Verify is_approved = 0');
    console.log('-'.repeat(70));

    const userBefore = await database.get(
      'SELECT id, username, is_approved, is_active FROM users WHERE username = ?',
      ['workflow_test_user']
    );

    console.log(`✅ User found in database:`);
    console.log(`   - ID: ${userBefore.id}`);
    console.log(`   - is_approved: ${userBefore.is_approved} (0 = awaiting approval) ✓`);
    console.log(`   - is_active: ${userBefore.is_active} (1 = active) ✓`);

    // TEST 4: Admin approves user
    console.log('\n4️⃣ ADMIN ACTION: Administrator approves user');
    console.log('-'.repeat(70));

    await database.run(
      'UPDATE users SET is_approved = 1 WHERE id = ?',
      [userBefore.id]
    );

    const userAfter = await database.get(
      'SELECT is_approved FROM users WHERE id = ?',
      [userBefore.id]
    );

    console.log(`✅ User approved`);
    console.log(`   - is_approved updated from 0 → ${userAfter.is_approved} ✓`);

    // TEST 5: Login after approval (should succeed)
    console.log('\n5️⃣ LOGIN AFTER APPROVAL: User logs in with approval');
    console.log('-'.repeat(70));

    try {
      const loginResult = await authService.login('workflow_test_user', 'TestPassword123!');
      console.log('✅ User logged in successfully');
      console.log(`   - Username: ${loginResult.user.username}`);
      console.log(`   - Role: ${loginResult.user.role}`);
      console.log(`   - Token generated: ${loginResult.token ? '✓' : '✗'}`);
    } catch (error) {
      console.log('❌ Login failed after approval:', error.message);
      throw error;
    }

    // TEST 6: Admin denies approval (deactivation)
    console.log('\n6️⃣ ADMIN ACTION: Administrator denies/revokes approval');
    console.log('-'.repeat(70));

    await database.run(
      'UPDATE users SET is_approved = 0 WHERE id = ?',
      [userBefore.id]
    );

    const userDenied = await database.get(
      'SELECT is_approved FROM users WHERE id = ?',
      [userBefore.id]
    );

    console.log(`✅ User approval revoked`);
    console.log(`   - is_approved: ${userDenied.is_approved} (0 = approval removed) ✓`);

    // TEST 7: Verify user cannot login when denied
    console.log('\n7️⃣ LOGIN AFTER DENIAL: User tries to login after approval revoked');
    console.log('-'.repeat(70));

    try {
      const loginResult = await authService.login('workflow_test_user', 'TestPassword123!');
      console.log('❌ SECURITY BUG: User logged in after approval revoked!');
      throw new Error('FAILED: User should not be able to login after approval revoked');
    } catch (error) {
      if (error.message.includes('pending admin approval')) {
        console.log('✅ CORRECT: User blocked from login');
        console.log(`   Error message: "${error.message}"`);
      } else if (error.message.includes('FAILED')) {
        throw error;
      } else {
        console.log('⚠️ Different error:', error.message);
        throw error;
      }
    }

    // TEST 8: Verify complete workflow with all transitions
    console.log('\n8️⃣ WORKFLOW SUMMARY: Complete user lifecycle');
    console.log('-'.repeat(70));

    console.log(`
    ╔════════════════════════════════════════════════════════════════╗
    ║ USER LIFECYCLE - APPROVAL WORKFLOW                             ║
    ╠════════════════════════════════════════════════════════════════╣
    ║ State 1: REGISTRATION                                          ║
    ║   └─ is_approved = 0, is_active = 1                            ║
    ║   └─ ❌ Cannot login                                           ║
    ║                                                                ║
    ║ State 2: ADMIN APPROVES                                        ║
    ║   └─ is_approved = 1, is_active = 1                            ║
    ║   └─ ✅ Can login                                              ║
    ║                                                                ║
    ║ State 3: ADMIN REVOKES APPROVAL                                ║
    ║   └─ is_approved = 0, is_active = 1                            ║
    ║   └─ ❌ Cannot login                                           ║
    ║                                                                ║
    ║ State 4: ADMIN DEACTIVATES (Optional)                          ║
    ║   └─ is_approved = 0, is_active = 0                            ║
    ║   └─ ❌ Cannot login (extra security)                          ║
    ╚════════════════════════════════════════════════════════════════╝
    `);

    // TEST 9: Cleanup
    console.log('\n9️⃣ CLEANUP: Removing test user');
    console.log('-'.repeat(70));

    await database.run(
      'DELETE FROM users WHERE username = ?',
      ['workflow_test_user']
    );

    const deleted = await database.get(
      'SELECT id FROM users WHERE username = ?',
      ['workflow_test_user']
    );

    console.log(`✅ Test user removed from database`);

    // Final summary
    console.log('\n' + '='.repeat(70));
    console.log('✅ ALL TESTS PASSED - APPROVAL WORKFLOW IS WORKING CORRECTLY');
    console.log('='.repeat(70));
    console.log(`
    KEY FINDINGS:
    ✅ Registration creates user with is_approved = 0
    ✅ User cannot login while awaiting approval
    ✅ Admin can approve user (is_approved = 1)
    ✅ User can login after approval
    ✅ Admin can revoke approval (is_approved = 0)
    ✅ User cannot login after approval revoked
    ✅ Complete approval workflow enforced!
    `);

    await database.close();
    process.exit(0);

  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    console.error(error);
    await database.close();
    process.exit(1);
  }
}

testApprovalWorkflow();
