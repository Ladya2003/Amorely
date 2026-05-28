import mongoose from 'mongoose';
import Relationship from '../models/relationship';
import User from '../models/user';

export interface ActiveRelationshipContext {
  relationship: {
    _id: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    partnerId: mongoose.Types.ObjectId;
  };
  partnerId: string;
  partnerUser: {
    _id: mongoose.Types.ObjectId;
    username: string;
    firstName?: string;
    lastName?: string;
    avatar?: string;
  };
}

export const requireActiveRelationship = async (
  userId: string
): Promise<ActiveRelationshipContext | null> => {
  const relationship = await Relationship.findOne({
    $or: [{ userId }, { partnerId: userId }],
    status: 'active',
  });

  if (!relationship) {
    return null;
  }

  const partnerId =
    relationship.userId.toString() === userId
      ? relationship.partnerId.toString()
      : relationship.userId.toString();

  const partnerUser = await User.findById(partnerId).select(
    'username firstName lastName avatar'
  );

  if (!partnerUser) {
    return null;
  }

  return {
    relationship: {
      _id: relationship._id as mongoose.Types.ObjectId,
      userId: relationship.userId as mongoose.Types.ObjectId,
      partnerId: relationship.partnerId as mongoose.Types.ObjectId,
    },
    partnerId,
    partnerUser: partnerUser as ActiveRelationshipContext['partnerUser'],
  };
};
