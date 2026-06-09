import mongoose from 'mongoose';
import User from '../models/user';
import { hasActivePartner, idsEqual, normalizeIdStr } from './normalizeId';
import {
  findActiveRelationshipForUser,
  getPartnerIdFromRelationship
} from './relationshipHelpers';

export const resolvePartnerUserId = async (userId: string): Promise<string> => {
  const normalizedUserId = normalizeIdStr(userId);
  if (!normalizedUserId) {
    return userId;
  }

  const relationship = await findActiveRelationshipForUser(normalizedUserId);
  if (relationship) {
    const partnerFromRelationship = getPartnerIdFromRelationship(relationship, normalizedUserId);
    if (partnerFromRelationship && !idsEqual(partnerFromRelationship, normalizedUserId)) {
      return partnerFromRelationship;
    }
  }

  const user = await User.findById(normalizedUserId).select('partnerId');
  const partnerFromUser = normalizeIdStr(user?.partnerId);
  if (partnerFromUser && !idsEqual(partnerFromUser, normalizedUserId)) {
    return partnerFromUser;
  }

  return normalizedUserId;
};

export const resolvePartnerContext = async (userId: string) => {
  const partnerId = await resolvePartnerUserId(userId);
  return {
    partnerId,
    hasPartner: hasActivePartner(userId, partnerId)
  };
};
