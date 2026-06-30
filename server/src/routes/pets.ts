import express, { Request, Response } from 'express';
import mongoose from 'mongoose';
import Pet from '../models/pet';
import User from '../models/user';
import { ExtendedRequest } from '../types/mongoose';
import {
  getBalance,
  spendCurrency,
  awardCurrency,
} from '../services/currencyService';
import {
  isValidSpecies,
  isValidVariant,
  getNextUpgradeCost,
  getSubLevelMax,
  getLevelProgressPercent,
  isMainLevelUpgradeNext,
  applyUpgradeStep,
  PET_PURCHASE_COST,
  getPetImagePath,
  getPetEggPath,
  getPetStats,
} from '../config/petCatalog';
import { resolvePartnerContext } from '../utils/resolvePartnerId';
import { canAccessUserProfile } from '../utils/canAccessUserProfile';

const router = express.Router();
const PETTING_DAILY_LIMIT = 2;
const PETTING_REWARD_AMOUNT = 3;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const getUtcDayStart = (value: Date) =>
  Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate());

const getUtcDayDiff = (from: Date, to: Date) =>
  Math.max(0, Math.floor((getUtcDayStart(to) - getUtcDayStart(from)) / MS_PER_DAY));

const getUtcDayKey = (value: Date) => value.toISOString().slice(0, 10);
const getUtcHalfDayKey = (value: Date) => {
  const dayKey = getUtcDayKey(value);
  const half = value.getUTCHours() < 12 ? 'am' : 'pm';
  return `${dayKey}:${half}`;
};

const getPetAffectionDelta = (pet: any) => clamp(Number(pet.affectionDelta ?? 0), -5, 5);

const applyPendingAffectionDecay = (pet: any): boolean => {
  const now = new Date();
  const lastPettedAt = pet.lastPettedAt ? new Date(pet.lastPettedAt) : new Date(pet.createdAt ?? now);
  const daysWithoutPetting = getUtcDayDiff(lastPettedAt, now);
  const shouldDecayDays = Math.max(0, daysWithoutPetting - 2);
  const appliedDays = Math.max(0, Number(pet.affectionDecayAppliedDays ?? 0));
  const decayToApply = shouldDecayDays - appliedDays;

  if (decayToApply <= 0) {
    return false;
  }

  const nextDelta = clamp(getPetAffectionDelta(pet) - decayToApply, -5, 5);
  pet.affectionDelta = nextDelta;
  pet.affectionDecayAppliedDays = appliedDays + decayToApply;
  return true;
};

type PetUserInfo = {
  username?: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
};

const resolvePersonDisplayName = (user?: PetUserInfo | null) => {
  if (!user) return null;
  if (user.firstName && user.lastName) return `${user.firstName} ${user.lastName}`;
  if (user.firstName) return user.firstName;
  return user.username ?? null;
};

const formatPet = (
  pet: any,
  giftedByUser?: PetUserInfo | null,
  ownerUser?: PetUserInfo | null
) => {
  const subLevel = pet.subLevel ?? 0;
  const subLevelMax = getSubLevelMax(pet.level);
  const baseStats = getPetStats(pet.species, pet.variant, pet.level, subLevel);
  const affectionBase = baseStats.affection;
  const affectionDelta = getPetAffectionDelta(pet);
  const affectionMin = Math.max(1, affectionBase - 5);
  const affectionMax = Math.min(100, affectionBase + 5);
  const affectionCurrent = clamp(affectionBase + affectionDelta, affectionMin, affectionMax);

  return {
    id: pet._id.toString(),
    ownerId: pet.ownerId.toString(),
    species: pet.species,
    variant: pet.variant,
    name: pet.name,
    level: pet.level,
    subLevel,
    subLevelMax,
    levelProgressPercent: getLevelProgressPercent(pet.level, subLevel),
    stats: {
      ...baseStats,
      affection: affectionCurrent,
    },
    affectionBase,
    affectionDelta: affectionCurrent - affectionBase,
    imageUrl: getPetImagePath(pet.species, pet.variant, pet.level),
    eggUrl: getPetEggPath(pet.species, pet.variant),
    giftedByUserId: pet.giftedByUserId?.toString() ?? null,
    giftedByUsername: giftedByUser?.username ?? null,
    giftedByName: resolvePersonDisplayName(giftedByUser),
    giftedByAvatar: giftedByUser?.avatar ?? null,
    ownerUsername: ownerUser?.username ?? null,
    ownerName: resolvePersonDisplayName(ownerUser),
    ownerAvatar: ownerUser?.avatar ?? null,
    createdAt: pet.createdAt,
    updatedAt: pet.updatedAt,
  };
};

const loadOwnerUser = (ownerId: string | mongoose.Types.ObjectId) =>
  User.findById(ownerId).select('username firstName lastName avatar').lean();

const buildPetDetailResponse = async (
  userId: string,
  pet: any,
  visitOnly: boolean
) => {
  if (applyPendingAffectionDecay(pet)) {
    await pet.save();
  }

  let giftedByUser = null;
  if (pet.giftedByUserId) {
    giftedByUser = await User.findById(pet.giftedByUserId).select('username firstName lastName avatar').lean();
  }
  const ownerUser = await loadOwnerUser(pet.ownerId);

  const wallet = await getBalance(userId);
  const ownerId = pet.ownerId.toString();
  const subLevel = pet.subLevel ?? 0;
  const levelUpCost = getNextUpgradeCost(pet.level, subLevel);
  const isOwner = ownerId === userId;
  const canManagePet = isOwner || (await canUpgradePartnerPet(userId, ownerId));

  return {
    pet: formatPet(pet.toObject(), giftedByUser, ownerUser),
    isOwner,
    canLevelUp: !visitOnly && levelUpCost !== null && canManagePet,
    levelUpCost: visitOnly ? null : levelUpCost,
    isMainLevelUpgrade: isMainLevelUpgradeNext(pet.level, subLevel),
    balance: wallet.balance,
    visitOnly,
  };
};

const canUpgradePartnerPet = async (viewerId: string, ownerId: string): Promise<boolean> => {
  if (viewerId === ownerId) return true;
  const partnerContext = await resolvePartnerContext(viewerId);
  return partnerContext.partnerId === ownerId;
};

const canViewPet = async (viewerId: string, ownerId: string): Promise<boolean> =>
  canUpgradePartnerPet(viewerId, ownerId) || canAccessUserProfile(viewerId, ownerId);

const loadPetsForOwner = async (ownerId: string) => {
  const pets = await Pet.find({ ownerId }).sort({ createdAt: 1 });
  await Promise.all(
    pets.map(async (pet) => {
      if (applyPendingAffectionDecay(pet)) {
        await pet.save();
      }
    })
  );

  const giftedByIds = pets
    .map((p) => p.giftedByUserId?.toString())
    .filter(Boolean) as string[];
  const gifters = giftedByIds.length
    ? await User.find({ _id: { $in: giftedByIds } }).select('username firstName lastName avatar').lean()
    : [];
  const gifterMap = new Map(gifters.map((g) => [g._id.toString(), g]));
  const ownerUser = await loadOwnerUser(ownerId);

  return pets.map((p) =>
    formatPet(
      p.toObject(),
      p.giftedByUserId ? gifterMap.get(p.giftedByUserId.toString()) : null,
      ownerUser
    )
  );
};

router.get('/', async (req: ExtendedRequest, res: Response) => {
  try {
    const userId = req.userId as string;
    const pets = await Pet.find({ ownerId: userId }).sort({ createdAt: 1 });
    await Promise.all(
      pets.map(async (pet) => {
        if (applyPendingAffectionDecay(pet)) {
          await pet.save();
        }
      })
    );
    const wallet = await getBalance(userId);

    const giftedByIds = pets
      .map((p) => p.giftedByUserId?.toString())
      .filter(Boolean) as string[];
    const gifters = giftedByIds.length
      ? await User.find({ _id: { $in: giftedByIds } }).select('username firstName lastName avatar').lean()
      : [];
    const gifterMap = new Map(gifters.map((g) => [g._id.toString(), g]));

    res.json({
      pets: pets.map((p) =>
        formatPet(p.toObject(), p.giftedByUserId ? gifterMap.get(p.giftedByUserId.toString()) : null)
      ),
      balance: wallet.balance,
      canAffordFirstPet: wallet.canAffordFirstPet,
      petPurchaseCost: PET_PURCHASE_COST,
      awardedAmount: wallet.registrationBonusAwarded ?? 0,
    });
  } catch (error) {
    console.error('GET /api/pets error:', error);
    res.status(500).json({ error: 'Failed to load pets' });
  }
});

router.get('/partner', async (req: ExtendedRequest, res: Response) => {
  try {
    const userId = req.userId as string;
    const partnerContext = await resolvePartnerContext(userId);
    if (!partnerContext.partnerId) {
      return res.json({ pets: [] });
    }

    const pets = await loadPetsForOwner(partnerContext.partnerId);

    res.json({
      pets,
      partnerId: partnerContext.partnerId,
    });
  } catch (error) {
    console.error('GET /api/pets/partner error:', error);
    res.status(500).json({ error: 'Failed to load partner pets' });
  }
});

router.get('/by-user/:userId', async (req: ExtendedRequest, res: Response) => {
  try {
    const viewerId = req.userId as string;
    const ownerId = String(req.params.userId || '');

    if (!ownerId || !mongoose.Types.ObjectId.isValid(ownerId)) {
      return res.status(400).json({ error: 'Valid userId required' });
    }

    const allowed = await canAccessUserProfile(viewerId, ownerId);
    if (!allowed) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const pets = await loadPetsForOwner(ownerId);
    res.json({ pets, userId: ownerId });
  } catch (error) {
    console.error('GET /api/pets/by-user/:userId error:', error);
    res.status(500).json({ error: 'Failed to load user pets' });
  }
});

router.get('/by-user/:userId/:petId', async (req: ExtendedRequest, res: Response) => {
  try {
    const userId = req.userId as string;
    const ownerId = String(req.params.userId || '');
    const petId = String(req.params.petId || '');

    if (
      !ownerId ||
      !petId ||
      !mongoose.Types.ObjectId.isValid(ownerId) ||
      !mongoose.Types.ObjectId.isValid(petId)
    ) {
      return res.status(400).json({ error: 'Valid userId and petId required' });
    }

    const allowed = await canAccessUserProfile(userId, ownerId);
    if (!allowed) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const pet = await Pet.findOne({ _id: petId, ownerId });
    if (!pet) {
      return res.status(404).json({ error: 'Pet not found' });
    }

    const visitOnly = req.query.visit === '1' || req.query.visit === 'true' || userId !== ownerId;
    const payload = await buildPetDetailResponse(userId, pet, visitOnly);
    res.json(payload);
  } catch (error) {
    console.error('GET /api/pets/by-user/:userId/:petId error:', error);
    res.status(500).json({ error: 'Failed to load pet' });
  }
});

router.get('/:id', async (req: ExtendedRequest, res: Response) => {
  try {
    const userId = req.userId as string;
    const petId = String(req.params.id || '');

    if (!petId || !mongoose.Types.ObjectId.isValid(petId)) {
      return res.status(400).json({ error: 'Valid pet id required' });
    }

    const pet = await Pet.findById(petId);
    if (!pet) {
      return res.status(404).json({ error: 'Pet not found' });
    }

    const ownerId = pet.ownerId.toString();
    const canView = await canViewPet(userId, ownerId);
    if (!canView) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const visitOnly = req.query.visit === '1' || req.query.visit === 'true';
    const payload = await buildPetDetailResponse(userId, pet, visitOnly);
    res.json(payload);
  } catch (error) {
    console.error('GET /api/pets/:id error:', error);
    res.status(500).json({ error: 'Failed to load pet' });
  }
});

router.post('/', async (req: ExtendedRequest, res: Response) => {
  try {
    const userId = req.userId as string;
    const { species, variant, name } = req.body;

    if (!species || !variant || !name?.trim()) {
      return res.status(400).json({ error: 'species, variant and name are required' });
    }
    if (!isValidSpecies(species)) {
      return res.status(400).json({ error: 'Invalid species' });
    }
    if (!isValidVariant(species, variant)) {
      return res.status(400).json({ error: 'Invalid variant for species' });
    }
    if (name.trim().length > 24) {
      return res.status(400).json({ error: 'Name too long' });
    }

    const spend = await spendCurrency(
      userId,
      PET_PURCHASE_COST,
      'pet_purchase',
      `pet_purchase:${userId}:${Date.now()}`
    );
    if (!spend.success) {
      return res.status(402).json({ error: 'Insufficient balance', balance: spend.balance, required: PET_PURCHASE_COST });
    }

    const pet = await Pet.create({
      ownerId: userId,
      species,
      variant,
      name: name.trim(),
      stats: getPetStats(species, variant, 1),
    });

    const ownerUser = await loadOwnerUser(userId);

    res.status(201).json({
      pet: formatPet(pet.toObject(), null, ownerUser),
      balance: spend.balance,
      awardedAmount: 0,
    });
  } catch (error) {
    console.error('POST /api/pets error:', error);
    res.status(500).json({ error: 'Failed to create pet' });
  }
});

router.post('/:id/level-up', async (req: ExtendedRequest, res: Response) => {
  try {
    const userId = req.userId as string;
    const pet = await Pet.findById(req.params.id);
    if (!pet) {
      return res.status(404).json({ error: 'Pet not found' });
    }

    const ownerId = pet.ownerId.toString();
    const allowed = await canUpgradePartnerPet(userId, ownerId);
    if (!allowed) {
      return res.status(403).json({ error: 'Cannot upgrade this pet' });
    }

    const subLevel = pet.subLevel ?? 0;
    const cost = getNextUpgradeCost(pet.level, subLevel);
    if (cost === null) {
      return res.status(400).json({ error: 'Pet is already max level' });
    }

    const spend = await spendCurrency(
      userId,
      cost,
      'pet_level_up',
      `pet_level_up:${pet._id}:L${pet.level}:S${subLevel}`
    );
    if (!spend.success) {
      return res.status(402).json({ error: 'Insufficient balance', balance: spend.balance, required: cost });
    }

    const previousLevel = pet.level;
    const upgraded = applyUpgradeStep(pet.level, subLevel);
    pet.level = upgraded.level;
    pet.subLevel = upgraded.subLevel;
    pet.stats = getPetStats(pet.species, pet.variant, pet.level, pet.subLevel);
    await pet.save();

    const nextCost = getNextUpgradeCost(pet.level, pet.subLevel);
    const ownerUser = await loadOwnerUser(pet.ownerId);
    let giftedByUser = null;
    if (pet.giftedByUserId) {
      giftedByUser = await User.findById(pet.giftedByUserId).select('username firstName lastName avatar').lean();
    }

    res.json({
      pet: formatPet(pet.toObject(), giftedByUser, ownerUser),
      balance: spend.balance,
      levelUpCost: nextCost,
      isMainLevelUpgrade: isMainLevelUpgradeNext(pet.level, pet.subLevel),
      mainLevelReached: upgraded.level > previousLevel,
    });
  } catch (error) {
    console.error('POST /api/pets/:id/level-up error:', error);
    res.status(500).json({ error: 'Failed to level up pet' });
  }
});

router.post('/:id/pet', async (req: ExtendedRequest, res: Response) => {
  try {
    const userId = req.userId as string;
    const pet = await Pet.findById(req.params.id);
    if (!pet) {
      return res.status(404).json({ error: 'Pet not found' });
    }

    const ownerId = pet.ownerId.toString();
    const visitOnly = Boolean(req.body?.visitOnly);
    const canInteract =
      ownerId === userId ||
      (visitOnly
        ? await canAccessUserProfile(userId, ownerId)
        : await canUpgradePartnerPet(userId, ownerId));
    if (!canInteract) {
      return res.status(403).json({ error: 'Cannot pet this pet' });
    }

    applyPendingAffectionDecay(pet);

    const now = new Date();
    const dayKey = getUtcDayKey(now);
    const halfDayKey = getUtcHalfDayKey(now);
    const currentWindowDate = pet.pettingWindowDate ?? null;
    const currentCount = currentWindowDate === dayKey ? Number(pet.pettingWindowCount ?? 0) : 0;

    if (currentCount >= PETTING_DAILY_LIMIT) {
      return res.status(429).json({ error: 'Daily petting limit reached', remainingPettingsToday: 0 });
    }

    const nextCount = currentCount + 1;
    pet.pettingWindowDate = dayKey;
    pet.pettingWindowCount = nextCount;
    pet.lastPettedAt = now;
    pet.affectionDecayAppliedDays = 0;
    pet.affectionDelta = clamp(getPetAffectionDelta(pet) + 1, -5, 5);
    const shouldAwardCurrency =
      !visitOnly && (pet.pettingRewardHalfDayKey ?? null) !== halfDayKey;
    if (shouldAwardCurrency) {
      pet.pettingRewardHalfDayKey = halfDayKey;
    }
    await pet.save();

    let awardResult: { awarded: boolean; amount: number; balance: number };
    if (shouldAwardCurrency) {
      awardResult = await awardCurrency(
        userId,
        PETTING_REWARD_AMOUNT,
        'pet_petting',
        `pet_petting:${pet._id.toString()}:${halfDayKey}`,
        { petId: pet._id.toString(), ownerId, halfDayKey }
      );
    } else {
      const wallet = await getBalance(userId);
      awardResult = { awarded: false, amount: 0, balance: wallet.balance };
    }

    const ownerUser = await loadOwnerUser(pet.ownerId);
    let giftedByUser = null;
    if (pet.giftedByUserId) {
      giftedByUser = await User.findById(pet.giftedByUserId).select('username firstName lastName avatar').lean();
    }

    res.json({
      pet: formatPet(pet.toObject(), giftedByUser, ownerUser),
      balance: awardResult.balance,
      awardedAmount: awardResult.awarded ? PETTING_REWARD_AMOUNT : 0,
      remainingPettingsToday: Math.max(0, PETTING_DAILY_LIMIT - nextCount),
    });
  } catch (error) {
    console.error('POST /api/pets/:id/pet error:', error);
    res.status(500).json({ error: 'Failed to pet this pet' });
  }
});

router.post('/:id/gift', async (req: ExtendedRequest, res: Response) => {
  try {
    const userId = req.userId as string;
    const { recipientUserId } = req.body;

    if (!recipientUserId || !mongoose.Types.ObjectId.isValid(recipientUserId)) {
      return res.status(400).json({ error: 'Valid recipientUserId required' });
    }
    if (recipientUserId === userId) {
      return res.status(400).json({ error: 'Cannot gift pet to yourself' });
    }

    const pet = await Pet.findById(req.params.id);
    if (!pet) {
      return res.status(404).json({ error: 'Pet not found' });
    }
    if (pet.ownerId.toString() !== userId) {
      return res.status(403).json({ error: 'Only the owner can gift this pet' });
    }

    const recipient = await User.findById(recipientUserId);
    if (!recipient) {
      return res.status(404).json({ error: 'Recipient not found' });
    }

    pet.ownerId = new mongoose.Types.ObjectId(recipientUserId);
    pet.giftedByUserId = new mongoose.Types.ObjectId(userId);
    await pet.save();

    const gifter = await User.findById(userId).select('username firstName lastName avatar').lean();
    const ownerUser = await loadOwnerUser(recipientUserId);

    res.json({
      pet: formatPet(pet.toObject(), gifter, ownerUser),
      message: 'Pet gifted successfully',
    });
  } catch (error) {
    console.error('POST /api/pets/:id/gift error:', error);
    res.status(500).json({ error: 'Failed to gift pet' });
  }
});

export default router;
