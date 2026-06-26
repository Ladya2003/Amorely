/**
 * Reset currency/pet test data for a user by email.
 * Clears pets, wallet, all activity awards (days theme, signature, chat, settings, etc.)
 * and restores the starting wallet with registration bonus only.
 *
 * Usage (from server/): npm run reset:pet-test -- anna@m.pl
 */
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from '../models/user';
import UserWallet from '../models/userWallet';
import CurrencyTransaction, { CURRENCY_REASONS } from '../models/currencyTransaction';
import CurrencyActivityState from '../models/currencyActivityState';
import Pet from '../models/pet';
import { REGISTRATION_BONUS } from '../config/petCatalog';
import { awardRegistrationBonus } from '../services/currencyService';
import { requireTestScriptsEnabled } from '../utils/requireTestScriptsEnabled';

dotenv.config();
requireTestScriptsEnabled();

const email = process.argv[2];

const ACTIVITY_REASONS = CURRENCY_REASONS.filter(
  (reason) => !['registration_bonus', 'pet_purchase', 'pet_level_up'].includes(reason)
);

if (!email) {
  console.error('Usage: npm run reset:pet-test -- <email>');
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

  const activityTransactions = await CurrencyTransaction.find({
    userId,
    reason: { $in: ACTIVITY_REASONS },
  })
    .select('reason idempotencyKey amount')
    .lean();

  if (activityTransactions.length > 0) {
    console.log('Activity awards to clear:');
    for (const tx of activityTransactions) {
      console.log(`  - ${tx.reason}: ${tx.amount > 0 ? '+' : ''}${tx.amount} (${tx.idempotencyKey})`);
    }
  } else {
    console.log('No activity awards found for this user.');
  }

  const activityStates = await CurrencyActivityState.find({ userId }).select('activityKey count').lean();
  if (activityStates.length > 0) {
    console.log('Activity progress to clear:');
    for (const state of activityStates) {
      console.log(`  - ${state.activityKey}: count=${state.count}`);
    }
  }

  const [walletResult, txByUserResult, txByKeyResult, activityResult, petsResult] = await Promise.all([
    UserWallet.deleteMany({ userId }),
    CurrencyTransaction.deleteMany({ userId }),
    CurrencyTransaction.deleteMany({ idempotencyKey: { $regex: userIdStr } }),
    CurrencyActivityState.deleteMany({ userId }),
    Pet.deleteMany({ ownerId: userId }),
  ]);

  console.log('Deleted:', {
    wallets: walletResult.deletedCount,
    transactionsByUser: txByUserResult.deletedCount,
    transactionsByIdempotencyKey: txByKeyResult.deletedCount,
    activityStates: activityResult.deletedCount,
    pets: petsResult.deletedCount,
  });

  const bonus = await awardRegistrationBonus(userIdStr);
  const wallet = await UserWallet.findOne({ userId }).lean();

  console.log('Restored wallet:', {
    balance: wallet?.balance ?? bonus.balance,
    lifetimeEarned: wallet?.lifetimeEarned,
    registrationBonusAwarded: bonus.awarded ? bonus.amount : 0,
  });
  console.log('Activity awards can be earned again (days theme, export, signature, chat, settings, etc.).');

  await mongoose.disconnect();
  console.log('Done.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
