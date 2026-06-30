import axios from 'axios';
import { API_URL } from '../config';
import type { PetSpecies } from '../config/petCatalogShared';

export interface PetStats {
  affection: number;
  playfulness: number;
  charm: number;
}

export interface Pet {
  id: string;
  ownerId: string;
  species: PetSpecies;
  variant: string;
  name: string;
  level: number;
  subLevel: number;
  subLevelMax: number;
  levelProgressPercent: number;
  stats: PetStats;
  affectionBase: number;
  affectionDelta: number;
  imageUrl: string;
  eggUrl: string;
  giftedByUserId: string | null;
  giftedByUsername: string | null;
  giftedByName: string | null;
  giftedByAvatar: string | null;
  ownerUsername: string | null;
  ownerName: string | null;
  ownerAvatar: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PetsListResponse {
  pets: Pet[];
  balance: number;
  canAffordFirstPet: boolean;
  petPurchaseCost: number;
  awardedAmount?: number;
}

export interface PetDetailResponse {
  pet: Pet;
  isOwner: boolean;
  canLevelUp: boolean;
  levelUpCost: number | null;
  isMainLevelUpgrade: boolean;
  balance: number;
  visitOnly?: boolean;
}

export const fetchMyPets = async (): Promise<PetsListResponse> => {
  const { data } = await axios.get(`${API_URL}/api/pets`);
  return data;
};

export const fetchPartnerPets = async (): Promise<{ pets: Pet[]; partnerId: string | null }> => {
  const { data } = await axios.get(`${API_URL}/api/pets/partner`);
  return data;
};

export const fetchUserPets = async (userId: string): Promise<{ pets: Pet[]; userId: string }> => {
  const { data } = await axios.get(`${API_URL}/api/pets/by-user/${userId}`);
  return data;
};

export const fetchPet = async (petId: string, options?: { visit?: boolean }): Promise<PetDetailResponse> => {
  const { data } = await axios.get(`${API_URL}/api/pets/${petId}`, {
    params: options?.visit ? { visit: '1' } : undefined,
  });
  return data;
};

export const fetchUserPet = async (
  userId: string,
  petId: string,
  options?: { visit?: boolean }
): Promise<PetDetailResponse> => {
  const { data } = await axios.get(`${API_URL}/api/pets/by-user/${userId}/${petId}`, {
    params: options?.visit ? { visit: '1' } : undefined,
  });
  return data;
};

export const createPet = async (payload: {
  species: PetSpecies;
  variant: string;
  name: string;
}): Promise<{ pet: Pet; balance: number }> => {
  const { data } = await axios.post(`${API_URL}/api/pets`, payload);
  return data;
};

export const levelUpPet = async (
  petId: string
): Promise<{
  pet: Pet;
  balance: number;
  levelUpCost: number | null;
  isMainLevelUpgrade: boolean;
  mainLevelReached: boolean;
}> => {
  const { data } = await axios.post(`${API_URL}/api/pets/${petId}/level-up`);
  return data;
};

export const giftPet = async (petId: string, recipientUserId: string): Promise<{ pet: Pet }> => {
  const { data } = await axios.post(`${API_URL}/api/pets/${petId}/gift`, { recipientUserId });
  return data;
};

export const petPet = async (
  petId: string,
  options?: { visitOnly?: boolean }
): Promise<{ pet: Pet; balance: number; awardedAmount: number; remainingPettingsToday: number }> => {
  const { data } = await axios.post(`${API_URL}/api/pets/${petId}/pet`, {
    visitOnly: options?.visitOnly ?? false,
  });
  return data;
};

export const fetchCurrencyBalance = async () => {
  const { data } = await axios.get(`${API_URL}/api/currency/balance`);
  return data;
};

export const claimCurrency = async (reason: string) => {
  const { data } = await axios.post(`${API_URL}/api/currency/claim`, { reason });
  return data as { awarded: boolean; awardedAmount: number; balance: number };
};

export const searchUsers = async (query: string) => {
  const { data } = await axios.get(`${API_URL}/api/settings/search`, { params: { query } });
  return data as Array<{ _id: string; username: string; firstName?: string; avatar?: string }>;
};
