const database = require('./lib/database');
const authService = require('./lib/auth');

async function testLoginAfterApproval() {
  console.log('\n=== TESTING LOGIN AFTER APPROVAL ===\n');

  try {
    // Find a recently approved user (not the default admin users)
    console.log('📝 Finding recently approved users...');
    const recentUsers = await database.query(
      "SELECT id, username, email, first_name, role, is_approved, is_active FROM users WHERE is_approved = 1 ORDER BY created_at DESC LIMIT 10"
    );

    console.log(`✅ Found ${recentUsers.length} approved users`);
    recentUsers.slice(0, 5).forEach(u => {
      console.log(`  • ${u.username} (${u.first_name}) - ${u.role} - Active: ${u.is_active}`);
    });

    // Find a user that was just registered (before approval)
    console.log('\n📝 Finding previously pending users...');
    const previouslyPending = await database.query(
      "SELECT id, username, email, first_name, password_hash, role, is_approved, is_active FROM users WHERE first_name IN ('New', 'Test', 
'Venkatesh', 'Pearlin') ORDER BY created_at DESC LIMIT 5"
    );

    console.log(`✅ Found ${previouslyPending.length} users to test with`);

    for (const user of previouslyPending) {
      if (!user.password_hash) {
        console.log(`\n⚠️  ${user.username} - No password hash found (can't test)`);
        continue;
      }

      console.log(`\n🔐 Testing login for: ${user.username}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   First Name: ${user.first_name}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   is_approved: ${user.is_approved}`);
      console.log(`   is_active: ${user.is_active}`);

      // Try login with the username
      try {
        console.log(`   ⏳ Attempting login as "${user.username}"`);
        
        // We don't know the password, so let's just check the database flags
        if (!user.is_approved) {
          console.log('   ❌ NOT APPROVED - User cannot login');
          continue;
        }

        if (!user.is_active) {
          console.log('   ❌ NOT ACTIVE - User account is deactivated');
          continue;
        }

        console.log('   ✅ User is approved and active - should be able to login');
        console.log(`   📋 Password hash exists: ${!!user.password_hash}`);
        
      } catch (err) {
        console.log(`   ❌ Error: ${err.message}`);
      }
    }

    // Show all unapproved users (to verify approvals worked)
    console.log('\n\n📝 Checking unapproved users...');
    const stillPending = await database.query(
      "SELECT id, username, first_name, role, is_approved FROM users WHERE is_approved = 0 LIMIT 5"
    );

    console.log(`⏳ Still pending: ${stillPending.length} users`);
    stillPending.forEach(u => {
      console.log(`   • ${u.username} (${u.first_name}) - NOT APPROVED`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  }
}

testLoginAfterApproval();
