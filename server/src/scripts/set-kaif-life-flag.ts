/**
 * Enable or disable Kaif Life ideas for a user by email (dev/test helper).
 *
 * Usage (from server/):
 *   npm run set:kaif-life -- vlad@m.pl true
 */
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from '../models/user';
import { requireTestScriptsEnabled } from '../utils/requireTestScriptsEnabled';

dotenv.config();
requireTestScriptsEnabled();

const email = process.argv[2];
const flagArg = process.argv[3];

if (!email || flagArg === undefined) {
  console.error('Usage: npm run set:kaif-life -- <email> <true|false>');
  process.exit(1);
}

const enabled = ['1', 'true', 'yes', 'on'].includes(flagArg.trim().toLowerCase());
if (!['1', 'true', 'yes', 'on', '0', 'false', 'no', 'off'].includes(flagArg.trim().toLowerCase())) {
  console.error('Flag must be true or false');
  process.exit(1);
}

const getMongoUri = (): string => {
  const isLocalDev = process.env.NODE_ENV === 'development';
  return isLocalDev
    ? 'mongodb://localhost:27017/amorely'
    : process.env.MONGODB_URI || 'mongodb://localhost:27017/amorely';
};

async function main() {
  const mongoUri = getMongoUri();
  await mongoose.connect(mongoUri);
  console.log(`Connected (${process.env.NODE_ENV ?? 'production'}): ${mongoUri.replace(/\/\/.*@/, '//***@')}`);

  const user = await User.findOne({ email });
  if (!user) {
    console.error(`User not found: ${email}`);
    process.exit(1);
  }

  user.kaifLifeIdeasEnabled = enabled;
  await user.save();

  console.log(`kaifLifeIdeasEnabled=${enabled} for ${email} (${user._id.toString()})`);
  await mongoose.disconnect();
  console.log('Done.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
