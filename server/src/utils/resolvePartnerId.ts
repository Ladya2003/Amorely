import mongoose from 'mongoose';
import Relationship from '../models/relationship';
import User from '../models/user';

export const resolvePartnerUserId = async (userId: string): Promise<string> => {
  const user = await User.findById(userId).select('partnerId');
  if (user?.partnerId) {
    return user.partnerId.toString();
  }

  const relationship = await Relationship.findOne({
    $or: [
      { userId: new mongoose.Types.ObjectId(userId) },
      { partnerId: new mongoose.Types.ObjectId(userId) }
    ],
    status: 'active'
  });

  if (!relationship) {
    return userId;
  }

  return relationship.userId.toString() === userId
    ? relationship.partnerId.toString()
    : relationship.userId.toString();
};
