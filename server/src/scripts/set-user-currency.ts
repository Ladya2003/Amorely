/**
 * Set AmoreCoins balance for a user by email (dev/test helper).
 *
 * Usage (from server/):
 *   npm run set:currency -- anna@m.pl 500
 */
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from '../models/user';
import CurrencyTransaction from '../models/currencyTransaction';
import { getOrCreateWallet } from '../services/currencyService';
import { requireTestScriptsEnabled } from '../utils/requireTestScriptsEnabled';

dotenv.config();
requireTestScriptsEnabled();

const email = process.argv[2];
const amountArg = process.argv[3];

if (!email || amountArg === undefined) {
  console.error('Usage: npm run set:currency -- <email> <amount>');
  process.exit(1);
}

const targetBalance = Number(amountArg);
if (!Number.isFinite(targetBalance) || targetBalance < 0 || !Number.isInteger(targetBalance)) {
  console.error('Amount must be a non-negative integer');
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

  const user = await User.findOne({ email }).lean();
  if (!user) {
    console.error(`User not found: ${email}`);
    process.exit(1);
  }

  const userId = user._id;
  const userIdStr = userId.toString();
  console.log(`User: ${email} (${userIdStr})`);

  const { wallet } = await getOrCreateWallet(userIdStr);
  const previousBalance = wallet.balance;
  const delta = targetBalance - previousBalance;

  if (delta === 0) {
    console.log(`Balance unchanged: ${previousBalance} AmoreCoins`);
    await mongoose.disconnect();
    return;
  }

  await CurrencyTransaction.create({
    userId,
    amount: delta,
    reason: 'manual_claim',
    idempotencyKey: `manual_claim:set_balance:${userIdStr}:${Date.now()}`,
    metadata: {
      source: 'set-user-currency-script',
      previousBalance,
      targetBalance,
    },
  });

  wallet.balance = targetBalance;
  if (delta > 0) {
    wallet.lifetimeEarned += delta;
  }
  await wallet.save();

  console.log('Balance updated:', {
    previous: previousBalance,
    current: wallet.balance,
    delta: delta > 0 ? `+${delta}` : delta,
  });

  await mongoose.disconnect();
  console.log('Done.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
