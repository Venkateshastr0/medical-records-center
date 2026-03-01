const db = require("../db/database");
const bcrypt = require("bcrypt");

function authenticateUser(username, password) {
  return new Promise((resolve, reject) => {
    db.get(
      "SELECT * FROM Users WHERE username = ?",
      [username],
      async (err, user) => {
        if (err) return reject(err);
        if (!user) return resolve(null);

        const match = await bcrypt.compare(password, user.password_hash);
        if (!match) return resolve(null);

        resolve(user);
      }
    );
  });
}

module.exports = { authenticateUser };
