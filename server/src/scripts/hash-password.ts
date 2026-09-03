/**
 * Print a bcrypt hash using the same cost as User pre-save (10).
 *
 * Usage (from server/):
 *   npm run hash:password -- 12312312
 */
import bcrypt from 'bcryptjs';

const password = process.argv[2];

if (!password) {
  console.error('Usage: npm run hash:password -- <password>');
  process.exit(1);
}

const main = async () => {
  const hash = await bcrypt.hash(password, 10);
  const matches = await bcrypt.compare(password, hash);
  if (!matches) {
    console.error('Generated hash failed self-check');
    process.exit(1);
  }
  console.log(hash);
};

void main();
