import express, { Response } from 'express';
import mongoose from 'mongoose';
import User from '../models/user';
import Relationship from '../models/relationship';
import Content from '../models/content';
import Message from '../models/message';
import News from '../models/news';
import { formatNewsForAdmin } from '../i18n/newsContent';
import PushSubscription from '../models/pushSubscription';
import CryptoDevice from '../models/cryptoDevice';
import TapGameState from '../models/tapGameState';
import GeoGameState from '../models/geoGameState';
import DrawGameState from '../models/drawGameState';
import QuizGameState from '../models/quizGameState';
import { ExtendedRequest } from '../types/mongoose';
import { getTapLeaderboard } from '../games/tapGameService';
import { getGeoLeaderboard } from '../games/geoGameService';
import { getDrawLeaderboard } from '../games/drawGameService';
import { getQuizLeaderboard } from '../games/quizGameService';

const router = express.Router();

const GAME_IDS = ['tap', 'geo', 'draw', 'quiz'] as const;
type GameId = (typeof GAME_IDS)[number];

type GameRankInfo = {
  score: number;
  rank: number | null;
};

type RelationshipGameRanks = Record<GameId, GameRankInfo>;

const getPairKey = (userId: string, partnerId: string) =>
  [userId, partnerId].sort().join(':');

const startOfDay = (daysAgo = 0) => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - daysAgo);
  return date;
};

const buildRelationshipRankMap = async (): Promise<Map<string, RelationshipGameRanks>> => {
  const [tap, geo, draw, quiz] = await Promise.all([
    getTapLeaderboard(500),
    getGeoLeaderboard(500),
    getDrawLeaderboard(500),
    getQuizLeaderboard(500),
  ]);

  const leaderboards: Record<GameId, typeof tap> = {
    tap,
    geo,
    draw,
    quiz,
  };

  const rankMap = new Map<string, RelationshipGameRanks>();

  for (const gameId of GAME_IDS) {
    for (const entry of leaderboards[gameId]) {
      if (!entry) {
        continue;
      }

      const relationship = await Relationship.findById(entry.relationshipId).select('userId partnerId');
      if (!relationship) {
        continue;
      }

      const pairKey = getPairKey(relationship.userId.toString(), relationship.partnerId.toString());
      const existing = rankMap.get(pairKey) ?? {
        tap: { score: 0, rank: null },
        geo: { score: 0, rank: null },
        draw: { score: 0, rank: null },
        quiz: { score: 0, rank: null },
      };

      existing[gameId] = {
        score: entry.totalScore,
        rank: entry.rank,
      };
      rankMap.set(pairKey, existing);
    }
  }

  return rankMap;
};

const buildPairStatsMap = async () => {
  const [calendarRows, feedRows] = await Promise.all([
    Content.aggregate<{ _id: string; count: number }>([
      {
        $match: {
          eventId: { $exists: true, $nin: [null, ''] },
        },
      },
      {
        $addFields: {
          pairKey: {
            $cond: [
              { $lt: [{ $toString: '$userId' }, { $toString: '$targetId' }] },
              {
                $concat: [{ $toString: '$userId' }, ':', { $toString: '$targetId' }],
              },
              {
                $concat: [{ $toString: '$targetId' }, ':', { $toString: '$userId' }],
              },
            ],
          },
        },
      },
      {
        $group: {
          _id: { pairKey: '$pairKey', eventId: '$eventId' },
        },
      },
      {
        $group: {
          _id: '$_id.pairKey',
          count: { $sum: 1 },
        },
      },
    ]),
    Content.aggregate<{ _id: string; count: number }>([
      {
        $match: {
          showInFeed: true,
        },
      },
      {
        $addFields: {
          pairKey: {
            $cond: [
              { $lt: [{ $toString: '$userId' }, { $toString: '$targetId' }] },
              {
                $concat: [{ $toString: '$userId' }, ':', { $toString: '$targetId' }],
              },
              {
                $concat: [{ $toString: '$targetId' }, ':', { $toString: '$userId' }],
              },
            ],
          },
        },
      },
      {
        $group: {
          _id: '$pairKey',
          count: { $sum: 1 },
        },
      },
    ]),
  ]);

  const calendarMap = new Map(calendarRows.map((row) => [row._id, row.count]));
  const feedMap = new Map(feedRows.map((row) => [row._id, row.count]));

  return { calendarMap, feedMap };
};

const buildUserStatsMap = async () => {
  const [calendarRows, feedRows] = await Promise.all([
    Content.aggregate<{ _id: string; count: number }>([
      {
        $match: {
          eventId: { $exists: true, $nin: [null, ''] },
        },
      },
      {
        $group: {
          _id: { userId: '$userId', eventId: '$eventId' },
        },
      },
      {
        $group: {
          _id: '$_id.userId',
          count: { $sum: 1 },
        },
      },
    ]),
    Content.aggregate<{ _id: string; count: number }>([
      {
        $match: {
          showInFeed: true,
        },
      },
      {
        $group: {
          _id: '$userId',
          count: { $sum: 1 },
        },
      },
    ]),
  ]);

  const calendarMap = new Map(calendarRows.map((row) => [row._id.toString(), row.count]));
  const feedMap = new Map(feedRows.map((row) => [row._id.toString(), row.count]));

  return { calendarMap, feedMap };
};

const emptyGames = (): RelationshipGameRanks => ({
  tap: { score: 0, rank: null },
  geo: { score: 0, rank: null },
  draw: { score: 0, rank: null },
  quiz: { score: 0, rank: null },
});

const DASHBOARD_METRIC_KEYS = [
  'totalUsers',
  'newUsersToday',
  'newUsers7d',
  'newUsers30d',
  'activePairs',
  'brokenUpPairs',
  'usersWithoutPartner',
  'activeLast24h',
  'totalCalendarEvents',
  'totalFeedMedia',
  'totalMessages',
  'totalNewsPublished',
] as const;

type DashboardMetricKey = (typeof DASHBOARD_METRIC_KEYS)[number];

type DashboardDetailItem = {
  id: string;
  title: string;
  subtitle?: string;
  extra?: string;
  count?: number;
};

const formatUserDetail = (user: {
  _id: mongoose.Types.ObjectId;
  email: string;
  username: string;
  firstName?: string;
  lastName?: string;
  createdAt?: Date;
  lastSeen?: Date;
}): DashboardDetailItem => {
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ');
  return {
    id: user._id.toString(),
    title: fullName || user.username,
    subtitle: `${user.email} · @${user.username}`,
    extra: user.lastSeen
      ? `Был(а): ${user.lastSeen.toISOString()}`
      : user.createdAt
        ? `Регистрация: ${user.createdAt.toISOString()}`
        : undefined,
  };
};

const buildPairDetail = async (
  userId: string,
  partnerId: string,
  extra?: string,
  count?: number
): Promise<DashboardDetailItem> => {
  const [user, partner] = await Promise.all([
    User.findById(userId).select('username email firstName lastName').lean(),
    User.findById(partnerId).select('username email firstName lastName').lean(),
  ]);

  const userLabel = user
    ? [user.firstName, user.lastName].filter(Boolean).join(' ') || user.username
    : '—';
  const partnerLabel = partner
    ? [partner.firstName, partner.lastName].filter(Boolean).join(' ') || partner.username
    : '—';

  return {
    id: getPairKey(userId, partnerId),
    title: `${userLabel} + ${partnerLabel}`,
    subtitle: `${user?.email ?? '—'} · @${user?.username ?? '—'}  |  ${partner?.email ?? '—'} · @${partner?.username ?? '—'}`,
    extra,
    count,
  };
};

const getUsersByCreatedSince = async (since?: Date) => {
  const filter = since ? { createdAt: { $gte: since } } : {};
  const users = await User.find(filter)
    .select('email username firstName lastName createdAt lastSeen')
    .sort({ createdAt: -1 })
    .lean();
  return users.map((user) => formatUserDetail(user));
};

const getRelationshipsDetail = async (status: 'active' | 'broken_up') => {
  const relationships = await Relationship.find({ status })
    .select('userId partnerId startDate createdAt')
    .sort({ startDate: -1 })
    .lean();

  return Promise.all(
    relationships.map((relationship) =>
      buildPairDetail(
        relationship.userId.toString(),
        relationship.partnerId.toString(),
        `С ${new Date(relationship.startDate).toLocaleDateString('ru-RU')}`
      )
    )
  );
};

const getPairCountDetails = async (rows: Array<{ _id: string; count: number }>) => {
  const sorted = [...rows].sort((a, b) => b.count - a.count);
  return Promise.all(
    sorted.map(async (row) => {
      const [userId, partnerId] = row._id.split(':');
      return buildPairDetail(userId, partnerId, undefined, row.count);
    })
  );
};

router.get('/dashboard/details/:metricKey', async (req: ExtendedRequest, res: Response) => {
  try {
    const metricKey = req.params.metricKey as DashboardMetricKey;
    if (!DASHBOARD_METRIC_KEYS.includes(metricKey)) {
      return res.status(400).json({ error: 'Неизвестная метрика' });
    }

    const now = new Date();
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const weekAgo = startOfDay(7);
    const monthAgo = startOfDay(30);
    const todayStart = startOfDay(0);

    let items: DashboardDetailItem[] = [];

    switch (metricKey) {
      case 'totalUsers':
        items = await getUsersByCreatedSince();
        break;
      case 'newUsersToday':
        items = await getUsersByCreatedSince(todayStart);
        break;
      case 'newUsers7d':
        items = await getUsersByCreatedSince(weekAgo);
        break;
      case 'newUsers30d':
        items = await getUsersByCreatedSince(monthAgo);
        break;
      case 'activePairs':
        items = await getRelationshipsDetail('active');
        break;
      case 'brokenUpPairs':
        items = await getRelationshipsDetail('broken_up');
        break;
      case 'usersWithoutPartner': {
        const users = await User.find({
          $or: [{ partnerId: null }, { partnerId: { $exists: false } }],
        })
          .select('email username firstName lastName createdAt lastSeen')
          .sort({ createdAt: -1 })
          .lean();
        items = users.map((user) => formatUserDetail(user));
        break;
      }
      case 'activeLast24h': {
        const users = await User.find({ lastSeen: { $gte: dayAgo } })
          .select('email username firstName lastName createdAt lastSeen')
          .sort({ lastSeen: -1 })
          .lean();
        items = users.map((user) => formatUserDetail(user));
        break;
      }
      case 'totalCalendarEvents': {
        const rows = await Content.aggregate<{ _id: string; count: number }>([
          { $match: { eventId: { $exists: true, $nin: [null, ''] } } },
          {
            $addFields: {
              pairKey: {
                $cond: [
                  { $lt: [{ $toString: '$userId' }, { $toString: '$targetId' }] },
                  { $concat: [{ $toString: '$userId' }, ':', { $toString: '$targetId' }] },
                  { $concat: [{ $toString: '$targetId' }, ':', { $toString: '$userId' }] },
                ],
              },
            },
          },
          { $group: { _id: { pairKey: '$pairKey', eventId: '$eventId' } } },
          { $group: { _id: '$_id.pairKey', count: { $sum: 1 } } },
        ]);
        items = await getPairCountDetails(rows);
        break;
      }
      case 'totalFeedMedia': {
        const rows = await Content.aggregate<{ _id: string; count: number }>([
          { $match: { showInFeed: true } },
          {
            $addFields: {
              pairKey: {
                $cond: [
                  { $lt: [{ $toString: '$userId' }, { $toString: '$targetId' }] },
                  { $concat: [{ $toString: '$userId' }, ':', { $toString: '$targetId' }] },
                  { $concat: [{ $toString: '$targetId' }, ':', { $toString: '$userId' }] },
                ],
              },
            },
          },
          { $group: { _id: '$pairKey', count: { $sum: 1 } } },
        ]);
        items = await getPairCountDetails(rows);
        break;
      }
      case 'totalMessages': {
        const rows = await Message.aggregate<{ _id: string; count: number }>([
          {
            $addFields: {
              pairKey: {
                $cond: [
                  { $lt: [{ $toString: '$senderId' }, { $toString: '$receiverId' }] },
                  { $concat: [{ $toString: '$senderId' }, ':', { $toString: '$receiverId' }] },
                  { $concat: [{ $toString: '$receiverId' }, ':', { $toString: '$senderId' }] },
                ],
              },
            },
          },
          { $group: { _id: '$pairKey', count: { $sum: 1 } } },
        ]);
        items = await getPairCountDetails(rows);
        break;
      }
      case 'totalNewsPublished': {
        const newsItems = await News.find({ isPublished: true })
          .select('title category publishDate')
          .sort({ publishDate: -1 })
          .lean();
        items = newsItems.map((item) => ({
          id: item._id.toString(),
          title: item.title,
          subtitle: item.category,
          extra: new Date(item.publishDate).toLocaleDateString('ru-RU'),
        }));
        break;
      }
      default:
        items = [];
    }

    res.json({ metric: metricKey, items });
  } catch (error) {
    console.error('Ошибка получения деталей дашборда:', error);
    res.status(500).json({ error: 'Ошибка получения деталей дашборда' });
  }
});

router.get('/dashboard', async (_req: ExtendedRequest, res: Response) => {
  try {
    const now = new Date();
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const weekAgo = startOfDay(7);
    const monthAgo = startOfDay(30);
    const todayStart = startOfDay(0);

    const [
      totalUsers,
      newUsersToday,
      newUsers7d,
      newUsers30d,
      activePairs,
      brokenUpPairs,
      usersWithoutPartner,
      activeLast24h,
      totalCalendarEvents,
      totalFeedMedia,
      totalMessages,
      totalNewsPublished,
      topPairsByEvents,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ createdAt: { $gte: todayStart } }),
      User.countDocuments({ createdAt: { $gte: weekAgo } }),
      User.countDocuments({ createdAt: { $gte: monthAgo } }),
      Relationship.countDocuments({ status: 'active' }),
      Relationship.countDocuments({ status: 'broken_up' }),
      User.countDocuments({ $or: [{ partnerId: null }, { partnerId: { $exists: false } }] }),
      User.countDocuments({ lastSeen: { $gte: dayAgo } }),
      Content.distinct('eventId', { eventId: { $exists: true, $nin: [null, ''] } }).then((ids) => ids.length),
      Content.countDocuments({ showInFeed: true }),
      Message.countDocuments(),
      News.countDocuments({ isPublished: true }),
      Content.aggregate([
        {
          $match: {
            eventId: { $exists: true, $nin: [null, ''] },
          },
        },
        {
          $addFields: {
            pairKey: {
              $cond: [
                { $lt: [{ $toString: '$userId' }, { $toString: '$targetId' }] },
                {
                  $concat: [{ $toString: '$userId' }, ':', { $toString: '$targetId' }],
                },
                {
                  $concat: [{ $toString: '$targetId' }, ':', { $toString: '$userId' }],
                },
              ],
            },
          },
        },
        {
          $group: {
            _id: { pairKey: '$pairKey', eventId: '$eventId' },
          },
        },
        {
          $group: {
            _id: '$_id.pairKey',
            calendarEvents: { $sum: 1 },
          },
        },
        { $sort: { calendarEvents: -1 } },
        { $limit: 5 },
      ]),
    ]);

    const topPairs = await Promise.all(
      topPairsByEvents.map(async (row) => {
        const [userId, partnerId] = row._id.split(':');
        const [user, partner] = await Promise.all([
          User.findById(userId).select('username'),
          User.findById(partnerId).select('username'),
        ]);

        return {
          userId,
          partnerId,
          username: user?.username ?? '—',
          partnerUsername: partner?.username ?? '—',
          calendarEvents: row.calendarEvents,
        };
      })
    );

    res.json({
      totalUsers,
      newUsersToday,
      newUsers7d,
      newUsers30d,
      activePairs,
      brokenUpPairs,
      usersWithoutPartner,
      activeLast24h,
      totalCalendarEvents,
      totalFeedMedia,
      totalMessages,
      totalNewsPublished,
      topPairs,
    });
  } catch (error) {
    console.error('Ошибка получения дашборда:', error);
    res.status(500).json({ error: 'Ошибка получения дашборда' });
  }
});

router.get('/users', async (req: ExtendedRequest, res: Response) => {
  try {
    const search = String(req.query.search ?? '').trim();
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 25));
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = {};
    if (search) {
      const regex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = [{ username: regex }, { email: regex }, { firstName: regex }, { lastName: regex }];
    }

    const [users, total, relationships, rankMap, pairStats, userStats] = await Promise.all([
      User.find(filter)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(filter),
      Relationship.find().select('userId partnerId status').lean(),
      buildRelationshipRankMap(),
      buildPairStatsMap(),
      buildUserStatsMap(),
    ]);

    const relationshipByUserId = new Map<
      string,
      { partnerId: string; status: 'active' | 'broken_up'; relationshipId: string }
    >();

    for (const relationship of relationships) {
      const userId = relationship.userId.toString();
      const partnerId = relationship.partnerId.toString();
      relationshipByUserId.set(userId, {
        partnerId,
        status: relationship.status as 'active' | 'broken_up',
        relationshipId: relationship._id.toString(),
      });
      relationshipByUserId.set(partnerId, {
        partnerId: userId,
        status: relationship.status as 'active' | 'broken_up',
        relationshipId: relationship._id.toString(),
      });
    }

    const partnerIds = [...new Set(users.map((user) => user.partnerId?.toString()).filter(Boolean))] as string[];
    const partners = partnerIds.length
      ? await User.find({ _id: { $in: partnerIds } }).select('username email').lean()
      : [];
    const partnerMap = new Map(partners.map((partner) => [partner._id.toString(), partner]));

    const items = users.map((user) => {
      const userId = user._id.toString();
      const rel = relationshipByUserId.get(userId);
      const partner = user.partnerId ? partnerMap.get(user.partnerId.toString()) : null;

      let calendarEvents = userStats.calendarMap.get(userId) ?? 0;
      let feedMedia = userStats.feedMap.get(userId) ?? 0;
      let games = emptyGames();

      if (user.partnerId && rel?.status === 'active') {
        const pairKey = getPairKey(userId, user.partnerId.toString());
        calendarEvents = pairStats.calendarMap.get(pairKey) ?? calendarEvents;
        feedMedia = pairStats.feedMap.get(pairKey) ?? feedMedia;
        games = rankMap.get(pairKey) ?? emptyGames();
      }

      return {
        _id: userId,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role ?? 'user',
        createdAt: user.createdAt,
        lastSeen: user.lastSeen,
        partner: partner
          ? {
              _id: user.partnerId?.toString(),
              username: partner.username,
              email: partner.email,
            }
          : null,
        relationshipStatus: rel?.status ?? null,
        stats: {
          calendarEvents,
          feedMedia,
          games,
        },
      };
    });

    res.json({
      users: items,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Ошибка получения пользователей:', error);
    res.status(500).json({ error: 'Ошибка получения пользователей' });
  }
});

router.get('/health', async (_req: ExtendedRequest, res: Response) => {
  try {
    const mongoStates: Record<number, string> = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting',
    };

    const [
      storageAgg,
      encryptedContentCount,
      totalContentCount,
      pushSubscriptions,
      cryptoDevices,
      tapGames,
      geoGames,
      drawGames,
      quizGames,
      draftNewsCount,
    ] = await Promise.all([
      Content.aggregate<{ totalBytes: number }>([
        {
          $group: {
            _id: null,
            totalBytes: { $sum: { $ifNull: ['$fileSize', 0] } },
          },
        },
      ]),
      Content.countDocuments({ encrypted: true }),
      Content.countDocuments(),
      PushSubscription.countDocuments(),
      CryptoDevice.countDocuments(),
      TapGameState.countDocuments({ relationshipId: { $ne: null } }),
      GeoGameState.countDocuments(),
      DrawGameState.countDocuments(),
      QuizGameState.countDocuments(),
      News.countDocuments({ isPublished: false }),
    ]);

    res.json({
      mongodb: {
        status: mongoStates[mongoose.connection.readyState] ?? 'unknown',
        readyState: mongoose.connection.readyState,
      },
      feedScheduler: {
        schedule: '0 2,17 * * *',
        timezone: 'Europe/Minsk',
        description: 'Ротация ленты в 02:00 и 17:00',
      },
      storage: {
        totalBytes: storageAgg[0]?.totalBytes ?? 0,
        encryptedContentCount,
        totalContentCount,
      },
      pushSubscriptions,
      cryptoDevices,
      games: {
        tap: tapGames,
        geo: geoGames,
        draw: drawGames,
        quiz: quizGames,
      },
      draftNewsCount,
      serverTime: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Ошибка получения состояния системы:', error);
    res.status(500).json({ error: 'Ошибка получения состояния системы' });
  }
});

router.get('/news', async (req: ExtendedRequest, res: Response) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 50));
    const skip = (page - 1) * limit;

    const [news, total] = await Promise.all([
      News.find().sort({ publishDate: -1 }).skip(skip).limit(limit),
      News.countDocuments(),
    ]);

    res.json({
      news: news.map((item) => formatNewsForAdmin(item)),
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Ошибка получения новостей для админки:', error);
    res.status(500).json({ error: 'Ошибка получения новостей' });
  }
});

export default router;
