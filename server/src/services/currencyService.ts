import mongoose from 'mongoose';
import UserWallet from '../models/userWallet';
import CurrencyTransaction, { CurrencyReason } from '../models/currencyTransaction';
import CurrencyActivityState from '../models/currencyActivityState';
import { PET_PURCHASE_COST, REGISTRATION_BONUS } from '../config/petCatalog';

export interface CurrencyAwardResult {
  awarded: boolean;
  amount: number;
  balance: number;
}

export interface WalletSummary {
  balance: number;
  lifetimeEarned: number;
  canAffordFirstPet: boolean;
  registrationBonusAwarded?: number;
}

const toObjectId = (userId: string | mongoose.Types.ObjectId) =>
  typeof userId === 'string' ? new mongoose.Types.ObjectId(userId) : userId;

export const getOrCreateWallet = async (
  userId: string | mongoose.Types.ObjectId
): Promise<{ wallet: InstanceType<typeof UserWallet>; created: boolean }> => {
  const oid = toObjectId(userId);
  let wallet = await UserWallet.findOne({ userId: oid });
  if (wallet) {
    return { wallet, created: false };
  }
  wallet = await UserWallet.create({ userId: oid, balance: 0, lifetimeEarned: 0 });
  return { wallet, created: true };
};

export const ensureRegistrationBonus = async (userId: string): Promise<CurrencyAwardResult> => {
  await getOrCreateWallet(userId);
  return awardRegistrationBonus(userId);
};

export const getBalance = async (userId: string): Promise<WalletSummary> => {
  const bonus = await ensureRegistrationBonus(userId);
  const { wallet } = await getOrCreateWallet(userId);
  return {
    balance: wallet.balance,
    lifetimeEarned: wallet.lifetimeEarned,
    canAffordFirstPet: wallet.balance >= PET_PURCHASE_COST,
    registrationBonusAwarded: bonus.awarded ? bonus.amount : undefined,
  };
};

export const awardRegistrationBonus = async (userId: string): Promise<CurrencyAwardResult> => {
  await getOrCreateWallet(userId);
  return awardCurrency(userId, REGISTRATION_BONUS, 'registration_bonus', `registration_bonus:${userId}`);
};

export const awardCurrency = async (
  userId: string | mongoose.Types.ObjectId,
  amount: number,
  reason: CurrencyReason,
  idempotencyKey: string,
  metadata?: Record<string, unknown>
): Promise<CurrencyAwardResult> => {
  if (amount <= 0) {
    const { wallet } = await getOrCreateWallet(userId);
    return { awarded: false, amount: 0, balance: wallet.balance };
  }

  const existing = await CurrencyTransaction.findOne({ idempotencyKey });
  if (existing) {
    const { wallet } = await getOrCreateWallet(userId);
    return { awarded: false, amount: 0, balance: wallet.balance };
  }

  const oid = toObjectId(userId);
  const { wallet } = await getOrCreateWallet(userId);

  await CurrencyTransaction.create({
    userId: oid,
    amount,
    reason,
    idempotencyKey,
    metadata,
  });

  wallet.balance += amount;
  wallet.lifetimeEarned += amount;
  await wallet.save();

  return { awarded: true, amount, balance: wallet.balance };
};

export const spendCurrency = async (
  userId: string,
  amount: number,
  reason: CurrencyReason,
  idempotencyKey: string,
  metadata?: Record<string, unknown>
): Promise<{ success: boolean; balance: number }> => {
  if (amount <= 0) {
    const { wallet } = await getOrCreateWallet(userId);
    return { success: true, balance: wallet.balance };
  }

  const existing = await CurrencyTransaction.findOne({ idempotencyKey });
  if (existing) {
    const { wallet } = await getOrCreateWallet(userId);
    return { success: true, balance: wallet.balance };
  }

  const oid = toObjectId(userId);
  const { wallet } = await getOrCreateWallet(userId);

  if (wallet.balance < amount) {
    return { success: false, balance: wallet.balance };
  }

  await CurrencyTransaction.create({
    userId: oid,
    amount: -amount,
    reason,
    idempotencyKey,
    metadata,
  });

  wallet.balance -= amount;
  await wallet.save();

  return { success: true, balance: wallet.balance };
};

export const incrementActivityAndAward = async (
  userId: string,
  activityKey: string,
  threshold: number,
  rewardAmount: number,
  reason: CurrencyReason,
  awardIdempotencyKey: string
): Promise<CurrencyAwardResult | null> => {
  const oid = toObjectId(userId);
  const state = await CurrencyActivityState.findOneAndUpdate(
    { userId: oid, activityKey },
    { $inc: { count: 1 }, $set: { lastAwardedAt: new Date() } },
    { upsert: true, new: true }
  );

  if (state.count < threshold) {
    const { wallet } = await getOrCreateWallet(userId);
    return { awarded: false, amount: 0, balance: wallet.balance };
  }

  return awardCurrency(userId, rewardAmount, reason, awardIdempotencyKey);
};

/** Awards on each action while daily count stays within dailyLimit (inclusive). */
export const incrementDailyActivityAward = async (
  userId: string,
  activityPrefix: string,
  dailyLimit: number,
  rewardAmount: number,
  reason: CurrencyReason,
  itemIdempotencyKey: string
): Promise<CurrencyAwardResult> => {
  const dateKey = new Date().toISOString().slice(0, 10);
  const activityKey = `${activityPrefix}:${dateKey}`;
  const oid = toObjectId(userId);
  const state = await CurrencyActivityState.findOneAndUpdate(
    { userId: oid, activityKey },
    { $inc: { count: 1 }, $set: { lastAwardedAt: new Date() } },
    { upsert: true, new: true }
  );

  if (state.count > dailyLimit) {
    const { wallet } = await getOrCreateWallet(userId);
    return { awarded: false, amount: 0, balance: wallet.balance };
  }

  return awardCurrency(userId, rewardAmount, reason, itemIdempotencyKey);
};

export const tryOnceActivityAward = async (
  userId: string,
  activityKey: string,
  rewardAmount: number,
  reason: CurrencyReason
): Promise<CurrencyAwardResult> => {
  const idempotencyKey = `${reason}:${activityKey}:${userId}`;
  return awardCurrency(userId, rewardAmount, reason, idempotencyKey);
};

export const getRecentTransactions = async (userId: string, limit = 10) => {
  const oid = toObjectId(userId);
  return CurrencyTransaction.find({ userId: oid })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
};
