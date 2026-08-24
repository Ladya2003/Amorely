import User from '../models/user';
import { resolveLocale } from '../i18n/locales';
import { calculateDaysTogether } from '../config/daysAchievementCatalog';
import { processNewDaysAchievements } from './daysAchievementService';
import { getBalance } from './currencyService';
import { getDatingIdeasOverview } from './datingIdeasService';
import {
  buildDailyQuestionsResponse,
  getOrCreateState,
} from './dailyQuestionsService';
import { buildOrGetDynamicFeed } from '../utils/dynamicFeedRotation';
import { formatContentForApi } from '../utils/contentFormat';
import { formatDistanceKm, haversineDistanceKm } from '../utils/geoDistance';
import {
  findActiveRelationshipForUser,
  getPartnerIdFromRelationship,
} from '../utils/relationshipHelpers';
import { listActiveAnnouncements } from '../routes/announcements';
import { getMyPetsPayload, getPartnerPetsPayload } from '../routes/pets';

const isValidCoordinate = (value: unknown, min: number, max: number): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max;

const getSharedLocationPayload = (user: {
  sharedLocation?: { lat?: number; lng?: number; updatedAt?: Date };
}) => {
  const location = user.sharedLocation;
  if (
    !location ||
    !isValidCoordinate(location.lat, -90, 90) ||
    !isValidCoordinate(location.lng, -180, 180) ||
    !location.updatedAt
  ) {
    return null;
  }

  return {
    lat: location.lat,
    lng: location.lng,
    updatedAt: location.updatedAt,
  };
};

const getCoupleLocationPayload = async (userId: string, partnerId: string | null) => {
  if (!partnerId) {
    return null;
  }

  const [currentUser, partner] = await Promise.all([
    User.findById(userId).select('sharedLocation'),
    User.findById(partnerId).select('sharedLocation'),
  ]);

  if (!currentUser || !partner) {
    return null;
  }

  const myLocation = getSharedLocationPayload(currentUser);
  const partnerLocation = getSharedLocationPayload(partner);

  let distanceKm: number | null = null;
  if (myLocation && partnerLocation) {
    distanceKm = formatDistanceKm(
      haversineDistanceKm(
        myLocation.lat,
        myLocation.lng,
        partnerLocation.lat,
        partnerLocation.lng
      )
    );
  }

  return {
    myLocationShared: Boolean(myLocation),
    partnerLocationShared: Boolean(partnerLocation),
    distanceKm,
    myLocationUpdatedAt: myLocation?.updatedAt ?? null,
    partnerLocationUpdatedAt: partnerLocation?.updatedAt ?? null,
  };
};

export const getFeedHomePayload = async (userId: string, localeQuery?: string) => {
  const locale = resolveLocale(localeQuery);
  const relationship = await findActiveRelationshipForUser(userId);
  const partnerId = relationship ? getPartnerIdFromRelationship(relationship, userId) : null;

  const [
    partner,
    achievementAward,
    content,
    pets,
    partnerPets,
    dailyQuestions,
    datingIdeas,
    announcements,
    location,
  ] = await Promise.all([
    partnerId ? User.findById(partnerId).select('-password') : Promise.resolve(null),
    relationship
      ? processNewDaysAchievements(userId, relationship)
      : Promise.resolve({ amount: 0, balance: null, newAchievementIds: [] as string[] }),
    buildOrGetDynamicFeed(userId).then((selectedMedia) =>
      selectedMedia.map((media: any) => formatContentForApi(media))
    ),
    getMyPetsPayload(userId),
    getPartnerPetsPayload(userId),
    (async () => {
      if (!partnerId) {
        return { hasPartner: false };
      }
      const state = await getOrCreateState(userId);
      if (!state) {
        return { hasPartner: false };
      }
      const wallet = await getBalance(userId);
      return buildDailyQuestionsResponse(state, userId, locale, wallet.balance);
    })(),
    getDatingIdeasOverview(userId, locale),
    listActiveAnnouncements(locale, userId),
    getCoupleLocationPayload(userId, partnerId),
  ]);

  return {
    relationship: relationship
      ? {
          startDate: relationship.startDate,
          daysCount: calculateDaysTogether(new Date(relationship.startDate)),
          photo: relationship.photo?.url,
          signature: relationship.signature,
          signatures: relationship.signatures || { user: '', partner: '' },
          statusBubbles: relationship.statusBubbles || { user: '', partner: '' },
          ownerId: relationship.userId.toString(),
          badges: relationship.badges || [],
          awardedAmount: achievementAward.amount,
          balance: achievementAward.balance,
          newAchievementIds: achievementAward.newAchievementIds,
        }
      : null,
    partner,
    content,
    pets,
    partnerPets,
    dailyQuestions,
    datingIdeas,
    announcements,
    location,
  };
};
