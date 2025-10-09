const bcrypt = require('bcrypt');

async function hashPassword() {
  const password = 'admin123';
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(password, salt);
  console.log('\n===========================================');
  console.log('Password: admin123');
  console.log('Hash:', hash);
  console.log('===========================================\n');
  console.log('Copy the hash above and use it in pgAdmin');
}

hashPassword();