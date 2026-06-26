import type { PetSpecies } from './petCatalogShared';
import { PET_SPECIES } from './petCatalogShared';

export {
  PET_SPECIES,
  PET_VARIANTS,
  PET_MAX_LEVEL,
  PET_PURCHASE_COST,
  REGISTRATION_BONUS,
  LEVEL_PROGRESSION,
  isValidSpecies,
  isValidVariant,
  getNextUpgradeCost,
  getLevelUpCost,
  getSubLevelMax,
  getLevelProgressPercent,
  isMainLevelUpgradeNext,
  applyUpgradeStep,
  getPetImagePath,
  getPetEggPath,
  getPetStats,
} from './petCatalogShared';

export type { PetSpecies, PetStats } from './petCatalogShared';

export interface PetCatalogEntry {
  id: PetSpecies;
  nameKey: string;
}

export const PET_CATALOG: PetCatalogEntry[] = PET_SPECIES.map((id) => ({
  id,
  nameKey: `pets.species.${id}`,
}));

export const VARIANT_NAME_KEYS: Record<PetSpecies, Record<string, string>> = {
  kitten: { orange: 'pets.variants.orange', gray: 'pets.variants.gray', black: 'pets.variants.black' },
  puppy: { golden: 'pets.variants.golden', brown: 'pets.variants.brown', spotted: 'pets.variants.spotted' },
  gecko: { green: 'pets.variants.green', blue: 'pets.variants.blue', yellow: 'pets.variants.yellow' },
  bunny: { white: 'pets.variants.white', gray: 'pets.variants.gray', cream: 'pets.variants.cream' },
  owlet: { brown: 'pets.variants.brown', gray: 'pets.variants.gray', white: 'pets.variants.white' },
};

export const CURRENCY_COIN_PATH = '/pets/currency-coin.svg';
