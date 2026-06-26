import type { PetSpecies } from '../config/petCatalogShared';
import { getPetEggPath } from '../config/petCatalogShared';
import { getPublicAssetPath } from '../utils/publicAssetPath';

/** Egg image URLs from public/pets (PNG, one per species + variant). */
export const getPetEggSrc = (species: PetSpecies, variant: string): string =>
  getPublicAssetPath(getPetEggPath(species, variant));
